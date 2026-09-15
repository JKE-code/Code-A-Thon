import React, { useState } from 'react';

const INITIAL_RULES = [
  {
    id: 'RULE-GEO-04',
    name: 'Cross-Border Location Dissonance',
    category: 'Geolocation & IP',
    description: 'Intercepts transactions originating from foreign IPs when cardholder SIM or primary device was active domestically within the last 15 minutes.',
    condition: "location != 'home_country' && velocity_delta_minutes < 15 && amount > 5000",
    action: 'AUTONOMOUS BLOCK',
    actionType: 'block',
    enabled: true,
    triggeredToday: 38,
    falsePositiveRate: '0.4%',
    confidence: '99.4%'
  },
  {
    id: 'RULE-VEL-01',
    name: 'High-Frequency Velocity Surge',
    category: 'Velocity & Volume',
    description: 'Flags anomalous transaction bursts exceeding 3 card authorization requests within a 30-second sliding window across online merchants.',
    condition: 'transaction_count_30s >= 3 && is_online_gateway == true',
    action: 'QUARANTINE & STEP-UP OTP',
    actionType: 'challenge',
    enabled: true,
    triggeredToday: 84,
    falsePositiveRate: '1.2%',
    confidence: '96.8%'
  },
  {
    id: 'RULE-AMT-09',
    name: 'Extreme Baseline Outlier (+400%)',
    category: 'Velocity & Volume',
    description: 'Detects single transactions exceeding 4x the cardholder 90-day moving average authorization volume.',
    condition: 'amount > (cardholder_90d_avg * 4.0) && amount >= 50000',
    action: 'AUTONOMOUS BLOCK',
    actionType: 'block',
    enabled: true,
    triggeredToday: 19,
    falsePositiveRate: '0.2%',
    confidence: '99.8%'
  },
  {
    id: 'RULE-DEV-08',
    name: 'Zero-Trust Device Fingerprint Mismatch',
    category: 'Device & Identity',
    description: 'Triggers when a transaction originates from an unrecognized hardware hash with zero prior authentication history on high-risk merchant categories.',
    condition: "device == 'new_device' && merchant_risk_tier >= 'HIGH'",
    action: 'MANUAL REVIEW',
    actionType: 'review',
    enabled: true,
    triggeredToday: 52,
    falsePositiveRate: '2.1%',
    confidence: '94.5%'
  },
  {
    id: 'RULE-ML-99',
    name: 'Ensemble Neural Anomaly Threshold (≥85%)',
    category: 'Machine Learning',
    description: 'Composite risk score fusion: XGBoost classification probability (≥85%) combined with Isolation Forest outlier anomaly score (≥80%).',
    condition: 'xgb_fraud_prob >= 0.85 && isoforest_score >= 0.80',
    action: 'AUTONOMOUS BLOCK',
    actionType: 'block',
    enabled: true,
    triggeredToday: 27,
    falsePositiveRate: '0.1%',
    confidence: '99.9%'
  },
  {
    id: 'RULE-MERCH-02',
    name: 'Offshore Crypto & Virtual Asset Intercept',
    category: 'Merchant & Gateway',
    description: 'Shadow monitoring of peer-to-peer cryptocurrency on-ramp transactions initiated during non-habitual nocturnal hours.',
    condition: "merchant_mcc in ['6051', '6211'] && hour_of_day in [1,2,3,4,5]",
    action: 'SHADOW MONITOR',
    actionType: 'shadow',
    enabled: false,
    triggeredToday: 11,
    falsePositiveRate: '4.8%',
    confidence: '88.2%'
  }
];

export function PolicyRules() {
  const [rules, setRules] = useState(INITIAL_RULES);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const categories = ['All', 'Velocity & Volume', 'Geolocation & IP', 'Device & Identity', 'Machine Learning', 'Merchant & Gateway'];

  const toggleRule = (id) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newState = !r.enabled;
          showToast(`Rule ${r.id} ${newState ? 'Enabled' : 'Disabled'}`);
          return { ...r, enabled: newState };
        }
        return r;
      })
    );
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredRules = rules.filter((rule) => {
    const matchesCat = activeCategory === 'All' || rule.category === activeCategory;
    const matchesSearch =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="rules-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rules-mini-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rules-header-strip">
        <div className="rules-title-group">
          <div className="rules-badge-row">
            <span className="rules-pill-kicker">AUTONOMOUS INTERVENTION ENGINE</span>
            <span className="rules-version-tag">POLICY ENGINE v4.19</span>
          </div>
          <h1 className="rules-main-heading">Fraud Policy Rules & Risk Thresholds</h1>
          <p className="rules-sub-heading">
            Configure real-time algorithmic heuristics, threshold barriers, and automated intervention actions.
          </p>
        </div>

        <div className="rules-header-metrics">
          <div className="metric-pill-box">
            <span className="m-label">ACTIVE RULES</span>
            <span className="m-val text-emerald">{activeCount} / {rules.length}</span>
          </div>
          <div className="metric-pill-box">
            <span className="m-label">DECISION LATENCY</span>
            <span className="m-val font-mono">1.8ms</span>
          </div>
          <button
            className="btn-create-rule"
            onClick={() => showToast('Custom rule template generator initialized.')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create New Rule
          </button>
        </div>
      </div>

      {/* Filters and Search Toolbar */}
      <div className="rules-toolbar-card">
        <div className="category-tabs-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-tab-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="rules-search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="search-icon-svg">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="rules-search-input"
            placeholder="Search rules by ID, condition, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Rules Grid */}
      <div className="rules-cards-grid">
        {filteredRules.map((rule) => (
          <div key={rule.id} className={`rule-item-card ${!rule.enabled ? 'rule-disabled' : ''}`}>
            <div className="rule-card-top">
              <div className="rule-id-cluster">
                <span className="rule-id-tag">{rule.id}</span>
                <span className="rule-category-tag">{rule.category}</span>
              </div>

              <div className="rule-toggle-wrap">
                <span className={`toggle-status-label ${rule.enabled ? 'label-active' : 'label-inactive'}`}>
                  {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                </span>
                <button
                  type="button"
                  className={`switch-track ${rule.enabled ? 'track-on' : 'track-off'}`}
                  onClick={() => toggleRule(rule.id)}
                  aria-label={`Toggle ${rule.name}`}
                >
                  <span className="switch-thumb" />
                </button>
              </div>
            </div>

            <div className="rule-card-mid">
              <h3 className="rule-name">{rule.name}</h3>
              <p className="rule-desc">{rule.description}</p>
            </div>

            {/* Condition Logic Box */}
            <div className="rule-logic-box">
              <div className="logic-label-bar">
                <span className="code-kicker">EXPRESSION FILTER:</span>
                <span className="code-engine">AST Evaluator</span>
              </div>
              <code className="logic-code-text">{rule.condition}</code>
            </div>

            {/* Footer Stats & Action Badge */}
            <div className="rule-card-footer">
              <div className="action-tag-wrap">
                <span className={`action-badge badge-act-${rule.actionType}`}>
                  {rule.action}
                </span>
              </div>

              <div className="rule-telemetry-stats">
                <div className="telemetry-item" title="Triggered authorizations today">
                  <span className="t-label">Hits Today:</span>
                  <strong className="t-val">{rule.triggeredToday}</strong>
                </div>
                <div className="telemetry-item" title="False positive rate">
                  <span className="t-label">FPR:</span>
                  <strong className="t-val">{rule.falsePositiveRate}</strong>
                </div>
                <div className="telemetry-item" title="Neural model confidence">
                  <span className="t-label">Confidence:</span>
                  <strong className="t-val text-emerald">{rule.confidence}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
