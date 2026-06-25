from django.contrib.auth.models import User
from rest_framework import serializers

from .models import RawArticle, Incident


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class RawArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawArticle
        fields = [
            "id",
            "title",
            "source",
            "published_at",
            "url",
            "description",
            "matched_query",
            "raw_payload",
            "ingested_at",
        ]


class IncidentListSerializer(serializers.ModelSerializer):
    source_article_title = serializers.CharField(
        source="source_article.title",
        read_only=True
    )
    source_article_url = serializers.URLField(
        source="source_article.url",
        read_only=True
    )

    class Meta:
        model = Incident
        fields = [
            "id",
            "category",
            "summary",
            "severity",
            "location_text",
            "state",
            "district_city",
            "latitude",
            "longitude",
            "location_confidence",
            "review_status",
            "duplicate_score",
            "is_possible_duplicate",
            "source_article_title",
            "source_article_url",
            "created_at",
            "updated_at",
        ]


class IncidentDetailSerializer(serializers.ModelSerializer):
    source_article = RawArticleSerializer(read_only=True)

    class Meta:
        model = Incident
        fields = [
            "id",
            "source_article",
            "category",
            "summary",
            "severity",
            "location_text",
            "state",
            "district_city",
            "latitude",
            "longitude",
            "location_confidence",
            "review_status",
            "duplicate_score",
            "is_possible_duplicate",
            "created_at",
            "updated_at",
        ]