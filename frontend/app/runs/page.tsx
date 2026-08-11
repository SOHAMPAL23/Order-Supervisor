"use client";

import { useEffect, useState, useCallback } from "react";
import { Run } from "@/types";
import { getRuns } from "@/lib/api/runs";
import TopBar from "@/components/layout/TopBar";
import RunCard from "@/components/runs/RunCard";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Play, Plus, Search, AlertCircle } from "lucide-react";

const STATUS_FILTERS = [
  { value: "all", label: "All Active" },
  { value: "ACTIVE", label: "Active" },
  { value: "SLEEPING", label: "Sleeping" },
  { value: "PAUSED", label: "Paused" },
  { value: "STARTING", label: "Starting" },
  { value: "INTERRUPTED", label: "Interrupted" },
];

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getRuns();
      setRuns(data);
    } catch {
      setError("Unable to load runs. Make sure the backend is running.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 5000);
    return () => clearInterval(interval);
  }, [load]);

  const activeRuns = runs.filter(
    (r) => !["COMPLETED", "TERMINATED"].includes(r.status)
  );

  const filtered = activeRuns.filter((run) => {
    const matchesSearch =
      !search ||
      run.order_id.toLowerCase().includes(search.toLowerCase()) ||
      run.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <TopBar onRefresh={() => load(true)} isRefreshing={refreshing} />
      <div className="flex-1 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Active Runs</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {activeRuns.length} run{activeRuns.length !== 1 ? "s" : ""} in progress
            </p>
          </div>
          <Link href="/runs/new">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              id="btn-start-new-run"
            >
              Start Run
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              type="text"
              placeholder="Search by order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              id="search-runs"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all border ${
                  statusFilter === value
                    ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-300"
                    : "bg-zinc-800/60 border-zinc-700/50 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse h-40"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <EmptyState
              icon={<Play className="w-5 h-5" />}
              title={
                activeRuns.length === 0
                  ? "No active runs"
                  : "No runs match your search"
              }
              description={
                activeRuns.length === 0
                  ? "Start an order to begin supervising it."
                  : "Try adjusting your search or filters."
              }
              action={
                activeRuns.length === 0 ? (
                  <Link href="/runs/new">
                    <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                      Start Run
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((run) => (
              <RunCard key={run.id} run={run} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
