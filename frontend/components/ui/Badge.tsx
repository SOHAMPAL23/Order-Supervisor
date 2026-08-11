"use client";

import { RunStatus } from "@/types";

interface BadgeProps {
  status: RunStatus | string;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  string,
  { label: string; classes: string; dot: string }
> = {
  STARTING: {
    label: "STARTING",
    classes: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400 animate-pulse",
  },
  START_FAILED: {
    label: "START_FAILED",
    classes: "bg-red-500/15 text-red-400 border-red-500/30",
    dot: "bg-red-400",
  },
  ACTIVE: {
    label: "ACTIVE",
    classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400 animate-pulse",
  },
  SLEEPING: {
    label: "SLEEPING",
    classes: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    dot: "bg-indigo-400",
  },
  PAUSED: {
    label: "PAUSED",
    classes: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    dot: "bg-amber-400",
  },
  INTERRUPTED: {
    label: "INTERRUPTED",
    classes: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    dot: "bg-orange-400",
  },
  COMPLETING: {
    label: "COMPLETING",
    classes: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    dot: "bg-teal-400 animate-pulse",
  },
  COMPLETED: {
    label: "COMPLETED",
    classes: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    dot: "bg-zinc-400",
  },
  TERMINATED: {
    label: "TERMINATED",
    classes: "bg-red-500/15 text-red-400 border-red-500/30",
    dot: "bg-red-400",
  },
};

export default function Badge({ status, size = "md" }: BadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    classes: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    dot: "bg-zinc-400",
  };

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] gap-1"
      : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold tracking-wider border rounded-full ${sizeClasses} ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  );
}
