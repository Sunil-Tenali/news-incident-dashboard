"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import IncidentMap from "@/components/IncidentMap";
import IncidentTable from "@/components/IncidentTable";
import {
  clearToken,
  getDashboardSummary,
  getToken,
  logout,
  runIngestion,
  DashboardSummary,
  IngestionResult,
} from "@/lib/api";

const emptySummary: DashboardSummary = {
  articles_ingested: 0,
  detected_incidents: 0,
  needs_review: 0,
  accepted_incidents: 0,
  rejected_incidents: 0,
  possible_duplicates: 0,
};

export default function DashboardPage() {
  const router = useRouter();

  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [ingestionResult, setIngestionResult] =
    useState<IngestionResult | null>(null);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [runningSample, setRunningSample] = useState(false);
  const [runningLive, setRunningLive] = useState(false);
  const [error, setError] = useState("");

  async function loadSummary() {
    try {
      setError("");
      setLoadingSummary(true);

      const data = await getDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load summary.");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function handleRunIngestion(useSample: boolean) {
    try {
      setError("");
      setIngestionResult(null);

      if (useSample) {
        setRunningSample(true);
      } else {
        setRunningLive(true);
      }

      const result = await runIngestion(useSample);
      setIngestionResult(result);

      await loadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingestion failed.");
    } finally {
      setRunningSample(false);
      setRunningLive(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Even if backend logout fails, clear local token.
    } finally {
      clearToken();
      router.push("/login");
    }
  }

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    loadSummary();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Sunil Varma Tenali
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              News-to-Incident Dashboard
            </h1>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Ingestion Control
              </h2>
              <p className="text-slate-600 mt-1">
                Fetch news articles, detect incidents, extract locations, and
                update the dashboard.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleRunIngestion(true)}
                disabled={runningSample || runningLive}
                className="rounded-lg bg-slate-700 text-white px-5 py-3 font-semibold disabled:opacity-60"
              >
                {runningSample ? "Running..." : "Run Sample"}
              </button>

              <button
                onClick={() => handleRunIngestion(false)}
                disabled={runningSample || runningLive}
                className="rounded-lg bg-slate-900 text-white px-5 py-3 font-semibold disabled:opacity-60"
              >
                {runningLive ? "Running..." : "Run Live"}
              </button>
            </div>
          </div>
        </div>


        {ingestionResult && (
          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">
              Last Ingestion Result
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <ResultItem label="Mode" value={ingestionResult.mode} />
              <ResultItem
                label="Feeds Attempted"
                value={ingestionResult.feeds_attempted}
              />
              <ResultItem
                label="Articles Seen"
                value={ingestionResult.articles_seen}
              />
              <ResultItem
                label="Raw Articles Created"
                value={ingestionResult.raw_articles_created}
              />
              <ResultItem
                label="Duplicates Skipped"
                value={ingestionResult.raw_articles_skipped_as_duplicates}
              />
              <ResultItem
                label="Incidents Created"
                value={ingestionResult.incidents_created}
              />
              <ResultItem
                label="Irrelevant Skipped"
                value={ingestionResult.irrelevant_articles_skipped}
              />
              <ResultItem
                label="Errors"
                value={ingestionResult.errors.length}
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Dashboard Summary
              </h2>
              <p className="text-slate-600 mt-1">
                Current counts from backend database.
              </p>
            </div>

            <button
              onClick={loadSummary}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>



          {loadingSummary ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              Loading summary...
            </div>
          ) : (
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <SummaryCard
                label="Articles Ingested"
                value={summary.articles_ingested}
              />
              <SummaryCard
                label="Detected Incidents"
                value={summary.detected_incidents}
              />
              <SummaryCard label="Needs Review" value={summary.needs_review} />
              <SummaryCard
                label="Accepted Incidents"
                value={summary.accepted_incidents}
              />
              <SummaryCard
                label="Rejected Incidents"
                value={summary.rejected_incidents}
              />
              <SummaryCard
                label="Possible Duplicates"
                value={summary.possible_duplicates}
              />
            </div>
          )}
        </div>
        <IncidentMap />
        <div className="mb-6">
          <IncidentTable onChanged={loadSummary} />
        </div>

      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-4xl font-bold text-slate-900 mt-3">{value}</p>
    </div>
  );
}

function ResultItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900">{value}</p>
    </div>
  );
}