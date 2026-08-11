"use client";

import { useEffect, useState, useCallback } from "react";
import { Run } from "@/types";
import { getRuns } from "@/lib/api/runs";
import { computeDashboardStats } from "@/lib/utils/format";
import TopBar from "@/components/layout/TopBar";
import RunCard from "@/components/runs/RunCard";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Link from "next/link";
import {
  Activity,
  Moon,
  CheckCircle2,
  Layers,
  Plus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className={`mb-3 w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-zinc-100 tabular-nums">{value}</div>
      <div className="text-sm text-zinc-500 mt-0.5">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getRuns();
      setRuns(data);
    } catch {
      setError("Unable to load runs. Make sure the backend is running at " + (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();

    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (document.hidden) return;
      if (!intervalId) {
        intervalId = setInterval(() => {
          if (!document.hidden) loadRuns(true);
        }, 5000);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        loadRuns(true);
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadRuns]);

  const stats = computeDashboardStats(runs);
  const activeRuns = runs
    .filter((r) => !["COMPLETED", "TERMINATED"].includes(r.status))
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

  return (
    <>
      <TopBar onRefresh={() => loadRuns(true)} isRefreshing={refreshing} />
      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Activity className="w-4 h-4 text-emerald-400" />}
            label="Active Runs"
            value={stats.active}
            color="bg-emerald-500/10"
          />
          <StatCard
            icon={<Moon className="w-4 h-4 text-indigo-400" />}
            label="Sleeping Runs"
            value={stats.sleeping}
            color="bg-indigo-500/10"
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4 text-zinc-400" />}
            label="Completed"
            value={stats.completed}
            color="bg-zinc-500/10"
          />
          <StatCard
            icon={<Layers className="w-4 h-4 text-blue-400" />}
            label="Total Runs"
            value={stats.total}
            color="bg-blue-500/10"
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-red-300">
                Backend Unavailable
              </div>
              <div className="text-xs text-red-400/80 mt-0.5">{error}</div>
            </div>
          </div>
        )}

        {/* Active runs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-300">
              Active Runs
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadRuns(true)}
                disabled={refreshing}
                className="p-1.5 rounded text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
              <Link href="/runs/new">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  id="btn-start-run"
                >
                  Start Run
                </Button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse"
                >
                  <div className="h-4 bg-zinc-800 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-zinc-800 rounded w-3/4 mb-4" />
                  <div className="h-3 bg-zinc-800 rounded w-full mb-1" />
                  <div className="h-3 bg-zinc-800 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : activeRuns.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
              <EmptyState
                icon={<Activity className="w-5 h-5" />}
                title="No active runs"
                description="Start an order to begin supervising it."
                action={
                  <Link href="/runs/new">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Start First Run
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeRuns.map((run) => (
                <RunCard key={run.id} run={run} />
              ))}
            </div>
          )}
        </div>

        {/* Workflow flow explanation */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            How It Works
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: "EVENT", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
              { label: "↓", color: "text-zinc-600" },
              { label: "WAKE POLICY", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
              { label: "↓", color: "text-zinc-600" },
              { label: "AGENT", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
              { label: "↓", color: "text-zinc-600" },
              { label: "ACTION", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
              { label: "↓", color: "text-zinc-600" },
              { label: "MEMORY", color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
              { label: "↓", color: "text-zinc-600" },
              { label: "SLEEP", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
              { label: "↓", color: "text-zinc-600" },
              { label: "NEXT EVENT", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
            ].map((item, i) =>
              item.label === "↓" ? (
                <span key={i} className="text-zinc-600 text-sm">
                  {item.label}
                </span>
              ) : (
                <span
                  key={i}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-semibold ${item.color}`}
                >
                  {item.label}
                </span>
              )
            )}
          </div>
          <p className="text-xs text-zinc-600 mt-3">
            The Temporal workflow runs durably in the background. This console observes and controls the workflow — it never simulates state.
          </p>
        </div>
      </div>
    </>
  );
}
