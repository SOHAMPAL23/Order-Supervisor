"use client";

import { useState } from "react";
import { Run } from "@/types";
import { pauseRun, resumeRun, interruptRun, terminateRun } from "@/lib/api/runs";
import { APIError } from "@/lib/api/client";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Pause, Play, AlertTriangle, Trash2 } from "lucide-react";

interface RunControlsProps {
  run: Run;
  onUpdate: () => void;
}

type ConfirmAction = "interrupt" | "terminate" | null;

export default function RunControls({ run, onUpdate }: RunControlsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const isTerminal = run.status === "COMPLETED" || run.status === "TERMINATED";

  const doAction = async (
    action: string,
    fn: () => Promise<unknown>
  ) => {
    setLoading(action);
    setError(null);
    setSuccess(null);
    try {
      await fn();
      setSuccess(`${action} successful`);
      setTimeout(() => setSuccess(null), 3000);
      onUpdate();
    } catch (e) {
      setError(
        e instanceof APIError
          ? e.message
          : "Operation failed. Please try again."
      );
    } finally {
      setLoading(null);
    }
  };

  const handlePause = () => doAction("Pause", () => pauseRun(run.id));
  const handleResume = () => doAction("Resume", () => resumeRun(run.id));
  const handleInterrupt = () =>
    doAction("Interrupt", () => interruptRun(run.id, "Manual interrupt via UI"));
  const handleTerminate = () =>
    doAction("Terminate", () =>
      terminateRun(run.id, "Manual termination via UI")
    );

  if (isTerminal) {
    return (
      <div className="text-xs text-zinc-600 text-center py-2">
        This workflow has ended and cannot be controlled.
      </div>
    );
  }

  return (
    <div className="space-y-3">
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

      {/* Control buttons */}
      <div className="grid grid-cols-2 gap-2">
        {run.status !== "PAUSED" ? (
          <Button
            variant="outline"
            size="sm"
            loading={loading === "Pause"}
            disabled={!!loading}
            onClick={handlePause}
            icon={<Pause className="w-3.5 h-3.5" />}
            id="btn-pause"
          >
            Pause
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            loading={loading === "Resume"}
            disabled={!!loading}
            onClick={handleResume}
            icon={<Play className="w-3.5 h-3.5" />}
            id="btn-resume"
          >
            Resume
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          loading={loading === "Interrupt"}
          disabled={!!loading}
          onClick={() => setConfirmAction("interrupt")}
          icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          id="btn-interrupt"
        >
          Interrupt
        </Button>
      </div>

      <Button
        variant="danger"
        size="sm"
        className="w-full"
        loading={loading === "Terminate"}
        disabled={!!loading}
        onClick={() => setConfirmAction("terminate")}
        icon={<Trash2 className="w-3.5 h-3.5" />}
        id="btn-terminate"
      >
        Terminate Workflow
      </Button>

      {/* Interrupt confirmation */}
      <Modal
        isOpen={confirmAction === "interrupt"}
        onClose={() => setConfirmAction(null)}
        title="Interrupt Workflow"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            This will send an interrupt signal to the workflow. The agent will
            stop its current cycle but the workflow will remain active.
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConfirmAction(null);
                handleInterrupt();
              }}
            >
              Interrupt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Terminate confirmation */}
      <Modal
        isOpen={confirmAction === "terminate"}
        onClose={() => setConfirmAction(null)}
        title="Terminate Workflow"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-sm text-red-300 font-medium mb-1">
              This cannot be undone.
            </p>
            <p className="text-xs text-red-400/80">
              Terminating this workflow will permanently stop all supervision
              for order {run.order_id}.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setConfirmAction(null);
                handleTerminate();
              }}
            >
              Terminate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
