// TypeScript types for Order Supervisor POC frontend
// Matching backend Pydantic schemas exactly

export type RunStatus =
  | "STARTING"
  | "START_FAILED"
  | "ACTIVE"
  | "SLEEPING"
  | "PAUSED"
  | "INTERRUPTED"
  | "COMPLETING"
  | "COMPLETED"
  | "TERMINATED"
  | "START_FAILED";

export interface Supervisor {
  id: string;
  name: string;
  base_instruction: string;
  available_actions: string[];
  wake_policy: Record<string, unknown>;
  model_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SupervisorCreate {
  name: string;
  base_instruction: string;
  available_actions: string[];
  wake_policy?: Record<string, unknown>;
  model_config?: Record<string, unknown>;
}

export interface Run {
  id: string;
  order_id: string;
  supervisor_id: string;
  status: RunStatus;
  order_context: Record<string, unknown>;
  memory_summary: string;
  next_wake_at: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  final_summary: string | null;
  learnings: string[] | null;
  recommendations: string[] | null;
}

export interface RunCreate {
  order_id: string;
  supervisor_id: string;
  order_context: Record<string, unknown>;
}

export interface TimelineItem {
  timestamp: string;
  type: string;
  description: string;
  details: Record<string, unknown>;
}

export interface Activity {
  id: string;
  run_id: string;
  event_id: string | null;
  type: string;
  action: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Memory {
  run_id: string;
  order_id: string;
  compact_memory: string;
}

export interface OrderEvent {
  event_id: string;
  event_type: string;
  timestamp?: string;
  payload: Record<string, unknown>;
  source?: string;
}

export interface AddInstructionPayload {
  instruction: string;
  added_by?: string;
  timestamp?: string;
}

export interface AgentDecision {
  decision: "ACT" | "SLEEP" | "COMPLETE";
  reasoning: string;
  actions?: string[];
  sleep_seconds?: number;
}

export interface FinalSummary {
  summary: string;
  actions_taken: string[];
  key_learnings: string[];
  recommendations: string[];
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface DashboardStats {
  active: number;
  sleeping: number;
  completed: number;
  total: number;
}

export const EVENT_TYPES = [
  { value: "order_created", label: "Order Created" },
  { value: "payment_confirmed", label: "Payment Confirmed" },
  { value: "payment_failed", label: "Payment Failed" },
  { value: "shipment_created", label: "Shipment Created" },
  { value: "shipment_delayed", label: "Shipment Delayed" },
  { value: "delivered", label: "Delivered" },
  { value: "refund_requested", label: "Refund Requested" },
  { value: "customer_message_received", label: "Customer Message" },
  { value: "no_update_for_n_hours", label: "No Update" },
] as const;

export const AVAILABLE_ACTIONS = [
  "message_fulfillment_team",
  "message_payments_team",
  "message_logistics_team",
  "message_customer",
  "create_internal_note",
] as const;

export type AvailableAction = (typeof AVAILABLE_ACTIONS)[number];
