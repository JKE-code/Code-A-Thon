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
      location: 'Mumbai, MH (ASN 55836)',
      device: 'mobile',
      fingerprint: 'iOS 17 (Safari) • Hash: c83a921d...',
      isUnrecognized: false,
      cardNumber: '4242 •••• •••• 4242',
      expiry: '09/27',
      cvc: '•••'
    },
    {
      id: 'elevated',
      amount: '8500',
      label: 'Electronics / Elevated',
      merchant: 'Croma Electronics',
      location: 'Delhi, DL (ASN 45820)',
      device: 'desktop',
      fingerprint: 'Windows 11 (Edge) • Hash: 4e21a89c...',
      isUnrecognized: false,
      cardNumber: '5500 •••• •••• 8821',
      expiry: '11/26',
      cvc: '•••'
    },
    {
      id: 'critical',
      amount: '95000',
      label: 'Dubai Luxury / Critical',
      merchant: 'Al-Safa Watches & Luxury',
      location: 'Dubai, UAE (ASN 5384)',
      device: 'new_device',
      fingerprint: 'MacOS (Chrome 122) • Hash: 9df04a8b...',
      isUnrecognized: true,
      cardNumber: '4242 •••• •••• 4242',
      expiry: '12/28',
      cvc: '•••'
    }
  ];

  const [selectedScenario, setSelectedScenario] = useState('critical');
  const [formData, setFormData] = useState({
    amount: '95000',
    merchant: 'Al-Safa Watches & Luxury',
    location: 'Dubai, UAE (ASN 5384)',
    device: 'new_device',
    payment_method: 'CARD',
    fingerprint: 'MacOS (Chrome 122) • Hash: 9df04a8b...',
    cardNumber: '4242 •••• •••• 4242',
    expiry: '12/28',
    cvc: '•••'
  });

  const [activeTab, setActiveTab] = useState('Critical Flag'); // Evaluating, Critical Flag, Safe Normal
  const [isProcessing, setIsProcessing] = useState(false);
  const [verdict, setVerdict] = useState({
    status: 'BLOCKED',
    decision: 'REJECT 403',
    fraudLikelihood: 94.1,
    threatCategory: 'Critical Threat Category',
    modelId: 'XGB-F419',
    latency: '18.2ms',
    refId: 'TX-1027-BLOCKED',
    timestamp: 'JUST NOW',
    riskFactors: [
      {
        title: 'Amount Outlier (+480%)',
        detail: "Authorized amount of ₹95,000 exceeds the 90-day baseline average of ₹4,210.",
        icon: 'alert'
      },
      {
        title: 'Geolocation Dissonance',
        detail: "Request routed through UAE IP while cardholder's mobile SIM was active in Mumbai 8 mins ago.",
        icon: 'globe'
      },
      {
        title: 'Unknown Device Signature',
        detail: "Zero prior authentication footprint. Hardware entropy indicates emulated user agent.",
        icon: 'fingerprint'
      }
    ]
  });

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario.id);
    setFormData({
      amount: scenario.amount,
      merchant: scenario.merchant,
      location: scenario.location,
      device: scenario.device,
      payment_method: 'CARD',
      fingerprint: scenario.fingerprint,
      cardNumber: scenario.cardNumber,
      expiry: scenario.expiry,
      cvc: scenario.cvc
    });

    if (scenario.id === 'safe') {
      setActiveTab('Safe Normal');
      setVerdict({
        status: 'APPROVED',
        decision: 'PASS 200',
        fraudLikelihood: 2.1,
        threatCategory: 'Baseline Clean Traffic',
        modelId: 'XGB-F419',
        latency: '14.1ms',
        refId: 'TX-1034-APPROVED',
        timestamp: 'JUST NOW',
        riskFactors: []
      });
    } else if (scenario.id === 'elevated') {
      setActiveTab('Critical Flag');
      setVerdict({
        status: 'REVIEW',
        decision: 'CHALLENGE 302',
        fraudLikelihood: 68.2,
        threatCategory: 'Elevated Threat Category',
        modelId: 'XGB-F419',
        latency: '16.5ms',
        refId: 'TX-1035-STEPUP',
        timestamp: 'JUST NOW',
        riskFactors: [
          {
            title: 'Unfamiliar Shopping Time',
            detail: 'Transaction initiated outside habitual active cardholder hours.',
            icon: 'alert'
          },
          {
            title: 'Moderate Deviation',
            detail: 'Amount is 2.8x higher than typical merchant category spend.',
            icon: 'globe'
          }
        ]
      });
    } else {
      setActiveTab('Critical Flag');
      setVerdict({
        status: 'BLOCKED',
        decision: 'REJECT 403',
        fraudLikelihood: 94.1,
        threatCategory: 'Critical Threat Category',
        modelId: 'XGB-F419',
        latency: '18.2ms',
        refId: 'TX-1027-BLOCKED',
        timestamp: 'JUST NOW',
        riskFactors: [
          {
            title: 'Amount Outlier (+480%)',
            detail: "Authorized amount of ₹95,000 exceeds the 90-day baseline average of ₹4,210.",
            icon: 'alert'
          },
          {
            title: 'Geolocation Dissonance',
            detail: "Request routed through UAE IP while cardholder's mobile SIM was active in Mumbai 8 mins ago.",
            icon: 'globe'
          },
          {
            title: 'Unknown Device Signature',
            detail: "Zero prior authentication footprint. Hardware entropy indicates emulated user agent.",
            icon: 'fingerprint'
          }
        ]
      });
    }
  };

  const handleProcessTransaction = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setActiveTab('Evaluating');

    const payload = {
      amount: parseFloat(formData.amount) || 0,
      merchant: formData.merchant,
      location: formData.location.split(' ')[0],
      device: formData.device,
      payment_method: formData.payment_method
    };

    await new Promise((res) => setTimeout(res, 900));

    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (onTransactionCreated) onTransactionCreated(data);
    } catch (err) {
      const mockResult = mockAnalyzeTransaction(payload);
      if (onTransactionCreated) onTransactionCreated(mockResult);
    }

    setIsProcessing(false);
    setActiveTab(selectedScenario === 'safe' ? 'Safe Normal' : 'Critical Flag');
  };

  const formattedDisplayAmount = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(formData.amount);

  return (
    <div className="secops-pay-page-wrapper">
      {/* Top Breadcrumb & Port Telemetry Bar */}
      <div className="pay-telemetry-strip">
        <div className="telemetry-strip-left">
          <span className="telemetry-label">SECOPS SIMULATOR</span>
          <span className="telemetry-sep">/</span>
          <span className="telemetry-sub">Live Gateway Sandbox v4.19</span>
          <span className="telemetry-kernel-pill">KERNEL: XGB-992B</span>
        </div>

        <div className="telemetry-strip-right">
          <span className="ingestion-dot" />
          <span className="ingestion-text">INGESTION PORT: <strong>8443</strong></span>
          <span className="telemetry-sep">|</span>
          <span className="telemetry-latency">Latency: 14ms (P99)</span>
        </div>
      </div>

      {/* Main 2-Column Split Layout */}
      <div className="pay-two-column-layout">
        {/* ========================================================
            LEFT COLUMN: SECURE CHECKOUT FORM
            ======================================================== */}
        <section className="checkout-form-column" aria-label="Secure Checkout">
          <div className="checkout-main-card">
            {/* Header */}
            <div className="checkout-header-row">
              <div className="checkout-brand-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <h2>Secure Checkout</h2>
              </div>
              <span className="testnet-emulator-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                </svg>
                TESTNET EMULATOR
              </span>
            </div>

            <p className="checkout-subline">
              Processed via FraudGuard Autonomous Risk Engine. Biometric and network heuristics analyzed in real-time.
            </p>

            {/* Sandbox Notice Banner */}
            <div className="sandbox-alert-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" className="lightning-icon">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <div>
                <strong>SANDBOX ACTIVE</strong>
                <p>Simulated telemetry environment. No actual bank funds or clearing networks are debited.</p>
              </div>
            </div>

            {/* SIMULATE RISK SCENARIOS Cards */}
            <div className="scenarios-section">
              <span className="section-micro-heading">SIMULATE RISK SCENARIOS</span>
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
                  <label className="field-label" htmlFor="pay-amt">AUTHORIZATION AMOUNT</label>
                  <span className="field-hint-code">INR (₹)</span>
                </div>
                <div className="large-amount-input-box">
                  <span className="currency-symbol">₹</span>
                  <input
                    id="pay-amt"
                    type="text"
                    value={formattedDisplayAmount}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, '');
                      setFormData((prev) => ({ ...prev, amount: clean }));
                    }}
                    className="large-amount-field"
                  />
                </div>
              </div>

              {/* Target Merchant & Geo Telemetry */}
              <div className="two-col-inputs">
                <div className="form-group-wrap">
                  <label className="field-label" htmlFor="pay-merch">TARGET MERCHANT</label>
                  <div className="icon-input-container">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <input
                      id="pay-merch"
                      type="text"
                      value={formData.merchant}
                      onChange={(e) => setFormData((prev) => ({ ...prev, merchant: e.target.value }))}
                      className="clean-field"
                    />
                  </div>
                </div>

                <div className="form-group-wrap">
                  <label className="field-label" htmlFor="pay-geo">GEO TELEMETRY</label>
                  <div className="icon-input-container">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <input
                      id="pay-geo"
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      className="clean-field"
                    />
                  </div>
                </div>
              </div>

              {/* Client Fingerprint Profile */}
              <div className="form-group-wrap">
                <label className="field-label">CLIENT FINGERPRINT PROFILE</label>
                <div className="fingerprint-display-box">
                  <div className="fp-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <span>{formData.fingerprint}</span>
                  </div>
                  {formData.device === 'new_device' && (
                    <span className="unrecognized-tag">UNRECOGNIZED</span>
                  )}
                </div>
              </div>

              {/* Payment Instrument */}
              <div className="form-group-wrap">
                <div className="field-label-row">
                  <label className="field-label">PAYMENT INSTRUMENT</label>
                  <div className="card-brand-logos">
                    <span className="brand-chip">VISA</span>
                    <span className="brand-chip">MC</span>
                  </div>
                </div>
                <div className="card-input-box">
                  <div className="card-num-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    <span className="card-digits">{formData.cardNumber}</span>
                  </div>
                  <span className="tokenized-badge">TOKENIZED</span>
                </div>
              </div>

              {/* Expiry & CVC */}
              <div className="two-col-inputs">
                <div className="form-group-wrap">
                  <label className="field-label" htmlFor="pay-exp">Expiry</label>
                  <input
                    id="pay-exp"
                    type="text"
                    value={formData.expiry}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expiry: e.target.value }))}
                    className="clean-field font-mono"
                  />
                </div>

                <div className="form-group-wrap">
                  <label className="field-label" htmlFor="pay-cvc">Security CVC</label>
                  <div className="icon-input-container">
                    <input
                      id="pay-cvc"
                      type="text"
                      value={formData.cvc}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cvc: e.target.value }))}
                      className="clean-field font-mono"
                    />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Big CTA Process Button */}
              <button
                id="process-transaction-btn"
                type="submit"
                disabled={isProcessing}
                className="btn-process-transaction"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {isProcessing
                  ? 'AI INGESTION & RISK SCORING...'
                  : `PROCESS TRANSACTION (₹${formattedDisplayAmount})`}
              </button>

              <div className="tls-security-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>256-Bit TLS Ingestion</span>
                <span className="dot-sep">•</span>
                <span>SecOps Model v4.19 Active</span>
              </div>
            </form>
          </div>
        </section>

        {/* ========================================================
            RIGHT COLUMN: EVALUATION VERDICT INSPECTOR
            ======================================================== */}
        <section className="verdict-inspector-column" aria-label="Evaluation Verdict Inspector">
          {/* Header Row */}
          <div className="inspector-header-strip">
            <h3 className="inspector-heading">EVALUATION VERDICT INSPECTOR</h3>
            <div className="inspector-tabs-group">
              <button
                className={`tab-pill ${activeTab === 'Evaluating' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('Evaluating')}
              >
                Evaluating
              </button>
              <button
                className={`tab-pill ${activeTab === 'Critical Flag' ? 'active-tab-red' : ''}`}
                onClick={() => handleScenarioSelect(scenarios[2])}
              >
                Critical Flag
              </button>
              <button
                className={`tab-pill ${activeTab === 'Safe Normal' ? 'active-tab-green' : ''}`}
                onClick={() => handleScenarioSelect(scenarios[0])}
              >
                Safe Normal
              </button>
            </div>
          </div>

          {/* Autonomous Intercept Hero Banner */}
          {verdict.status === 'BLOCKED' ? (
            <div className="hero-verdict-banner banner-blocked">
              <div className="banner-top-headline">
                <span className="kicker-tag">AUTONOMOUS INTERCEPT</span>
                <span className="decision-code-pill">REJECT 403</span>
              </div>
              <div className="banner-title-line">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <h4>TRANSACTION BLOCKED</h4>
              </div>
              <p className="banner-sub-text">High-confidence anomalous pattern detected.</p>
            </div>
          ) : (
            <div className="hero-verdict-banner banner-approved">
              <div className="banner-top-headline">
                <span className="kicker-tag">AUTONOMOUS CLEARANCE</span>
                <span className="decision-code-pill pass-pill">PASS 200</span>
              </div>
              <div className="banner-title-line">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <h4>TRANSACTION APPROVED</h4>
              </div>
              <p className="banner-sub-text">Baseline risk clearance verified across neural checkpoints.</p>
            </div>
          )}

          {/* Metrics Grid (Likelihood & Model ID) */}
          <div className="verdict-metrics-duo">
            <div className="v-metric-card">
              <span className="metric-micro-label">FRAUD LIKELIHOOD</span>
              <div className="metric-primary-figure text-crimson">
                {verdict.fraudLikelihood}%
              </div>
              <span className="metric-sub-note">{verdict.threatCategory}</span>
            </div>

            <div className="v-metric-card">
              <span className="metric-micro-label">SECOPS MODEL ID</span>
              <div className="metric-primary-figure font-mono">
                {verdict.modelId}
              </div>
              <span className="metric-sub-note">Latency: {verdict.latency}</span>
            </div>
          </div>

          {/* TRIGGERED RISK FACTORS */}
          <div className="risk-factors-container">
            <span className="section-micro-heading">TRIGGERED RISK FACTORS</span>

            {verdict.riskFactors.length === 0 ? (
              <div className="factor-clean-card">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div>
                  <strong>All Behavioral Tests Passed</strong>
                  <p>No outlier signatures detected across 42 cardholder telemetry parameters.</p>
                </div>
              </div>
            ) : (
              <div className="factors-list">
                {verdict.riskFactors.map((factor, idx) => (
                  <div key={idx} className="factor-card-item">
                    <div className="factor-icon-col">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
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

          {/* Audit Reference Bar */}
          <div className="audit-ref-strip">
            <span>REF: <strong>{verdict.refId}</strong></span>
            <span>TIMESTAMP: <strong>{verdict.timestamp}</strong></span>
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
              Open Forensics
            </button>
          </div>

          {/* Bottom Model Confidence Gauge */}
          <div className="confidence-gauge-box">
            <div className="gauge-header-row">
              <span className="gauge-title">MODEL CONFIDENCE INDEX</span>
              <span className="gauge-roc">ROC-AUC: <strong>0.994</strong></span>
            </div>

            <div className="confidence-multi-bar">
              <div className="conf-segment seg-clear" style={{ width: '49%' }}>
                <span>0-49 (CLEAR)</span>
              </div>
              <div className="conf-segment seg-review" style={{ width: '35%' }}>
                <span>50-84 (REVIEW)</span>
              </div>
              <div className="conf-segment seg-reject" style={{ width: '16%' }}>
                <span>85-100 (REJECT)</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Compliance Footer */}
      <footer className="secops-footer-bar mt-4">
        <div className="footer-left">
          <span>© 2025 FRAUDGUARD AUTONOMOUS RISK ENGINE.</span>
          <span className="soc2-badge">SOC-2 Type II Certified</span>
        </div>
        <div className="footer-right">
          <span>Cluster ID: <code>secops-prod-us-east-1</code></span>
          <span className="bullet-sep">|</span>
          <span>API Latency: <strong>18ms</strong></span>
        </div>
      </footer>
    </div>
  );
}
