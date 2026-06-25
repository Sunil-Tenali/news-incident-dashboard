"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
    acceptIncident,
    getIncidents,
    Incident,
    rejectIncident,
} from "@/lib/api";

const categories = [
    "",
    "Fire",
    "Flood / Rain Damage",
    "Road Accident",
    "Infrastructure Failure",
    "Power Outage",
    "Health / Food Safety",
    "Public Safety",
    "Other",
];

const severities = ["", "Critical", "High", "Medium", "Low", "Unknown"];

const reviewStatuses = [
    "",
    "Needs Review",
    "Accepted",
    "Rejected",
    "Edited",
];

type IncidentTableProps = {
    onChanged?: () => void;
};

export default function IncidentTable({ onChanged }: IncidentTableProps) {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState<string | null>(null);
    const [previous, setPrevious] = useState<string | null>(null);

    const [page, setPage] = useState(1);

    const [searchInput, setSearchInput] = useState("");
    const [stateInput, setStateInput] = useState("");

    const [appliedSearch, setAppliedSearch] = useState("");
    const [appliedState, setAppliedState] = useState("");

    const [category, setCategory] = useState("");
    const [severity, setSeverity] = useState("");
    const [reviewStatus, setReviewStatus] = useState("");

    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
    const [error, setError] = useState("");

    async function loadIncidents() {
        try {
            setError("");
            setLoading(true);

            const data = await getIncidents({
                page,
                search: appliedSearch,
                state: appliedState,
                category,
                severity,
                review_status: reviewStatus,
            });

            setIncidents(data.results);
            setCount(data.count);
            setNext(data.next);
            setPrevious(data.previous);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load incidents.");
        } finally {
            setLoading(false);
        }
    }

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setPage(1);
        setAppliedSearch(searchInput.trim());
        setAppliedState(stateInput.trim());
    }

    function clearFilters() {
        setSearchInput("");
        setStateInput("");
        setAppliedSearch("");
        setAppliedState("");
        setCategory("");
        setSeverity("");
        setReviewStatus("");
        setPage(1);
    }

    async function handleAccept(id: number) {
        try {
            setActionLoadingId(id);
            await acceptIncident(id);
            await loadIncidents();
            onChanged?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to accept incident.");
        } finally {
            setActionLoadingId(null);
        }
    }

    async function handleReject(id: number) {
        try {
            setActionLoadingId(id);
            await rejectIncident(id);
            await loadIncidents();
            onChanged?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to reject incident.");
        } finally {
            setActionLoadingId(null);
        }
    }

    useEffect(() => {
        loadIncidents();
    }, [page, appliedSearch, appliedState, category, severity, reviewStatus]);

    return (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="mb-6 flex items-start justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Incident Review</h2>
                    <p className="text-slate-600 mt-1">
                        Search, filter, accept, or reject detected incident records.
                    </p>
                </div>

                <div className="text-sm text-slate-500">
                    Total matching incidents:{" "}
                    <span className="font-semibold text-slate-900">{count}</span>
                </div>
            </div>

            <form
                onSubmit={handleSearchSubmit}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-6"
            >
                <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search summary/location/source"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
                />

                <input
                    value={stateInput}
                    onChange={(event) => setStateInput(event.target.value)}
                    placeholder="State"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
                />

                <select
                    value={category}
                    onChange={(event) => {
                        setPage(1);
                        setCategory(event.target.value);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
                >
                    {categories.map((item) => (
                        <option key={item || "all-categories"} value={item}>
                            {item || "All categories"}
                        </option>
                    ))}
                </select>

                <select
                    value={severity}
                    onChange={(event) => {
                        setPage(1);
                        setSeverity(event.target.value);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
                >
                    {severities.map((item) => (
                        <option key={item || "all-severities"} value={item}>
                            {item || "All severities"}
                        </option>
                    ))}
                </select>

                <select
                    value={reviewStatus}
                    onChange={(event) => {
                        setPage(1);
                        setReviewStatus(event.target.value);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
                >
                    {reviewStatuses.map((item) => (
                        <option key={item || "all-statuses"} value={item}>
                            {item || "All statuses"}
                        </option>
                    ))}
                </select>

                <div className="lg:col-span-6 flex gap-3">
                    <button
                        type="submit"
                        className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold"
                    >
                        Apply Search
                    </button>

                    <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Clear
                    </button>
                </div>
            </form>

            {error && (
                <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="rounded-xl border border-slate-200 p-6 text-slate-600">
                    Loading incidents...
                </div>
            ) : incidents.length === 0 ? (
                <div className="rounded-xl border border-slate-200 p-6 text-slate-600">
                    No incidents found. Run ingestion or clear filters.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <TableHead>Category</TableHead>
                                <TableHead>Summary</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Duplicate</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Actions</TableHead>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 bg-white">
                            {incidents.map((incident) => (
                                <tr key={incident.id} className="align-top">
                                    <TableCell>
                                        <span className="font-semibold text-slate-900">
                                            {incident.category}
                                        </span>
                                    </TableCell>

                                    <TableCell>
                                        <p className="max-w-md text-slate-700 line-clamp-3">
                                            {incident.summary}
                                        </p>
                                    </TableCell>

                                    <TableCell>
                                        <div className="min-w-40">
                                            <p className="font-medium text-slate-900">
                                                {incident.location_text || "Unknown"}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {incident.state || "State unknown"}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Confidence: {incident.location_confidence}
                                            </p>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <SeverityBadge severity={incident.severity} />
                                    </TableCell>

                                    <TableCell>
                                        <StatusBadge status={incident.review_status} />
                                    </TableCell>

                                    <TableCell>
                                        {incident.is_possible_duplicate ? (
                                            <div>
                                                <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-1 text-xs font-semibold">
                                                    Possible
                                                </span>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Score: {incident.duplicate_score}
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-slate-500">No</span>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex flex-col gap-2 min-w-28">
                                            <Link
                                                href={`/incidents/${incident.id}`}
                                                className="mb-2 flex items-start justify-between rounded-lg border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                            >
                                                View/Edit
                                            </Link>
                                            <button
                                                onClick={() => handleAccept(incident.id)}
                                                disabled={actionLoadingId === incident.id}
                                                className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
                                            >
                                                Accept
                                            </button>

                                            <button
                                                onClick={() => handleReject(incident.id)}
                                                disabled={actionLoadingId === incident.id}
                                                className="rounded-lg bg-red-600 text-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {incident.source_article_url ? (
                                            <a
                                                href={incident.source_article_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-slate-900 underline underline-offset-2"
                                            >
                                                Open article
                                            </a>
                                        ) : (
                                            <span className="text-slate-500">No link</span>
                                        )}
                                    </TableCell>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex items-center justify-between mt-5">
                <button
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={!previous}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                >
                    Previous
                </button>

                <p className="text-sm text-slate-600">
                    Page <span className="font-semibold text-slate-900">{page}</span>
                </p>

                <button
                    onClick={() => setPage((current) => current + 1)}
                    disabled={!next}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                >
                    Next
                </button>
            </div>
        </section>
    );
}

function TableHead({ children }: { children: React.ReactNode }) {
    return (
        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {children}
        </th>
    );
}

function TableCell({ children }: { children: React.ReactNode }) {
    return <td className="px-4 py-4 text-slate-700">{children}</td>;
}

function SeverityBadge({ severity }: { severity: string }) {
    const className =
        severity === "Critical"
            ? "bg-red-100 text-red-800"
            : severity === "High"
                ? "bg-orange-100 text-orange-800"
                : severity === "Medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : severity === "Low"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700";

    return (
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>
            {severity}
        </span>
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
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>
            {status}
        </span>
    );
}