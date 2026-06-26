"use client";

// Browser-side Leaflet map for incidents that already have coordinates.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { getMapIncidents, Incident } from "@/lib/api";

const DEFAULT_CENTER: [number, number] = [16.5062, 80.6480];

function createIncidentIcon(category: string) {
  // A small text marker avoids depending on Leaflet's default image assets.
  const label = category.charAt(0).toUpperCase();

  return L.divIcon({
    className: "incident-marker",
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 9999px;
        background: #0f172a;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.35);
      ">
        ${label}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

export default function IncidentMapClient() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMapIncidents() {
    try {
      setError("");
      setLoading(true);

      const data = await getMapIncidents();
      setIncidents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load map data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMapIncidents();
  }, []);

  // Keep unplaced incidents off the map, but still available in the review table.
  const validIncidents = useMemo(() => {
    return incidents.filter(
      (incident) =>
        incident.latitude !== null &&
        incident.longitude !== null &&
        !Number.isNaN(Number(incident.latitude)) &&
        !Number.isNaN(Number(incident.longitude))
    );
  }, [incidents]);

  const center = useMemo<[number, number]>(() => {
    if (validIncidents.length === 0) {
      return DEFAULT_CENTER;
    }

    // Center on the newest plotted incident because the API sends recent records first.
    return [
      Number(validIncidents[0].latitude),
      Number(validIncidents[0].longitude),
    ];
  }, [validIncidents]);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Incident Map</h2>
          <p className="text-slate-600 mt-1">
            Shows detected incidents that have latitude and longitude.
          </p>
        </div>

        <button
          onClick={loadMapIncidents}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh Map
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-[420px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600">
          Loading map incidents...
        </div>
      ) : validIncidents.length === 0 ? (
        <div className="h-[420px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600">
          No coordinate-based incidents found. Run ingestion or check location extraction.
        </div>
      ) : (
        <div className="h-[420px] overflow-hidden rounded-xl border border-slate-200">
          <MapContainer
            center={center}
            zoom={7}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {validIncidents.map((incident) => (
              <Marker
                key={incident.id}
                position={[
                  Number(incident.latitude),
                  Number(incident.longitude),
                ]}
                icon={createIncidentIcon(incident.category)}
              >
                <Popup>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-slate-900">
                      {incident.category}
                    </p>

                    <p>
                      <span className="font-semibold">Severity:</span>{" "}
                      {incident.severity}
                    </p>

                    <p>
                      <span className="font-semibold">Location:</span>{" "}
                      {incident.location_text || "Unknown"}
                    </p>

                    <p>
                      <span className="font-semibold">Status:</span>{" "}
                      {incident.review_status}
                    </p>

                    <p className="max-w-56 text-slate-700">
                      {incident.summary}
                    </p>

                    <Link
                      href={`/incidents/${incident.id}`}
                      className="inline-block font-semibold text-slate-900 underline underline-offset-2"
                    >
                      View/Edit incident
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      <p className="text-sm text-slate-500 mt-4">
        Showing {validIncidents.length} incidents with coordinates.
      </p>
    </section>
  );
}
