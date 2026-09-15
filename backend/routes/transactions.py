import uuid
from datetime import datetime, timezone
from typing import Dict, Any

from fastapi import APIRouter, HTTPException

from backend.models import TransactionRequest, TransactionResponse, TransactionListResponse
from backend.store import add_transaction, get_transaction, get_all_transactions, get_total_count
from backend.websocket import manager

import importlib

# Dynamic ML predictor resolver (checks ml_engine.predictor first, falls back to mock_predict)
def predict_transaction(tx_payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        ml_module = importlib.import_module("ml_engine.predictor")
        if hasattr(ml_module, "predict_transaction"):
            return ml_module.predict_transaction(tx_payload)
    except (ImportError, ModuleNotFoundError):
        pass
    from backend.mock_data import mock_predict
    return mock_predict(tx_payload)

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

    # Combine transaction data + ML results (contract frozen in spec)
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
