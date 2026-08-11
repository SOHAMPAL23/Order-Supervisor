"use client";

import { TimelineItem } from "@/types";
import { formatTimestamp, getActivityTypeLabel } from "@/lib/utils/format";
import EmptyState from "@/components/ui/EmptyState";
import { Activity, Zap, Brain, RotateCcw, MessageSquare, CheckCircle2, AlertCircle, Moon, Play } from "lucide-react";

interface TimelineProps {
  items: TimelineItem[];
}

function getIcon(type: string) {
  const iconMap: Record<string, React.ReactNode> = {
    event_injected: <Zap className="w-3.5 h-3.5" />,
    instruction_added: <MessageSquare className="w-3.5 h-3.5" />,
    action: <CheckCircle2 className="w-3.5 h-3.5" />,
    decision: <Brain className="w-3.5 h-3.5" />,
    memory_update: <RotateCcw className="w-3.5 h-3.5" />,
    sleep: <Moon className="w-3.5 h-3.5" />,
    wake: <Play className="w-3.5 h-3.5" />,
    workflow_start: <Play className="w-3.5 h-3.5" />,
    workflow_complete: <CheckCircle2 className="w-3.5 h-3.5" />,
    error: <AlertCircle className="w-3.5 h-3.5" />,
  };
  return iconMap[type] || <Activity className="w-3.5 h-3.5" />;
}

function getTypeColors(type: string): string {
  const colorMap: Record<string, string> = {
    event_injected: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    instruction_added: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    action: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    decision: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    memory_update: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    sleep: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    wake: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    workflow_start: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    workflow_complete: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return colorMap[type] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}

function PayloadDisplay({ payload }: { payload: Record<string, unknown> }) {
  if (!payload || Object.keys(payload).length === 0) return null;

  return (
    <pre className="mt-2 p-2 bg-zinc-950 border border-zinc-800 rounded text-[10px] font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap break-words">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

export default function Timeline({ items }: TimelineProps) {
  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="w-5 h-5" />}
        title="No activity yet"
        description="Events and agent actions will appear here as they happen."
      />
    );
  }

  const sorted = [...items].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="space-y-0">
      {sorted.map((item, index) => (
        <div key={index} className="flex gap-3 group">
          {/* Timeline line + icon */}
          <div className="flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 ${getTypeColors(item.type)}`}
            >
              {getIcon(item.type)}
            </div>
            {index < sorted.length - 1 && (
              <div className="w-px flex-1 bg-zinc-800 mt-1 mb-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-mono text-[11px] text-zinc-600">
                {formatTimestamp(item.timestamp)}
              </span>
              <span className="text-[11px] font-medium text-zinc-400">
                {getActivityTypeLabel(item.type)}
              </span>
            </div>
            <p className="text-sm text-zinc-300">{item.description}</p>
            {item.details && Object.keys(item.details).length > 0 && (
              <details className="mt-1">
                <summary className="text-[11px] text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors">
                  View payload
                </summary>
                <PayloadDisplay payload={item.details} />
              </details>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
