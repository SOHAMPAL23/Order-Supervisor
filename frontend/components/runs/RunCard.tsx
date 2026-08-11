"use client";

import { Run } from "@/types";
import { formatRelative, getTimeUntilWake } from "@/lib/utils/format";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { Clock, ArrowRight, Hash } from "lucide-react";

interface RunCardProps {
  run: Run;
}

export default function RunCard({ run }: RunCardProps) {
  return (
    <Link
      href={`/runs/${run.id}`}
      className="block bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="w-3 h-3 text-zinc-600 flex-shrink-0" />
            <span className="font-mono text-sm font-semibold text-zinc-100 truncate">
              {run.order_id}
            </span>
          </div>
          <div className="font-mono text-[10px] text-zinc-600 truncate">
            {run.id}
          </div>
        </div>
        <div className="flex-shrink-0">
          <Badge status={run.status} size="sm" />
        </div>
      </div>

      {/* Memory summary */}
      {run.memory_summary && (
        <p className="text-xs text-zinc-400 mb-3 line-clamp-2 leading-relaxed">
          {run.memory_summary}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {run.status === "SLEEPING" && run.next_wake_at && (
          <div className="flex items-center gap-1.5 text-indigo-400 col-span-2">
            <Clock className="w-3 h-3" />
            <span>Wakes in {getTimeUntilWake(run.next_wake_at)}</span>
          </div>
        )}
        <div>
          <span className="text-zinc-600">Updated</span>
          <span className="text-zinc-400 ml-1.5">
            {formatRelative(run.updated_at)}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end">
        <span className="text-[11px] text-zinc-600 group-hover:text-indigo-400 flex items-center gap-1 transition-colors">
          View run <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}
