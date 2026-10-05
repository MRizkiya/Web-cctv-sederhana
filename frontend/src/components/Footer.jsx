export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <div className="footer-brand">
              <div className="footer-logo">🛡️</div>
              <div className="footer-brand-name">
                Dinas Perhubungan<br />Kota Banjarbaru
              </div>
            </div>
            <p className="footer-desc">
              Layanan monitoring CCTV dan informasi lalu lintas resmi yang
              dikelola oleh Dinas Perhubungan Kota Banjarbaru untuk meningkatkan
              keselamatan dan kelancaran arus lalu lintas.
            </p>
          </div>

          {/* Tautan */}
          <div>
            <h4 className="footer-heading">Tautan Lain</h4>
            <ul className="footer-links">
              <li><a href="#">Tentang Dishub</a></li>
              <li><a href="#">Tentang ATCS</a></li>
              <li><a href="#">Hasil Deteksi</a></li>
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h4 className="footer-heading">Kontak Kantor</h4>
            <div className="footer-contact-item">
              <span className="icon">📍</span>
              <span>
                Jl. Karang Rejo, Guntungmanggis, Kec. Landasan Ulin,
                Kota Banjar Baru, Kalimantan Selatan 70731
              </span>
            </div>
            <div className="footer-contact-item">
              <span className="icon">📞</span>
              <span>(0511) 6749034</span>
            </div>
            <div className="footer-contact-item">
              <span className="icon">✉️</span>
              <span>dishub@atcs.kotasistem.go.id</span>
            </div>
          </div>

          {/* Sosmed */}
          <div>
            <h4 className="footer-heading">Media Sosial</h4>
            <div className="social-icons">
              <div className="social-icon" title="Facebook">𝑓</div>
              <div className="social-icon" title="Instagram">📷</div>
              <div className="social-icon" title="Twitter">𝕏</div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          © 2026 CCTV Monitoring System. Semua Hak Cipta Dilindungi.
        </div>
      </div>
    </footer>
  );
}
