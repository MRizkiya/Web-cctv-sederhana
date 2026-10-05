import { useState } from 'react';

export default function CCTVCard({ cam }) {
  const [starred, setStarred] = useState(false);

  return (
    <div className="cctv-card">
      <img src={cam.img} alt={cam.name} loading="lazy" />
      <div className="cctv-card-overlay" />

      {/* Top row: LIVE badge + CAM label */}
      <div className="cctv-card-top">
        {cam.status === 'live'
          ? <span className="badge-live">● LIVE</span>
          : <span className="badge-offline">OFFLINE</span>
        }
        <span className="cctv-card-cam-label">{cam.id}</span>
      </div>

      {/* Bottom row: info + star */}
      <div className="cctv-card-bottom">
        <div className="cctv-card-info">
          <h3>{cam.name}</h3>
          <p>📍 {cam.location}</p>
        </div>
        <button
          className="cctv-star-btn"
          onClick={(e) => { e.stopPropagation(); setStarred(!starred); }}
          title="Tandai favorit"
        >
          {starred ? '★' : '☆'}
        </button>
      </div>
    </div>
  );
}
