"""
In-memory store for transactions.
Keeps demo state lightweight, fast, and dependency-free.
"""
from typing import Dict, Any, List

transactions: Dict[str, Dict[str, Any]] = {}


def add_transaction(tx_id: str, data: Dict[str, Any]) -> None:
    transactions[tx_id] = data


def get_transaction(tx_id: str) -> Dict[str, Any] | None:
    return transactions.get(tx_id)


def get_all_transactions() -> List[Dict[str, Any]]:
    # Return newest first
    return list(reversed(list(transactions.values())))


def get_total_count() -> int:
    return len(transactions)


def get_stats() -> Dict[str, Any]:
    total = len(transactions)
    if total == 0:
        return {
            "total_transactions": 0,
            "fraud_detected": 0,
            "high_risk_transactions": 0,
            "avg_risk_score": 0.0,
            "risk_distribution": {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0},
            "prediction_distribution": {"LEGITIMATE": 0, "FRAUD": 0},
        }

    fraud_count = 0
    high_risk_count = 0
    risk_sum = 0.0
    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    pred_dist = {"LEGITIMATE": 0, "FRAUD": 0}

    for tx in transactions.values():
        risk_score = tx.get("risk_score", 0.0)
        risk_sum += risk_score

        level = tx.get("risk_level", "LOW")
        if level in risk_dist:
            risk_dist[level] += 1
        else:
            risk_dist[level] = 1

        if level in ("HIGH", "CRITICAL"):
            high_risk_count += 1

        pred = tx.get("prediction", "LEGITIMATE")
        if pred == "FRAUD":
            fraud_count += 1
            pred_dist["FRAUD"] = pred_dist.get("FRAUD", 0) + 1
        else:
            pred_dist["LEGITIMATE"] = pred_dist.get("LEGITIMATE", 0) + 1

    return {
        "total_transactions": total,
        "fraud_detected": fraud_count,
        "high_risk_transactions": high_risk_count,
        "avg_risk_score": round((risk_sum / total) * 100, 2),
        "risk_distribution": risk_dist,
        "prediction_distribution": pred_dist,
    }
