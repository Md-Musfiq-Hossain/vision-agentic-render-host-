import json
from typing import List
from fastapi import WebSocket

class TelemetryWebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_state_update(self, node_name: str, payload: dict):
        """Broadcasts real-time step evaluations over active socket lines."""
        message = json.dumps({
            "event": "node_execution",
            "node": node_name,
            "data": payload
        })
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Silently prune stale connections
                pass

websocket_manager = TelemetryWebSocketManager()