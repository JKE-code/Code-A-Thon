import uuid
import time
from datetime import datetime, timezone
from typing import Dict, Any

from fastapi import APIRouter, HTTPException

from backend.models import TransactionRequest, TransactionResponse, TransactionListResponse
from backend.store import add_transaction, get_transaction, get_all_transactions, get_total_count
from backend.websocket import manager

import importlib

# Dynamic ML predictor resolver (checks ml_engine.predictor first, falls back to mock_predict)
# Now transparently reports which mode is active.
_ml_module = None
_ml_available = False

try:
    _ml_module = importlib.import_module("ml_engine.predictor")
    if hasattr(_ml_module, "predict_transaction"):
        _ml_available = True
except (ImportError, ModuleNotFoundError):
    pass


def predict_transaction(tx_payload: Dict[str, Any]) -> Dict[str, Any]:
    if _ml_available:
        return _ml_module.predict_transaction(tx_payload)
    from backend.mock_data import mock_predict
    result = mock_predict(tx_payload)
    result["model_status"] = "mock"
    result["inference_latency_ms"] = None
    result["shap_values"] = {}
    result["shap_available"] = False
    result["agent_action"] = {"action": "APPROVE", "customer_message": None, "analyst_case_note": None}
    return result


def get_model_status() -> str:
    """Get current model status for health checks."""
    if _ml_available and hasattr(_ml_module, "get_model_status"):
        return _ml_module.get_model_status()
    return "mock"


def get_latency_benchmark() -> dict:
    """Get stored latency benchmark from training."""
    if _ml_available and hasattr(_ml_module, "get_latency_benchmark"):
        return _ml_module.get_latency_benchmark()
    return None


router = APIRouter(prefix="/api/transactions", tags=["transactions"])


def generate_transaction_id() -> str:
    return f"TX-{uuid.uuid4().hex[:8].upper()}"


def process_transaction(request_data: Dict[str, Any]) -> Dict[str, Any]:
    tx_id = generate_transaction_id()
    now_iso = request_data.get("timestamp") or datetime.now(timezone.utc).isoformat()
    timing_val = request_data.get("timing") or ""

    tx_payload = {
        "transaction_id": tx_id,
        "timestamp": now_iso,
        "timing": timing_val,
        "amount": request_data["amount"],
        "merchant": request_data["merchant"],
        "location": request_data["location"],
        "device": request_data["device"],
        "payment_method": request_data["payment_method"],
    }

    # Call ML predictor interface (either real or mock)
    ml_result = predict_transaction(tx_payload)

    # Combine transaction data + ML results
    combined: Dict[str, Any] = {
        "transaction_id": tx_id,
        "timestamp": now_iso,
        "amount": request_data["amount"],
        "merchant": request_data["merchant"],
        "location": request_data["location"],
        "device": request_data["device"],
        "payment_method": request_data["payment_method"],
        "fraud_probability": ml_result.get("fraud_probability", 0.0),
        "anomaly_score": ml_result.get("anomaly_score", 0.0),
        "risk_score": ml_result.get("risk_score", 0.0),
        "risk_level": ml_result.get("risk_level", "LOW"),
        "is_suspicious": ml_result.get("is_suspicious", False),
        "prediction": ml_result.get("prediction", "LEGITIMATE"),
        "explanation": ml_result.get("explanation", []),
        # New fields
        "shap_values": ml_result.get("shap_values", {}),
        "shap_available": ml_result.get("shap_available", False),
        "model_status": ml_result.get("model_status", "mock"),
        "inference_latency_ms": ml_result.get("inference_latency_ms", None),
        "agent_action": ml_result.get("agent_action", None),
    }

    # In-memory storage
    add_transaction(tx_id, combined)

    return combined


@router.post("", response_model=TransactionResponse)
async def create_transaction(request: TransactionRequest):
    result = process_transaction(request.model_dump())

    # Broadcast to WebSocket clients
    await manager.broadcast({
        "event": "transaction_created",
        "data": result,
    })

    return result


@router.get("", response_model=TransactionListResponse)
async def list_transactions():
    tx_list = get_all_transactions()
    return {
        "transactions": tx_list,
        "total": get_total_count(),
    }


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def retrieve_transaction(transaction_id: str):
    tx = get_transaction(transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx
