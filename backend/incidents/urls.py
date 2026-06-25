from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter

from .views import (
    LoginAPIView,
    LogoutAPIView,
    RunIngestionAPIView,
    RawArticleViewSet,
    IncidentViewSet,
    DashboardSummaryAPIView,
    DuplicateIncidentAPIView,
)

router = DefaultRouter()
router.register(r"articles", RawArticleViewSet, basename="article")
router.register(r"incidents", IncidentViewSet, basename="incident")

urlpatterns = [
    path("auth/login/", LoginAPIView.as_view(), name="login"),
    path("auth/logout/", LogoutAPIView.as_view(), name="logout"),
    
    path("ingestion/run/", RunIngestionAPIView.as_view(), name="run-ingestion"),

    path("dashboard/summary/", DashboardSummaryAPIView.as_view(), name="dashboard-summary"),
    path("duplicates/", DuplicateIncidentAPIView.as_view(), name="duplicates"),

    path("", include(router.urls)),
]