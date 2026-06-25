"use client";

import dynamic from "next/dynamic";

const IncidentMapClient = dynamic(() => import("./IncidentMapClient"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600">
      Loading map...
    </div>
  ),
});

export default function IncidentMap() {
  return <IncidentMapClient />;
}