from pydantic import BaseModel, Field
from typing import List, Optional


class TransactionRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount in INR, must be > 0")
    merchant: str = Field(..., min_length=1, description="Merchant name")
    location: str = Field(..., min_length=1, description="Transaction location")
    device: str = Field(..., min_length=1, description="Device identifier or type")
    payment_method: str = Field(..., min_length=1, description="Payment method (e.g. CARD, UPI)")
    timing: Optional[str] = Field(None, description="Transaction time (e.g. 14:30 or 03:00)")
    timestamp: Optional[str] = Field(None, description="Optional ISO timestamp")


class TransactionResponse(BaseModel):
    transaction_id: str
    timestamp: str
    amount: float
    merchant: str
    location: str
    device: str
    payment_method: str
    fraud_probability: float
    anomaly_score: float
    risk_score: float
    risk_level: str
    is_suspicious: bool
    prediction: str
    explanation: List[str]


class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]
    total: int


class HealthResponse(BaseModel):
    status: str
    service: str


class DashboardStatsResponse(BaseModel):
    total_transactions: int
    fraud_detected: int
    high_risk_transactions: int
    avg_risk_score: float
    risk_distribution: dict
    prediction_distribution: dict
