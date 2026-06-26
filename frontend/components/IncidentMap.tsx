"use client";

// Client-only wrapper for the Leaflet incident map.

import dynamic from "next/dynamic";

// Leaflet needs browser APIs, so the actual map stays client-side.
const IncidentMapClient = dynamic(() => import("./IncidentMapClient"), {
  ssr: false,
  // Match the final map size so loading does not shift the dashboard around.
  loading: () => (
    <div className="h-[420px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600">
      Loading map...
    </div>
  ),
});

export default function IncidentMap() {
  return <IncidentMapClient />;
}
