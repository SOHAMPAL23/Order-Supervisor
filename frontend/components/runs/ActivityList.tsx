"use client";

import { useState } from "react";
import { Activity } from "@/types";
import { formatTimestamp } from "@/lib/utils/format";
import EmptyState from "@/components/ui/EmptyState";
import { Activity as ActivityIcon, ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react";

interface ActivityListProps {
  activities: Activity[];
}

function ActivityItem({ activity }: { activity: Activity }) {
  const [expanded, setExpanded] = useState(false);
  const isAction = activity.type === "action";
  const isError = activity.type === "error";

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              isError
                ? "bg-red-500/10 text-red-400"
                : "bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {isError ? (
              <XCircle className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-mono text-sm text-zinc-200 truncate">
              {activity.action || activity.type}
            </div>
            <div className="text-[11px] text-zinc-600">
              {formatTimestamp(activity.created_at)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              isError
                ? "text-red-400 border-red-500/20 bg-red-500/10"
                : "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
            }`}
          >
            {isError ? "ERROR" : "SUCCESS"}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-600" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 p-3 bg-zinc-950/50">
          <div className="text-[11px] text-zinc-500 mb-1.5">Payload</div>
          <pre className="text-[11px] font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(activity.payload, null, 2)}
          </pre>
          {activity.event_id && (
            <div className="mt-2 pt-2 border-t border-zinc-800">
              <span className="text-[11px] text-zinc-600 font-mono">
                Event ID: {activity.event_id}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActivityList({ activities }: ActivityListProps) {
  if (!activities || activities.length === 0) {
    return (
      <EmptyState
        icon={<ActivityIcon className="w-5 h-5" />}
        title="No activity yet"
        description="Agent actions will appear here."
      />
    );
  }

  const sorted = [...activities].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-2">
      {sorted.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
