"""
Feature engineering for fraud detection.

Handles two modes:
1. Training mode: transforms raw dataset features (Time, V1..V28, Amount)
2. Inference mode: maps frontend transaction dicts to model-compatible vectors
"""

import numpy as np
import os
import joblib

# --- paths ---
_DIR = os.path.dirname(os.path.abspath(__file__))
_MODELS_DIR = os.path.join(_DIR, "models")

# --- load scaler & metadata at import time ---
_scaler = None
_metadata = None

def _load_artifacts():
    global _scaler, _metadata
    scaler_path = os.path.join(_MODELS_DIR, "scaler.pkl")
    meta_path = os.path.join(_MODELS_DIR, "metadata.pkl")
    if os.path.exists(scaler_path):
        _scaler = joblib.load(scaler_path)
    if os.path.exists(meta_path):
        _metadata = joblib.load(meta_path)

_load_artifacts()

# ---------- constants for synthetic feature generation ----------

# Known-safe merchants get a low risk signal; unknowns get a high one.
MERCHANT_RISK = {
    "amazon": 0.05,
    "flipkart": 0.08,
    "swiggy": 0.06,
    "zomato": 0.06,
    "bigbasket": 0.07,
    "myntra": 0.08,
    "phonepe": 0.04,
    "paytm": 0.05,
    "google pay": 0.04,
    "uber": 0.10,
    "ola": 0.09,
}

LOCATION_RISK = {
    "mumbai": 0.05,
    "delhi": 0.08,
    "bangalore": 0.05,
    "hyderabad": 0.06,
    "chennai": 0.06,
    "kolkata": 0.07,
    "pune": 0.06,
    "ahmedabad": 0.07,
}

DEVICE_RISK = {
    "mobile": 0.05,
    "desktop": 0.15,
    "tablet": 0.10,
    "new_device": 0.85,
}

PAYMENT_RISK = {
    "upi": 0.05,
    "card": 0.25,
    "net_banking": 0.15,
    "wallet": 0.10,
}

# Average legitimate transaction amount (for deviation calc)
NORMAL_AMOUNT = 2500.0


def transform_for_model(transaction: dict) -> np.ndarray:
    """
    Convert a frontend transaction dict into the 30-feature vector
    (Time, V1..V28, Amount) that the trained models expect.

    Strategy:
    - Amount → use actual amount (scaled if scaler available)
    - Time   → synthetic: 0 (irrelevant for demo)
    - V1..V28→ deterministic synthetic values derived from the transaction
               context so that risky transactions produce feature patterns
               that sit in the "fraud" region the classifier learned.
    """
    amount = float(transaction.get("amount", 0))
    merchant = str(transaction.get("merchant", "")).lower()
    location = str(transaction.get("location", "")).lower()
    device = str(transaction.get("device", "")).lower()
    payment_method = str(transaction.get("payment_method", "")).lower()

    # --- risk signals ---
    merchant_risk = MERCHANT_RISK.get(merchant, 0.70)
    if "unknown" in merchant:
        merchant_risk = 0.85

    location_risk = LOCATION_RISK.get(location, 0.65)
    device_risk = DEVICE_RISK.get(device, 0.50)
    payment_risk = PAYMENT_RISK.get(payment_method, 0.15)

    amount_deviation = amount / NORMAL_AMOUNT  # >1 = suspicious

    # Composite risk signal 0‒1
    context_signal = min(1.0, (
        0.30 * merchant_risk +
        0.20 * location_risk +
        0.25 * device_risk +
        0.10 * payment_risk +
        0.15 * min(amount_deviation / 40, 1.0)
    ))

    # --- build synthetic V1..V28 ---
    # The credit-card PCA dataset has V1..V28 centred around 0 for
    # legitimate transactions.  Fraud rows tend to have large negative V1,
    # V3, V7, V10, V14, V17 and large positive V4, V11, V12, V16.
    # We push the synthetic vector towards the fraud region proportionally
    # to the context risk signal.

    rng = np.random.RandomState(int(amount * 100) % (2**31))  # deterministic per amount
    base = rng.randn(28) * 0.2  # small noise around zero (looks normal)

    # Shift fraud-indicative components proportionally
    # Must be aggressive enough that the RandomForest actually classifies
    # high-risk demo transactions as fraud.
    fraud_shift = context_signal * 8.0  # strong push into fraud region

    # Components that go strongly negative in fraud
    # V1(idx0), V3(idx2), V5(idx4), V7(idx6), V10(idx9), V14(idx13), V17(idx16)
    for idx in [0, 2, 4, 6, 9, 13, 16]:
        base[idx] = -(fraud_shift * (1.5 + rng.rand() * 0.5))

    # Components that go strongly positive in fraud
    # V4(idx3), V11(idx10), V12(idx11), V16(idx15)
    for idx in [3, 10, 11, 15]:
        base[idx] = fraud_shift * (1.0 + rng.rand() * 0.4)

    # For low-risk transactions, dampen everything back towards zero
    dampen = context_signal ** 0.7  # nonlinear: low risk → very dampened
    base *= dampen

    # --- assemble feature vector: [Time, V1..V28, Amount] ---
    time_val = 0.0
    features = np.zeros(30)
    features[0] = time_val
    features[1:29] = base
    features[29] = amount

    # Scale Time and Amount if scaler is available
    if _scaler is not None:
        try:
            scaled = _scaler.transform([[time_val, amount]])
            features[0] = scaled[0][0]
            features[29] = scaled[0][1]
        except Exception:
            pass  # if scaler shape mismatch, leave raw values

    return features.reshape(1, -1)


def normalize_anomaly(raw_score: float) -> float:
    """
    Convert IsolationForest decision_function output to 0‒1 score.
    decision_function returns negative for anomalies, positive for normal.
    We invert: 0 = normal, 1 = highly anomalous.
    """
    return float(max(0.0, min(1.0, 0.5 - raw_score)))
