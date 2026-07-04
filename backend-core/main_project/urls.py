from django.contrib import admin
from django.urls import path
from scraper_admin.views import sync_agent_session_state, ScraperLogListView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Synchronizes active agent state loops across microservices
    path('api/v1/sync/', sync_agent_session_state, name='agent_session_sync'),
    
    # Feeds row matrix objects directly to your dashboard history view
    path('api/scraper_admin/logs/', ScraperLogListView.as_view(), name='scraper_logs'),
]