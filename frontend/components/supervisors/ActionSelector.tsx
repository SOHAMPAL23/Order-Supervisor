"use client";

import { AVAILABLE_ACTIONS } from "@/types";
import { Check } from "lucide-react";

interface ActionSelectorProps {
  selected: string[];
  onChange: (actions: string[]) => void;
}

const ACTION_DESCRIPTIONS: Record<string, string> = {
  message_fulfillment_team: "Contact the fulfillment team about order issues",
  message_payments_team: "Contact the payments team about payment issues",
  message_logistics_team: "Contact the logistics team about shipment issues",
  message_customer: "Send a message directly to the customer",
  create_internal_note: "Create an internal note in the order system",
};

export default function ActionSelector({
  selected,
  onChange,
}: ActionSelectorProps) {
  const toggle = (action: string) => {
    if (selected.includes(action)) {
      onChange(selected.filter((a) => a !== action));
    } else {
      onChange([...selected, action]);
    }
  };

  return (
    <div className="space-y-2">
      {AVAILABLE_ACTIONS.map((action) => {
        const isSelected = selected.includes(action);
        return (
          <button
            key={action}
            type="button"
            onClick={() => toggle(action)}
            className={`
              w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border text-left
              transition-all duration-150
              ${
                isSelected
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                  : "bg-zinc-800/40 border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }
            `}
          >
            <div
              className={`
                w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center
                ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-500"
                    : "border-zinc-600"
                }
              `}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-mono font-medium">{action}</div>
              <div className="text-xs text-zinc-500 mt-0.5">
                {ACTION_DESCRIPTIONS[action]}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
