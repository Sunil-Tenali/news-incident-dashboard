import json
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_classification_rules():
    file_path = DATA_DIR / "classification_rules.json"

    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def contains_keyword(text, keywords):
    text = text.lower()

    for keyword in keywords:
        if keyword.lower() in text:
            return True

    return False


def detect_category(text, default_category="Other"):
    rules = load_classification_rules()
    category_rules = rules.get("categories", {})

    for category, keywords in category_rules.items():
        if contains_keyword(text, keywords):
            return category

    return default_category or "Other"


def detect_severity(text):
    rules = load_classification_rules()
    severity_rules = rules.get("severity", {})

    for severity, keywords in severity_rules.items():
        if contains_keyword(text, keywords):
            return severity

    return "Unknown"


def build_summary(title, description):
    if description:
        return f"{title}. {description}"[:500]

    return title[:500]


def classify_article(title, description, default_category="Other"):
    combined_text = f"{title} {description}".strip()

    category = detect_category(combined_text, default_category)
    severity = detect_severity(combined_text)
    summary = build_summary(title, description)

    is_relevant = category != "Other"

    return {
        "is_relevant": is_relevant,
        "category": category,
        "severity": severity,
        "summary": summary,
    }