import uuid
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import VisualLayoutCache, ExecutionHistory, TrajectoryLogItem

@api_view(['POST'])
@permission_classes([AllowAny])
def sync_agent_session_state(request):
    """
    Receives finalized state payloads directly from FastAPI to populate
    the dashboard data matrices.
    """
    data = request.data
    session_uuid = data.get("session_id", str(uuid.uuid4()))
    
    # 1. Record primary session object
    session_record = ExecutionHistory.objects.create(
        session_id=session_uuid,
        target_url=data.get("target_url"),
        target_element=data.get("target_element"),
        final_status="HEALED" if data.get("validation_passed") and data.get("anomaly_detected") else ("SUCCESS" if data.get("validation_passed") else "FAILED"),
        total_steps=data.get("current_step", 0),
        anomaly_detected=data.get("anomaly_detected", False)
    )
    
    # 2. Bulk record historical telemetry steps
    history_items = data.get("history", [])
    for step in history_items:
        TrajectoryLogItem.objects.create(
            execution_history=session_record,
            node_visited=step.get("node_visited"),
            action_executed=step.get("action_executed"),
            status=step.get("status"),
            details=step.get("details")
        )
        
    # 3. If the graph fixed a broken element coordinate pathway, cache it!
    if data.get("validation_passed") and data.get("anomaly_detected") and data.get("target_box_2d"):
        box = data.get("target_box_2d")
        click = data.get("absolute_click_target")
        VisualLayoutCache.objects.update_or_create(
            target_url=data.get("target_url"),
            target_element=data.get("target_element"),
            defaults={
                "healed_ymin": box[0], "healed_xmin": box[1],
                "healed_ymax": box[2], "healed_xmax": box[3],
                "absolute_click_x": click["x"], "absolute_click_y": click["y"]
            }
        )
        
    return Response({"status": "synced", "session_id": session_uuid}, status=status.HTTP_201_CREATED)


class ScraperLogListView(APIView):
    """
    API View tracking history events to render rows within the ScrapeOps Admin panel.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            # Query persistent historical telemetry runs from the DB
            logs = ExecutionHistory.objects.all().order_by('-created_at')[:20]
            
            payload = [
                {
                    "job_id": str(log.session_id),
                    "objective": log.target_element if log.target_element else "Unknown Element Target",
                    "result": log.final_status
                }
                for log in logs
            ]
            return Response(payload, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to retrieve persistent logging matrix: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )