import React from 'react';

export function RiskBadge({ level }) {
  const norm = (level || 'LOW').toUpperCase();
  let badgeStyle = 'badge-low';

  if (norm === 'CRITICAL') {
    badgeStyle = 'badge-critical';
  } else if (norm === 'HIGH') {
    badgeStyle = 'badge-high';
  } else if (norm === 'MEDIUM') {
    badgeStyle = 'badge-medium';
  }

  return (
    <span className={`risk-badge ${badgeStyle}`}>
      <span className="badge-dot" />
      {norm}
    </span>
  );
}

export function PredictionBadge({ prediction }) {
  const isFraud = (prediction || '').toUpperCase() === 'FRAUD';

  return (
    <span className={`prediction-badge ${isFraud ? 'pred-fraud' : 'pred-legit'}`}>
      {isFraud ? 'FRAUD' : 'LEGITIMATE'}
    </span>
  );
}
