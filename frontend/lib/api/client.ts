import { APIResponse } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}/api${path}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  let body: APIResponse<T>;

  try {
    body = await res.json();
  } catch {
    throw new APIError(
      "PARSE_ERROR",
      "Unable to parse server response. The backend may be unavailable.",
      res.status
    );
  }

  if (!res.ok || !body.success) {
    throw new APIError(
      body.error?.code || "HTTP_ERROR",
      body.error?.message || `Request failed with status ${res.status}`,
      res.status
    );
  }

  return body.data as T;
}

export async function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export async function post<T>(path: string, data?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
