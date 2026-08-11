import { Run, RunStatus, DashboardStats } from "@/types";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return "—";
  try {
    return format(parseISO(ts), "HH:mm:ss");
  } catch {
    return ts;
  }
}

export function formatDatetime(ts: string | null | undefined): string {
  if (!ts) return "—";
  try {
    return format(parseISO(ts), "MMM d, HH:mm:ss");
  } catch {
    return ts;
  }
}

export function formatRelative(ts: string | null | undefined): string {
  if (!ts) return "—";
  try {
    return formatDistanceToNow(parseISO(ts), { addSuffix: true });
  } catch {
    return ts;
  }
}

export function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function getTimeUntilWake(nextWakeAt: string | null): string {
  if (!nextWakeAt) return "—";
  try {
    const diff = new Date(nextWakeAt).getTime() - Date.now();
    if (diff <= 0) return "now";
    return formatSeconds(Math.floor(diff / 1000));
  } catch {
    return "—";
  }
}

export function computeDashboardStats(runs: Run[]): DashboardStats {
  return {
    active: runs.filter((r) =>
      ["ACTIVE", "STARTING", "COMPLETING"].includes(r.status)
    ).length,
    sleeping: runs.filter((r) => r.status === "SLEEPING").length,
    completed: runs.filter((r) =>
      ["COMPLETED", "TERMINATED"].includes(r.status)
    ).length,
    total: runs.length,
  };
}

export function isTerminalStatus(status: RunStatus): boolean {
  return ["COMPLETED", "TERMINATED", "START_FAILED"].includes(status);
}

export function isActiveStatus(status: RunStatus): boolean {
  return !isTerminalStatus(status);
}

export function getActivityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    event_injected: "Event Received",
    instruction_added: "Instruction Added",
    action: "Action Executed",
    decision: "Agent Decision",
    memory_update: "Memory Updated",
    state_change: "State Changed",
    sleep: "Workflow Sleeping",
    wake: "Workflow Woke Up",
    agent_start: "Agent Started",
    agent_complete: "Agent Completed",
    workflow_start: "Workflow Started",
    workflow_complete: "Workflow Completed",
  };
  return labels[type] || type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
