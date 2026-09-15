"""
Training pipeline for Fraud Detection models.

Trains:
  1. RandomForestClassifier — supervised fraud classifier
  2. IsolationForest — unsupervised anomaly detector (trained on legitimate only)

Dataset: Kaggle Credit Card Fraud Detection (mlg-ulb/creditcardfraud)
         Features: Time, V1..V28, Amount, Class (0=legit, 1=fraud)

Usage:
    python ml_engine/train.py
"""

import os
import sys
import time
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    average_precision_score,
    f1_score,
    precision_score,
    recall_score,
)

# --- paths ---
_DIR = os.path.dirname(os.path.abspath(__file__))
_MODELS_DIR = os.path.join(_DIR, "models")
os.makedirs(_MODELS_DIR, exist_ok=True)


def load_dataset():
    """Download / load the credit card fraud dataset."""
    print("[1/7] Loading dataset...")

    try:
        import kagglehub
        path = kagglehub.dataset_download("mlg-ulb/creditcardfraud")
        csv_path = os.path.join(path, "creditcard.csv")
    except Exception as e:
        # Fallback: look for a local copy
        csv_path = os.path.join(_DIR, "creditcard.csv")
        if not os.path.exists(csv_path):
            csv_path = os.path.join(os.path.dirname(_DIR), "creditcard.csv")
        if not os.path.exists(csv_path):
            print(f"ERROR: Could not load dataset: {e}")
            print("Place creditcard.csv in ml_engine/ or project root.")
            sys.exit(1)

    df = pd.read_csv(csv_path)
    print(f"  Loaded {len(df)} rows, {df['Class'].sum()} fraud cases "
          f"({df['Class'].mean()*100:.3f}%)")
    return df


def preprocess(df):
    """Clean + split + scale."""
    print("[2/7] Preprocessing...")

    # Drop NaN rows if any
    df = df.dropna()

    # Features and target
    X = df.drop("Class", axis=1)
    y = df["Class"]

    feature_names = list(X.columns)

    # Stratified split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # Scale Time and Amount (V1..V28 are already PCA-scaled)
    scaler = StandardScaler()
    X_train[["Time", "Amount"]] = scaler.fit_transform(
        X_train[["Time", "Amount"]]
    )
    X_test[["Time", "Amount"]] = scaler.transform(
        X_test[["Time", "Amount"]]
    )

    print(f"  Train: {len(X_train)} | Test: {len(X_test)}")
    print(f"  Train fraud rate: {y_train.mean()*100:.3f}%")

    return X_train, X_test, y_train, y_test, scaler, feature_names


def train_fraud_classifier(X_train, y_train):
    """Train RandomForestClassifier."""
    print("[3/7] Training RandomForestClassifier...")
    t0 = time.time()

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    elapsed = time.time() - t0
    print(f"  Trained in {elapsed:.1f}s")
    return model


def train_anomaly_detector(X_train, y_train):
    """Train IsolationForest on legitimate transactions only."""
    print("[4/7] Training IsolationForest (on legitimate data)...")
    t0 = time.time()

    # Filter to legitimate transactions only
    X_legit = X_train[y_train == 0]
    print(f"  Using {len(X_legit)} legitimate transactions for training")

    model = IsolationForest(
        n_estimators=200,
        contamination=0.01,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_legit)

    elapsed = time.time() - t0
    print(f"  Trained in {elapsed:.1f}s")
    return model


