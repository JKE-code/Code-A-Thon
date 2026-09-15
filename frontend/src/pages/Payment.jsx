import React, { useState } from 'react';
import { API_URL } from '../api';
import { mockAnalyzeTransaction } from '../data/mockTransactions';

export function Payment({ onTransactionCreated, onNavigate }) {
  const scenarios = [
    {
      id: 'safe',
      amount: '450',
      label: 'Amazon / Safe Baseline',
      merchant: 'Amazon India',
      location: 'Mumbai',
      timing: '14:30',
      device: 'mobile',
      payment_method: 'UPI',
      fingerprint: 'iOS 17 (Safari) • Verified Mobile'
    },
    {
      id: 'elevated',
      amount: '8500',
      label: 'Electronics / Elevated',
      merchant: 'Croma Electronics',
      location: 'Delhi',
      timing: '23:45',
      device: 'desktop',
      payment_method: 'CARD',
      fingerprint: 'Windows 11 (Edge) • Known Desktop'
    },
    {
      id: 'critical',
      amount: '95000',
      label: 'Dubai Luxury / Critical',
      merchant: 'Al-Safa Watches & Luxury',
      location: 'Dubai',
      timing: '03:15',
      device: 'new_device',
      payment_method: 'CARD',
      fingerprint: 'MacOS (Chrome) • Unrecognized Device'
    }
  ];

  const [selectedScenario, setSelectedScenario] = useState('critical');
  const [formData, setFormData] = useState({
    amount: '95000',
    merchant: 'Al-Safa Watches & Luxury',
    location: 'Dubai',
    timing: '03:15',
    device: 'new_device',
    payment_method: 'CARD',
    fingerprint: 'MacOS (Chrome) • Unrecognized Device'
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [verdict, setVerdict] = useState({
    status: 'BLOCKED',
    decision: 'REJECT 403',
    fraudLikelihood: 94.5,
    threatCategory: 'CRITICAL Threat Category',
    modelId: 'Ensemble ML (RF + IsoForest)',
    latency: '18.2ms',
    refId: 'TX-INITIAL',
    timestamp: 'JUST NOW',
    riskFactors: [
      {
        title: 'High Amount Outlier',
        detail: 'Transaction amount (Rs.95,000) is extremely high compared to normal history.'
      },
      {
        title: 'Unrecognized Device Signature',
        detail: 'Transaction originated from a new or unrecognized device.'
      },
      {
        title: 'Foreign / Anomalous Location',
        detail: 'Transaction location (Dubai) differs from regular geographic baseline.'
      },
      {
        title: 'Unusual Transaction Timing',
        detail: 'Initiated during high-risk late-night hours (03:15 AM).'
      }
    ]
  });

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario.id);
    setFormData({
      amount: scenario.amount,
      merchant: scenario.merchant,
      location: scenario.location,
      timing: scenario.timing,
      device: scenario.device,
      payment_method: scenario.payment_method,
      fingerprint: scenario.fingerprint
    });
  };

  const handleProcessTransaction = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    const amountNum = parseFloat(formData.amount) || 0;
    const now = new Date();
    const [hours, minutes] = formData.timing.includes(':') 
      ? formData.timing.split(':') 
      : [now.getHours(), now.getMinutes()];
    
    const txDate = new Date();
    txDate.setHours(parseInt(hours) || 12, parseInt(minutes) || 0, 0, 0);

    const payload = {
      amount: amountNum,
      merchant: formData.merchant.trim() || 'General Merchant',
      location: formData.location.trim() || 'Mumbai',
      device: formData.device,
      payment_method: formData.payment_method,
      timing: formData.timing,
      timestamp: txDate.toISOString()
    };

    const startTime = performance.now();

    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const latencyMs = (performance.now() - startTime).toFixed(1);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Convert backend ML explanation list to riskFactors format
      const explanations = (data.explanation && data.explanation.length > 0)
        ? data.explanation.map((item, idx) => ({
            title: `Factor #${idx + 1}`,
            detail: item
          }))
        : [];

      const isBlocked = data.risk_level === 'CRITICAL' || data.risk_level === 'HIGH';
      const fraudPct = ((data.fraud_probability || 0) * 100).toFixed(1);

      setVerdict({
        status: isBlocked ? 'BLOCKED' : 'APPROVED',
        decision: isBlocked ? (data.risk_level === 'CRITICAL' ? 'REJECT 403' : 'CHALLENGE 302') : 'PASS 200',
        fraudLikelihood: fraudPct,
        threatCategory: `${data.risk_level} Risk Category`,
        modelId: 'Ensemble ML (RF + IsoForest)',
        latency: `${latencyMs}ms`,
        refId: data.transaction_id,
        timestamp: 'JUST NOW',
        riskFactors: explanations
      });

      if (onTransactionCreated) onTransactionCreated(data);
    } catch (err) {
      // Offline fallback
      const mockResult = mockAnalyzeTransaction(payload);
      const isBlocked = mockResult.risk_level === 'CRITICAL' || mockResult.risk_level === 'HIGH';
      
      setVerdict({
        status: isBlocked ? 'BLOCKED' : 'APPROVED',
        decision: isBlocked ? 'REJECT 403' : 'PASS 200',
        fraudLikelihood: ((mockResult.fraud_probability || 0) * 100).toFixed(1),
        threatCategory: `${mockResult.risk_level} Risk Category`,
        modelId: 'ML Risk Engine (Offline)',
        latency: '15.4ms',
        refId: mockResult.transaction_id,
        timestamp: 'JUST NOW',
        riskFactors: (mockResult.explanation || []).map((exp, i) => ({
          title: `Triggered Signal #${i + 1}`,
          detail: exp
        }))
      });

      if (onTransactionCreated) onTransactionCreated(mockResult);
    } finally {
      setIsProcessing(false);
    }
  };

  const formattedDisplayAmount = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(formData.amount || 0);

  return (
    <div className="secops-pay-page-wrapper">
      {/* Main 2-Column Split Layout */}
      <div className="pay-two-column-layout">
        {/* ========================================================
            LEFT COLUMN: TRANSACTION SIMULATOR FORM
            ======================================================== */}
        <section className="checkout-form-column" aria-label="Transaction Simulator">
          <div className="checkout-main-card">
            {/* Header */}
            <div className="checkout-header-row">
              <div className="checkout-brand-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <h2>Transaction Risk Simulator</h2>
              </div>
            </div>

            <p className="checkout-subline">
              Enter any custom transaction details below to test the machine learning fraud detection model in real-time.
            </p>

            {/* Quick Presets */}
            <div className="scenarios-section">
              <span className="section-micro-heading">QUICK PRESET SCENARIOS</span>
              <div className="scenarios-grid">
                {scenarios.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    className={`scenario-card-btn ${selectedScenario === sc.id ? 'active-scenario' : ''}`}
                    onClick={() => handleScenarioSelect(sc)}
                  >
                    <div className="sc-header">
                      <span className="sc-amount">₹{parseInt(sc.amount).toLocaleString()}</span>
                      <span className={`sc-radio-dot ${selectedScenario === sc.id ? 'dot-active' : ''}`} />
                    </div>
                    <span className="sc-label">{sc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Checkout Input Fields Form */}
            <form onSubmit={handleProcessTransaction} className="checkout-fields-form">
              {/* AUTHORIZATION AMOUNT */}
              <div className="form-group-wrap">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="pay-amt">TRANSACTION AMOUNT (INR)</label>
                </div>
                <div className="large-amount-input-box">
                  <span className="currency-symbol">₹</span>
                  <input
                    id="pay-amt"
                    type="text"
                    value={formData.amount}
                    placeholder="Enter amount (e.g. 5000)"
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9.]/g, '');
                      setFormData((prev) => ({ ...prev, amount: clean }));
                      setSelectedScenario('custom');
                    }}
                    className="large-amount-field"
                  />
                </div>
              </div>

              {/* Target Merchant & Geo Telemetry */}
              <div className="two-col-inputs">
                <div className="form-group-wrap">
                  <label className="field-label" htmlFor="pay-merch">MERCHANT NAME</label>
                  <div className="icon-input-container">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <input
                      id="pay-merch"
                      type="text"
                      value={formData.merchant}
                      placeholder="e.g. Swiggy, Amazon, Unknown Merchant"
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, merchant: e.target.value }));
                        setSelectedScenario('custom');
                      }}
                      className="clean-field"
                    />
                  </div>
                </div>

                <div className="form-group-wrap">
                  <label className="field-label" htmlFor="pay-geo">LOCATION / CITY</label>
                  <div className="icon-input-container">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <input
                      id="pay-geo"
                      type="text"
                      value={formData.location}
                      placeholder="e.g. Mumbai, Delhi, Dubai"
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, location: e.target.value }));
                        setSelectedScenario('custom');
                      }}
                      className="clean-field"
                    />
                  </div>
                </div>
              </div>

              {/* Timing & Payment Method */}
              <div className="two-col-inputs">
                <div className="form-group-wrap">
                  <label className="field-label" htmlFor="pay-time">TRANSACTION TIMING</label>
                  <div className="icon-input-container">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <input
                      id="pay-time"
                      type="text"
                      value={formData.timing}
                      placeholder="HH:MM (e.g. 14:30 or 03:00)"
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, timing: e.target.value }));
                        setSelectedScenario('custom');
                      }}
                      className="clean-field font-mono"
                    />
                  </div>
                </div>

                <div className="form-group-wrap">
                  <label className="field-label" htmlFor="pay-method">PAYMENT METHOD</label>
                  <select
                    id="pay-method"
                    value={formData.payment_method}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, payment_method: e.target.value }));
                      setSelectedScenario('custom');
                    }}
                    className="clean-field"
                    style={{ background: 'var(--color-bg-secondary, #1e293b)', color: 'inherit' }}
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="NETBANKING">Net Banking</option>
                  </select>
                </div>
              </div>

              {/* Device Profile Selection */}
              <div className="form-group-wrap">
                <label className="field-label" htmlFor="pay-device">DEVICE PROFILE</label>
                <select
                  id="pay-device"
                  value={formData.device}
                  onChange={(e) => {
                    const dev = e.target.value;
                    const fp = dev === 'new_device' 
                      ? 'MacOS (Chrome) • Unrecognized Device' 
                      : (dev === 'desktop' ? 'Windows 11 (Edge) • Known Desktop' : 'iOS 17 (Safari) • Verified Mobile');
                    setFormData((prev) => ({ ...prev, device: dev, fingerprint: fp }));
                    setSelectedScenario('custom');
                  }}
                  className="clean-field"
                  style={{ background: 'var(--color-bg-secondary, #1e293b)', color: 'inherit' }}
                >
                  <option value="mobile">Verified Mobile Device (iOS / Android)</option>
                  <option value="desktop">Known Desktop Workstation</option>
                  <option value="new_device">New / Unrecognized Device (High Risk Signal)</option>
                </select>
              </div>

              {/* CTA Button */}
              <button
                id="process-transaction-btn"
                type="submit"
                disabled={isProcessing}
                className="btn-process-transaction mt-3"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {isProcessing
                  ? 'ANALYZING TRANSACTION WITH ML...'
                  : `PROCESS TRANSACTION (₹${formattedDisplayAmount})`}
              </button>
            </form>
          </div>
        </section>

        {/* ========================================================
            RIGHT COLUMN: EVALUATION VERDICT INSPECTOR
            ======================================================== */}
        <section className="verdict-inspector-column" aria-label="Evaluation Verdict Inspector">
          {/* Header Row */}
          <div className="inspector-header-strip">
            <h3 className="inspector-heading">ML EVALUATION VERDICT</h3>
            <span className="badge-live-ml" style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              fontWeight: 600
            }}>
              LIVE MODEL PREDICTION
            </span>
          </div>

          {/* Verdict Banner */}
          {verdict.status === 'BLOCKED' ? (
            <div className="hero-verdict-banner banner-blocked">
              <div className="banner-top-headline">
                <span className="kicker-tag">AUTONOMOUS INTERCEPT</span>
                <span className="decision-code-pill">{verdict.decision}</span>
              </div>
              <div className="banner-title-line">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <h4>TRANSACTION BLOCKED</h4>
              </div>
              <p className="banner-sub-text">High-risk anomalous transaction detected by ML model.</p>
            </div>
          ) : (
            <div className="hero-verdict-banner banner-approved">
              <div className="banner-top-headline">
                <span className="kicker-tag">AUTONOMOUS CLEARANCE</span>
                <span className="decision-code-pill pass-pill">{verdict.decision}</span>
              </div>
              <div className="banner-title-line">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <h4>TRANSACTION APPROVED</h4>
              </div>
              <p className="banner-sub-text">Normal spending behavior verified across behavioral checkpoints.</p>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="verdict-metrics-duo">
            <div className="v-metric-card">
              <span className="metric-micro-label">FRAUD PROBABILITY</span>
              <div className={`metric-primary-figure ${verdict.status === 'BLOCKED' ? 'text-crimson' : 'text-emerald'}`}>
                {verdict.fraudLikelihood}%
              </div>
              <span className="metric-sub-note">{verdict.threatCategory}</span>
            </div>

            <div className="v-metric-card">
              <span className="metric-micro-label">MODEL INFERENCE</span>
              <div className="metric-primary-figure font-mono" style={{ fontSize: '18px', paddingTop: '4px' }}>
                {verdict.modelId}
              </div>
              <span className="metric-sub-note">Latency: {verdict.latency}</span>
            </div>
          </div>

          {/* TRIGGERED RISK FACTORS */}
          <div className="risk-factors-container">
            <span className="section-micro-heading">EXPLAINABLE AI FACTORS</span>

            {verdict.riskFactors.length === 0 ? (
              <div className="factor-clean-card">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div>
                  <strong>Legitimate Transaction</strong>
                  <p>Matches normal user spending patterns, trusted locations, and recognized devices.</p>
                </div>
              </div>
            ) : (
              <div className="factors-list">
                {verdict.riskFactors.map((factor, idx) => (
                  <div key={idx} className="factor-card-item">
                    <div className="factor-icon-col">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <div className="factor-text-col">
                      <strong>{factor.title}</strong>
                      <p>{factor.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="inspector-actions-row">
            <button
              type="button"
              className="btn-reset-preset"
              onClick={() => handleScenarioSelect(scenarios[0])}
            >
              Reset to Safe Preset
            </button>
            <button
              type="button"
              className="btn-open-forensics"
              onClick={() => onNavigate && onNavigate('/dashboard')}
            >
              View in Live Dashboard
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
