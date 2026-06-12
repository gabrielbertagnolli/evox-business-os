"use client";

import { useEffect, useState, useCallback } from "react";
import { Bot, Plus, Search, Trash2, Play, Pause, Loader2, X, ChevronDown } from "lucide-react";
import { PROVIDERS, type ProviderId } from "@/lib/integrations/config";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "inactive" | "error";
  trigger_type: string;
  integrations: string[];
  last_run_at: string | null;
  run_count: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e",
  inactive: "rgba(255,255,255,0.3)",
  error: "#ef4444",
};

const TRIGGER_LABELS: Record<string, string> = {
  manual: "Manual",
  schedule: "Scheduled",
  webhook: "Webhook",
};

const AGENT_TEMPLATES = [
  {
    name: "Meta Ads Monitor",
    description: "Tracks ad spend and performance daily, sends alerts on anomalies.",
    integrations: ["meta"],
    trigger_type: "schedule",
  },
  {
    name: "CRM Weekly Report",
    description: "Generates weekly conversion reports from CRM data and emails the team.",
    integrations: ["hubspot"],
    trigger_type: "schedule",
  },
  {
    name: "Slack Digest",
    description: "Summarizes important Slack messages and threads into a daily briefing.",
    integrations: ["slack"],
    trigger_type: "schedule",
  },
  {
    name: "Lead Qualifier",
    description: "Automatically qualifies new inbound leads from forms and adds to CRM.",
    integrations: ["hubspot"],
    trigger_type: "webhook",
  },
];

