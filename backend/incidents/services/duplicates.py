from datetime import timedelta
from difflib import SequenceMatcher

from .models_import import get_incident_model


def similarity_score(text_a, text_b):
    if not text_a or not text_b:
        return 0

    return SequenceMatcher(
        None,
        text_a.lower(),
        text_b.lower()
    ).ratio()


def calculate_duplicate_score(new_incident, existing_incident):
    score = 0

    if new_incident.category == existing_incident.category:
        score += 25

    if (
        new_incident.location_text
        and existing_incident.location_text
        and new_incident.location_text.lower() == existing_incident.location_text.lower()
    ):
        score += 30

    title_a = new_incident.source_article.title
    title_b = existing_incident.source_article.title

    title_similarity = similarity_score(title_a, title_b)
    score += title_similarity * 30

    time_a = new_incident.source_article.published_at
    time_b = existing_incident.source_article.published_at

    if time_a and time_b:
        difference = abs(time_a - time_b)

        if difference <= timedelta(hours=24):
            score += 15

    return round(score, 2)


def mark_possible_duplicate(incident):
    Incident = get_incident_model()

    existing_incidents = Incident.objects.select_related("source_article").exclude(
        id=incident.id
    )

    best_score = 0

    for existing_incident in existing_incidents:
        score = calculate_duplicate_score(incident, existing_incident)
        best_score = max(best_score, score)

    if best_score >= 65:
        incident.is_possible_duplicate = True
        incident.duplicate_score = best_score
        incident.save(update_fields=[
            "is_possible_duplicate",
            "duplicate_score",
            "updated_at",
        ])

    return incident

def find_duplicate_candidates(incident, threshold=50):
    Incident = get_incident_model()

    existing_incidents = Incident.objects.select_related("source_article").exclude(
        id=incident.id
    )

    candidates = []

    for existing_incident in existing_incidents:
        score = calculate_duplicate_score(incident, existing_incident)

        if score >= threshold:
            candidates.append({
                "incident": existing_incident,
                "score": score,
            })

    candidates.sort(key=lambda item: item["score"], reverse=True)

    return candidates