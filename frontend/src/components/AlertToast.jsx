import React from 'react';

export function AlertToast({ alert, onDismiss, onInvestigate }) {
  if (!alert) return null;

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(alert.amount || 72000);

  const probPercent = Math.round((alert.fraud_probability || 0.89) * 100);

  return (
    <div className="secops-floating-toast" role="alert">
      <div className="toast-top-row">
        <div className="toast-title-group">
          <div className="toast-alert-square">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="toast-heading-text">
            <strong>CRITICAL FRAUD DETECTED</strong>
            <span className="toast-time-tag">Just Now</span>
          </div>
        </div>

        <button className="toast-x-btn" onClick={() => onDismiss(alert.id)} aria-label="Dismiss">
          ×
        </button>
      </div>

      <div className="toast-meta-line">
        <span>{alert.transaction_id || 'TX-1033'}</span>
        <span className="bullet-sep">·</span>
        <span>{formattedAmount}</span>
        <span className="bullet-sep">·</span>
        <span>Probable: <strong className="text-crimson">{probPercent}%</strong></span>
      </div>

      <div className="toast-actions-strip">
        <button
          className="btn-investigate-now"
          onClick={() => onInvestigate && onInvestigate(alert)}
        >
          Investigate Now
        </button>
        <button
          className="btn-toast-dismiss"
          onClick={() => onDismiss(alert.id)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
