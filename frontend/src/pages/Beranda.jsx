import { Link } from 'react-router-dom';
import CCTVCard from '../components/CCTVCard';

// Data dummy kamera
const cameras = [
  { id: 'CAM-01', name: 'Simpang A Yani', location: 'Jl. A. Yani KM.33 • Banjarbaru Utara', status: 'live',    img: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=600&q=70' },
  { id: 'CAM-02', name: 'Simpang Trikora',   location: 'Jl. Trikora • Banjarbaru Selatan',     status: 'live',    img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=70' },
  { id: 'CAM-03', name: 'Bundaran Banjarbaru', location: 'Jl. Panglima Batur • Banjarbaru Utara', status: 'offline', img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=70' },
  { id: 'CAM-04', name: 'Gerbang Kota',     location: 'Jl. A. Yani KM.36 • Landasan Ulin',    status: 'live',    img: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=70' },
  { id: 'CAM-05', name: 'Simpang Guntung',  location: 'Jl. Guntung Manggis • Cempaka',         status: 'live',    img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=70' },
  { id: 'CAM-06', name: 'Jl. Mistar Cokro', location: 'Jl. Mistar Cokrokusumo • Ulang Anggang', status: 'live',   img: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=600&q=70' },
];

const stats = [
  { icon: '📹', num: '5/6', label: 'CCTV Aktif' },
  { icon: '🔍', num: '128', label: 'Total Deteksi' },
  { icon: '⚠️', num: '18',  label: 'ODOL' },
  { icon: '🚛', num: '27',  label: 'Kontainer' },
];

const features = [
  { icon: '📡', title: 'Pemantauan Real-Time', desc: 'Memantau arus lalu lintas secara real-time dari berbagai titik pemantauan jalan raya di kota.' },
  { icon: '📊', title: 'Analisis Lalu Lintas', desc: 'Mengumpulkan data secara otomatis untuk membantu menganalisis kepadatan lalu lintas.' },
  { icon: '🚨', title: 'Respons Cepat Insiden', desc: 'Komunikasi cepat antar petugas di lapangan untuk respons lebih efektif dan terarah.' },
];

// Posisi marker peta (persen dari pojok kiri atas)
const mapMarkers = [
  { id: 'CAM-01 A Yani',  top: '30%', left: '45%' },
  { id: 'CAM-02 Trikora', top: '55%', left: '62%' },
  { id: 'CAM-03 Muara',   top: '20%', left: '70%' },
  { id: 'CAM-04 Menjing', top: '70%', left: '30%' },
];

export default function Beranda() {
  return (
    <>
      {/* ── Hero ─────────────────────────── */}
      <section className="hero">
        <div className="hero-bg">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80"
            alt="Jalan raya Banjarbaru"
          />
        </div>
        <div className="hero-overlay" />
        <div className="container" style={{ width: '100%' }}>
          <div className="hero-content">
            <h1 className="hero-title">
              Sistem Monitoring Over-Dimension
            </h1>
            <p className="hero-desc">
              Pantau kondisi lalu lintas, tampilan CCTV, dan hasil deteksi truk
              secara langsung di wilayah Banjarbaru.
            </p>
            <div className="hero-buttons">
              <Link to="/live-cctv" className="btn btn-primary">
                📹 Lihat Live CCTV
              </Link>
              <Link to="/dashboard" className="btn btn-outline">
                📊 Lihat Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────── */}
      <div className="stats-bar">
        {stats.map((s) => (
          <div className="stats-bar-item" key={s.label}>
            <span className="stats-bar-icon">{s.icon}</span>
            <div>
              <div className="stats-bar-num">{s.num}</div>
              <div className="stats-bar-lbl">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pantauan CCTV Terkini ─────────────────────────── */}
      <section className="section-pad section-bg-white">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Pantauan CCTV Terkini</h2>
          <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: '32px' }}>
            Pemantauan langsung arus lalu lintas di beberapa ruas jalan protokol dan
            persimpangan banjarbaru.
          </p>

          <div className="cctv-grid-2x3">
            {cameras.map((cam) => (
              <CCTVCard key={cam.id} cam={cam} />
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link to="/live-cctv" className="view-more-link">
              Lihat Semua CCTV →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Lokasi CCTV ─────────────────────────── */}
      <section className="section-pad section-bg-light">
        <div className="container">
          <div className="map-section">
            <div>
              <h2 className="section-title">Lokasi CCTV</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-gray)', lineHeight: '1.7', margin: '14px 0 24px' }}>
                Jaringan CCTV perangkat ATCS tersebar di lokasi-lokasi persimpangan dan
                jalan-jalan strategis. Pengguna dapat melihat di peta interaktif lokasi titik-titik
                kamera yang terpasang.
              </p>
              <button className="btn btn-primary" style={{ borderRadius: '20px' }}>
                📍 Buka Peta Interaktif
              </button>
            </div>

            {/* Peta placeholder */}
            <div className="map-placeholder">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=70"
                alt="Peta Banjarbaru"
                style={{ filter: 'saturate(0.6) brightness(0.9)' }}
              />
              {mapMarkers.map((m) => (
                <div
                  key={m.id}
                  className="map-marker"
                  style={{ top: m.top, left: m.left }}
                >
                  <div className="map-marker-pin" />
                  <div className="map-marker-label">{m.id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tentang ATCS ─────────────────────────── */}
      <section className="section-pad section-bg-white">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Tentang ATCS</h2>
          <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: '36px' }}>
            Dinas Perhubungan Kota Banjarbaru mengelola layanan monitoring CCTV untuk
            menjaga keselamatan, ketertiban, dan kelancaran lalu lintas di wilayah Kota Banjarbaru.
          </p>
          <div className="feature-cards">
            {features.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
