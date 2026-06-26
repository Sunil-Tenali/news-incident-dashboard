"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    acceptIncident,
    DuplicateCandidate,
    getIncident,
    getIncidentDuplicates,
    getToken,
    IncidentDetail,
    rejectIncident,
    updateIncident,
} from "@/lib/api";

const categories = [
    "Fire",
    "Flood / Rain Damage",
    "Road Accident",
    "Infrastructure Failure",
    "Power Outage",
    "Health / Food Safety",
    "Public Safety",
    "Other",
];

const severities = ["Critical", "High", "Medium", "Low", "Unknown"];

const locationConfidences = ["High", "Medium", "Low"];

export default function IncidentDetailPage() {
    const params = useParams();
    const router = useRouter();

    const incidentId = Number(params.id);

    const [incident, setIncident] = useState<IncidentDetail | null>(null);

    const [category, setCategory] = useState("");
    const [severity, setSeverity] = useState("");
    const [summary, setSummary] = useState("");
    const [locationText, setLocationText] = useState("");
    const [state, setState] = useState("");
    const [districtCity, setDistrictCity] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [locationConfidence, setLocationConfidence] = useState("Low");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [duplicateCandidates, setDuplicateCandidates] = useState<
        DuplicateCandidate[]
    >([]);

    async function loadDuplicateCandidates() {
        try {
            const data = await getIncidentDuplicates(incidentId);
            setDuplicateCandidates(data);
        } catch {
            setDuplicateCandidates([]);
        }
    }

    async function loadIncident() {
        try {
            setError("");
            setLoading(true);

            const data = await getIncident(incidentId);

            setIncident(data);

            await loadDuplicateCandidates();

            setCategory(data.category);
            setSeverity(data.severity);
            setSummary(data.summary);
            setLocationText(data.location_text || "");
            setState(data.state || "");
            setDistrictCity(data.district_city || "");
            setLatitude(data.latitude === null ? "" : String(data.latitude));
            setLongitude(data.longitude === null ? "" : String(data.longitude));
            setLocationConfidence(data.location_confidence || "Low");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load incident.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setError("");
            setMessage("");
            setSaving(true);

            const updated = await updateIncident(incidentId, {
                category,
                severity,
                summary,
                location_text: locationText,
                state,
                district_city: districtCity,
                latitude: latitude.trim() === "" ? null : Number(latitude),
                longitude: longitude.trim() === "" ? null : Number(longitude),
                location_confidence: locationConfidence,
            });

            setIncident(updated);
            setMessage("Incident updated successfully. Status is now marked as Edited.");
            await loadIncident();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save incident.");
        } finally {
            setSaving(false);
        }
    }

    // Accept/reject/edit are explicit reviewer choices, separate from extraction.
    async function handleAccept() {
        try {
            setError("");
            setMessage("");
            setActionLoading("accept");

            await acceptIncident(incidentId);
            setMessage("Incident accepted.");
            await loadIncident();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to accept incident.");
        } finally {
            setActionLoading("");
        }
    }

    async function handleReject() {
        try {
            setError("");
            setMessage("");
            setActionLoading("reject");

            await rejectIncident(incidentId);
            setMessage("Incident rejected.");
            await loadIncident();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to reject incident.");
        } finally {
            setActionLoading("");
        }
    }

    useEffect(() => {
        const token = getToken();

        if (!token) {
            router.push("/login");
            return;
        }

        if (!Number.isNaN(incidentId)) {
            loadIncident();
        }
    }, [incidentId, router]);

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-100 px-6 py-8">
                <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 p-6">
                    Loading incident...
                </div>
            </main>
        );
    }

    if (!incident) {
        return (
            <main className="min-h-screen bg-slate-100 px-6 py-8">
                <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 p-6">
                    Incident not found.
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-100">
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div>
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-slate-600 hover:text-slate-900"
                        >
                            ← Back to dashboard
                        </Link>

                        <h1 className="text-2xl font-bold text-slate-900 mt-2">
                            Incident Detail #{incident.id}
                        </h1>
                    </div>

                    <StatusBadge status={incident.review_status} />
                </div>
            </header>

            <section className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-red-700">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-emerald-700">
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-1">
                            Edit Extracted Incident
                        </h2>
                        <p className="text-slate-600 mb-6">
                            Update the machine-detected fields after reviewing the source article.
                        </p>

                        <form onSubmit={handleSave} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(event) => setCategory(event.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                                    >
                                        {categories.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Severity
                                    </label>
                                    <select
                                        value={severity}
                                        onChange={(event) => setSeverity(event.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                                    >
                                        {severities.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Summary
                                </label>
                                <textarea
                                    value={summary}
                                    onChange={(event) => setSummary(event.target.value)}
                                    rows={5}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Location Text
                                    </label>
                                    <input
                                        value={locationText}
                                        onChange={(event) => setLocationText(event.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
                                        placeholder="Example: Vijayawada"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        State
                                    </label>
                                    <input
                                        value={state}
                                        onChange={(event) => setState(event.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
                                        placeholder="Example: Andhra Pradesh"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        District / City
                                    </label>
                                    <input
                                        value={districtCity}
                                        onChange={(event) => setDistrictCity(event.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
                                        placeholder="Example: NTR"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Latitude
                                    </label>
                                    <input
                                        value={latitude}
                                        onChange={(event) => setLatitude(event.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
                                        placeholder="16.5062"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Longitude
                                    </label>
                                    <input
                                        value={longitude}
                                        onChange={(event) => setLongitude(event.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
                                        placeholder="80.6480"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Location Confidence
                                    </label>
                                    <select
                                        value={locationConfidence}
                                        onChange={(event) =>
                                            setLocationConfidence(event.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                                    >
                                        {locationConfidences.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-2">
                                <button
                                    disabled={saving}
                                    className="rounded-lg bg-slate-900 text-white px-5 py-3 font-semibold disabled:opacity-60"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleAccept}
                                    disabled={actionLoading !== ""}
                                    className="rounded-lg bg-emerald-600 text-white px-5 py-3 font-semibold disabled:opacity-60"
                                >
                                    {actionLoading === "accept" ? "Accepting..." : "Accept"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleReject}
                                    disabled={actionLoading !== ""}
                                    className="rounded-lg bg-red-600 text-white px-5 py-3 font-semibold disabled:opacity-60"
                                >
                                    {actionLoading === "reject" ? "Rejecting..." : "Reject"}
                                </button>
                            </div>
                        </form>
                    </section>

                    <aside className="space-y-6">
                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900">
                                Source Article
                            </h2>

                            <div className="mt-4 space-y-3 text-sm">
                                <InfoItem label="Title" value={incident.source_article.title} />
                                <InfoItem label="Source" value={incident.source_article.source || "Unknown"} />
                                <InfoItem
                                    label="Matched Query"
                                    value={incident.source_article.matched_query || "Unknown"}
                                />
                                <InfoItem
                                    label="Published"
                                    value={
                                        incident.source_article.published_at
                                            ? new Date(
                                                incident.source_article.published_at
                                            ).toLocaleString()
                                            : "Unknown"
                                    }
                                />

                                {incident.source_article.url && (
                                    <a
                                        href={incident.source_article.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-block max-w-full break-all text-slate-900 underline underline-offset-2 font-semibold"
                                    >
                                        Open source article
                                    </a>
                                )}
                            </div>
                        </section>

                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900">
                                Extraction Metadata
                            </h2>

                            <div className="mt-4 space-y-3 text-sm">
                                <InfoItem
                                    label="Review Status"
                                    value={incident.review_status}
                                />
                                <InfoItem
                                    label="Location Confidence"
                                    value={incident.location_confidence}
                                />
                                <InfoItem
                                    label="Possible Duplicate"
                                    value={incident.is_possible_duplicate ? "Yes" : "No"}
                                />
                                <InfoItem
                                    label="Duplicate Score"
                                    value={String(incident.duplicate_score)}
                                />
                                <InfoItem
                                    label="Created"
                                    value={new Date(incident.created_at).toLocaleString()}
                                />
                                <InfoItem
                                    label="Updated"
                                    value={new Date(incident.updated_at).toLocaleString()}
                                />
                            </div>
                        </section>
                    </aside>
                </div>

                <section className="bg-white break-all rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-3">
                        Raw Title / Snippet
                    </h2>

                    <p className="font-semibold text-slate-900">
                        {incident.source_article.title}
                    </p>

                    <p className="text-slate-700 mt-3">
                        {incident.source_article.description || "No description available."}
                    </p>
                </section>

                <section className="bg-white break-all rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-2">
                        Possible Duplicates
                    </h2>

                    <p className="text-slate-600 mb-5">
                        Similar incidents based on category, location, title similarity, and
                        published time window.
                    </p>

                    {duplicateCandidates.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
                            No similar incidents found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {duplicateCandidates.map((candidate) => (
                                <div
                                    key={candidate.incident.id}
                                    className="rounded-xl border border-slate-200 p-5"
                                >
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-500">
                                                Duplicate score: {candidate.score}
                                            </p>

                                            <h3 className="font-bold text-slate-900 mt-1">
                                                {candidate.incident.category} —{" "}
                                                {candidate.incident.location_text || "Unknown location"}
                                            </h3>

                                            <p className="text-sm text-slate-600 mt-2 line-clamp-3">
                                                {candidate.incident.summary}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700 font-semibold">
                                                    {candidate.incident.severity}
                                                </span>

                                                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700 font-semibold">
                                                    {candidate.incident.review_status}
                                                </span>

                                                {candidate.incident.is_possible_duplicate && (
                                                    <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800 font-semibold">
                                                        Marked duplicate
                                                    </span>
                                                )}
                                            <Link
                                                href={`/incidents/${candidate.incident.id}`}
                                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 text-center"
                                            >
                                                Open
                                            </Link>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-slate-500">{label}</p>
            <p className="font-medium text-slate-900 break-words">{value}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const className =
        status === "Accepted"
            ? "bg-emerald-100 text-emerald-800"
            : status === "Rejected"
                ? "bg-red-100 text-red-800"
                : status === "Edited"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-700";

    return (
        <span className={`rounded-full px-3 py-2 text-sm font-semibold ${className}`}>
            {status}
        </span>
    );
}
