from django.contrib.auth import authenticate
from django.db.models import Count
from rest_framework import status, viewsets, filters
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django_filters.rest_framework import DjangoFilterBackend

from .models import RawArticle, Incident
from .services.ingestion import run_ingestion
from .services.duplicates import find_duplicate_candidates
from .serializers import (
    UserSerializer,
    RawArticleSerializer,
    IncidentListSerializer,
    IncidentDetailSerializer,
)


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"detail": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token, created = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "user": UserSerializer(user).data,
        })


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"detail": "Logged out successfully."})


class RawArticleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RawArticle.objects.all().order_by("-ingested_at")
    serializer_class = RawArticleSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "source", "matched_query"]
    filterset_fields = ["source", "matched_query"]
    ordering_fields = ["published_at", "ingested_at"]


class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.select_related("source_article").all().order_by("-created_at")
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    search_fields = [
        "summary",
        "location_text",
        "state",
        "district_city",
        "source_article__title",
        "source_article__description",
    ]

    filterset_fields = [
        "category",
        "severity",
        "review_status",
        "state",
        "district_city",
        "is_possible_duplicate",
    ]

    ordering_fields = [
        "created_at",
        "updated_at",
        "severity",
        "duplicate_score",
    ]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return IncidentDetailSerializer
        return IncidentListSerializer

    def perform_update(self, serializer):
        serializer.save(review_status=Incident.ReviewStatus.EDITED)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        incident = self.get_object()
        incident.review_status = Incident.ReviewStatus.ACCEPTED
        incident.save(update_fields=["review_status", "updated_at"])

        return Response({
            "detail": "Incident accepted.",
            "incident": IncidentDetailSerializer(incident).data,
        })

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        incident = self.get_object()
        incident.review_status = Incident.ReviewStatus.REJECTED
        incident.save(update_fields=["review_status", "updated_at"])

        return Response({
            "detail": "Incident rejected.",
            "incident": IncidentDetailSerializer(incident).data,
        })
    @action(detail=True, methods=["get"], url_path="duplicates")
    def duplicates(self, request, pk=None):
        incident = self.get_object()
        candidates = find_duplicate_candidates(incident)

        response_data = []

        for candidate in candidates:
            candidate_incident = candidate["incident"]

            response_data.append({
                "score": candidate["score"],
                "incident": IncidentListSerializer(candidate_incident).data,
            })

        return Response(response_data)
    @action(detail=False, methods=["get"], url_path="map")
    def map(self, request):
        incidents = (
            self.get_queryset()
            .filter(latitude__isnull=False, longitude__isnull=False)
            .order_by("-created_at")[:200]
        )

        serializer = IncidentListSerializer(incidents, many=True)
        return Response(serializer.data)

class RunIngestionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        use_sample = request.data.get("use_sample", False)
        max_items_per_query = request.data.get("max_items_per_query", 5)

        try:
            max_items_per_query = int(max_items_per_query)
        except ValueError:
            max_items_per_query = 5

        result = run_ingestion(
            use_sample=use_sample,
            max_items_per_query=max_items_per_query,
        )

        return Response(result)

class DashboardSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        article_count = RawArticle.objects.count()
        incident_count = Incident.objects.count()

        needs_review_count = Incident.objects.filter(
            review_status=Incident.ReviewStatus.NEEDS_REVIEW
        ).count()

        accepted_count = Incident.objects.filter(
            review_status=Incident.ReviewStatus.ACCEPTED
        ).count()

        rejected_count = Incident.objects.filter(
            review_status=Incident.ReviewStatus.REJECTED
        ).count()

        possible_duplicate_count = Incident.objects.filter(
            is_possible_duplicate=True
        ).count()

        return Response({
            "articles_ingested": article_count,
            "detected_incidents": incident_count,
            "needs_review": needs_review_count,
            "accepted_incidents": accepted_count,
            "rejected_incidents": rejected_count,
            "possible_duplicates": possible_duplicate_count,
        })


class DuplicateIncidentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        duplicates = Incident.objects.select_related("source_article").filter(
            is_possible_duplicate=True
        ).order_by("-duplicate_score", "-created_at")

        serializer = IncidentListSerializer(duplicates, many=True)

        return Response(serializer.data)