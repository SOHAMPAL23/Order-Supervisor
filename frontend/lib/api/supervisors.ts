import { get, post } from "./client";
import { Supervisor, SupervisorCreate } from "@/types";

export async function getSupervisors(): Promise<Supervisor[]> {
  return get<Supervisor[]>("/supervisors");
}

export async function getSupervisor(id: string): Promise<Supervisor> {
  return get<Supervisor>(`/supervisors/${id}`);
}

export async function createSupervisor(
  data: SupervisorCreate
): Promise<Supervisor> {
  return post<Supervisor>("/supervisors", data);
}
