"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Supervisor } from "@/types";
import { getSupervisor } from "@/lib/api/supervisors";
import TopBar from "@/components/layout/TopBar";
import { formatDatetime } from "@/lib/utils/format";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Bot, Zap, Play, AlertCircle, ArrowLeft } from "lucide-react";

export default function SupervisorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSupervisor(id)
      .then(setSupervisor)
      .catch(() => setError("Supervisor not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <TopBar />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-800 rounded w-1/3" />
            <div className="h-32 bg-zinc-800 rounded" />
          </div>
        </div>
      </>
    );
  }

  if (error || !supervisor) {
    return (
      <>
        <TopBar />
        <div className="flex-1 p-6">
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-400">{error || "Supervisor not found."}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <div className="flex-1 p-6 space-y-6 max-w-3xl">
        {/* Back */}
        <Link href="/supervisors">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Supervisors
          </Button>
        </Link>

        {/* Header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-100">
                  {supervisor.name}
                </h2>
                <div className="font-mono text-[11px] text-zinc-600 mt-0.5">
                  {supervisor.id}
                </div>
              </div>
            </div>
            <Link href={`/runs/new?supervisorId=${supervisor.id}`}>
              <Button
                variant="primary"
                size="sm"
                icon={<Play className="w-3.5 h-3.5" />}
                id="btn-start-run-from-supervisor"
              >
                Start Run
              </Button>
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-zinc-500">
            <div>
              <span className="text-zinc-600">Created</span>{" "}
              {formatDatetime(supervisor.created_at)}
            </div>
            <div>
              <span className="text-zinc-600">Updated</span>{" "}
              {formatDatetime(supervisor.updated_at)}
            </div>
          </div>
        </div>

        {/* Base instruction */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Base Instruction
          </h3>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {supervisor.base_instruction}
          </p>
        </div>

        {/* Available actions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Available Actions ({supervisor.available_actions.length})
          </h3>
          <div className="space-y-2">
            {supervisor.available_actions.map((action) => (
              <div
                key={action}
                className="flex items-center gap-2.5 px-3 py-2 bg-zinc-800/60 border border-zinc-700/50 rounded-lg"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="font-mono text-sm text-zinc-300">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Config */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Wake Policy
            </h3>
            <pre className="text-xs font-mono text-zinc-400">
              {JSON.stringify(supervisor.wake_policy, null, 2)}
            </pre>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Model Config
            </h3>
            <pre className="text-xs font-mono text-zinc-400">
              {JSON.stringify(supervisor.model_config, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}
