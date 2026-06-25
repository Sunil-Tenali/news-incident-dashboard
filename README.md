# News-to-Incident Mapping Dashboard

A full-stack application that ingests public news/RSS feed results, detects likely real-world incidents, extracts location information, geocodes incidents, checks for possible duplicates, and displays them on a protected map-based review dashboard.

The system is built as a take-home assessment for Saptharishi Intelligence.

---

## Project Overview

The application converts unstructured public news articles into structured incident records.

Example:

```text
News article:
"Fire breaks out at warehouse in Vijayawada, no casualties reported"

Detected incident:
Category: Fire
Severity: Low
Location: Vijayawada
State: Andhra Pradesh
Latitude/Longitude: 16.5062, 80.6480
Review Status: Needs Review
```

The dashboard allows a reviewer to:

* Run news ingestion
* View dashboard summary counts
* Search and filter detected incidents
* View incidents on a map
* Open incident detail pages
* Accept or reject incidents
* Edit extracted incident fields
* View possible duplicate incidents

---

## Tech Stack

### Backend

* Django
* Django REST Framework
* Token Authentication
* SQLite for local development
* PostgreSQL-ready configuration for deployment
* Feedparser for RSS parsing
* OpenStreetMap Nominatim for geocoding

### Frontend

* Next.js
* TypeScript
* TailwindCSS
* React Leaflet
* OpenStreetMap tiles

---

## Core Features

* Login/logout
* Protected dashboard
* Run ingestion action
* Google News RSS ingestion
* Raw article storage
* Rule-based incident classification
* Severity detection
* Location extraction from article title/snippet
* Local location reference matching
* Geocoding fallback
* Basic duplicate scoring
* Dashboard summary cards
* Incident table with search, filters, and pagination
* Map view with incident markers
* Incident detail/edit page
* Accept/reject/edit review workflow
* Possible duplicate candidate display on incident detail page

---

## Backend Setup

```bash
cd backend
python -m venv venv
```

Activate virtual environment.

Windows:

```bash
venv\Scripts\activate
```

Mac/Linux:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

If `requirements.txt` is not generated yet, run:

```bash
pip freeze > requirements.txt
```

Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

Create test user:

```bash
python manage.py createsuperuser
```

Run backend:

```bash
python manage.py runserver
```

Backend runs at:

```text
http://127.0.0.1:8000
```

---

## Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

Run frontend:

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:3000
```

---

## Environment Variables

### Frontend

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

### Backend

For local development, the backend can run with default Django settings and SQLite.

For deployment, configure:

```env
SECRET_KEY=your-secret-key
DEBUG=False
DATABASE_URL=your-postgres-url
ALLOWED_HOSTS=your-backend-domain
CORS_ALLOWED_ORIGINS=your-frontend-domain
```

---

## Main API Endpoints

```text
POST    /api/auth/login/
POST    /api/auth/logout/

POST    /api/ingestion/run/

GET     /api/dashboard/summary/

GET     /api/articles/
GET     /api/articles/:id/

GET     /api/incidents/
POST    /api/incidents/
GET     /api/incidents/:id/
PUT     /api/incidents/:id/
PATCH   /api/incidents/:id/
DELETE  /api/incidents/:id/

POST    /api/incidents/:id/accept/
POST    /api/incidents/:id/reject/

GET     /api/incidents/map/
GET     /api/incidents/:id/duplicates/

GET     /api/duplicates/
```

---

## External APIs Used

### Google News RSS

Used for live public news ingestion.

The backend builds RSS search URLs from predefined incident-related queries in:

```text
backend/incidents/data/feed_queries.json
```

Example:

```text
https://news.google.com/rss/search?q=fire+accident+Andhra+Pradesh&hl=en-IN&gl=IN&ceid=IN:en
```

### OpenStreetMap Nominatim

Used by the frontend map through React Leaflet to display the incident map.

Used as a fallback geocoding service when a location is not found in the local location reference CSV.

The local location reference is checked first to keep extraction fast and deterministic.

---

## Data Files

```text
backend/incidents/data/feed_queries.json
```

Contains predefined incident-related news search queries.

```text
backend/incidents/data/classification_rules.json
```

Contains keyword rules for category and severity detection.

```text
backend/incidents/data/location_reference.csv
```

Contains known Indian locations with state, district, latitude, and longitude.

```text
backend/incidents/data/sample_feed_items.json
```

Contains local test feed items for sample ingestion mode.

---

## Ingestion Flow

```text
1. Reviewer clicks Run Ingestion.
2. Frontend calls POST /api/ingestion/run/.
3. Backend loads feed queries.
4. Backend fetches RSS articles.
5. Each new article is stored as RawArticle.
6. Article title and description are classified using rules.
7. Location is extracted from article text.
8. Local CSV matching is attempted first.
9. Geocoding is used as fallback.
10. Incident record is created.
11. Duplicate score is calculated.
12. Dashboard updates with new incidents.
```

---

## Known Limitations

* Classification is rule-based and may miss incidents if the article uses unexpected wording.
* Google News RSS summaries may be inconsistent, so summaries are cleaned during ingestion.
* Location extraction is basic and works best when the article clearly mentions a known city or district.
* Geocoding can fail or return ambiguous results for vague locations.
* Duplicate detection is heuristic and does not automatically merge incidents.
* Map only shows incidents with valid latitude and longitude.
* Ingestion currently runs synchronously from the API request; a production version should use background jobs.

---

## Deployment Notes

The app can be deployed with:

* Backend on Render/Railway/Fly.io
* PostgreSQL database
* Frontend on Vercel/Netlify

For production:

* Set `DEBUG=False`
* Configure `ALLOWED_HOSTS`
* Configure CORS for frontend domain
* Use PostgreSQL instead of SQLite
* Set a secure Django `SECRET_KEY`
* Run migrations after deployment

---

## Test Credentials

```text
Username: reviewer
Password: <provide-created-password>
```

Replace this with the actual test credentials created for review.

---

## Repository Structure

```text
backend/
  config/
  incidents/
    data/
    services/
    models.py
    serializers.py
    views.py
    urls.py

frontend/
  app/
  components/
  lib/

README.md
ARCHITECTURE.md
AI_USAGE.md
```
