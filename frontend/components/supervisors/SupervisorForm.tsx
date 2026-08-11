"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SupervisorCreate, AVAILABLE_ACTIONS } from "@/types";
import { createSupervisor } from "@/lib/api/supervisors";
import { APIError } from "@/lib/api/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ActionSelector from "./ActionSelector";
import { Save } from "lucide-react";

const DEFAULT_INSTRUCTION = `You are an AI order supervisor. Your job is to monitor order lifecycle events and take appropriate actions.

Guidelines:
- Immediately notify the customer if there is a payment failure or significant delay
- Alert the logistics team if shipment tracking shows anomalies
- Create internal notes for all significant events
- Escalate to fulfillment team if an order has been pending for more than 24 hours
- When an order is delivered, verify the delivery and close the supervision cycle`;

export default function SupervisorForm() {
  const router = useRouter();
  const [form, setForm] = useState<SupervisorCreate>({
    name: "",
    base_instruction: DEFAULT_INSTRUCTION,
    available_actions: [...AVAILABLE_ACTIONS],
    wake_policy: { type: "rule_based" },
    model_config: { model: "gpt-4o", temperature: 0.2 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Supervisor name is required.");
      return;
    }
    if (!form.base_instruction.trim()) {
      setError("Base instruction is required.");
      return;
    }
    if (form.available_actions.length === 0) {
      setError("Select at least one available action.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supervisor = await createSupervisor(form);
      router.push(`/supervisors/${supervisor.id}`);
    } catch (e) {
      setError(
        e instanceof APIError
          ? e.message
          : "Failed to create supervisor. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Name */}
      <Input
        label="Supervisor Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="E-Commerce Order Supervisor v1"
        required
        id="supervisor-name"
      />

      {/* Base instruction */}
      <Textarea
        label="Base Instruction"
        value={form.base_instruction}
        onChange={(e) => setForm({ ...form, base_instruction: e.target.value })}
        rows={8}
        hint="System prompt that guides the AI supervisor's decision-making"
        id="base-instruction"
      />

      {/* Available actions */}
      <div>
        <div className="text-sm font-medium text-zinc-300 mb-2">
          Available Actions
        </div>
        <ActionSelector
          selected={form.available_actions}
          onChange={(actions) =>
            setForm({ ...form, available_actions: actions })
          }
        />
      </div>

      {/* Wake behavior */}
      <div>
        <div className="text-sm font-medium text-zinc-300 mb-1.5">
          Wake-up Behavior
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "rule_based", label: "Rule-based" },
            { value: "always_wake", label: "Always Wake" },
            { value: "priority_only", label: "Priority Only" },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  wake_policy: { type: value },
                })
              }
              className={`
                px-3 py-2 rounded-lg text-sm border text-center transition-all
                ${
                  (form.wake_policy as Record<string, unknown>)?.type === value
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                    : "bg-zinc-800/40 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-600 mt-2">
          Rule-based: wake on HIGH priority and TERMINAL events. Always-wake: wake on every event.
        </p>
      </div>

      {/* Model config */}
      <div>
        <div className="text-sm font-medium text-zinc-300 mb-2">Model</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500">Model Name</label>
            <select
              value={(form.model_config as Record<string, unknown>)?.model as string || "gpt-4o"}
              onChange={(e) =>
                setForm({
                  ...form,
                  model_config: {
                    ...(form.model_config as Record<string, unknown>),
                    model: e.target.value,
                  },
                })
              }
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              id="model-select"
            >
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4-turbo">gpt-4-turbo</option>
              <option value="mock">mock (no API key needed)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500">Temperature</label>
            <input
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={(form.model_config as Record<string, unknown>)?.temperature as number || 0.2}
              onChange={(e) =>
                setForm({
                  ...form,
                  model_config: {
                    ...(form.model_config as Record<string, unknown>),
                    temperature: parseFloat(e.target.value),
                  },
                })
              }
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              id="temperature-input"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          icon={<Save className="w-4 h-4" />}
          id="btn-create-supervisor"
        >
          Create Supervisor
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
