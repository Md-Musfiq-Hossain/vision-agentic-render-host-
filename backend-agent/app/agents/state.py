from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AgentHistoryItem(BaseModel):
    node_visited: str
    action_executed: str
    status: str
    details: Optional[str] = None

class ScraperAgentState(BaseModel):
    target_url: str = Field(..., description="Primary web page destination target")
    target_element: str = Field(..., description="Semantic text description of layout element to target")
    max_steps: int = Field(default=5, description="Infinite loop tracking step threshold")
    current_step: int = Field(default=0, description="Active iteration index tracker")
    current_url: Optional[str] = None
    page_title: Optional[str] = None
    base64_screenshot: Optional[str] = None
    viewport_dimensions: Dict[str, int] = Field(default={"width": 1280, "height": 720})
    absolute_click_target: Optional[Dict[str, float]] = None
    element_found: bool = False
    anomaly_detected: bool = False
    history: List[AgentHistoryItem] = []
    # Phase 8 Operational Token Protection Layer
    loop_tracker: Dict[str, int] = Field(default={}, description="Tracks consecutive action hashes to kill token bleeding loops")