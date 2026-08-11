"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { checkHealth } from "@/lib/api/client";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/supervisors": "Supervisors",
  "/supervisors/new": "New Supervisor",
  "/runs": "Active Runs",
  "/runs/new": "Start Run",
  "/completed": "Completed Runs",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/supervisors/")) return "Supervisor Detail";
  if (pathname.startsWith("/runs/")) return "Run Detail";
  return "Order Supervisor";
}

interface TopBarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function TopBar({ onRefresh, isRefreshing }: TopBarProps) {
  const pathname = usePathname();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = useCallback(async () => {
    const ok = await checkHealth();
    setConnected(ok);
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  const title = getPageTitle(pathname);

  return (
    <header className="h-14 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="text-sm font-semibold text-zinc-200">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Connection status */}
        <button
          onClick={checkConnection}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors"
          style={{
            borderColor:
              connected === null
                ? "rgb(63,63,70)"
                : connected
                ? "rgb(34,197,94,0.3)"
                : "rgb(239,68,68,0.3)",
            color:
              connected === null
                ? "rgb(113,113,122)"
                : connected
                ? "rgb(74,222,128)"
                : "rgb(248,113,113)",
          }}
          title={
            lastChecked
              ? `Last checked: ${lastChecked.toLocaleTimeString()}`
              : "Checking connection..."
          }
        >
          {connected === false ? (
            <WifiOff className="w-3 h-3" />
          ) : (
            <Wifi className="w-3 h-3" />
          )}
          {connected === null
            ? "Connecting..."
            : connected
            ? "Backend Connected"
            : "Backend Offline"}
        </button>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            aria-label="Refresh data"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        )}
      </div>
    </header>
  );
}
