"use client";

import { useState } from "react";
import { addInstruction } from "@/lib/api/events";
import { APIError } from "@/lib/api/client";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import Input from "@/components/ui/Input";
import { MessageSquare, Send } from "lucide-react";

interface InstructionPanelProps {
  runId: string;
  onInstructionAdded: () => void;
  disabled?: boolean;
}

export default function InstructionPanel({
  runId,
  onInstructionAdded,
  disabled = false,
}: InstructionPanelProps) {
  const [instruction, setInstruction] = useState("");
  const [addedBy, setAddedBy] = useState("operator");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!instruction.trim()) {
      setError("Please enter an instruction.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await addInstruction(runId, {
        instruction: instruction.trim(),
        added_by: addedBy || "operator",
      });
      setSuccess("Instruction sent to the workflow.");
      setInstruction("");
      onInstructionAdded();
    } catch (e) {
      setError(
        e instanceof APIError
          ? e.message
          : "Unable to send instruction. The backend may be unavailable. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-zinc-200">
          Add Live Instruction
        </h3>
        <span className="text-[10px] font-mono text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">
          POST /instructions
        </span>
      </div>

      <Textarea
        label="Instruction"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="For this order, prioritize speed over cost. Contact the logistics manager if delay exceeds 48 hours."
        rows={4}
        disabled={disabled}
        id="instruction-textarea"
      />

      <Input
        label="Added By"
        value={addedBy}
        onChange={(e) => setAddedBy(e.target.value)}
        placeholder="operator"
        disabled={disabled}
        id="added-by-input"
      />

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

      {disabled && (
        <p className="text-xs text-zinc-600">
          Instructions cannot be added to a completed or terminated workflow.
        </p>
      )}

      <Button
        variant="primary"
        size="sm"
        className="w-full"
        loading={loading}
        disabled={disabled || !instruction.trim()}
        onClick={handleSubmit}
        icon={<Send className="w-3.5 h-3.5" />}
        id="btn-add-instruction"
      >
        Add Instruction
      </Button>
    </div>
  );
}
