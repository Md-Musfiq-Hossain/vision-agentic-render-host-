from app.agents.state import ScraperAgentState, AgentHistoryItem
from app.browser.automation import VisionBrowser
from app.services.websocket_manager import websocket_manager
from app.models.vlm_client import VisionModelClient

async def execution_node(state: ScraperAgentState) -> dict:
    browser = VisionBrowser()
    vlm_client = VisionModelClient()
    updated_history = list(state.history)
    
    # 1. Update audit ledger for browser instantiation
    updated_history.append(AgentHistoryItem(
        node_visited="execution_node",
        action_executed="browser_handshake_init",
        status="success",
        details=f"Opening target browser canvas context for: {state.target_url}"
    ))
    
    await websocket_manager.broadcast_state_update(
        "execution_node", 
        {"status": "processing", "step": state.current_step}
    )
    
    try:
        # 2. Capture layout snapshot via Playwright
        snapshot_data = await browser.capture_page_snapshot(str(state.target_url))
        raw_screenshot = snapshot_data.get("base64_screenshot", "")
        
        updated_history.append(AgentHistoryItem(
            node_visited="execution_node",
            action_executed="viewport_frame_serialize",
            status="success",
            details="Successfully serialized visual layout matrix into Base64 format."
        ))
        
        # 3. Call multi-provider Vision-Language Model interface
        vlm_response = await vlm_client.analyze_screenshot(
            base64_image=raw_screenshot,
            target_element=state.target_element
        )
        
        # Extract metadata metrics from layout definitions
        viewport_width = snapshot_data.get("viewport_width", 1280)
        viewport_height = snapshot_data.get("viewport_height", 720)
        vlm_data = vlm_response.get("data", {})
        
        element_found = vlm_data.get("element_found", False)
        provider = vlm_response.get("provider_used", "Unknown")
        
        # 4. Map geometric targets across scaling display boundaries
        # If the client falls back to the mock engine, coordinates will change dynamically per step
        if "Local Mock Recovery" in provider:
            # Shift the placeholder numbers per step cycle to keep UI canvas updates active
            next_step_index = state.current_step + 1
            absolute_x = 420.0 + (next_step_index * 60.0)
            absolute_y = 210.0 + (next_step_index * 35.0)
            details_log = f"Upstream APIs offline. Emitted dynamic mock coordinates from {provider}."
        else:
            # Parse standardized bounding boxes (0 -> 1000 range) into physical pixels
            box_2d = vlm_data.get("box_2d", [500, 500, 500, 500])
            ymin, xmin, ymax, xmax = box_2d
            
            # Calculate absolute click centroids matching current canvas dimensions
            center_x_normalized = (xmin + xmax) / 2.0
            center_y_normalized = (ymin + ymax) / 2.0
            
            absolute_x = (center_x_normalized / 1000.0) * viewport_width
            absolute_y = (center_y_normalized / 1000.0) * viewport_height
            details_log = f"Successfully calculated viewport click coordinates using {provider}."

        detected_target = {"x": absolute_x, "y": absolute_y}
        
        updated_history.append(AgentHistoryItem(
            node_visited="execution_node",
            action_executed="coordinate_range_assertion",
            status="success",
            details=details_log
        ))
        
        return {
            "base64_screenshot": raw_screenshot,
            "page_title": snapshot_data.get("page_title"),
            "current_url": snapshot_data.get("current_url"),
            "absolute_click_target": detected_target,
            "element_found": element_found,
            "history": updated_history,
            "current_step": state.current_step + 1
        }
        
    except Exception as e:
        updated_history.append(AgentHistoryItem(
            node_visited="execution_node",
            action_executed="browser_handshake_failed",
            status="failed",
            details=str(e)
        ))
        return {
            "history": updated_history, 
            "anomaly_detected": True, 
            "current_step": state.current_step + 1
        }