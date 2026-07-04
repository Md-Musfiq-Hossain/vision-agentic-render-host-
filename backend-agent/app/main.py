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
    # Null-coalesce payload field to ensure strong 'str' typing
    target_element_str = payload.target_element if payload.target_element is not None else ""

    initial_state = ScraperAgentState(
        target_url=str(payload.url),
        target_element=target_element_str,
        current_step=0,
        history=[],
        loop_tracker={}
    )
    
    # Execute LangGraph processing state machine loops
    result = await agent_graph.ainvoke(initial_state)
    
    # Transform LangGraph state variables into your exact Django payload schema structure
    is_halted = any(item.action_executed == "debugger_safety_switch" for item in result.get("history", []))
    validation_passed = result.get("element_found", False) and not is_halted
    
    # Extract mock box metrics (ymin, xmin, ymax, xmax) for testing coordinate caches
    mock_box_2d = [0.15, 0.20, 0.45, 0.60] if validation_passed else None

    # Cross-Service Sync Pipeline: Matches Django views.py expected body properties
    try:
        requests.post("http://localhost:8000/api/v1/sync/", json={
            "target_url": result.get("target_url"),
            "target_element": result.get("target_element"),
            "validation_passed": validation_passed,
            "anomaly_detected": result.get("anomaly_detected", False),
            "current_step": result.get("current_step", 0),
            "absolute_click_target": result.get("absolute_click_target"),
            "target_box_2d": mock_box_2d,
            "history": [item.model_dump() for item in result.get("history", [])] # Raw Pydantic objects serialized to dicts
        }, timeout=3.0)
    except Exception:
        # Prevents microservice network drops from crashing the active runtime instance
        pass
        
    return result