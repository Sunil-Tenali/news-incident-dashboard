import json
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import quote_plus

import feedparser
from django.utils import timezone
import html
import re


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_feed_queries():
    file_path = DATA_DIR / "feed_queries.json"

    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    return data.get("queries", [])


def load_sample_feed_items():
    file_path = DATA_DIR / "sample_feed_items.json"

    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def build_google_news_rss_url(query):
    encoded_query = quote_plus(query)
    return (
        "https://news.google.com/rss/search"
        f"?q={encoded_query}"
        "&hl=en-IN"
        "&gl=IN"
        "&ceid=IN:en"
    )


def parse_published_datetime(entry):
    published_value = entry.get("published")

    if not published_value:
        return None

    try:
        parsed = parsedate_to_datetime(published_value)

        if timezone.is_naive(parsed):
            parsed = timezone.make_aware(parsed)

        return parsed
    except Exception:
        return None


def get_entry_source(entry):
    source = entry.get("source")

    if isinstance(source, dict):
        return source.get("title", "Google News")

    return "Google News"

def clean_google_summary(summary):
    if not summary:
        return ""

    # Convert HTML entities like &nbsp; into normal text
    text = html.unescape(summary)

    # Remove HTML tags like <a>, <font>, etc.
    text = re.sub(r"<[^>]+>", " ", text)

    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text

def fetch_google_news_articles(query, max_items=5):
    rss_url = build_google_news_rss_url(query)
    feed = feedparser.parse(rss_url)

    articles = []

    for entry in feed.entries[:max_items]:
        title = entry.get("title", "").strip()
        url = entry.get("link", "").strip()
        description = clean_google_summary(entry.get("summary", "").strip())

        if not title or not url:
            continue

        articles.append({
            "title": title,
            "source": get_entry_source(entry),
            "published_at": parse_published_datetime(entry),
            "url": url,
            "description": description,
            "raw_payload": dict(entry),
        })

    return articles