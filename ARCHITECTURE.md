# Architecture Note

## Overview

This project is a full-stack News-to-Incident Mapping Dashboard. It ingests public news/RSS feed items, stores raw articles, detects likely incidents, extracts location data, geocodes incidents, checks possible duplicates, and displays records for human review on a protected dashboard.

The main goal is to convert unstructured news articles into structured, reviewable incident records that can be searched, filtered, edited, accepted, rejected, and viewed on a map.

---

## Data Model

The backend uses two main models:

### RawArticle

`RawArticle` stores the original news/RSS item before any processing.

Important fields:

* title
* source
* published time
* URL
* description/snippet
* matched query
* raw payload
* ingested timestamp

`RawArticle` acts as the source of truth. Every detected incident can be traced back to the original article.

### Incident

`Incident` stores the structured output extracted from a raw article.

Important fields:

* category
* summary
* severity
* location text
* state
* district/city
* latitude
* longitude
* location confidence
* source article reference
* review status
* duplicate score
* possible duplicate flag

Each incident references a `RawArticle`, so the reviewer can compare the extracted fields against the original source article.

---

## Ingestion Flow

The ingestion pipeline is triggered by:

```text
POST /api/ingestion/run/
```

Flow:

```text
1. Reviewer clicks Run Ingestion from the dashboard.
2. Frontend calls the Django ingestion API.
3. Backend loads configured feed queries from feed_queries.json.
4. Backend builds Google News RSS search URLs.
5. RSS entries are parsed using feedparser.
6. Each article is normalized into a common article format.
7. Each new article is stored as a RawArticle.
8. Duplicate raw articles are skipped using URL uniqueness.
9. The article title and description are classified using keyword rules.
10. Location is extracted from the title/snippet.
11. Local location_reference.csv matching is attempted first.
12. If local matching fails, geocoding is attempted using OpenStreetMap Nominatim.
13. A structured Incident record is created.
14. The new incident is compared with existing incidents for possible duplicates.
15. The dashboard summary, incident table, and map can display the new records.
```

---

## Incident Detection Approach

Incident detection is rule-based and explainable.

The backend checks the article title and description against keywords in:

```text
classification_rules.json
```

Example category rules:

* fire, blaze, explosion → Fire
* flood, rain, waterlogging → Flood / Rain Damage
* accident, crash, collision → Road Accident
* power outage, transformer fault → Power Outage
* food poisoning, contamination → Health / Food Safety

Severity is also detected using keyword rules.

Example severity rules:

* dead, killed, fatal → Critical
* injured, evacuated, hospitalised → High
* affected, delayed → Medium
* minor, no casualties → Low

This approach was chosen because the assignment allows rules and requires the approach to be documented and explainable. It is easy to debug because each classification can be traced back to matching keywords.

---

## Location Extraction and Geocoding

The backend first searches the article title and description against:

```text
location_reference.csv
```

If a known location is found, the system assigns:

* location text
* state
* district/city
* latitude
* longitude
* High location confidence

If no local match is found, the backend attempts to guess a location phrase after words such as:

```text
in
near
at
```

Then it calls OpenStreetMap Nominatim as a fallback geocoding service.

Location confidence is assigned as:

```text
High   → matched from local location reference
Medium → geocoded from guessed location text
Low    → location uncertain or geocoding failed
```

If location extraction fails, the incident is still stored with low confidence so a reviewer can inspect it manually.

---

## Deduplication Approach

Deduplication is heuristic and review-friendly.

The system compares a new incident with existing incidents using:

* same category
* same location
* similar source article title
* similar published time window

A duplicate score is calculated out of 100.

Strong matches are marked as possible duplicates, but the system does not automatically merge or delete them.

This keeps the workflow safe because two similar articles may still describe different real-world incidents. The reviewer can inspect possible duplicate candidates on the incident detail page.

---

## Backend Architecture

The backend is built with Django and Django REST Framework.

Main backend responsibilities:

* authentication
* raw article storage
* incident storage
* RSS ingestion
* classification
* location extraction
* geocoding
* duplicate scoring
* dashboard summary API
* incident review APIs

Important backend areas:

```text
backend/config/
Django project settings and root URLs.

backend/incidents/models.py
RawArticle and Incident database models.

backend/incidents/serializers.py
Converts Django model objects into JSON API responses.

backend/incidents/views.py
REST API views for authentication, dashboard summary, ingestion, incidents, and duplicates.

backend/incidents/services/
Business logic for feeds, ingestion, classification, location extraction, geocoding, and deduplication.

backend/incidents/data/
JSON/CSV support files for feed queries, classification rules, sample feed items, and location reference data.
```

---

## Frontend Architecture

The frontend is built with Next.js, TypeScript, and TailwindCSS.

Main screens:

```text
/login
/dashboard
/incidents/[id]
```

The dashboard includes:

* ingestion controls
* dashboard summary cards
* incident map
* incident table
* search and filters
* pagination
* accept/reject actions

The incident detail page includes:

* full extracted incident fields
* source article details
* raw title/snippet
* edit form
* accept/reject actions
* possible duplicate candidates

The frontend stores the authentication token in browser local storage and sends it with protected API requests using the `Authorization: Token <token>` header.

---

## Map Architecture

The map is built using React Leaflet and OpenStreetMap tiles.

The backend exposes:

```text
GET /api/incidents/map/
```

This endpoint returns recent incidents that have valid latitude and longitude.

The frontend dynamically loads the Leaflet map with server-side rendering disabled because Leaflet depends on browser APIs such as `window` and `document`.

Only incidents with valid coordinates are shown as markers. Clicking a marker shows:

* category
* severity
* location
* review status
* summary
* link to detail page

---

## Deployment Architecture

Recommended deployment:

```text
Frontend: Vercel
Backend: Render / Railway / Fly.io
Database: PostgreSQL
News Source: Google News RSS
Geocoding: OpenStreetMap Nominatim
Map Tiles: OpenStreetMap
```

The frontend communicates with the backend using:

```text
NEXT_PUBLIC_API_BASE_URL
```

The backend should be configured with:

```text
DEBUG=False
SECRET_KEY
DATABASE_URL
ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS
```

For production, PostgreSQL should be used instead of SQLite.

---

## Error Handling

The ingestion pipeline handles common external data issues:

* feed/API failure
* empty feed results
* duplicate article ingestion
* missing article descriptions
* HTML-formatted RSS summaries
* missing or ambiguous location
* geocoding failure
* invalid external API response

A single bad feed item should not crash the whole ingestion run. Errors are captured and returned in the ingestion result.

---

## Known Limitations

* Classification is rule-based and may miss incidents if the article uses unexpected wording.
* Google News RSS summaries can be inconsistent and sometimes contain HTML-like content.
* Location extraction is basic and works best when the article clearly mentions a known city or district.
* Geocoding can fail or return ambiguous results for vague place names.
* Duplicate detection is heuristic and does not automatically merge incidents.
* The map only shows incidents that have valid latitude and longitude.
* Ingestion currently runs synchronously from the API request.
* There is no scheduled ingestion yet.
* There is no audit log for reviewer edits yet.

---

## What I Would Improve With More Time

* Move ingestion to a background worker such as Celery.
* Add scheduled ingestion.
* Improve location extraction using better NLP.
* Add stronger duplicate grouping and merge workflow.
* Add marker clustering for large numbers of map incidents.
* Add audit logs for reviewer edits.
* Add automated tests for ingestion, classification, geocoding, and deduplication.
* Add retry logic for external feed/geocoding failures.
* Add role-based permissions for reviewers and admins.
