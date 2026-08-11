"use client";

import { Memory } from "@/types";
import { Brain, Database } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface MemoryPanelProps {
  memory: Memory | null;
  orderContext?: Record<string, unknown>;
}

export default function MemoryPanel({ memory, orderContext }: MemoryPanelProps) {
  const hasMemory = memory?.compact_memory && memory.compact_memory.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Compact memory */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Compact Memory
          </h4>
        </div>
        {hasMemory ? (
          <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3">
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {memory!.compact_memory}
            </p>
          </div>
        ) : (
          <EmptyState
            title="No memory yet"
            description="Memory will appear as the agent processes events."
          />
        )}
      </div>

      {/* Order context */}
      {orderContext && Object.keys(orderContext).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Order Context
            </h4>
          </div>
          <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3">
            <pre className="text-[11px] font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(orderContext, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
