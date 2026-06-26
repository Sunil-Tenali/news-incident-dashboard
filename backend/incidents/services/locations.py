# Extracts local place hints and coordinates from article text.

import csv
import re
from pathlib import Path

import requests


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_location_reference():
    file_path = DATA_DIR / "location_reference.csv"

    locations = []

    with open(file_path, "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        for row in reader:
            locations.append(row)

    return locations


def find_location_from_reference(text):
    text_lower = text.lower()
    locations = load_location_reference()

    matched_locations = []

    for location in locations:
        place_name = location["place_name"]

        if place_name.lower() in text_lower:
            matched_locations.append(location)

    if not matched_locations:
        return None

    matched_locations.sort(
        # Prefer "New Delhi" over "Delhi" when both appear in the same text.
        key=lambda row: len(row["place_name"]),
        reverse=True
    )

    best_match = matched_locations[0]

    return {
        "location_text": best_match["place_name"],
        "state": best_match["state"],
        "district_city": best_match["district"],
        "latitude": float(best_match["latitude"]),
        "longitude": float(best_match["longitude"]),
        "location_confidence": "High",
    }


def guess_location_phrase(text):
    # Keep guesses short so a headline fragment does not become the "location".
    patterns = [
        r"\bin\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})",
        r"\bnear\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})",
        r"\bat\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})",
    ]

    ignored_words = {
        # These are common capitalized matches in news text, but not useful places here.
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
        "Monday",
        "Tuesday",
        "India",
    }

    for pattern in patterns:
        match = re.search(pattern, text)

        if match:
            candidate = match.group(1).strip()

            if candidate not in ignored_words:
                return candidate

    return ""


def geocode_location(location_text):
    if not location_text:
        return None

    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": f"{location_text}, India",
                "format": "json",
                "limit": 1,
            },
            headers={
                # Nominatim asks clients to identify themselves; keep requests easy to trace.
                "User-Agent": "news-incident-mapping-dashboard/1.0"
            },
            timeout=10,
        )

        response.raise_for_status()
        data = response.json()

        if not data:
            return None

        result = data[0]

        # External coordinates help the map, but local state/district fields stay blank.
        return {
            "location_text": location_text,
            "state": "",
            "district_city": "",
            "latitude": float(result["lat"]),
            "longitude": float(result["lon"]),
            "location_confidence": "Medium",
        }

    except Exception:
        return None


def extract_location(title, description):
    combined_text = f"{title} {description}".strip()

    # Try the local reference first; known places are faster and less noisy than geocoding.
    reference_match = find_location_from_reference(combined_text)

    if reference_match:
        return reference_match

    guessed_location = guess_location_phrase(combined_text)

    geocoded_location = geocode_location(guessed_location)

    if geocoded_location:
        return geocoded_location

    # Keep the guessed phrase even without coordinates so the review screen has a clue.
    return {
        "location_text": guessed_location,
        "state": "",
        "district_city": "",
        "latitude": None,
        "longitude": None,
        "location_confidence": "Low",
    }
