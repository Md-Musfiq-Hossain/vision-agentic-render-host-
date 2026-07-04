import os
import requests
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.schemas.coordinate import ScrapeRequest
from app.agents.graph import agent_graph
from app.agents.state import ScraperAgentState
from app.services.websocket_manager import websocket_manager

app = FastAPI(title="Vision-Agentic Telemetry Engine Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DJANGO_URL = os.environ.get("DJANGO_URL", "http://localhost:8000")

@app.websocket("/ws/telemetry")
async def telemetry_stream_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)

@app.post("/api/v1/ingest")
async def process_ingest_trajectory(payload: ScrapeRequest):
    target_element_str = payload.target_element if payload.target_element is not None else ""

    initial_state = ScraperAgentState(
        target_url=str(payload.url),
        target_element=target_element_str,
        current_step=0,
        history=[],
        loop_tracker={}
    )

    result = await agent_graph.ainvoke(initial_state)

    is_halted = any(item.action_executed == "debugger_safety_switch" for item in result.get("history", []))
    validation_passed = result.get("element_found", False) and not is_halted
    mock_box_2d = [0.15, 0.20, 0.45, 0.60] if validation_passed else None

    try:
        requests.post(f"{DJANGO_URL}/api/v1/sync/", json={
            "target_url": result.get("target_url"),
            "target_element": result.get("target_element"),
            "validation_passed": validation_passed,
            "anomaly_detected": result.get("anomaly_detected", False),
            "current_step": result.get("current_step", 0),
            "absolute_click_target": result.get("absolute_click_target"),
            "target_box_2d": mock_box_2d,
            "history": [item.model_dump() for item in result.get("history", [])]
        }, timeout=3.0)
    except Exception as e:
        print(f"[SYNC WARNING] Failed to sync to Django: {e}")

    return result