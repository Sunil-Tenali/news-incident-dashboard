# AI / Tool Usage Declaration

AI tools were used during this project as coding, debugging, explanation, and documentation assistants. I mainly used AI to speed up repetitive boilerplate, understand errors faster, improve documentation wording, and think through testing ideas.

The engineering decisions, business logic, integration, debugging, testing, and final submitted code remained my responsibility.

---

## How I Used AI

My usual workflow was to first define the feature or problem myself, then use AI for suggestions or boilerplate where useful. After that, I reviewed, modified, integrated, debugged, and tested the code before keeping it in the project.

AI helped with standard Django boilerplate such as serializers, views, and CRUD-style endpoints. Those files were substantially modified to match the project’s data model, review workflow, validation rules, API behavior, and frontend requirements.

AI was not used as the owner of the architecture or core business logic.

---

## Architecture Ownership

One important design decision was separating `RawArticle` and `Incident`.

A simpler approach would have been to store the fetched article and extracted incident data together. I avoided that because the article is the original source data, while the incident is the system’s extracted and reviewable interpretation of that source.

This decision came from a similar pattern I had used in my earlier CarbonTrail ESG ingestion project, where raw uploaded rows were preserved separately from normalized records.

In this project, `RawArticle` preserves the untouched news article, while `Incident` stores the structured incident created from it. This keeps every reviewed incident traceable back to the original article, allows reviewers to verify the source, prevents raw data loss when incident fields are edited, and makes debugging easier when extraction or classification is wrong.

---

## Backend Implementation

I implemented or substantially modified the backend data model, ingestion pipeline, RSS feed processing, location extraction, duplicate detection, review workflow, serializers, views, routes, and API endpoints.

Important backend areas included:

* `models.py`
* `serializers.py`
* `views.py`
* `urls.py`
* `duplicate_detector.py`
* ingestion logic
* RSS processing
* location extraction
* review actions

For example, I integrated the review workflow so incidents could be listed, opened, edited, accepted, rejected, shown on the map, and checked against duplicate candidates.

---

## Ingestion Flow

The ingestion flow starts by fetching articles from RSS feeds. Each item is cleaned, and the source URL is checked first to avoid processing the same article again.

This URL duplicate check happens before classification and geocoding, so already-ingested articles do not go through unnecessary processing.

After that, the backend runs classification, severity detection, location extraction, coordinate lookup, geocoding fallback, incident creation, and duplicate detection.

Classification and severity followed the assignment-provided rules. They were implemented using rule and keyword-based matching rather than a machine-learning model or AI-generated taxonomy.

For location extraction, the system checks `location_reference.csv` first. If no direct match is found, it tries to extract location phrases from the title or description, such as “in Hyderabad” or “near Warangal.” If needed, it falls back to OpenStreetMap/Nominatim-style geocoding. If geocoding fails, the incident is still saved with low location confidence instead of forcing an incorrect coordinate.

---

## Duplicate Detection

I implemented the duplicate detection logic in `duplicate_detector.py`.

Initially, the logic depended too much on title similarity. During testing, title-only matching produced false positives because unrelated incidents could have similar headlines. AI had suggested fuzzy title matching as a starting point, but I changed the final approach to weighted scoring.

The final duplicate scoring uses multiple signals, including:

* location
* title/description similarity
* category

I used a threshold of 65 for stronger duplicate flagging. During testing, lower values produced too many false positives, while higher values missed related incidents. A lower threshold of 50 is used only to show borderline duplicate candidates on the detail page for reviewer inspection.

The system does not automatically merge or delete duplicates. Since duplicate detection is heuristic-based, possible matches are surfaced for human review instead of risking incorrect automatic merges.

---

## Frontend Implementation

On the frontend, I worked on the map component, incident list/table, incident detail page, duplicate candidates section, and review action buttons.

This included:

* accept/reject actions
* run live/sample ingestion buttons
* open/edit actions
* opening the original article link
* displaying duplicate candidates
* showing incidents on the map

The table supports quick review, while the detail page gives deeper context such as source article data, editable incident fields, location information, and duplicate candidates.

---

## Debugging Examples

One important issue involved Leaflet in Next.js. Leaflet depends on browser APIs, so rendering it during server-side rendering caused map-related issues. I fixed this by loading the map client component dynamically with SSR disabled:

`const IncidentMapClient = dynamic(() => import("./IncidentMapClient"), { ssr: false });`

Another map-related issue was the number of markers shown. AI initially treated it as a possible frontend/backend data-passing bug. After checking the API response and database records, I found the map was working correctly; only incidents with valid latitude and longitude were being shown. More markers required ingesting more live feed items with resolvable locations, not changing the map code.

Other manual fixes included cleaning HTML/link-like RSS summaries, handling long URL/text overflow, and keeping backend ingestion defaults instead of relying only on frontend-provided values.

---

## Testing

I tested the main workflows using Postman, browser requests, and Django Admin.

I checked:

* HTTP requests
* request payloads
* response JSON
* status codes
* authentication behavior
* validation errors
* saved database records

The tested workflows included login/logout, ingestion run, dashboard summary, article APIs, incident list/detail APIs, edit/update, accept, reject, map data, and duplicate lookup.

Django Admin was used to confirm that records were actually created, updated, accepted, rejected, and flagged correctly in the backend.

---

## Final Responsibility

AI helped me move faster, but it did not replace my engineering judgment. The final architecture, business logic, debugging decisions, testing, and submitted implementation are my responsibility.

I can explain and modify each major part of the system, including the data model, ingestion workflow, API structure, duplicate detection, location extraction, review process, and frontend integration without relying on AI.
