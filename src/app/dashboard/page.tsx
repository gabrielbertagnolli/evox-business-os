import { createClient } from "@/lib/supabase/server";
import { Bot, GitBranch, Plug, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

async function getDashboardStats() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const [agentsRes, workflowsRes, integrationsRes, logsRes] = await Promise.all([
      supabase.from("x7_agents").select("id, name, updated_at", { count: "exact" }).eq("user_id", user.id),
      Promise.resolve({ data: [] as any[], count: 0 }), // Mockup for now
      Promise.resolve({ data: [] as any[], count: 0 }), // Mockup for now
      Promise.resolve({ data: [] as any[], count: 0 }), // Mockup for now
    ]);

    return {
      agents: agentsRes.data ?? [],
      agentCount: agentsRes.count ?? 0,
      activeAgents: agentsRes.count ?? 0, // All agents are "active" in x7_agents for now
      workflows: [],
      workflowCount: 0,
      activeWorkflows: 0,
      integrations: [],
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
          sub="Próximamente"
          href="/dashboard/integrations"
          color="#2d7bff"
        />
        <StatCard
          icon={Bot}
          label="Agentes X7"
          value={agentCount}
          sub={`${activeAgents} creados`}
          href="/dashboard/x7/workspace"
          color="#34d399"
        />
        <StatCard
          icon={GitBranch}
          label="Workflows"
          value={workflowCount}
          sub={workflowCount === 0 ? "Próximamente" : `${activeWorkflows} active`}
          href="/dashboard/workflows"
          color="#06b6d4"
        />
      </div>



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
      {(!stats?.recentLogs || stats.recentLogs.length === 0) && (
        <div
          className="rounded-2xl px-6 py-8 text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.07)",
          }}
        >
          <Activity size={20} className="mx-auto mb-3 text-white/15" />
          <p className="text-sm font-medium text-white/80">Próximamente</p>
          <p className="text-xs text-white/30">Aquí aparecerán los logs de ejecución de tus automatizaciones.</p>
        </div>
      )}
    </div>
  );
}
