import { get, post } from "./client";
import {
  Run,
  RunCreate,
  TimelineItem,
  Activity,
  Memory,
} from "@/types";

export async function getRuns(): Promise<Run[]> {
  return get<Run[]>("/runs");
}

export async function getRun(id: string): Promise<Run> {
  return get<Run>(`/runs/${id}`);
}

export async function createRun(data: RunCreate): Promise<Run> {
  return post<Run>("/runs", data);
}

export async function getRunTimeline(runId: string): Promise<TimelineItem[]> {
  return get<TimelineItem[]>(`/runs/${runId}/timeline`);
}

export async function getRunActivities(runId: string): Promise<Activity[]> {
  return get<Activity[]>(`/runs/${runId}/activities`);
}

export async function getRunMemory(runId: string): Promise<Memory> {
  return get<Memory>(`/runs/${runId}/memory`);
}

export async function pauseRun(
  id: string
): Promise<{ run_id: string; status: string }> {
  return post(`/runs/${id}/pause`);
}

export async function resumeRun(
  id: string
): Promise<{ run_id: string; status: string }> {
  return post(`/runs/${id}/resume`);
}

export async function interruptRun(
  id: string,
  reason?: string
): Promise<{ run_id: string; status: string; reason: string }> {
  const params = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  return post(`/runs/${id}/interrupt${params}`);
}

export async function terminateRun(
  id: string,
  reason?: string
): Promise<{ run_id: string; status: string; reason: string }> {
  const params = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  return post(`/runs/${id}/terminate${params}`);
}
