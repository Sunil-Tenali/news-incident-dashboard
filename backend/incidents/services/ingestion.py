# Turns feed items into stored raw articles and reviewer-ready incidents.

from django.db import IntegrityError
from django.utils.dateparse import parse_datetime

from incidents.models import RawArticle, Incident

from .classifier import classify_article
from .duplicates import mark_possible_duplicate
from .feeds import (
    fetch_google_news_articles,
    load_feed_queries,
    load_sample_feed_items,
)
from .locations import extract_location


def normalize_sample_item(item):
    published_at = item.get("published_at")

    if isinstance(published_at, str):
        published_at = parse_datetime(published_at)

    return {
        "title": item.get("title", "").strip(),
        "source": item.get("source", "Sample Feed"),
        "published_at": published_at,
        "url": item.get("url", "").strip(),
        "description": item.get("description", "").strip(),
        "raw_payload": item,
    }


def create_raw_article(article_data, matched_query):
    return RawArticle.objects.get_or_create(
        url=article_data["url"],
        defaults={
            "title": article_data["title"],
            "source": article_data.get("source", ""),
            "published_at": article_data.get("published_at"),
            "description": article_data.get("description", ""),
            "matched_query": matched_query,
            "raw_payload": article_data.get("raw_payload", {}),
        },
    )


def create_incident_from_article(raw_article, default_category="Other"):
    classification = classify_article(
        title=raw_article.title,
        description=raw_article.description,
        default_category=default_category,
    )

    if not classification["is_relevant"]:
        return None

    location = extract_location(
        title=raw_article.title,
        description=raw_article.description,
    )

    # Save low-confidence locations too; dropping them would hide cases a reviewer can fix.
    incident = Incident.objects.create(
        source_article=raw_article,
        category=classification["category"],
        summary=classification["summary"],
        severity=classification["severity"],
        location_text=location["location_text"],
        state=location["state"],
        district_city=location["district_city"],
        latitude=location["latitude"],
        longitude=location["longitude"],
        location_confidence=location["location_confidence"],
        review_status=Incident.ReviewStatus.NEEDS_REVIEW,
    )

    mark_possible_duplicate(incident)

    return incident


def run_ingestion(use_sample=False, max_items_per_query=5):
    result = {
        "mode": "sample" if use_sample else "live",
        "feeds_attempted": 0,
        "articles_seen": 0,
        "raw_articles_created": 0,
        "raw_articles_skipped_as_duplicates": 0,
        "incidents_created": 0,
        "irrelevant_articles_skipped": 0,
        "errors": [],
    }

    if use_sample:
        result["feeds_attempted"] = 1
        sample_items = load_sample_feed_items()
        articles = [normalize_sample_item(item) for item in sample_items]

        # Shape the sample feed like a live feed so the main ingest path stays the same.
        feed_sources = [{
            "name": "Sample Local Feed",
            "query": "sample local feed",
            "default_category": "Other",
            "articles": articles,
        }]
    else:
        feed_sources = []

        for feed_query in load_feed_queries():
            result["feeds_attempted"] += 1

            try:
                articles = fetch_google_news_articles(
                    query=feed_query["query"],
                    max_items=max_items_per_query,
                )

                feed_sources.append({
                    "name": feed_query["name"],
                    "query": feed_query["query"],
                    "default_category": feed_query.get("default_category", "Other"),
                    "articles": articles,
                })

            except Exception as error:
                result["errors"].append({
                    "feed": feed_query.get("name"),
                    "error": str(error),
                })

    for feed_source in feed_sources:
        matched_query = feed_source["query"]
        # Feed defaults are just a nudge; the classifier still gets the final say.
        default_category = feed_source.get("default_category", "Other")

        for article_data in feed_source["articles"]:
            result["articles_seen"] += 1

            if not article_data.get("title") or not article_data.get("url"):
                result["errors"].append({
                    "article": article_data,
                    "error": "Missing title or URL",
                })
                continue

            try:
                raw_article, created = create_raw_article(
                    article_data=article_data,
                    matched_query=matched_query,
                )

                if not created:
                    # Skip known URLs early so classification and geocoding are not repeated.
                    result["raw_articles_skipped_as_duplicates"] += 1
                    continue

                result["raw_articles_created"] += 1

                incident = create_incident_from_article(
                    raw_article=raw_article,
                    default_category=default_category,
                )

                if incident:
                    result["incidents_created"] += 1
                else:
                    result["irrelevant_articles_skipped"] += 1

            except IntegrityError:
                # Covers the rare case where the same URL lands while another run is saving it.
                result["raw_articles_skipped_as_duplicates"] += 1

            except Exception as error:
                result["errors"].append({
                    "article_url": article_data.get("url"),
                    "error": str(error),
                })

    return result
