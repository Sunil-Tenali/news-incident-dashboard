// Shared API helpers and response shapes for the dashboard frontend.

const API_BASE_URL =
  // Keep local setup working unless the deployment overrides the backend URL.
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

export type LoginResponse = {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
};

export type DashboardSummary = {
  articles_ingested: number;
  detected_incidents: number;
  needs_review: number;
  accepted_incidents: number;
  rejected_incidents: number;
  possible_duplicates: number;
};

export type IngestionResult = {
  mode: string;
  feeds_attempted: number;
  articles_seen: number;
  raw_articles_created: number;
  raw_articles_skipped_as_duplicates: number;
  incidents_created: number;
  irrelevant_articles_skipped: number;
  errors: unknown[];
};

export type Incident = {
  id: number;
  category: string;
  summary: string;
  severity: string;
  location_text: string;
  state: string;
  district_city: string;
  latitude: number | null;
  longitude: number | null;
  location_confidence: string;
  review_status: string;
  duplicate_score: number;
  is_possible_duplicate: boolean;
  source_article_title: string;
  source_article_url: string;
  created_at: string;
  updated_at: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type IncidentQueryParams = {
  page?: number;
  search?: string;
  category?: string;
  severity?: string;
  review_status?: string;
  state?: string;
};

export type RawArticle = {
  id: number;
  title: string;
  source: string;
  published_at: string | null;
  url: string;
  description: string;
  matched_query: string;
  raw_payload: unknown;
  ingested_at: string;
};

export type IncidentDetail = {
  id: number;
  // Detail views need the untouched article beside the editable incident fields.
  source_article: RawArticle;
  category: string;
  summary: string;
  severity: string;
  location_text: string;
  state: string;
  district_city: string;
  latitude: number | null;
  longitude: number | null;
  location_confidence: string;
  review_status: string;
  duplicate_score: number;
  is_possible_duplicate: boolean;
  created_at: string;
  updated_at: string;
};

export type UpdateIncidentPayload = {
  category?: string;
  severity?: string;
  summary?: string;
  location_text?: string;
  state?: string;
  district_city?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_confidence?: string;
};

export async function getMapIncidents() {
  return apiRequest<Incident[]>("/incidents/map/");
}
export type DuplicateCandidate = {
  score: number;
  incident: Incident;
};

export async function getIncidentDuplicates(id: number) {
  return apiRequest<DuplicateCandidate[]>(`/incidents/${id}/duplicates/`);
}

export async function getIncident(id: number) {
  return apiRequest<IncidentDetail>(`/incidents/${id}/`);
}

export async function updateIncident(
  id: number,
  payload: UpdateIncidentPayload
) {
  return apiRequest<IncidentDetail>(`/incidents/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getIncidents(params: IncidentQueryParams = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    // Empty filters should disappear from the URL instead of narrowing results.
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const path = queryString ? `/incidents/?${queryString}` : "/incidents/";

  return apiRequest<PaginatedResponse<Incident>>(path);
}

export async function acceptIncident(id: number) {
  return apiRequest(`/incidents/${id}/accept/`, {
    method: "POST",
  });
}

export async function rejectIncident(id: number) {
  return apiRequest(`/incidents/${id}/reject/`, {
    method: "POST",
  });
}

export function getToken() {
  // Some helpers are imported during rendering, where localStorage does not exist.
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("auth_token");
}

export function saveToken(token: string) {
  localStorage.setItem("auth_token", token);
}

export function clearToken() {
  localStorage.removeItem("auth_token");
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    // Review actions should always come back from the latest backend state.
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail || data?.error || "Something went wrong while calling API.";
    throw new Error(message);
  }

  return data as T;
}

export async function login(username: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
    }),
  });
}

export async function logout() {
  return apiRequest<{ detail: string }>("/auth/logout/", {
    method: "POST",
  });
}

export async function getDashboardSummary() {
  return apiRequest<DashboardSummary>("/dashboard/summary/");
}

export async function runIngestion(useSample: boolean) {
  return apiRequest<IngestionResult>("/ingestion/run/", {
    method: "POST",
    body: JSON.stringify({
      use_sample: useSample,
    }),
  });
}
