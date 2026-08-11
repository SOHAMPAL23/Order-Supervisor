"use client";

import { Run } from "@/types";
import { formatDatetime, getTimeUntilWake } from "@/lib/utils/format";
import Badge from "@/components/ui/Badge";
import { Clock, Hash, Calendar, Bot } from "lucide-react";

interface RunHeaderProps {
  run: Run;
  supervisorName?: string;
}

export default function RunHeader({ run, supervisorName }: RunHeaderProps) {
  const isSleeping = run.status === "SLEEPING";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left: ID + status */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-mono text-xl font-bold text-zinc-100">
              {run.order_id}
            </h2>
            <Badge status={run.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5 font-mono">
              <Hash className="w-3 h-3" />
              {run.id}
            </span>
            {supervisorName && (
              <span className="flex items-center gap-1.5">
                <Bot className="w-3 h-3" />
                {supervisorName}
              </span>
            )}
          </div>
        </div>

        {/* Right: timing */}
        <div className="flex flex-col items-end gap-1.5">
          {isSleeping && run.next_wake_at && (
            <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="text-xs text-indigo-300 font-medium">
                Wakes in {getTimeUntilWake(run.next_wake_at)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-zinc-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Started {formatDatetime(run.created_at)}
            </span>
            <span>Updated {formatDatetime(run.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Workflow state visualization */}
      <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
        <WorkflowStateBar status={run.status} />
        <WorkflowStateGuidance status={run.status} />
      </div>
    </div>
  );
}

function WorkflowStateGuidance({ status }: { status: string }) {
  const guidanceMap: Record<string, { bg: string; border: string; text: string; icon: string; title: string; desc: string }> = {
    SLEEPING: {
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      text: "text-indigo-300",
      icon: "💤",
      title: "Supervisor is Sleeping (Durable Wait State)",
      desc: "The AI agent evaluated the order and found no immediate issues. It is sleeping durably in Temporal to save resources until an incoming event (e.g., PAYMENT_FAILED, SHIPMENT_DELAYED, or DELIVERED) or a timer wakes it up. Use the Events tab on the right to simulate events!"
    },
    ACTIVE: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-300",
      icon: "⚡",
      title: "Supervisor is Active",
      desc: "The AI agent is actively processing incoming events, executing LLM decisions, updating compact memory, or invoking activities."
    },
    STARTING: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      text: "text-blue-300",
      icon: "🚀",
      title: "Workflow Initializing",
      desc: "Connecting to Temporal and kicking off initial AI agent order analysis."
    },
    COMPLETING: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      text: "text-purple-300",
      icon: "🏁",
      title: "Workflow Completing",
      desc: "Terminal event received. The AI supervisor is compiling final summary report, learnings, and recommendations."
    },
    COMPLETED: {
      bg: "bg-zinc-800/60",
      border: "border-zinc-700/50",
      text: "text-zinc-300",
      icon: "✅",
      title: "Workflow Completed",
      desc: "Order supervision lifecycle finished successfully. All memory logs and final recommendations are archived below."
    },
    PAUSED: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      text: "text-amber-300",
      icon: "⏸️",
      title: "Workflow Paused",
      desc: "Supervision suspended by human operator. Use the Controls panel to resume execution when ready."
    },
    INTERRUPTED: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-300",
      icon: "⛔",
      title: "Workflow Interrupted",
      desc: "Workflow execution manually interrupted. Click Resume under Controls to re-enable."
    },
    TERMINATED: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-300",
      icon: "⏹️",
      title: "Workflow Terminated",
      desc: "Workflow manually terminated by operator."
    },
    START_FAILED: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-300",
      icon: "⚠️",
      title: "Start Failed",
      desc: "Workflow initialization failed. Check backend/Temporal service connectivity."
    }
  };

  const current = guidanceMap[status] || {
    bg: "bg-zinc-800",
    border: "border-zinc-700",
    text: "text-zinc-400",
    icon: "ℹ️",
    title: `Status: ${status}`,
    desc: "Workflow is executing standard operations."
  };

  return (
    <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${current.bg} ${current.border}`}>
      <span className="text-sm mt-0.5">{current.icon}</span>
      <div className="min-w-0">
        <div className={`text-xs font-semibold ${current.text}`}>
          {current.title}
        </div>
        <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
          {current.desc}
        </div>
      </div>
    </div>
  );
}

function WorkflowStateBar({ status }: { status: string }) {
  const steps = [
    { key: "STARTING", label: "Starting" },
    { key: "ACTIVE", label: "Agent Running" },
    { key: "SLEEPING", label: "Sleeping" },
    { key: "COMPLETING", label: "Completing" },
    { key: "COMPLETED", label: "Completed" },
  ];

  const terminalSteps = ["TERMINATED", "INTERRUPTED", "PAUSED", "START_FAILED"];

  if (terminalSteps.includes(status)) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="font-mono text-orange-400">{status}</span>
        <span>— workflow is in a terminal or halted state</span>
      </div>
    );
  }

  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isPast = index < currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all
                ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : isPast
                    ? "text-zinc-500"
                    : "text-zinc-700"
                }
              `}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive
                    ? "bg-indigo-400 animate-pulse"
                    : isPast
                    ? "bg-zinc-600"
                    : "bg-zinc-800"
                }`}
              />
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <span className="text-zinc-800 mx-0.5">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
