"use client";

import { useEffect, useState, useCallback } from "react";
import { Supervisor } from "@/types";
import { getSupervisors } from "@/lib/api/supervisors";
import TopBar from "@/components/layout/TopBar";
import SupervisorCard from "@/components/supervisors/SupervisorCard";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Bot, Plus, AlertCircle } from "lucide-react";

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getSupervisors();
      setSupervisors(data);
    } catch {
      setError("Unable to load supervisors. Make sure the backend is running.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <TopBar onRefresh={() => load(true)} isRefreshing={refreshing} />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">
              Supervisor Configurations
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Each supervisor defines how the AI agent behaves for order supervision.
            </p>
          </div>
          <Link href="/supervisors/new">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              id="btn-new-supervisor"
            >
              New Supervisor
            </Button>
          </Link>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse h-48"
              />
            ))}
          </div>
        ) : supervisors.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <EmptyState
              icon={<Bot className="w-5 h-5" />}
              title="No supervisors yet"
              description="Create a supervisor to define how the AI agent should behave."
              action={
                <Link href="/supervisors/new">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Create Supervisor
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {supervisors.map((s) => (
              <SupervisorCard key={s.id} supervisor={s} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
