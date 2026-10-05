import { useState } from 'react';
import HLSPlayer from '../components/HLSPlayer';
import CCTVCard from '../components/CCTVCard';

// ── Data kamera ──────────────────────────────────────────────────────────────
// Sementara 1 kamera real stream, sisanya dummy (belum ada URL)
const allCameras = [
  {
    id: 'CAM-01',
    name: 'Jl. Gubernur Soebardjo – Jembatan Tatah Bangkal',
    shortName: 'Jembatan Tatah Bangkal',
    location: 'Jl. Gubernur Soebardjo • Keluar Kota',
    status: 'live',
    category: 'Ruas Jalan',
    streamUrl: 'https://atcs.banjarmasinkota.go.id/stream/jalan_gubernur_soebardjo_jembatan_tatah_bangkal_keluar_kota/video1_stream.m3u8',
    img: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=70',
  },
  {
    id: 'CAM-02',
    name: 'Jalan A Yani KM 3 (Depan PDAM)',
    shortName: 'Jln A Yani KM 3',
    location: 'Jl. A. Yani KM 3 • Banjarmasin',
    status: 'live',
    category: 'Ruas Jalan',
    streamUrl: 'https://atcs.banjarmasinkota.go.id/stream/jalan_a_yani_km_3/index.m3u8',
    img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=70',
  },
  {
    id: 'CAM-03',
    name: 'Simpang Brimob arah bjm',
    shortName: 'Simpang Brimob',
    location: 'Jl. Jenderal Sudirman • Banjarmasin Tengah',
    status: 'live',
    category: 'Simpang',
    streamUrl: 'https://atcs.dishubbjb.net/stream/simpang_brimob_kamera_f1_arah_banjarmasin/video1_stream.m3u8',
    img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=70',
  },
  {
    id: 'CAM-04',
    name: 'Bundaran Mesjid Raya',
    shortName: 'Bundaran Mesjid Raya',
    location: 'Jl. Lambung Mangkurat • Banjarmasin',
    status: 'soon',
    category: 'Bundaran',
    streamUrl: null,
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=70',
  },
  {
    id: 'CAM-05',
    name: 'Ruas A. Yani KM 3',
    shortName: 'A. Yani KM 3',
    location: 'Jl. A. Yani KM.3 • Banjarmasin',
    status: 'soon',
    category: 'Ruas Jalan',
    streamUrl: null,
    img: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=600&q=70',
  },
  {
    id: 'CAM-06',
    name: 'Simpang Gatot Subroto',
    shortName: 'Simpang Gatot Subroto',
    location: 'Jl. Gatot Subroto • Banjarmasin Selatan',
    status: 'soon',
    category: 'Simpang',
    streamUrl: null,
    img: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=70',
  },
];

const categories = ['Semua', 'Simpang', 'Bundaran', 'Ruas Jalan'];

export default function LiveCCTV() {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [search, setSearch]             = useState('');
  const [selectedCam, setSelectedCam]   = useState(allCameras[0]);

  const filtered = allCameras.filter((c) => {
    const matchCat    = activeFilter === 'Semua' || c.category === activeFilter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                        c.location.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const liveCount = allCameras.filter(c => c.status.toLowerCase() === 'live').length;

  return (
    <div className="page-content">
      <div className="container">

        {/* ── Header ─── */}
        <div className="live-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-dark)' }}>LIVE CCTV</h1>
            <span className="live-badge-count">{liveCount} LIVE</span>
            <span className="live-badge-count" style={{ background: 'var(--border)', color: 'var(--text-gray)' }}>
              {allCameras.length} Total
            </span>
          </div>
          <div className="search-input">
            <span style={{ color: 'var(--text-light)' }}>🔍</span>
            <input
              type="text"
              placeholder="Cari nama atau lokasi CCTV..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Layout: Player kiri + Daftar kanan ─── */}
        <div className="live-layout">

          {/* ── Main Player ─── */}
          <div className="live-main-player">
            <div className="live-player-header">
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginBottom: '2px' }}>Sedang Ditampilkan</div>
                <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-dark)' }}>
                  {selectedCam.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>📍 {selectedCam.location}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <a
                  href={selectedCam.streamUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 14px', opacity: selectedCam.streamUrl ? 1 : 0.4 }}
                >
                  ↗ Buka Fullscreen
                </a>
              </div>
            </div>

            {/* Video Player — deteksi real-time otomatis jika streamUrl tersedia */}
            {selectedCam.streamUrl ? (
              <HLSPlayer
                key={selectedCam.id}
                src={selectedCam.streamUrl}
                camName={selectedCam.name}
                camId={selectedCam.id}
                location={selectedCam.location}
                enableDetection={true}
              />
            ) : (
              <div className="live-no-stream">
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📡</div>
                <p style={{ fontWeight: '600', fontSize: '16px' }}>Stream Belum Tersedia</p>
                <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '6px' }}>
                  URL stream untuk <strong>{selectedCam.shortName}</strong> belum dikonfigurasi.
                </p>
              </div>
            )}
          </div>

          {/* ── Camera List ─── */}
          <div className="live-cam-list">
            {/* Filter tabs */}
            <div className="filter-tabs" style={{ marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`filter-tab${activeFilter === cat ? ' active' : ''}`}
                  style={{ fontSize: '11px', padding: '4px 12px' }}
                  onClick={() => setActiveFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Camera cards */}
            <div className="cam-list-scroll">
              {filtered.length > 0 ? filtered.map((cam) => (
                <div
                  key={cam.id}
                  className={`cam-list-item${selectedCam.id === cam.id ? ' active' : ''}`}
                  onClick={() => setSelectedCam(cam)}
                >
                  <div className="cam-list-thumb">
                    <img src={cam.img} alt={cam.name} loading="lazy" />
                    <div className="cam-list-thumb-overlay" />
                    {cam.status === 'live'
                      ? <span className="badge-live" style={{ fontSize: '9px', padding: '1px 6px' }}>● LIVE</span>
                      : <span style={{
                          position: 'absolute', top: '6px', left: '6px',
                          background: '#6B7280', color: '#fff',
                          fontSize: '9px', padding: '1px 6px', borderRadius: '4px', fontWeight: '700'
                        }}>SOON</span>
                    }
                  </div>
                  <div className="cam-list-info">
                    <div className="cam-list-id">{cam.id}</div>
                    <div className="cam-list-name">{cam.shortName}</div>
                    <div className="cam-list-loc">📍 {cam.location.split('•')[0].trim()}</div>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-gray)' }}>
                  <div style={{ fontSize: '30px', marginBottom: '8px' }}>📷</div>
                  <p style={{ fontSize: '13px' }}>Tidak ada kamera ditemukan</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