function CreateAgentModal({
  onClose,
  onCreated,
  connectedProviders,
  prefill,
}: {
  onClose: () => void;
  onCreated: (agent: Agent) => void;
  connectedProviders: string[];
  prefill?: (typeof AGENT_TEMPLATES)[0] | null;
}) {
  const [name, setName] = useState(prefill?.name ?? "");
  const [description, setDescription] = useState(prefill?.description ?? "");
  const [triggerType, setTriggerType] = useState(prefill?.trigger_type ?? "manual");
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(prefill?.integrations ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, trigger_type: triggerType, integrations: selectedIntegrations }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create agent");
      onCreated(data.agent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  function toggleIntegration(id: string) {
    setSelectedIntegrations((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div
        className="relative w-full max-w-lg rounded-2xl p-6"
        style={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/30 hover:text-white/70 transition"
        >
          <X size={18} />
        </button>
        <h2 className="mb-1 text-lg font-semibold text-white">Create Agent</h2>
        <p className="mb-5 text-sm text-white/40">Define what this agent monitors or executes.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Meta Ads Monitor"
              required
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              rows={2}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">Trigger</label>
            <div className="relative">
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full appearance-none rounded-xl px-3 py-2.5 pr-8 text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <option value="manual">Manual — run on demand</option>
                <option value="schedule">Scheduled — run on a cron</option>
                <option value="webhook">Webhook — run on event</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-3 text-white/30" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-white/50">Integrations</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PROVIDERS) as ProviderId[]).map((pid) => {
                const p = PROVIDERS[pid];
                const isSelected = selectedIntegrations.includes(pid);
                const isConnected = connectedProviders.includes(pid);
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => toggleIntegration(pid)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition"
                    style={{
                      background: isSelected ? `${p.color}22` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isSelected ? p.color + "55" : "rgba(255,255,255,0.1)"}`,
                      color: isSelected ? p.color : isConnected ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {p.name}
                    {isConnected && !isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    )}
                  </button>
                );
              })}
            </div>
            {selectedIntegrations.some((id) => !connectedProviders.includes(id)) && (
              <p className="mt-1.5 text-xs text-amber-400/70">
                Some selected integrations are not connected yet.
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg px-3 py-2 text-xs text-red-400" style={{ background: "rgba(239,68,68,0.1)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white/40 transition hover:text-white/70"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white transition disabled:opacity-50"
              style={{ background: "rgba(45,123,255,0.2)", border: "1px solid rgba(45,123,255,0.4)" }}
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              Create Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [templatePrefill, setTemplatePrefill] = useState<(typeof AGENT_TEMPLATES)[0] | null>(null);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (res.ok) setAgents(data.agents ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    // Fetch connected integrations for the modal
    fetch("/api/integrations/list")
      .then((r) => r.json())
      .then((d) => setConnectedProviders((d.integrations ?? []).map((i: { provider: string }) => i.provider)))
      .catch(() => {});
  }, [fetchAgents]);

  const filtered = agents.filter(
    (a) =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function deleteAgent(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/agents/${id}`, { method: "DELETE" });
      setAgents((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleAgent(agent: Agent) {
    setTogglingId(agent.id);
    const newStatus = agent.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setAgents((prev) => prev.map((a) => (a.id === agent.id ? data.agent : a)));
      }
    } finally {
      setTogglingId(null);
    }
  }

  function handleCreated(agent: Agent) {
    setAgents((prev) => [agent, ...prev]);
    setShowCreate(false);
    setTemplatePrefill(null);
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
            Automation
          </p>
          <h1 className="text-2xl font-semibold text-white">Agents</h1>
          <p className="mt-1 text-sm text-white/40">
            AI agents that monitor, alert, and execute on your behalf.
          </p>
        </div>
        <button
          onClick={() => { setTemplatePrefill(null); setShowCreate(true); }}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          style={{ background: "rgba(45,123,255,0.15)", border: "1px solid rgba(45,123,255,0.3)" }}
        >
          <Plus size={14} />
          New Agent
        </button>
      </div>

      {/* Search */}
      <div
        className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Search size={14} className="text-white/25" />
        <input
          className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
          placeholder="Search agents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-white/20" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="mb-10 grid gap-3 sm:grid-cols-2">
          {filtered.map((agent) => (
            <div
              key={agent.id}
              className="glass rounded-2xl p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ background: STATUS_COLORS[agent.status] ?? STATUS_COLORS.inactive }}
                  />
                  <p className="text-sm font-semibold text-white">{agent.name}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleAgent(agent)}
                    disabled={togglingId === agent.id}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition hover:text-white/70"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                    title={agent.status === "active" ? "Pause" : "Activate"}
                  >
                    {togglingId === agent.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : agent.status === "active" ? (
                      <Pause size={12} />
                    ) : (
                      <Play size={12} />
                    )}
                  </button>
                  <button
                    onClick={() => deleteAgent(agent.id)}
                    disabled={deletingId === agent.id}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 transition hover:text-red-400"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    {deletingId === agent.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </div>
              </div>
              {agent.description && (
                <p className="mb-3 text-xs leading-relaxed text-white/40">{agent.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] text-white/35"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {TRIGGER_LABELS[agent.trigger_type] ?? agent.trigger_type}
                </span>
                {agent.integrations?.map((pid) => (
                  <span
                    key={pid}
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{
                      background: `${PROVIDERS[pid as ProviderId]?.color ?? "#666"}18`,
                      border: `1px solid ${PROVIDERS[pid as ProviderId]?.color ?? "#666"}30`,
                      color: PROVIDERS[pid as ProviderId]?.color ?? "rgba(255,255,255,0.4)",
                    }}
                  >
                    {PROVIDERS[pid as ProviderId]?.name ?? pid}
                  </span>
                ))}
              </div>
              {agent.last_run_at && (
                <p className="mt-2 text-[10px] text-white/20">
                  Last run {new Date(agent.last_run_at).toLocaleDateString()} · {agent.run_count} runs
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          className="mb-8 rounded-2xl px-6 py-10 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
        >
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "rgba(45,123,255,0.1)", border: "1px solid rgba(45,123,255,0.2)" }}
          >
            <Bot size={20} className="text-[#2d7bff]" />
          </div>
          <p className="mb-1 font-medium text-white/80">No agents yet</p>
          <p className="mb-6 text-sm text-white/35">Create your first agent from a template or from scratch.</p>
          <button
            onClick={() => { setTemplatePrefill(null); setShowCreate(true); }}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white"
            style={{ background: "rgba(45,123,255,0.15)", border: "1px solid rgba(45,123,255,0.3)" }}
          >
            <Plus size={14} />
            Create Agent
          </button>
        </div>
      )}

      {/* Template suggestions */}
      <div>
        <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
          Templates
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {AGENT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              onClick={() => { setTemplatePrefill(tpl); setShowCreate(true); }}
              className="glass glass-hover cursor-pointer rounded-2xl p-5 text-left transition w-full"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">{tpl.name}</p>
                <span
                  className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: "rgba(45,123,255,0.1)",
                    color: "rgba(45,123,255,0.8)",
                    border: "1px solid rgba(45,123,255,0.2)",
                  }}
                >
                  Template
                </span>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-white/40">{tpl.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {tpl.integrations.map((pid) => (
                  <span
                    key={pid}
                    className="rounded-full px-2 py-0.5 text-[10px] text-white/35"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {PROVIDERS[pid as ProviderId]?.name ?? pid}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {showCreate && (
        <CreateAgentModal
          onClose={() => { setShowCreate(false); setTemplatePrefill(null); }}
          onCreated={handleCreated}
          connectedProviders={connectedProviders}
          prefill={templatePrefill}
        />
      )}
    </div>
  );
}
