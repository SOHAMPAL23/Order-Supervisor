"use client";

import { Run } from "@/types";
import { formatDatetime } from "@/lib/utils/format";
import {
  FileText,
  Zap,
  BookOpen,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";

interface FinalSummaryPanelProps {
  run: Run;
}

export default function FinalSummaryPanel({ run }: FinalSummaryPanelProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800 bg-emerald-500/5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">
            Workflow Complete
          </h3>
          {run.completed_at && (
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Completed {formatDatetime(run.completed_at)}
            </p>
          )}
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Final Summary */}
        {run.final_summary && (
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Final Summary
              </h4>
            </div>
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
              <p className="text-sm text-zinc-300 leading-relaxed">
                {run.final_summary}
              </p>
            </div>
          </div>
        )}

        {/* Actions taken */}
        {run.learnings && run.learnings.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Key Learnings
              </h4>
            </div>
            <ul className="space-y-1.5">
              {run.learnings.map((learning, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-zinc-300"
                >
                  <span className="w-4 h-4 rounded-full bg-amber-500/10 text-amber-400 text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 font-mono">
                    {i + 1}
                  </span>
                  {learning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {run.recommendations && run.recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-violet-400" />
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Recommendations
              </h4>
            </div>
            <ul className="space-y-1.5">
              {run.recommendations.map((rec, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-zinc-300"
                >
                  <span className="w-4 h-4 rounded-full bg-violet-500/10 text-violet-400 text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 font-mono">
                    {i + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
