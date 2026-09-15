from fastapi import APIRouter
from backend.models import DashboardStatsResponse
from backend.store import get_stats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats():
    return get_stats()
