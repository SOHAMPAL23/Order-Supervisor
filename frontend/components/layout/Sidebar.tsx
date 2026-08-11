"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Play,
  CheckCircle2,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/supervisors", icon: Bot, label: "Supervisors" },
  { href: "/runs", icon: Play, label: "Active Runs" },
  { href: "/completed", icon: CheckCircle2, label: "Completed Runs" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-zinc-950 border-r border-zinc-800/60 flex flex-col z-30">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-100 leading-tight">
              Order Supervisor
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              POC Console
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                transition-all duration-150 group
                ${
                  isActive
                    ? "bg-indigo-600/15 text-indigo-400 font-medium"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
                }
              `}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive
                    ? "text-indigo-400"
                    : "text-zinc-600 group-hover:text-zinc-400"
                }`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-800/60">
        <div className="text-[10px] text-zinc-600 font-mono">
          Temporal · FastAPI · Next.js
        </div>
      </div>
    </aside>
  );
}
