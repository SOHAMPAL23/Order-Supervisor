"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Supervisor, RunCreate } from "@/types";
import { getSupervisors } from "@/lib/api/supervisors";
import { createRun } from "@/lib/api/runs";
import { APIError } from "@/lib/api/client";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Link from "next/link";
import { Play, ArrowLeft, AlertCircle, Bot } from "lucide-react";

const DEMO_PRESETS = [
  {
    id: "standard",
    title: "🛍️ Standard Express Order",
    desc: "MacBook Pro order progressing normally",
    orderIdPrefix: "ORDER-EXPRESS",
    context: JSON.stringify(
      {
        customer_name: "Alex Johnson",
        customer_id: "CUST-99",
        items: [
          { sku: "LAPTOP-01", name: "MacBook Pro 16", qty: 1, price: 2499.99 }
        ],
        payment_status: "confirmed",
        shipping_status: "processing",
        shipping_address: "123 Market St, San Francisco, CA 94105"
      },
      null,
      2
    )
  },
  {
    id: "payment_issue",
    title: "💳 Payment Issue Scenario",
    desc: "Order with pending payment to test PAYMENT_FAILED event",
    orderIdPrefix: "ORDER-PAYMENT",
    context: JSON.stringify(
      {
        customer_name: "Jordan Lee",
        customer_id: "CUST-104",
        items: [
          { sku: "PHONE-15", name: "iPhone 15 Pro", qty: 2, price: 999.00 }
        ],
        payment_status: "pending_verification",
        shipping_status: "hold",
        risk_score: 0.82
      },
      null,
      2
    )
  },
  {
    id: "logistics_delay",
    title: "🚚 Freight Logistics Delay Flow",
    desc: "High priority shipment to test SHIPMENT_DELAYED event",
    orderIdPrefix: "ORDER-DELAYED",
    context: JSON.stringify(
      {
        customer_name: "Samantha Vance",
        customer_id: "CUST-501",
        items: [
          { sku: "SERVER-RACK", name: "Enterprise Server Rack", qty: 1, price: 4999.00 }
        ],
        payment_status: "confirmed",
        shipping_status: "in_transit",
        carrier: "FedEx Freight",
        tracking_number: "FX-99201-US"
      },
      null,
      2
    )
  }
];

function NewRunForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSupervisorId = searchParams.get("supervisorId") || "";

  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [supervisorsLoading, setSupervisorsLoading] = useState(true);
  const [form, setForm] = useState({
    order_id: `ORDER-${Date.now().toString().slice(-4)}`,
    supervisor_id: preselectedSupervisorId,
    order_context: DEMO_PRESETS[0].context,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);

  useEffect(() => {
    getSupervisors()
      .then((data) => {
        setSupervisors(data);
        if (data.length > 0 && !form.supervisor_id) {
          setForm((f) => ({ ...f, supervisor_id: data[0].id }));
        }
      })
      .catch(() => {})
      .finally(() => setSupervisorsLoading(false));
  }, [form.supervisor_id]);

  const applyPreset = (preset: typeof DEMO_PRESETS[0]) => {
    setForm((f) => ({
      ...f,
      order_id: `${preset.orderIdPrefix}-${Date.now().toString().slice(-4)}`,
      order_context: preset.context,
    }));
    setContextError(null);
  };

  const validateContext = (value: string): boolean => {
    try {
      JSON.parse(value);
      setContextError(null);
      return true;
    } catch {
      setContextError("Invalid JSON. Please check the order context format.");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.order_id.trim()) {
      setError("Order ID is required.");
      return;
    }
    if (!form.supervisor_id) {
      setError("Please select a supervisor.");
      return;
    }
    if (!validateContext(form.order_context)) return;

    setLoading(true);
    setError(null);

    try {
      const data: RunCreate = {
        order_id: form.order_id.trim(),
        supervisor_id: form.supervisor_id,
        order_context: JSON.parse(form.order_context),
      };
      const run = await createRun(data);
      router.push(`/runs/${run.id}`);
    } catch (e) {
      setError(
        e instanceof APIError
          ? e.message
          : "Failed to start run. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1-Click Demo Scenarios */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          🚀 1-Click Demo Scenarios (Quick Start)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-left p-2.5 rounded-lg border bg-zinc-800/40 border-zinc-700/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
            >
              <div className="text-xs font-medium text-zinc-200 group-hover:text-indigo-300 truncate">
                {preset.title}
              </div>
              <div className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5">
                {preset.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Order ID"
        value={form.order_id}
        onChange={(e) => setForm({ ...form, order_id: e.target.value })}
        placeholder="ORDER-1001"
        required
        hint="Must be unique — only one active run per order is allowed"
        id="order-id"
      />

      {/* Supervisor selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="supervisor-select">
          Supervisor
        </label>
        {supervisorsLoading ? (
          <div className="h-10 bg-zinc-800 animate-pulse rounded-lg" />
        ) : supervisors.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="text-sm text-amber-300">
              No supervisors found.{" "}
              <Link href="/supervisors/new" className="underline hover:text-amber-200">
                Create one first.
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {supervisors.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setForm({ ...form, supervisor_id: s.id })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                  form.supervisor_id === s.id
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                    : "bg-zinc-800/40 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <Bot className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="text-[10px] font-mono text-zinc-600 truncate">{s.id}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Textarea
        label="Order Context (JSON)"
        value={form.order_context}
        onChange={(e) => {
          setForm({ ...form, order_context: e.target.value });
          validateContext(e.target.value);
        }}
        rows={10}
        error={contextError || undefined}
        hint="Initial order data passed to the AI agent"
        id="order-context"
        className="font-mono text-xs"
      />

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={supervisors.length === 0}
          icon={<Play className="w-4 h-4" />}
          id="btn-start-run-submit"
        >
          {loading ? "Starting Workflow..." : "Start Run"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function NewRunPage() {
  return (
    <>
      <TopBar />
      <div className="flex-1 p-6">
        <div className="max-w-xl">
          <Link href="/runs">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              className="mb-4"
            >
              Back to Runs
            </Button>
          </Link>

          <div className="mb-6">
            <h2 className="text-sm font-semibold text-zinc-200">Start Order Run</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Start a new Temporal workflow to supervise an order.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="h-96 animate-pulse bg-zinc-900 rounded-xl border border-zinc-800" />
            }
          >
            <NewRunForm />
          </Suspense>
        </div>
      </div>
    </>
  );
}
