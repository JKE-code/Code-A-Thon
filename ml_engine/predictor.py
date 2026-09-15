"""
predictor.py — THE interface for the backend.

Usage:
    from ml_engine.predictor import predict_transaction
    result = predict_transaction(transaction_dict)

Loads trained models at import time. Falls back to demo mode
if model files are missing.
"""

import os
import logging

logger = logging.getLogger(__name__)

_DIR = os.path.dirname(os.path.abspath(__file__))
_MODELS_DIR = os.path.join(_DIR, "models")

# ---------- load models once ----------

_fraud_model = None
_anomaly_model = None
_scaler = None
_metadata = None
_demo_mode = False

try:
    import joblib

    fraud_path = os.path.join(_MODELS_DIR, "fraud_model.pkl")
    anomaly_path = os.path.join(_MODELS_DIR, "anomaly_model.pkl")
    scaler_path = os.path.join(_MODELS_DIR, "scaler.pkl")
    meta_path = os.path.join(_MODELS_DIR, "metadata.pkl")

    if os.path.exists(fraud_path) and os.path.exists(anomaly_path):
        _fraud_model = joblib.load(fraud_path)
        _anomaly_model = joblib.load(anomaly_path)
        logger.info("ML models loaded successfully.")
        if os.path.exists(scaler_path):
            _scaler = joblib.load(scaler_path)
        if os.path.exists(meta_path):
            _metadata = joblib.load(meta_path)
    else:
        _demo_mode = True
        logger.warning(
            "Model files not found. Running in DEMO (fallback) mode."
        )
except Exception as e:
    _demo_mode = True
    logger.warning(f"Failed to load models: {e}. Running in DEMO mode.")

# ---------- imports from sibling modules ----------

from ml_engine.features import transform_for_model, normalize_anomaly
from ml_engine.risk import contextual_risk, calculate_risk
from ml_engine.explain import explain_transaction


def _predict_with_models(transaction: dict) -> dict:
    """Full prediction using trained ML models + contextual boost."""
    features = transform_for_model(transaction)

    # Fraud classifier — probability of class 1 (fraud)
    fraud_probability = float(
        _fraud_model.predict_proba(features)[0][1]
    )

    # Anomaly detector — decision_function (negative = anomaly)
    raw_anomaly = float(
        _anomaly_model.decision_function(features)[0]
    )
    anomaly_score = normalize_anomaly(raw_anomaly)

    # Hybrid boost: the PCA-trained model can't properly classify
    # synthetic demo features derived from merchant/location/device.
    # When contextual risk signals are strong, use them to set a
    # floor on fraud probability. This is the hybrid approach from
    # the spec (sections 10-11).
    ctx = contextual_risk(transaction)
    if ctx > 0.3:
        context_fraud_floor = min(1.0, ctx * 1.05)
        fraud_probability = max(fraud_probability, context_fraud_floor)
        anomaly_score = max(anomaly_score, ctx * 0.90)

    return fraud_probability, anomaly_score


def _predict_demo(transaction: dict) -> tuple:
    """
    Fallback prediction when models are unavailable.
    Uses contextual risk alone to produce believable scores.
    """
    ctx = contextual_risk(transaction)

    # Synthesise a plausible fraud probability from context
    fraud_probability = min(1.0, ctx * 1.15 + 0.02)

    # Synthesise anomaly from amount deviation + context
    amount = float(transaction.get("amount", 0))
    amount_signal = min(1.0, amount / 100000)
    anomaly_score = min(1.0, 0.4 * ctx + 0.6 * amount_signal)

    return fraud_probability, anomaly_score


def predict_transaction(transaction: dict) -> dict:
    """
    THE function the backend calls.

    Args:
        transaction: dict with keys:
            transaction_id, amount, merchant, location,
            device, payment_method  (timestamp optional)

    Returns:
        dict matching the frozen API contract.
    """
    # Get ML scores
    if _demo_mode:
        fraud_probability, anomaly_score = _predict_demo(transaction)
    else:
        fraud_probability, anomaly_score = _predict_with_models(transaction)

    # Contextual risk
    ctx_score = contextual_risk(transaction)

    # Combined risk
    risk_score, risk_level = calculate_risk(
        fraud_probability, anomaly_score, ctx_score
    )

    # Suspicion threshold
    is_suspicious = risk_score >= 0.65
    prediction = "FRAUD" if is_suspicious else "LEGITIMATE"

    # Explanations
    explanations = explain_transaction(
        transaction, fraud_probability, anomaly_score, ctx_score
    )

    return {
        "transaction_id": transaction.get("transaction_id", "TX-0000"),
        "fraud_probability": round(fraud_probability, 4),
        "anomaly_score": round(anomaly_score, 4),
        "risk_score": round(risk_score, 4),
        "risk_level": risk_level,
        "is_suspicious": is_suspicious,
        "prediction": prediction,
        "explanation": explanations,
    }
