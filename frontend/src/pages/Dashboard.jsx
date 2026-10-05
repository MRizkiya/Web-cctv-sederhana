import { useState, useEffect } from 'react';

const statCards = [
  { num: '128', label: 'Total Deteksi',  color: 'var(--text-dark)' },
  { num: '18',  label: 'ODOL',           color: '#D97706' },
  { num: '83',  label: 'Normal',         color: '#16A34A' },
  { num: '27',  label: 'Kontainer',      color: '#2563EB' },
  { num: '5/6', label: 'CCTV Aktif',     color: 'var(--text-dark)' },
];

const detectionBars = [
  { label: 'Normal',    value: 83,  max: 128, color: '#22C55E' },
  { label: 'Kontainer', value: 27,  max: 128, color: '#3B82F6' },
  { label: 'ODOL',      value: 18,  max: 128, color: '#F59E0B' },
];

const history = [
  { waktu: '10:42 WIB', cctv: 'CAM-02', jenis: 'Truk',      hasil: 'ODOL' },
  { waktu: '09:18 WIB', cctv: 'CAM-04', jenis: 'Kontainer', hasil: '-' },
  { waktu: '08:06 WIB', cctv: 'CAM-01', jenis: 'Truk',      hasil: 'Normal' },
  { waktu: '07:32 WIB', cctv: 'CAM-03', jenis: 'Truk',      hasil: 'ODOL' },
  { waktu: '06:45 WIB', cctv: 'CAM-02', jenis: 'Kontainer', hasil: '-' },
  { waktu: '06:12 WIB', cctv: 'CAM-05', jenis: 'Truk',      hasil: 'Normal' },
  { waktu: '05:55 WIB', cctv: 'CAM-01', jenis: 'Truk',      hasil: 'Normal' },
  { waktu: '05:30 WIB', cctv: 'CAM-06', jenis: 'Kontainer', hasil: 'ODOL' },
];

function HasilBadge({ hasil }) {
  if (hasil === 'ODOL')    return <span className="badge badge-orange">⚠️ ODOL</span>;
  if (hasil === 'Normal')  return <span className="badge badge-green">✅ Normal</span>;
  return <span className="badge badge-gray">—</span>;
}

export default function Dashboard() {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="page-content">
      <div className="container">

        {/* ── Header ─── */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="section-title" style={{ fontSize: '28px' }}>Dashboard Deteksi</h1>
          <p className="section-subtitle">
            Ringkasan hasil deteksi truk dari seluruh CCTV aktif di wilayah Banjarbaru.
          </p>
        </div>

        {/* ── Stat Cards ─── */}
        <div
          className="stat-cards"
          style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '40px' }}
        >
          {statCards.map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-number" style={{ color: s.color }}>{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Bar Chart ─── */}
        <div style={{ marginBottom: '40px' }}>
          <h2 className="section-title" style={{ fontSize: '18px', marginBottom: '16px' }}>
            Ringkasan Hasil Deteksi
          </h2>

          <div
            className="detection-bars"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              background: '#fff',
              overflow: 'hidden',
            }}
          >
            {detectionBars.map((bar) => (
              <div className="detection-bar-row" key={bar.label}>
                <span className="detection-bar-label">{bar.label}</span>
                <div className="detection-bar-track">
                  <div
                    className="detection-bar-fill"
                    style={{
                      width: animated ? `${(bar.value / bar.max) * 100}%` : '0%',
                      background: bar.color,
                    }}
                  />
                </div>
                <span className="detection-bar-value">{bar.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabel Riwayat ─── */}
        <div>
          <h2 className="section-title" style={{ fontSize: '18px', marginBottom: '16px' }}>
            Riwayat Deteksi Terbaru
          </h2>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>CCTV</th>
                  <th>Jenis Truk</th>
                  <th>Hasil Deteksi</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: '500', color: 'var(--text-dark)' }}>{row.waktu}</td>
                    <td style={{ color: 'var(--text-gray)' }}>{row.cctv}</td>
                    <td>{row.jenis}</td>
                    <td><HasilBadge hasil={row.hasil} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
