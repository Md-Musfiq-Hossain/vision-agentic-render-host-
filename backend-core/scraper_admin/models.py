from django.db import models

# Create your models here.
from django.db import models

class VisualLayoutCache(models.Model):
    """
    Caches successfully healed layout targets to reduce upstream VLM API token costs
    on frequently scraped invariant page layouts.
    """
    target_url = models.URLField(max_length=500)
    target_element = models.CharField(max_length=255)
    healed_ymin = models.IntegerField()
    healed_xmin = models.IntegerField()
    healed_ymax = models.IntegerField()
    healed_xmax = models.IntegerField()
    absolute_click_x = models.IntegerField()
    absolute_click_y = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('target_url', 'target_element')

    def __str__(self):
        return f"Cache -> {self.target_url} [{self.target_element}]"


class ExecutionHistory(models.Model):
    """
    Stores entire finalized LangGraph session tracking states for frontend
    audit dashboard consumption.
    """
    session_id = models.CharField(max_length=100, unique=True)
    target_url = models.URLField(max_length=500)
    target_element = models.CharField(max_length=255)
    final_status = models.CharField(max_length=50, default="PENDING")  # SUCCESS, FAILED, HEALED
    total_steps = models.IntegerField(default=0)
    anomaly_detected = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session {self.session_id} - {self.final_status}"


class TrajectoryLogItem(models.Model):
    """
    Maintains the individual step trace rows for granular timeline audits.
    """
    execution_history = models.ForeignKey(ExecutionHistory, on_delete=models.CASCADE, related_name='steps')
    node_visited = models.CharField(max_length=100)
    action_executed = models.CharField(max_length=100)
    status = models.CharField(max_length=50)
    details = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)