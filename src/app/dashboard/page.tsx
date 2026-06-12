import { createClient } from "@/lib/supabase/server";
import { Bot, GitBranch, Plug, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

async function getDashboardStats() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const [agentsRes, workflowsRes, integrationsRes, logsRes] = await Promise.all([
      supabase.from("agents").select("id, name, status, last_run_at", { count: "exact" }).eq("user_id", user.id),
      supabase.from("workflows").select("id, name, status, last_run_at", { count: "exact" }).eq("user_id", user.id),
      supabase.from("integrations").select("id, provider, provider_account_name", { count: "exact" }).eq("user_id", user.id),
      supabase.from("run_logs").select("id, source_name, status, started_at, source_type").eq("user_id", user.id).order("started_at", { ascending: false }).limit(5),
    ]);

    return {
      agents: agentsRes.data ?? [],
      agentCount: agentsRes.count ?? 0,
      activeAgents: (agentsRes.data ?? []).filter((a) => a.status === "active").length,
      workflows: workflowsRes.data ?? [],
      workflowCount: workflowsRes.count ?? 0,
      activeWorkflows: (workflowsRes.data ?? []).filter((w) => w.status === "active").length,
      integrations: integrationsRes.data ?? [],
      integrationCount: integrationsRes.count ?? 0,
      recentLogs: logsRes.data ?? [],
    };
  } catch {
    return null;
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="glass glass-hover group flex flex-col gap-4 rounded-2xl p-5 transition"
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `${color}18`, border: `1px solid ${color}33` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <ArrowRight
          size={14}
          className="text-white/15 transition group-hover:text-white/35 group-hover:translate-x-0.5"
        />
      </div>
      <div>
        <p className="text-2xl font-semibold text-white tabular-nums">{value}</p>
        <p className="text-xs text-white/40">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-white/25">{sub}</p>}
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const agentCount = stats?.agentCount ?? 0;
  const workflowCount = stats?.workflowCount ?? 0;
  const integrationCount = stats?.integrationCount ?? 0;
  const activeAgents = stats?.activeAgents ?? 0;
  const activeWorkflows = stats?.activeWorkflows ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
          Overview
        </p>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/40">
          Your business OS at a glance.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        <StatCard
          icon={Plug}
          label="Integrations"
          value={integrationCount}
          sub={integrationCount === 0 ? "Connect your first tool" : `${integrationCount} connected`}
          href="/dashboard/integrations"
          color="#2d7bff"
        />
        <StatCard
          icon={Bot}
          label="Agents"
          value={agentCount}
          sub={agentCount === 0 ? "No agents yet" : `${activeAgents} active`}
          href="/dashboard/agents"
          color="#8b5cf6"
        />
        <StatCard
          icon={GitBranch}
          label="Workflows"
          value={workflowCount}
          sub={workflowCount === 0 ? "No workflows yet" : `${activeWorkflows} active`}
          href="/dashboard/workflows"
          color="#06b6d4"
        />
      </div>

      {/* Getting started checklist if empty */}
      {integrationCount === 0 && agentCount === 0 && (
        <div
          className="mb-10 rounded-2xl p-6"
          style={{
            background: "rgba(45,123,255,0.05)",
            border: "1px solid rgba(45,123,255,0.15)",
          }}
        >
          <p className="mb-4 text-sm font-semibold text-white/70">Get started</p>
          <div className="space-y-3">
            {[
              { step: "1", label: "Connect an integration", href: "/dashboard/integrations", done: integrationCount > 0 },
              { step: "2", label: "Create your first agent", href: "/dashboard/agents", done: agentCount > 0 },
              { step: "3", label: "Build a workflow", href: "/dashboard/workflows", done: workflowCount > 0 },
            ].map(({ step, label, href, done }) => (
              <Link
                key={step}
                href={href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-white/5"
              >
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    background: done ? "rgba(34,197,94,0.15)" : "rgba(45,123,255,0.15)",
                    border: `1px solid ${done ? "rgba(34,197,94,0.3)" : "rgba(45,123,255,0.3)"}`,
                    color: done ? "#22c55e" : "#2d7bff",
                  }}
                >
                  {done ? "✓" : step}
                </div>
                <span className={`text-sm ${done ? "text-white/30 line-through" : "text-white/70"}`}>
                  {label}
                </span>
                {!done && <ArrowRight size={12} className="ml-auto text-white/20" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {stats?.recentLogs && stats.recentLogs.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Activity size={13} className="text-white/25" />
            <h2 className="text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
              Recent Activity
            </h2>
          </div>
          <div
            className="divide-y rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderColor: "rgba(255,255,255,0.07)",
            }}
          >
            {stats.recentLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    background:
                      log.status === "success"
                        ? "#22c55e"
                        : log.status === "error"
                        ? "#ef4444"
                        : "#f59e0b",
                  }}
                />
                <span className="flex-1 truncate text-sm text-white/60">
                  {log.source_name ?? log.source_type}
                </span>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px]"
                  style={{
                    background:
                      log.status === "success"
                        ? "rgba(34,197,94,0.1)"
                        : log.status === "error"
                        ? "rgba(239,68,68,0.1)"
                        : "rgba(245,158,11,0.1)",
                    color:
                      log.status === "success"
                        ? "#22c55e"
                        : log.status === "error"
                        ? "#ef4444"
                        : "#f59e0b",
                  }}
                >
                  {log.status}
                </span>
                <span className="shrink-0 text-[11px] text-white/20">
                  {new Date(log.started_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty recent activity */}
      {(!stats?.recentLogs || stats.recentLogs.length === 0) && agentCount > 0 && (
        <div
          className="rounded-2xl px-6 py-8 text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.07)",
          }}
        >
          <Activity size={20} className="mx-auto mb-3 text-white/15" />
          <p className="text-sm text-white/30">No runs yet — activate an agent to start.</p>
        </div>
      )}
    </div>
  );
}
