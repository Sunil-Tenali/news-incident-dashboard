"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login, saveToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await login(username, password);
      saveToken(response.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            News-to-Incident Mapping Dashboard
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">
            Reviewer Login
          </h1>
          <p className="text-slate-600 mt-2">
            Login to run ingestion and review detected incidents.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Username
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter Username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 text-white py-3 font-semibold disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}