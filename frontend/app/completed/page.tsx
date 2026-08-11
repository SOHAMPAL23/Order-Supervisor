"use client";

import { useEffect, useState, useCallback } from "react";
import { Run } from "@/types";
import { getRuns } from "@/lib/api/runs";
import { formatDatetime } from "@/lib/utils/format";
import TopBar from "@/components/layout/TopBar";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import FinalSummaryPanel from "@/components/runs/FinalSummaryPanel";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

function CompletedRunRow({ run }: { run: Run }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <Badge status={run.status} size="sm" />
          <div>
            <div className="font-mono text-sm font-semibold text-zinc-200">
              {run.order_id}
            </div>
            <div className="font-mono text-[10px] text-zinc-600 mt-0.5">
              {run.id}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-zinc-400">
              {run.completed_at
                ? formatDatetime(run.completed_at)
                : formatDatetime(run.updated_at)}
            </div>
            <div className="text-[11px] text-zinc-600">
              {run.status === "COMPLETED" ? "Completed" : "Terminated"}
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-600" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 p-4 bg-zinc-950/30">
          {run.final_summary ? (
            <FinalSummaryPanel run={run} />
          ) : (
            <div className="text-sm text-zinc-500 text-center py-4">
              No final summary available for this run.
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Link
              href={`/runs/${run.id}`}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View full run detail →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompletedRunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getRuns();
      setRuns(
        data
          .filter((r) => ["COMPLETED", "TERMINATED"].includes(r.status))
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
          )
      );
    } catch {
      setError("Unable to load completed runs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <TopBar onRefresh={() => load(true)} isRefreshing={refreshing} />
      <div className="flex-1 p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">
            Completed Runs
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {runs.length} run{runs.length !== 1 ? "s" : ""} have ended
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <EmptyState
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="No completed runs yet"
              description="Completed or terminated runs will appear here."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <CompletedRunRow key={run.id} run={run} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
