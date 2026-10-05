const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_URL = process.env.PYTHON_URL || 'http://localhost:5001';

// Middleware — limit 10MB untuk gambar base64
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── Cek status server Express ────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Backend Express berjalan!', python_url: PYTHON_URL });
});

// ── Proxy: cek status Python Flask ──────────────────────────
app.get('/api/model/status', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_URL}/`);
    res.json(response.data);
  } catch (err) {
    res.status(503).json({ error: 'Python server tidak bisa dijangkau', detail: err.message });
  }
});

// ── Proxy: deteksi dari gambar (JSON base64) ────────────────────
// Frontend kirim { image: base64 } → Express → Python Flask
app.post('/api/detect/image', async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_URL}/api/detect/image`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'json',
      timeout: 15000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    res.json(response.data);
  } catch (err) {
    console.error('[Detect Proxy]', err.message);
    res.status(500).json({ error: 'Deteksi gambar gagal', detail: err.message });
  }
});

// ── Proxy: stream CCTV (Python MJPEG) ────────────────────────
// Teruskan URL stream Python ke frontend
app.get('/api/stream/url', (req, res) => {
  const source = req.query.source || '0';
  res.json({
    stream_url: `${PYTHON_URL}/api/stream?source=${encodeURIComponent(source)}`,
  });
});

// ── Proxy: HLS stream dari ATCS Banjarmasin ──────────────────
// Mengatasi CORS: frontend request ke /api/hls-proxy?url=<encoded_url>
// Server ini yang fetch ke ATCS dan teruskan responsenya
const ALLOWED_HLS_HOSTS = new Set([
  'atcs.banjarmasinkota.go.id',
  'atcs.dishubbjb.net',
]);

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

app.get('/api/hls-proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Parameter url diperlukan' });
  }

  let parsedTarget;
  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'URL tidak valid' });
  }

  // Validasi hostname untuk mencegah proxy mengakses host lain
  if (parsedTarget.protocol !== 'https:' || !ALLOWED_HLS_HOSTS.has(parsedTarget.hostname)) {
    return res.status(403).json({ error: 'URL tidak diizinkan' });
  }

  try {
    const isM3U8 = targetUrl.endsWith('.m3u8');
    const isSegment = targetUrl.endsWith('.ts') || targetUrl.endsWith('.mp4') || targetUrl.endsWith('.m4s');

    const response = await axios.get(targetUrl, {
      httpsAgent,
      responseType: isSegment ? 'arraybuffer' : 'text',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': parsedTarget.origin,
        'Origin': parsedTarget.origin,
      },
    });

    if (isM3U8) {
      // Rewrite URL segmen dalam manifest agar juga melewati proxy ini
      const manifest = response.data;
      const baseStreamUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      // Rewrite URI di EXT-X-MAP (init segment)
      let proxied = manifest.replace(
        /URI="([^"]+\.(m3u8|mp4).*)"/g,
        (_, uri) => {
          const fullUrl = uri.startsWith('http') ? uri : baseStreamUrl + uri;
          return `URI="/api/hls-proxy?url=${encodeURIComponent(fullUrl.trim())}"`;
        }
      );

      // Rewrite baris segmen (.ts / .mp4 / .m4s)
      proxied = proxied.replace(
        /^(?!#)(.+\.(m3u8|ts|mp4|m4s).*)$/gm,
        (line) => {
          const fullUrl = line.startsWith('http') ? line : baseStreamUrl + line;
          return `/api/hls-proxy?url=${encodeURIComponent(fullUrl.trim())}`;
        }
      );

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(proxied);
    }

    if (isSegment) {
      // Tentukan content-type berdasarkan extension
      const contentType = targetUrl.endsWith('.mp4') || targetUrl.endsWith('.m4s')
        ? 'video/mp4'
        : 'video/MP2T';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'max-age=30');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(Buffer.from(response.data));
    }

    // fallback
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(response.data);
  } catch (err) {
    console.error('[HLS Proxy Error]', err.message);
    res.status(502).json({ error: 'Gagal mengambil stream', detail: err.message });
  }
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Express berjalan di http://localhost:${PORT}`);
  console.log(`Python model server: ${PYTHON_URL}`);
});
