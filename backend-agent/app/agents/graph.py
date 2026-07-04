from langgraph.graph import StateGraph, END
from app.agents.state import ScraperAgentState
from app.agents.nodes.execution import execution_node
from app.agents.nodes.validation import validation_node
from app.agents.nodes.healing import healing_node

def route_validation_next(state: ScraperAgentState):
    """Enforces execution checks strictly downstream of the validation assertions."""
    if state.anomaly_detected:
        if any(item.action_executed == "debugger_safety_switch" for item in state.history):
            return END
        return "healing_node"
    if state.element_found or state.current_step >= state.max_steps:
        return END
    return "execution_node"

workflow = StateGraph(ScraperAgentState)

workflow.add_node("execution_node", execution_node)
workflow.add_node("validation_node", validation_node)
workflow.add_node("healing_node", healing_node)

workflow.set_entry_point("execution_node")

# 🌟 Structural Fix: Execution loops always route directly to validation checking
workflow.add_edge("execution_node", "validation_node")

workflow.add_conditional_edges(
    "validation_node",
    route_validation_next,
    {
        "execution_node": "execution_node",
        "healing_node": "healing_node",
        END: END
    }
)

workflow.add_edge("healing_node", "validation_node")

agent_graph = workflow.compile()