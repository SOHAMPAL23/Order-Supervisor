"use client";

import { useState } from "react";
import { EVENT_TYPES, OrderEvent } from "@/types";
import { sendEvent } from "@/lib/api/events";
import { APIError } from "@/lib/api/client";
import { generateEventId } from "@/lib/utils/format";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { Zap, Send } from "lucide-react";

interface EventSimulatorProps {
  runId: string;
  onEventSent: () => void;
}

const EVENT_PAYLOAD_FIELDS: Record<string, Array<{ key: string; label: string; placeholder: string }>> = {
  shipment_delayed: [
    { key: "delay_reason", label: "Delay Reason", placeholder: "Severe weather at hub" },
    { key: "estimated_delay", label: "Estimated Delay", placeholder: "2-3 business days" },
    { key: "carrier", label: "Carrier", placeholder: "FedEx" },
  ],
  customer_message_received: [
    { key: "message", label: "Customer Message", placeholder: "Where is my order?" },
    { key: "channel", label: "Channel", placeholder: "email" },
  ],
  payment_failed: [
    { key: "reason", label: "Failure Reason", placeholder: "Insufficient funds" },
    { key: "amount", label: "Amount", placeholder: "99.99" },
  ],
  delivered: [
    { key: "signed_by", label: "Signed By", placeholder: "John Doe" },
    { key: "location", label: "Delivery Location", placeholder: "Front door" },
  ],
  shipment_created: [
    { key: "tracking_number", label: "Tracking Number", placeholder: "1Z999AA1..." },
    { key: "carrier", label: "Carrier", placeholder: "UPS" },
  ],
  refund_requested: [
    { key: "reason", label: "Refund Reason", placeholder: "Item damaged" },
    { key: "amount", label: "Amount", placeholder: "99.99" },
  ],
};

export default function EventSimulator({ runId, onEventSent }: EventSimulatorProps) {
  const [selectedType, setSelectedType] = useState("");
  const [payloadFields, setPayloadFields] = useState<Record<string, string>>({});
  const [source, setSource] = useState("simulator");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fields = selectedType ? EVENT_PAYLOAD_FIELDS[selectedType] || [] : [];

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setPayloadFields({});
    setError(null);
    setSuccess(null);
  };

  const handleSend = async () => {
    if (!selectedType) {
      setError("Please select an event type.");
      return;
    }

    const event: OrderEvent = {
      event_id: generateEventId(),
      event_type: selectedType,
      payload: { ...payloadFields },
      source: source || "simulator",
    };

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await sendEvent(runId, event);
      setSuccess(`Event "${selectedType}" sent successfully.`);
      setSelectedType("");
      setPayloadFields({});
      onEventSent();
    } catch (e) {
      setError(
        e instanceof APIError
          ? e.message
          : "Failed to send event. The backend may be unavailable."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-zinc-200">Event Simulator</h3>
        <span className="text-[10px] font-mono text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">
          POST /events
        </span>
      </div>

      {/* Event type selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300">Event Type</label>
        <div className="grid grid-cols-3 gap-1.5">
          {EVENT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleTypeChange(value)}
              className={`
                px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-all border
                ${
                  selectedType === value
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                    : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic payload fields */}
      {fields.length > 0 && (
        <div className="space-y-3 p-3 bg-zinc-950/40 border border-zinc-800 rounded-lg">
          <div className="text-xs font-medium text-zinc-500">Event Payload</div>
          {fields.map(({ key, label, placeholder }) => (
            <Input
              key={key}
              label={label}
              value={payloadFields[key] || ""}
              onChange={(e) =>
                setPayloadFields((prev) => ({
                  ...prev,
                  [key]: e.target.value,
                }))
              }
              placeholder={placeholder}
            />
          ))}
        </div>
      )}

      {/* Source */}
      <Input
        label="Source"
        value={source}
        onChange={(e) => setSource(e.target.value)}
        placeholder="simulator"
        hint="Identifies where this event originated"
      />

      {/* Feedback */}
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          {success}
        </div>
      )}

      <Button
        variant="primary"
        size="sm"
        className="w-full"
        loading={loading}
        disabled={!selectedType}
        onClick={handleSend}
        icon={<Send className="w-3.5 h-3.5" />}
        id="btn-send-event"
      >
        Send Event
      </Button>
    </div>
  );
}
