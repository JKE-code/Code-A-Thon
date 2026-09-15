import React from 'react';

export function TransactionRow({ tx, isNew, onClick, isSelected }) {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(tx.amount);

  const fraudPercent = (tx.fraud_probability * 100).toFixed(1);
  const isCritical = tx.risk_level === 'CRITICAL';
  const isHigh = tx.risk_level === 'HIGH';
  const isFraud = tx.prediction === 'FRAUD';

  return (
    <tr
      onClick={() => onClick(tx)}
      className={`secops-tx-row ${isNew ? 'row-highlight' : ''} ${isSelected ? 'row-active-selected' : ''}`}
    >
      <td className="cell-txid">
        <div className="tx-id-badge-wrap">
          <span className={`tx-signal-dot ${isCritical || isHigh ? 'dot-crimson' : 'dot-emerald'}`} />
          <span className="tx-id-code">{tx.transaction_id}</span>
          {(isCritical || isHigh) && <span className="scp-badge">SCP</span>}
        </div>
      </td>

      <td className="cell-time">{tx.timestamp}</td>

      <td className="cell-amount">{formattedAmount}</td>

      <td className="cell-merchant">
        <span className="merchant-truncated" title={`${tx.merchant} (${tx.location})`}>
          {tx.merchant}
        </span>
      </td>

      <td className="cell-fraudscore">
        <span className={`fraud-score-num ${isCritical || isHigh ? 'score-red' : 'score-green'}`}>
          {fraudPercent}%
        </span>
      </td>

      <td className="cell-risk">
        <span className={`risk-pill-chip ${isCritical ? 'chip-critical' : isHigh ? 'chip-high' : tx.risk_level === 'MEDIUM' ? 'chip-medium' : 'chip-low'}`}>
          {tx.risk_level}
        </span>
      </td>

      <td className="cell-prediction">
        <span className={`pred-pill-chip ${isFraud ? 'chip-pred-fraud' : 'chip-pred-legit'}`}>
          {isFraud ? 'FRAUD' : 'LEGITIMATE'}
        </span>
      </td>

      <td className="cell-action">
        <button
          className="btn-inspect-action"
          onClick={(e) => {
            e.stopPropagation();
            onClick(tx);
          }}
        >
          Inspect
        </button>
      </td>
    </tr>
  );
}
