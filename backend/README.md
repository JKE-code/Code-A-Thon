# Backend API Documentation & Integration Guide

## 1. Overview
The **Fraud Detection & Transaction Risk Agent** backend provides high-throughput real-time transaction scoring, risk assessment, and live WebSocket streaming.

Built with **FastAPI**, **Uvicorn**, and **Pydantic**.

---

## 2. Directory Structure
```text
backend/
├── __init__.py
├── main.py              # FastAPI application, CORS, WebSocket, and background live generator
├── models.py            # Pydantic data schemas matching exact contract
├── store.py             # In-memory transaction storage & statistical aggregation
├── websocket.py         # Connection manager & broadcasting
├── mock_data.py         # Mock ML predictor fallback & realistic dummy transaction generator
├── test_api.py          # Automated verification test suite
├── requirements.txt     # Python backend dependencies
└── routes/
    ├── __init__.py
    ├── transactions.py  # POST, GET list, GET by ID endpoints
    └── dashboard.py     # Aggregated stats endpoint (/api/dashboard/stats)
```

---

## 3. Quick Start

### 3.1 Installation
```bash
pip install -r backend/requirements.txt
```

### 3.2 Running the Server
```bash
python -m uvicorn backend.main:app --reload --port 8000
```
- **API URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **WebSocket Endpoint**: `ws://localhost:8000/ws`

### 3.3 Running Automated Contract Tests
```bash
python backend/test_api.py
```

---

## 4. API Endpoints

### 4.1 `GET /api/health`
Health verification endpoint.
- **Response**:
```json
{
  "status": "ok",
  "service": "fraud-detection-api"
}
```

---

### 4.2 `POST /api/transactions`
Submit a new transaction for real-time analysis.
- **Request Body**:
```json
{
  "amount": 95000,
  "merchant": "Unknown Merchant",
  "location": "Dubai",
  "device": "new_device",
  "payment_method": "CARD"
}
```
- **Response (HTTP 200)**:
```json
{
  "transaction_id": "TX-FEF9CBFF",
  "timestamp": "2026-09-15T12:35:00.000000+00:00",
  "amount": 95000.0,
  "merchant": "Unknown Merchant",
  "location": "Dubai",
  "device": "new_device",
  "payment_method": "CARD",
  "fraud_probability": 0.94,
  "anomaly_score": 0.88,
  "risk_score": 0.92,
  "risk_level": "CRITICAL",
  "is_suspicious": true,
  "prediction": "FRAUD",
  "explanation": [
    "Transaction amount is unusually high",
    "New device detected",
    "Unusual transaction location"
  ]
}
```

---

### 4.3 `GET /api/transactions`
Returns list of all processed transactions (newest first).
- **Response**:
```json
{
  "transactions": [ ... ],
  "total": 12
}
```

---

### 4.4 `GET /api/transactions/{transaction_id}`
Returns details for a specific transaction.
- Returns `404` with `{"detail": "Transaction not found"}` if not present.

---

### 4.5 `GET /api/dashboard/stats`
Returns aggregated metrics for dashboard KPI cards and charts:
```json
{
  "total_transactions": 24,
  "fraud_detected": 3,
  "high_risk_transactions": 5,
  "avg_risk_score": 21.4,
  "risk_distribution": {
    "LOW": 18,
    "MEDIUM": 1,
    "HIGH": 3,
    "CRITICAL": 2
  },
  "prediction_distribution": {
    "LEGITIMATE": 21,
    "FRAUD": 3
  }
}
```

---

### 4.6 `WS /ws` (WebSocket)
Connect: `ws://localhost:8000/ws`
Whenever a transaction is created (via payment form or background generator), the server broadcasts:
```json
{
  "event": "transaction_created",
  "data": {
    "transaction_id": "TX-...",
    "timestamp": "...",
    "amount": 450.0,
    "merchant": "Amazon",
    "location": "Mumbai",
    "device": "mobile",
    "payment_method": "UPI",
    "fraud_probability": 0.04,
    "anomaly_score": 0.06,
    "risk_score": 0.04,
    "risk_level": "LOW",
    "is_suspicious": false,
    "prediction": "LEGITIMATE",
    "explanation": []
  }
}
```

---

## 5. ML Integration Plug-and-Play
The backend imports:
```python
try:
    from ml_engine.predictor import predict_transaction
except ImportError:
    from backend.mock_data import mock_predict as predict_transaction
```
When `ml_engine/predictor.py` is ready, no backend changes or route restructuring are necessary.
