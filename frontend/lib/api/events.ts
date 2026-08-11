import { get, post } from "./client";
import { OrderEvent, AddInstructionPayload } from "@/types";

export async function sendEvent(
  runId: string,
  event: OrderEvent
): Promise<{
  run_id: string;
  order_id: string;
  event_id: string;
  event_type: string;
  status: string;
}> {
  return post(`/runs/${runId}/events`, event);
}

export async function addInstruction(
  runId: string,
  payload: AddInstructionPayload
): Promise<{
  run_id: string;
  instruction: string;
  added_by: string;
  status: string;
}> {
  return post(`/runs/${runId}/instructions`, payload);
}
