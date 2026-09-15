import React from 'react';

export function RiskChart() {
  const tiers = [
    { label: 'LOW (0-20%)', percent: '84.2%', colorClass: 'tier-emerald', width: '84.2%' },
    { label: 'MEDIUM (21-50%)', percent: '11.5%', colorClass: 'tier-amber', width: '11.5%' },
    { label: 'HIGH (51-84%)', percent: '3.1%', colorClass: 'tier-orange', width: '6.5%' },
    { label: 'CRITICAL (≥85%)', percent: '1.2%', colorClass: 'tier-crimson', width: '3.5%' }
  ];

  return (
    <div className="secops-chart-card">
      <div className="chart-card-top-bar">
        <div className="chart-card-heading">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <h3>Risk Distribution</h3>
        </div>
        <span className="card-window-pill">ALL SCORES</span>
      </div>

      <div className="risk-bars-container">
        {tiers.map((tier) => (
          <div key={tier.label} className="risk-progress-row">
            <div className="risk-label-group">
              <span className="tier-name-label">
                <span className={`tier-indicator-bullet ${tier.colorClass}`} />
                {tier.label}
              </span>
              <span className="tier-percent-number">{tier.percent}</span>
            </div>
            <div className="risk-progress-track">
              <div
                className={`risk-progress-fill ${tier.colorClass}`}
                style={{ width: tier.width }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="risk-card-footer-notes">
        <span className="auto-action-text">
          Threshold Auto-Action: <strong>≥85% Auto-Hold</strong>
        </span>
        <span className="adaptive-tuning-tag">
          Adaptive Tuning: <strong>ON</strong>
        </span>
      </div>
    </div>
  );
}
