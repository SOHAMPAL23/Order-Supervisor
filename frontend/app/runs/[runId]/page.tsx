"use client";

import { useEffect, useState, useCallback, use } from "react";
import { Run, TimelineItem, Activity, Memory, Supervisor } from "@/types";
import { getRun, getRunTimeline, getRunActivities, getRunMemory } from "@/lib/api/runs";
import { getSupervisor } from "@/lib/api/supervisors";
import { isTerminalStatus } from "@/lib/utils/format";
import TopBar from "@/components/layout/TopBar";
import RunHeader from "@/components/runs/RunHeader";
import Timeline from "@/components/runs/Timeline";
import ActivityList from "@/components/runs/ActivityList";
import MemoryPanel from "@/components/runs/MemoryPanel";
import RunControls from "@/components/runs/RunControls";
import EventSimulator from "@/components/runs/EventSimulator";
import InstructionPanel from "@/components/runs/InstructionPanel";
import FinalSummaryPanel from "@/components/runs/FinalSummaryPanel";
import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Activity as ActivityIcon,
  Brain,
  Settings,
  Zap,
  MessageSquare,
} from "lucide-react";

type Tab = "timeline" | "activity" | "memory";
type RightTab = "controls" | "events" | "instructions";

export default function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = use(params);

  const [run, setRun] = useState<Run | null>(null);
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<Tab>("timeline");
  const [rightTab, setRightTab] = useState<RightTab>("controls");

  const loadAll = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      setError(null);

      try {
        const [runData, timelineData, activitiesData, memoryData] =
          await Promise.all([
            getRun(runId),
            getRunTimeline(runId).catch(() => []),
            getRunActivities(runId).catch(() => []),
            getRunMemory(runId).catch(() => null),
          ]);

        setRun(runData);
        setTimeline(timelineData);
        setActivities(activitiesData);
        setMemory(memoryData);

        if (!supervisor && runData.supervisor_id) {
          getSupervisor(runData.supervisor_id)
            .then(setSupervisor)
            .catch(() => {});
        }
      } catch {
        setError("Unable to load run. It may not exist or the backend is unavailable.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [runId, supervisor]
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Adaptive & Visibility-Aware Polling (Optimized for performance)
  useEffect(() => {
    if (!run || isTerminalStatus(run.status)) return;

    // Determine poll interval based on workflow state
    const pollIntervalMs =
      run.status === "ACTIVE" || run.status === "STARTING" || run.status === "COMPLETING"
        ? 2000
        : 5000;

    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (document.hidden) return;
      if (!intervalId) {
        intervalId = setInterval(() => {
          if (!document.hidden) loadAll(true);
        }, pollIntervalMs);
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
        loadAll(true);
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [run, loadAll]);

  if (loading) {
    return (
      <>
        <TopBar />
        <div className="flex-1 p-6 space-y-4 animate-pulse">
          <div className="h-28 bg-zinc-900 border border-zinc-800 rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 h-96 bg-zinc-900 border border-zinc-800 rounded-xl" />
            <div className="h-96 bg-zinc-900 border border-zinc-800 rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  if (error || !run) {
    return (
      <>
        <TopBar />
        <div className="flex-1 p-6">
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">
              {error || "Run not found."}
            </p>
          </div>
        </div>
      </>
    );
  }

  const isTerminal = isTerminalStatus(run.status);

  return (
    <>
      <TopBar onRefresh={() => loadAll(true)} isRefreshing={refreshing} />
      <div className="flex-1 p-4 space-y-4">
        {/* Back */}
        <Link href="/runs">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Ongoing Runs
          </Button>
        </Link>

        {/* Run header */}
        <RunHeader run={run} supervisorName={supervisor?.name} />

        {/* Final summary (if completed) */}
        {isTerminal && run.final_summary && (
          <FinalSummaryPanel run={run} />
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Timeline / Activity / Memory */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              {(
                [
                  { key: "timeline", label: "Timeline", icon: Clock },
                  { key: "activity", label: "Activity Log", icon: ActivityIcon },
                  { key: "memory", label: "Memory", icon: Brain },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setLeftTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                    leftTab === key
                      ? "border-indigo-500 text-indigo-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {key === "timeline" && timeline.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-zinc-800 rounded-full text-zinc-400 text-[10px]">
                      {timeline.length}
                    </span>
                  )}
                  {key === "activity" && activities.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-zinc-800 rounded-full text-zinc-400 text-[10px]">
                      {activities.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-y-auto max-h-[600px]">
              {leftTab === "timeline" && <Timeline items={timeline} />}
              {leftTab === "activity" && (
                <ActivityList activities={activities} />
              )}
              {leftTab === "memory" && (
                <MemoryPanel
                  memory={memory}
                  orderContext={run.order_context}
                />
              )}
            </div>
          </div>

          {/* Right: Controls / Event Simulator / Instructions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              {(
                [
                  { key: "controls", label: "Controls", icon: Settings },
                  { key: "events", label: "Events", icon: Zap },
                  { key: "instructions", label: "Instructions", icon: MessageSquare },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setRightTab(key)}
                  className={`flex items-center gap-1 px-3 py-3 text-xs font-medium border-b-2 transition-colors flex-1 justify-center ${
                    rightTab === key
                      ? "border-indigo-500 text-indigo-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            <div className="p-4 overflow-y-auto max-h-[600px]">
              {rightTab === "controls" && (
                <RunControls run={run} onUpdate={() => loadAll(true)} />
              )}
              {rightTab === "events" && (
                isTerminal ? (
                  <p className="text-xs text-zinc-600 text-center py-4">
                    Cannot inject events into a terminal workflow.
                  </p>
                ) : (
                  <EventSimulator
                    runId={run.id}
                    onEventSent={() => loadAll(true)}
                  />
                )
              )}
              {rightTab === "instructions" && (
                <InstructionPanel
                  runId={run.id}
                  onInstructionAdded={() => loadAll(true)}
                  disabled={isTerminal}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
