import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-brand">
          <div className="navbar-logo">🛡️</div>
          <div className="navbar-title">
            <h1>DINAS PERHUBUNGAN KOTA BANJARBARU</h1>
            <p>SISTEM MONITORING OVER-DIMENSION</p>
          </div>
        </div>

        <ul className="navbar-nav">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Beranda
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/live-cctv"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Live CCTV
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Dashboard
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
