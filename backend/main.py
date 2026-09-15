"""
FastAPI application entry point for Fraud Detection & Transaction Risk Agent.
Handles REST endpoints, WebSocket connections, CORS, and dummy transaction simulator.
"""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.models import HealthResponse
from backend.routes.transactions import router as transactions_router, process_transaction
from backend.routes.dashboard import router as dashboard_router
from backend.websocket import manager
from backend.mock_data import get_random_sample_transaction


# Background worker to generate live dummy transactions for real-time dashboard feel
async def dummy_transaction_worker():
    # Wait 2 seconds before starting generator to let server spin up cleanly
    await asyncio.sleep(2)
    while True:
        try:
            sample_data = get_random_sample_transaction()
            result = process_transaction(sample_data)
            await manager.broadcast({
                "event": "transaction_created",
                "data": result,
            })
        except Exception:
            pass
        await asyncio.sleep(3)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed 5 transactions initially so dashboard has immediate history
    for _ in range(5):
        sample = get_random_sample_transaction()
        process_transaction(sample)

    task = asyncio.create_task(dummy_transaction_worker())
    yield
    task.cancel()


app = FastAPI(
    title="Fraud Detection & Transaction Risk Agent API",
    version="1.0.0",
    description="Real-time transaction fraud scoring, risk assessment, and WebSocket alerts.",
    lifespan=lifespan,
)

# CORS Middleware configured for React/Vite development and flexible staging
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(transactions_router)
app.include_router(dashboard_router)


@app.get("/api/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "service": "fraud-detection-api",
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open and receive any ping/pong or client messages
            data = await websocket.receive_text()
            # Respond to client ping with pong if needed
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
