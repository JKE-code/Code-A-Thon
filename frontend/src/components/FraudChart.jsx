import React from 'react';

export function FraudChart({ transactions = [] }) {
  const total = transactions.length || 1;
  const fraudCount = transactions.filter((t) => t.prediction === 'FRAUD').length;
  const legitCount = total - fraudCount;

  const fraudPercent = ((fraudCount / total) * 100).toFixed(1);
  const legitPercent = (100 - parseFloat(fraudPercent)).toFixed(1);

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const legitStrokeDash = ((100 - parseFloat(fraudPercent)) / 100) * circumference;
  const fraudStrokeDash = (parseFloat(fraudPercent) / 100) * circumference;

  return (
    <div className="secops-chart-card">
      <div className="chart-card-top-bar">
        <div className="chart-card-heading">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <h3>Fraud vs Legitimate</h3>
        </div>
        <span className="card-window-pill">30D WINDOW</span>
      </div>

      <div className="donut-body-wrapper">
        <div className="donut-ring-container">
          <svg width="130" height="130" viewBox="0 0 100 100" className="donut-svg-element">
            {/* Background ring */}
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
            {/* Legit green arc */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#059669"
              strokeWidth="12"
              strokeDasharray={`${legitStrokeDash} ${circumference}`}
              strokeDashoffset="0"
              transform="rotate(-90 50 50)"
              strokeLinecap="round"
            />
            {/* Fraud red arc */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#dc2626"
              strokeWidth="12"
              strokeDasharray={`${fraudStrokeDash} ${circumference}`}
              strokeDashoffset={-legitStrokeDash}
              transform="rotate(-90 50 50)"
              strokeLinecap="round"
            />
          </svg>
          <div className="donut-center-content">
            <span className="clean-percentage">{legitPercent}%</span>
            <span className="clean-flow-tag">CLEAN FLOW</span>
          </div>
        </div>

        <div className="donut-legend-bottom">
          <span className="legend-item-legit">
            <span className="legend-dot dot-emerald" />
            Legitimate: <strong>12,365</strong>
          </span>
          <span className="legend-item-fraud">
            <span className="legend-dot dot-crimson" />
            Fraudulent: <strong>127</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
