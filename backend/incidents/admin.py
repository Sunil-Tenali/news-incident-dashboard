from django.contrib import admin
from .models import RawArticle, Incident


@admin.register(RawArticle)
class RawArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "source", "published_at", "matched_query", "ingested_at")
    search_fields = ("title", "description", "source", "url")
    list_filter = ("source", "matched_query", "ingested_at")


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = (
        "category",
        "severity",
        "location_text",
        "state",
        "review_status",
        "is_possible_duplicate",
        "created_at",
    )
    search_fields = ("summary", "location_text", "state", "district_city")
    list_filter = ("category", "severity", "review_status", "state", "is_possible_duplicate")