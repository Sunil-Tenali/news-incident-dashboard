from django.db import models


class RawArticle(models.Model):
    title = models.TextField()
    source = models.CharField(max_length=255, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    url = models.URLField(unique=True, max_length = 1000)
    description = models.TextField(blank=True)
    matched_query = models.CharField(max_length=255, blank=True)
    raw_payload = models.JSONField(default=dict, blank=True)
    ingested_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title[:80]


class Incident(models.Model):
    class Category(models.TextChoices):
        FIRE = "Fire", "Fire"
        FLOOD = "Flood / Rain Damage", "Flood / Rain Damage"
        ROAD_ACCIDENT = "Road Accident", "Road Accident"
        INFRASTRUCTURE_FAILURE = "Infrastructure Failure", "Infrastructure Failure"
        POWER_OUTAGE = "Power Outage", "Power Outage"
        HEALTH_FOOD_SAFETY = "Health / Food Safety", "Health / Food Safety"
        PUBLIC_SAFETY = "Public Safety", "Public Safety"
        OTHER = "Other", "Other"

    class Severity(models.TextChoices):
        CRITICAL = "Critical", "Critical"
        HIGH = "High", "High"
        MEDIUM = "Medium", "Medium"
        LOW = "Low", "Low"
        UNKNOWN = "Unknown", "Unknown"

    class ReviewStatus(models.TextChoices):
        NEEDS_REVIEW = "Needs Review", "Needs Review"
        ACCEPTED = "Accepted", "Accepted"
        REJECTED = "Rejected", "Rejected"
        EDITED = "Edited", "Edited"

    source_article = models.ForeignKey(
        RawArticle,
        on_delete=models.CASCADE,
        related_name="incidents"
    )
    # Keep the raw article separate so reviewers can compare it with the extracted incident.

    category = models.CharField(
        max_length=100,
        choices=Category.choices,
        default=Category.OTHER
    )

    summary = models.TextField()
    severity = models.CharField(
        max_length=50,
        choices=Severity.choices,
        default=Severity.UNKNOWN
    )

    location_text = models.CharField(max_length=255, blank=True)
    state = models.CharField(max_length=100, blank=True)
    district_city = models.CharField(max_length=100, blank=True)

    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    location_confidence = models.CharField(max_length=50, default="Low")

    review_status = models.CharField(
        max_length=50,
        choices=ReviewStatus.choices,
        default=ReviewStatus.NEEDS_REVIEW
    )

    duplicate_score = models.FloatField(default=0)
    is_possible_duplicate = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def has_coordinates(self):
        return self.latitude is not None and self.longitude is not None

    def __str__(self):
        return f"{self.category} - {self.location_text or 'Unknown Location'}"
