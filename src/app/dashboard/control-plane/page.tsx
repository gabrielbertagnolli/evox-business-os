"use client";

import { useState, useCallback } from "react";
import { useMountEffect } from "@/hooks/useMountEffect";
import { Cpu, Server, Play, Bot, Loader2 } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  runtime: string;
  status: "active" | "inactive" | "error";
  last_run_at: string | null;
  run_count: number;
}

const RUNTIME_INFO: Record<string, { name: string; color: string; description: string }> = {
  x7_native: { name: "X7 Native", color: "#2d7bff", description: "Motor integrado de Evox Business OS" },
  cursor: { name: "Cursor", color: "#a855f7", description: "Cursor Agents API" },
  claude: { name: "Claude", color: "#d97757", description: "Claude Managed Agents" },
  opencode: { name: "OpenCode", color: "#10b981", description: "OpenCode Framework" },
  deepagents: { name: "DeepAgents", color: "#06b6d4", description: "DeepAgents Runtime" },
  hermes: { name: "Hermes", color: "#f59e0b", description: "Hermes OS Agents" },
};

export default function ControlPlanePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (res.ok) setAgents(data.agents ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useMountEffect(() => {
    fetchAgents();
  });

  const groupedAgents = agents.reduce((acc, agent) => {
    const r = agent.runtime || "x7_native";
    if (!acc[r]) acc[r] = [];
    acc[r].push(agent);
    return acc;
  }, {} as Record<string, Agent[]>);

  const runtimes = Object.keys(RUNTIME_INFO);

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
            Agent Control Plane
          </p>
          <h1 className="text-2xl font-semibold text-white">Unified Runtime Manager</h1>
          <p className="mt-1 text-sm text-white/40">
            Monitor and manage agents across all connected execution engines.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-white/20" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {runtimes.map((runtimeKey) => {
            const info = RUNTIME_INFO[runtimeKey];
            const runtimeAgents = groupedAgents[runtimeKey] || [];
            
            return (
              <div
                key={runtimeKey}
                className="glass rounded-2xl flex flex-col"
                style={{ borderTop: `2px solid ${info.color}` }}
              >
                <div className="p-5 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${info.color}15`, border: `1px solid ${info.color}30` }}
                    >
                      <Cpu size={18} color={info.color} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{info.name}</h3>
                      <p className="text-xs text-white/40">{info.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 text-xs font-medium text-white/30">
                    <span>{runtimeAgents.length} Agents</span>
                    <span className="flex items-center gap-1"><Server size={12}/> Connected</span>
                  </div>
                </div>

                <div className="flex-1 p-3 overflow-y-auto max-h-60 space-y-2">
                  {runtimeAgents.length > 0 ? (
                    runtimeAgents.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2">
                          <Bot size={14} className="text-white/40" />
                          <div>
                            <p className="text-sm font-medium text-white/80">{a.name}</p>
                            <p className="text-[10px] text-white/30">
                              {a.status === "active" ? "Running" : "Idle"}
                            </p>
                          </div>
                        </div>
                        <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition text-white/50">
                          <Play size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-white/20">
                      No agents running on this engine.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
