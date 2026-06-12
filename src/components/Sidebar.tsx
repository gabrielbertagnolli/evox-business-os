"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/actions/auth";
import {
  LayoutDashboard,
  Bot,
  Zap,
  GitBranch,
  Plug,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/agents", label: "Agents", icon: Bot },
  { href: "/dashboard/skills", label: "Skills", icon: Zap },
  { href: "/dashboard/workflows", label: "Workflows", icon: GitBranch },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
];

interface SidebarProps {
  userEmail: string;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full w-[220px] shrink-0 flex-col"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Wordmark */}
      <div className="px-5 pb-4 pt-6">
        <p className="mb-0.5 text-[9px] font-semibold tracking-[0.22em] text-white/30 uppercase">
          BUSINESS OS
        </p>
        <h2
          className="neon-glow text-xl font-bold tracking-[0.12em] text-white uppercase"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          EVOX
        </h2>
      </div>

      {/* Nav */}
      <nav className="mt-4 flex-1 px-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className="glass-hover flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition"
                  style={
                    isActive
                      ? {
                          background: "rgba(45,123,255,0.12)",
                          border: "1px solid rgba(45,123,255,0.2)",
                          color: "#ffffff",
                        }
                      : {
                          background: "transparent",
                          border: "1px solid transparent",
                          color: "rgba(255,255,255,0.45)",
                        }
                  }
                >
                  <Icon
                    size={15}
                    className={isActive ? "text-[#2d7bff]" : "text-white/40"}
                  />
                  <span className={isActive ? "font-medium" : ""}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-5 pt-3">
        <div
          className="mb-2 rounded-xl px-3 py-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Link
            href="/dashboard/settings"
            className="glass-hover flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition"
            style={{
              background: "transparent",
              border: "1px solid transparent",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <Settings size={15} />
            <span>Settings</span>
          </Link>
        </div>

        {/* User row */}
        <div
          className="rounded-xl px-3 py-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="truncate text-xs text-white/40">{userEmail}</p>
          <form action={signOut} className="mt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs text-white/25 transition hover:text-white/50"
            >
              <LogOut size={11} />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
