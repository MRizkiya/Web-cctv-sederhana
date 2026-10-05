import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

const ATCS_BASE = 'https://atcs.banjarmasinkota.go.id';

/** Ubah URL ATCS → URL proxy lokal */
function toProxyUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  if (rawUrl.startsWith('/api/hls-proxy')) return rawUrl;
  return `/api/hls-proxy?url=${encodeURIComponent(rawUrl)}`;
}

/** Warna per label */
const LABEL_COLORS = {
  ODOL:           '#EF4444',
  OVER_DIMENSION: '#EF4444',
  OVERDIMENSION:  '#EF4444',
  NORMAL:         '#22C55E',
};
function labelColor(label) {
  return LABEL_COLORS[label?.toUpperCase()] ?? '#F59E0B';
}

/** Interval antar deteksi (ms) */
const DETECT_INTERVAL = 500;

export default function HLSPlayer({ src, camName, camId, location, enableDetection = false }) {
  const videoRef    = useRef(null);
  const hlsRef      = useRef(null);
  const canvasRef   = useRef(null);   // overlay bounding box
  const timerRef    = useRef(null);
  const detectingRef = useRef(false);

  const [state, setState] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [detections, setDetections] = useState([]);
  const [detectStatus, setDetectStatus] = useState('idle'); // idle | running | error
  const [detectionLogs, setDetectionLogs] = useState([]);

  // ── Capture frame & kirim ke YOLO API ──────────────────────────
  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || detectingRef.current) return;

    detectingRef.current = true;
    try {
      // Capture frame dari video ke canvas sementara
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width  = video.videoWidth  || 640;
      tmpCanvas.height = video.videoHeight || 360;
      const ctx = tmpCanvas.getContext('2d');
      ctx.drawImage(video, 0, 0, tmpCanvas.width, tmpCanvas.height);
      const b64 = tmpCanvas.toDataURL('image/jpeg', 0.75);

      setDetectStatus('running');
      const res = await fetch('/api/detect/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: b64 }),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDetections(data.detections ?? []);
      
      // Update logs jika ada deteksi baru
      if (data.detections && data.detections.length > 0) {
        const newLogs = data.detections.map(d => ({
          time: new Date().toLocaleTimeString(),
          label: d.label,
          is_odol: d.is_odol,
          confidence: d.confidence
        }));
        setDetectionLogs(prev => [...newLogs, ...prev].slice(0, 10)); // Maksimal 10 log terakhir
      }

      setDetectStatus('idle');
      drawBoxes(data.detections ?? [], video);
    } catch (err) {
      console.warn('[Detect]', err.message);
      setDetectStatus('error');
    } finally {
      detectingRef.current = false;
    }
  }, []);

  // ── Gambar bounding box di canvas overlay ──────────────────────
  const drawBoxes = (dets, video) => {
    const canvas = canvasRef.current;
    if (!canvas || !video) return;
    canvas.width  = video.videoWidth  || canvas.offsetWidth;
    canvas.height = video.videoHeight || canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.offsetWidth  / (video.videoWidth  || 1);
    const scaleY = canvas.offsetHeight / (video.videoHeight || 1);

    dets.forEach(({ label, confidence, bbox }) => {
      const [x1, y1, x2, y2] = bbox;
      const color = labelColor(label);
      const bx = x1 * scaleX, by = y1 * scaleY;
      const bw = (x2 - x1) * scaleX, bh = (y2 - y1) * scaleY;

      // Kotak
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2.5;
      ctx.strokeRect(bx, by, bw, bh);

      // Label background
      const text = `${label} ${(confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 12px Inter, sans-serif';
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = color;
      ctx.fillRect(bx, by - 20, tw + 10, 20);

      // Label text
      ctx.fillStyle = '#fff';
      ctx.fillText(text, bx + 5, by - 5);
    });
  };

  // ── Load HLS stream ────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setState('loading');
    setErrorMsg('');
    setDetections([]);

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const proxySrc = toProxyUrl(src);

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
      hlsRef.current = hls;
      hls.loadSource(proxySrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setState('playing');
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setState('error');
          setErrorMsg(data.type === Hls.ErrorTypes.NETWORK_ERROR
            ? 'Koneksi gagal – cek jaringan'
            : 'Gagal memutar stream');
          hls.destroy();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxySrc;
      video.addEventListener('loadedmetadata', () => {
        setState('playing');
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setState('error');
        setErrorMsg('Gagal memuat stream');
      });
    } else {
      setState('error');
      setErrorMsg('Browser tidak mendukung HLS');
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [src]);

  // ── Auto-detection loop ─────────────────────────────────────────
  useEffect(() => {
    if (!enableDetection || state !== 'playing') return;

    // Mulai setelah 2 detik video berjalan
    const startDelay = setTimeout(() => {
      runDetection();
      timerRef.current = setInterval(runDetection, DETECT_INTERVAL);
    }, 2000);

    return () => {
      clearTimeout(startDelay);
      clearInterval(timerRef.current);
    };
  }, [enableDetection, state, runDetection]);

  // ── Retry ──────────────────────────────────────────────────────
  const handleRetry = () => {
    setState('loading');
    const video = videoRef.current;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    setTimeout(() => {
      if (!Hls.isSupported() || !video) return;
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(toProxyUrl(src));
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setState('playing');
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) { setState('error'); setErrorMsg('Gagal memutar stream'); }
      });
    }, 500);
  };

  // Hitung statistik deteksi
  const odolCount   = detections.filter(d => d.is_odol).length;
  const normalCount = detections.filter(d => !d.is_odol).length;

  return (
    <div className="hls-player-wrapper">
      {/* Video */}
      <video
        ref={videoRef}
        className="hls-video"
        muted autoPlay playsInline
        style={{ display: state === 'error' ? 'none' : 'block' }}
      />

      {/* Bounding box canvas overlay */}
      {enableDetection && state === 'playing' && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Loading overlay */}
      {state === 'loading' && (
        <div className="hls-overlay">
          <div className="hls-spinner" />
          <p>Memuat stream...</p>
        </div>
      )}

      {/* Error overlay */}
      {state === 'error' && (
        <div className="hls-overlay hls-error">
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📡</div>
          <p style={{ fontWeight: '600' }}>Stream Tidak Tersedia</p>
          <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>{errorMsg}</p>
          <button className="hls-retry-btn" onClick={handleRetry}>🔄 Coba Lagi</button>
        </div>
      )}

      {/* Top bar: LIVE badge + cam ID + deteksi status */}
      <div className="hls-info-bar">
        <span className="badge-live" style={{ fontSize: '10px', padding: '2px 8px' }}>
          {state === 'playing' ? '● LIVE' : state === 'loading' ? '⏳ LOADING' : '✕ OFFLINE'}
        </span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {enableDetection && state === 'playing' && (
            <span style={{
              background: detectStatus === 'running' ? 'rgba(234,179,8,0.85)' : 'rgba(0,0,0,0.55)',
              color: '#fff', fontSize: '9px', fontWeight: '700',
              padding: '2px 8px', borderRadius: '4px', backdropFilter: 'blur(4px)'
            }}>
              {detectStatus === 'running' ? '⚡ DETEKSI...' : '🤖 AI ON'}
            </span>
          )}
          <span className="hls-cam-id">{camId}</span>
        </div>
      </div>

      {/* Bottom: nama kamera + stats deteksi */}
      <div className="hls-bottom-info">
        <strong>{camName}</strong>
        <span>📍 {location}</span>
        {enableDetection && detections.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            {odolCount > 0 && (
              <span style={{
                background: 'rgba(239,68,68,0.85)', color: '#fff',
                fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px'
              }}>⚠️ ODOL: {odolCount}</span>
            )}
            {normalCount > 0 && (
              <span style={{
                background: 'rgba(34,197,94,0.85)', color: '#fff',
                fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px'
              }}>✅ Normal: {normalCount}</span>
            )}
          </div>
        )}
      </div>

      {/* Real-time Analytics Logs */}
      {detectionLogs.length > 0 && (
        <div style={{ marginTop: '20px', backgroundColor: '#1f2937', padding: '15px', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Real-time Analytics
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {detectionLogs.map((log, idx) => (
              <div key={idx} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', 
                backgroundColor: log.is_odol ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                borderLeft: `4px solid ${log.is_odol ? '#ef4444' : '#22c55e'}`,
                borderRadius: '6px', color: '#e5e7eb', fontSize: '0.9rem'
              }}>
                <span style={{fontWeight: 'bold', color: log.is_odol ? '#fca5a5' : '#86efac', minWidth: '80px'}}>{log.time}</span>
                <span style={{flex: 1, paddingLeft: '15px'}}>{log.label.toUpperCase()} — Akurasi: {(log.confidence * 100).toFixed(1)}%</span>
                <span style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.5px',
                  backgroundColor: log.is_odol ? '#ef4444' : '#22c55e', color: '#fff'
                }}>
                  {log.is_odol ? 'ODOL DETECTED' : 'NORMAL'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
