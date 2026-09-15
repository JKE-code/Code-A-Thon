import React, { useState } from 'react';
import { TransactionRow } from './TransactionRow';

export function TransactionTable({
  transactions = [],
  newTxId,
  selectedTx,
  onSelectTx
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (riskFilter === 'ALL') return true;
    return tx.risk_level === riskFilter;
  });

  return (
    <div className="secops-table-card">
      {/* Table Header Bar */}
      <div className="table-top-toolbar">
        <div className="toolbar-left">
          <div className="title-with-beacon">
            <span className="live-emerald-beacon" />
            <h2 className="toolbar-headline">Live Transaction Monitoring</h2>
          </div>
          <div className="receiving-chip">
            <span className="pulse-mini-dot" />
            <span>Receiving transactions 142 tx/s</span>
          </div>
        </div>

        <div className="toolbar-right">
          {/* Search Box */}
          <div className="table-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="table-search-input"
              placeholder="Filter ID, Merchant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Risk Level Filter Select */}
          <div className="risk-dropdown-wrap">
            <select
              className="risk-select-filter"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="secops-table-scroller">
        <table className="secops-table">
          <thead>
            <tr>
              <th>TRANSACTION ID</th>
              <th>TIME</th>
              <th>AMOUNT</th>
              <th>MERCHANT</th>
              <th>FRAUD SCORE</th>
              <th>RISK</th>
              <th>PREDICTION</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-row-td">
                  No matching sessions found
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <TransactionRow
                  key={tx.transaction_id}
                  tx={tx}
                  isNew={tx.transaction_id === newTxId}
                  isSelected={selectedTx && selectedTx.transaction_id === tx.transaction_id}
                  onClick={onSelectTx}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Pagination */}
      <div className="table-footer-status-bar">
        <div className="footer-status-left">
          <span className="status-bullet-green">●</span>
          <span>Showing 1 to {Math.min(filtered.length, 22)} of 12,492 streamed sessions</span>
        </div>

        <div className="footer-pagination-controls">
          <button className="btn-page-step" disabled>Previous</button>
          <span className="page-current-indicator">Page 1 of 2,892</span>
          <button className="btn-page-step">Next</button>
        </div>
      </div>
    </div>
  );
}