def evaluate(fraud_model, anomaly_model, X_test, y_test):
    """Evaluate both models on the test set."""
    print("[5/7] Evaluating...")

    # --- Fraud Classifier ---
    y_pred = fraud_model.predict(X_test)
    y_prob = fraud_model.predict_proba(X_test)[:, 1]

    print("\n" + "=" * 60)
    print("FRAUD CLASSIFIER EVALUATION")
    print("=" * 60)
    print(classification_report(
        y_test, y_pred, target_names=["Legitimate", "Fraud"]
    ))

    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)

    roc = roc_auc_score(y_test, y_prob)
    pr = average_precision_score(y_test, y_prob)
    f1 = f1_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)

    print(f"\nFraud Precision : {prec:.4f}")
    print(f"Fraud Recall    : {rec:.4f}")
    print(f"Fraud F1        : {f1:.4f}")
    print(f"ROC-AUC         : {roc:.4f}")
    print(f"PR-AUC          : {pr:.4f}")

    # --- Anomaly Detector ---
    anomaly_pred = anomaly_model.predict(X_test)
    anomaly_scores = anomaly_model.decision_function(X_test)

    n_anomalies = (anomaly_pred == -1).sum()
    print(f"\n{'=' * 60}")
    print("ISOLATION FOREST EVALUATION")
    print("=" * 60)
    print(f"Anomalies detected: {n_anomalies}/{len(X_test)} "
          f"({n_anomalies/len(X_test)*100:.2f}%)")
    print(f"Score range: [{anomaly_scores.min():.4f}, {anomaly_scores.max():.4f}]")
    print(f"Mean score (normal): {anomaly_scores[y_test == 0].mean():.4f}")
    print(f"Mean score (fraud):  {anomaly_scores[y_test == 1].mean():.4f}")

    return {
        "fraud_precision": prec,
        "fraud_recall": rec,
        "fraud_f1": f1,
        "roc_auc": roc,
        "pr_auc": pr,
    }


def save_models(fraud_model, anomaly_model, scaler, feature_names, metrics):
    """Serialize models and metadata."""
    print("[6/7] Saving models...")

    joblib.dump(fraud_model, os.path.join(_MODELS_DIR, "fraud_model.pkl"))
    joblib.dump(anomaly_model, os.path.join(_MODELS_DIR, "anomaly_model.pkl"))
    joblib.dump(scaler, os.path.join(_MODELS_DIR, "scaler.pkl"))

    metadata = {
        "features": feature_names,
        "threshold": 0.35,
        "metrics": metrics,
    }
    joblib.dump(metadata, os.path.join(_MODELS_DIR, "metadata.pkl"))

    print(f"  Saved to {_MODELS_DIR}/")
    for f in os.listdir(_MODELS_DIR):
        fpath = os.path.join(_MODELS_DIR, f)
        size_mb = os.path.getsize(fpath) / (1024 * 1024)
        print(f"    {f}: {size_mb:.2f} MB")


def quick_integration_test():
    """Smoke test: import predictor and run a sample transaction."""
    print("[7/7] Integration smoke test...")

    # Ensure ml_engine is importable
    import sys
    project_root = os.path.dirname(_DIR)
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    # Force reimport so it picks up the newly saved models
    import importlib
    import ml_engine.predictor as pred_mod
    importlib.reload(pred_mod)

    result = pred_mod.predict_transaction({
        "transaction_id": "TRAIN-TEST",
        "amount": 95000,
        "merchant": "Unknown Merchant",
        "location": "Dubai",
        "device": "new_device",
        "payment_method": "CARD",
    })

    print(f"\n  Test transaction result:")
    for k, v in result.items():
        print(f"    {k}: {v}")

    assert result["risk_level"] in ("HIGH", "CRITICAL"), \
        f"Expected HIGH/CRITICAL, got {result['risk_level']}"
    print("\n  ✓ Smoke test passed!")


def main():
    print("=" * 60)
    print("FRAUD DETECTION — MODEL TRAINING PIPELINE")
    print("=" * 60)
    t_start = time.time()

    df = load_dataset()
    X_train, X_test, y_train, y_test, scaler, feature_names = preprocess(df)
    fraud_model = train_fraud_classifier(X_train, y_train)
    anomaly_model = train_anomaly_detector(X_train, y_train)
    metrics = evaluate(fraud_model, anomaly_model, X_test, y_test)
    save_models(fraud_model, anomaly_model, scaler, feature_names, metrics)

    elapsed = time.time() - t_start
    print(f"\nTotal training time: {elapsed:.1f}s")
    print("Done.\n")

    quick_integration_test()


if __name__ == "__main__":
    main()
