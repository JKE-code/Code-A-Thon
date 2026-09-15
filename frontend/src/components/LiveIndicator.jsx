import React from 'react';

export function LiveIndicator({ status = 'live', label }) {
  const isLive = status === 'live' || status === 'simulating';
  const displayLabel = label || (status === 'live' ? 'LIVE' : status === 'simulating' ? 'SIMULATING' : 'DISCONNECTED');

  return (
    <div className={`live-indicator-wrapper ${isLive ? 'is-live' : 'is-disconnected'}`}>
      <span className="live-pulse-container">
        <span className="live-ping" />
        <span className="live-core" />
      </span>
      <span className="live-text">{displayLabel}</span>
    </div>
  );
}
