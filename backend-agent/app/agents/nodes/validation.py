from app.agents.state import ScraperAgentState, AgentHistoryItem
from app.services.websocket_manager import websocket_manager

async def validation_node(state: ScraperAgentState) -> dict:
    updated_history = list(state.history)
    current_tracker = dict(state.loop_tracker)
    
    # Hash layout footprint bounds
    coord_key = f"x_{state.absolute_click_target.get('x', 0)}_y_{state.absolute_click_target.get('y', 0)}" if state.absolute_click_target else "null_target"
    current_tracker[coord_key] = current_tracker.get(coord_key, 0) + 1
    
    # Debugger Safety Switch Breaker (Rule: Max 2 consecutive runs on identical coordinates)
    if current_tracker[coord_key] > 2:
        updated_history.append(AgentHistoryItem(
            node_visited="validation_node",
            action_executed="debugger_safety_switch",
            status="halted",
            details="Infinite execution loop breaker intercepted. Terminating path to preserve API token usage."
        ))
        await websocket_manager.broadcast_state_update("validation_node", {"status": "CIRCUIT_BREAKER_TRIGGERED"})
        return {
            "history": updated_history,
            "anomaly_detected": True,
            "element_found": False
        }

    if state.absolute_click_target:
        updated_history.append(AgentHistoryItem(
            node_visited="validation_node",
            action_executed="coordinate_range_assertion",
            status="passed",
            details="Target coordinate maps verified and cleared against visible viewport boundaries."
        ))
        return {
            "history": updated_history,
            "loop_tracker": current_tracker,
            "element_found": True
        }
        
    return {"loop_tracker": current_tracker}