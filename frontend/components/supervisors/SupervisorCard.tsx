"use client";

import Link from "next/link";
import { Supervisor } from "@/types";
import { formatRelative } from "@/lib/utils/format";
import { Bot, ArrowRight, Zap } from "lucide-react";

interface SupervisorCardProps {
  supervisor: Supervisor;
}

export default function SupervisorCard({ supervisor }: SupervisorCardProps) {
  return (
    <Link
      href={`/supervisors/${supervisor.id}`}
      className="block bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-100">
              {supervisor.name}
            </div>
            <div className="text-[10px] font-mono text-zinc-600">
              {supervisor.id}
            </div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-1" />
      </div>

      {/* Instruction preview */}
      <p className="text-xs text-zinc-500 mb-3 line-clamp-2 leading-relaxed">
        {supervisor.base_instruction}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap gap-1 mb-3">
        {supervisor.available_actions.slice(0, 3).map((action) => (
          <span
            key={action}
            className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 border border-zinc-700/50 rounded text-[10px] font-mono text-zinc-400"
          >
            <Zap className="w-2.5 h-2.5 text-amber-500" />
            {action}
          </span>
        ))}
        {supervisor.available_actions.length > 3 && (
          <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700/50 rounded text-[10px] text-zinc-600">
            +{supervisor.available_actions.length - 3} more
          </span>
        )}
      </div>

      <div className="text-[11px] text-zinc-600">
        Created {formatRelative(supervisor.created_at)}
      </div>
    </Link>
  );
}
