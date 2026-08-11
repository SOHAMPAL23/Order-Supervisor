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

  const isFirstTimeUser = runs.length === 0 && !loading;

  return (
    <>
      <TopBar onRefresh={() => loadRuns(true)} isRefreshing={refreshing} />
      <div className="flex-1 p-6 space-y-6">
        
        {isFirstTimeUser && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2" />
            <h2 className="text-xl font-bold text-indigo-300 mb-2">Welcome to Order Supervisor 👋</h2>
            <p className="text-indigo-200/80 max-w-2xl text-sm leading-relaxed mb-4">
              This is a durable AI Operations platform. To get started, you can spawn a new <b>AI Agent</b> to supervise an order. 
              The agent will durably monitor the order, wait for events, and take intelligent actions.
            </p>
            <Link href="/runs/new">
              <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                Spawn Your First Agent
              </Button>
            </Link>
          </div>
        )}
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Activity className="w-4 h-4 text-emerald-400" />}
            label="Ongoing Runs"
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
              Ongoing Runs
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
                title="No ongoing runs"
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
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
          <h3 className="text-sm font-bold text-zinc-300 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            How the Durable AI Supervisor Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs font-semibold text-amber-400 mb-1">1. Event Occurs</div>
              <p className="text-xs text-zinc-500">A webhook triggers an event like Payment Failed or Shipment Delayed.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs font-semibold text-blue-400 mb-1">2. Agent Wakes Up</div>
              <p className="text-xs text-zinc-500">The Temporal workflow durably wakes up without losing state.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs font-semibold text-violet-400 mb-1">3. AI Evaluation</div>
              <p className="text-xs text-zinc-500">GPT-4o analyzes the event and context to determine the best action.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs font-semibold text-emerald-400 mb-1">4. Action Taken</div>
              <p className="text-xs text-zinc-500">The agent executes the decision (e.g. emails customer, logs memory).</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs font-semibold text-indigo-400 mb-1">5. Sleep Durably</div>
              <p className="text-xs text-zinc-500">The agent goes back to sleep, consuming 0 CPU, awaiting the next event.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
