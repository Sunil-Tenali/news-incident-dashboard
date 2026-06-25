# Take-Home Assignment: News-to-Incident Mapping Dashboard

## Objective

Build and deploy a full-stack application that transforms public news/RSS feed items into structured, reviewable incident records displayed on a map-based dashboard.

This assignment evaluates your ability to design and deploy a production-ready system that handles third-party data ingestion, backend data modeling, location extraction, deduplication, frontend dashboards, and robust error handling.

You may use LLMs, AI coding tools, open-source libraries, templates, and any development tools of your choice. However, you must fully understand and be able to explain your final implementation.

---

## Required Stack

### Backend

- Django  
- Django REST Framework  
- PostgreSQL (preferred)

### Frontend

- Next.js  
- TypeScript  
- TailwindCSS  

### Deployment

Deploy the application publicly using any cloud or server platform.

---

## Product Requirement

The application should ingest public news/RSS feeds, identify real-world incidents, extract location details, geocode them, detect duplicates, and present the results for human review.

Supported incident categories include:

- Fire  
- Flood / Rain Damage  
- Road Accident  
- Infrastructure Failure  
- Power Outage  
- Health / Food Safety  
- Public Safety  
- Other  

---

## Required External Integrations

The application must integrate with:

1. **A public news/RSS source**  
   Examples: Google News RSS, GDELT, Indian news RSS feeds, or similar.

2. **A geocoding service**  
   Examples: OpenStreetMap Nominatim, Open-Meteo Geocoding, Mapbox, Google Maps, or similar.

A paid LLM API is not required.

---

## Core Features

### Authentication

- Login  
- Logout  
- Protected dashboard  
- Test credentials for evaluation  

---

### Ingestion

The dashboard must include a **Run Ingestion** action.

When triggered, the backend should fetch articles from one or more incident-related news/RSS feeds.

Each raw article must be stored with:

- Title  
- Source  
- Published time  
- URL  
- Description/snippet  
- Matched query or feed source  
- Raw payload  
- Ingested timestamp  

---

### Incident Detection

For each relevant article, create a detected incident record containing:

- Category  
- Summary  
- Severity  
- Location text  
- State  
- District/city (if available)  
- Latitude  
- Longitude  
- Location confidence  
- Source article reference  
- Review status  
- Duplicate status/score  

Incident extraction can use rules, open-source NLP, LLMs, or a hybrid approach. The method must be documented and explainable.

---

### Location Extraction and Geocoding

The system should infer location from article content (title, snippet, or feed context).

If coordinates are unavailable, call a geocoding API.

If the location is uncertain, store the incident with a low confidence score.

---

### Deduplication

The system must detect when multiple articles refer to the same incident.

At minimum, consider:

- Similar title or summary  
- Similar location  
- Same category  
- Similar publication time window  

The dashboard should display potential duplicates.

---

### Human Review

Users should be able to:

- View detected incidents  
- View source articles  
- Accept incidents  
- Reject incidents  
- Edit category, severity, summary, or location  
- View possible duplicates  

Review statuses:

- Needs Review  
- Accepted  
- Rejected  
- Edited  

---

## Dashboard Requirements

### Dashboard Summary

Display counts for:

- Articles ingested  
- Detected incidents  
- Needs review  
- Accepted incidents  
- Rejected incidents  
- Possible duplicates  

---

### Incident Table

The table must support:

- Search  
- Filter by category  
- Filter by state/district  
- Filter by severity  
- Filter by review status  
- Pagination  

---

### Map View

Display incidents on a map using latitude and longitude.

Clicking a marker should show basic incident details.

---

### Incident Detail Page

Each incident should include:

- Extracted incident fields  
- Source article  
- Raw title/snippet  
- Location confidence  
- Possible duplicates  
- Review/edit actions  

---

## Backend API Requirements

Expose REST APIs for:

- Authentication  
- Running ingestion  
- Listing raw articles  
- Listing detected incidents  
- Viewing incident details  
- Editing incident fields  
- Updating review status  
- Dashboard summary  
- Duplicate groups  

Endpoint structure is flexible.

---

## Error Handling Requirements

The application must gracefully handle:

- Feed/API failures  
- Empty feed results  
- Duplicate article ingestion  
- Missing article descriptions  
- Missing or ambiguous location  
- Geocoding failures  
- Invalid external API responses  

The system should not crash due to external service failures.

---

## Submission Requirements

Submit the following:

1. Deployed application URL  
2. Backend/API URL (if separate)  
3. Test username and password  
4. GitHub repository link  
5. README  
6. Architecture note  
7. Known limitations  
8. AI/tool usage note  

---

## README Requirements

Include:

- Project overview  
- Local setup instructions  
- Environment variables  
- Migration instructions  
- Deployment details  
- External APIs used  
- Known limitations  

---

## Architecture Note

Keep it concise. Cover:

- Data model  
- Ingestion flow  
- Incident detection approach  
- Location extraction/geocoding approach  
- Deduplication approach  
- Deployment architecture  
- Improvements with more time  

---

## AI / Tool Usage

AI tools are allowed.

Include a brief note explaining:

- Tools used  
- What they generated  
- What you manually reviewed or modified  
- Any AI-generated issues you identified  

---

## Minimum Acceptance Criteria

A valid submission must include:

- Deployed Django REST backend  
- Deployed Next.js TypeScript frontend  
- Login-protected dashboard  
- News/RSS ingestion  
- Raw article storage  
- Detected incident records  
- Location extraction and geocoding  
- Map view  
- Incident review workflow  
- Basic deduplication  
- README and architecture note  
```
