import React from 'react';

export function ActivityChart() {
  return (
    <div className="secops-chart-card">
      <div className="chart-card-top-bar">
        <div className="chart-card-heading">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <h3>Fraud Detection Activity</h3>
        </div>
        <span className="card-window-pill pill-scan">
          <span className="scan-mini-dot" /> SCAN/SEC
        </span>
      </div>

      <div className="activity-wave-container">
        <svg viewBox="0 0 320 120" className="activity-wave-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#64748b" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area under wave */}
          <path
            d="M 10 95 Q 60 90 100 82 T 180 65 T 230 88 T 290 70 L 290 115 L 10 115 Z"
            fill="url(#waveGradient)"
          />

          {/* Main sleek line */}
          <path
            d="M 10 95 Q 60 90 100 82 T 180 65 T 230 88 T 290 70"
            fill="none"
            stroke="#1e293b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Red Alert pulse peak */}
          <circle cx="290" cy="70" r="5" fill="#dc2626" />
          <circle cx="290" cy="70" r="9" fill="none" stroke="#dc2626" strokeWidth="1.5" opacity="0.6">
            <animate attributeName="r" values="6;14" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <div className="activity-bottom-axis">
        <span>T-5m</span>
        <span>T-3m</span>
        <span>T-1m</span>
        <span className="live-marker-text">REALTIME</span>
      </div>
    </div>
  );
}
