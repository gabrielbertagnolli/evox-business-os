"use client";

import { useState, useCallback } from "react";
import { useMountEffect } from "@/hooks/useMountEffect";
import { GitBranch, Plus, Trash2, Play, Loader2, X, ArrowRight } from "lucide-react";
import { PROVIDERS, type ProviderId } from "@/lib/integrations/config";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "paused";
  steps: { name: string; integration?: string }[];
  integrations: string[];
  last_run_at: string | null;
  run_count: number;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "rgba(255,255,255,0.25)",
  active: "#22c55e",
  paused: "#f59e0b",
};

const WORKFLOW_EXAMPLES = [
  {
    name: "Meta Ads × CRM Conversion Report",
    description: "Pulls daily ad spend from Meta, cross-references with CRM conversions, emails a formatted report.",
    steps: [
      { name: "Pull Meta Ads data", integration: "meta" },
      { name: "Pull CRM conversions", integration: "hubspot" },
      { name: "Format report" },
      { name: "Send email" },
    ],
    integrations: ["meta", "hubspot"],
  },
  {
    name: "New Lead Nurture",
    description: "Qualifies inbound leads, enriches from LinkedIn, adds to CRM, triggers follow-up.",
    steps: [
      { name: "Qualify lead" },
      { name: "Enrich from LinkedIn", integration: "linkedin" },
      { name: "Add to CRM", integration: "hubspot" },
      { name: "Send follow-up via Slack", integration: "slack" },
    ],
    integrations: ["linkedin", "hubspot", "slack"],
  },
  {
    name: "Weekly Google Ads Report",
    description: "Pulls weekly Google Ads metrics and sends a Slack summary to the team.",
    steps: [
      { name: "Pull Google Ads metrics", integration: "google" },
      { name: "Format summary" },
      { name: "Post to Slack", integration: "slack" },
    ],
    integrations: ["google", "slack"],
  },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    integrations: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workflows");
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data.workflows ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useMountEffect(() => { fetchWorkflows(); });

  async function deleteWorkflow(id: string) {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
  }

  async function createWorkflow(template?: typeof WORKFLOW_EXAMPLES[0]) {
    const name = template?.name ?? form.name.trim();
    if (!name) { setError("Name is required"); return; }

    setCreating(true);
    setError(null);
    try {
      const body = template
        ? { name: template.name, description: template.description, steps: template.steps, integrations: template.integrations }
        : { name, description: form.description.trim() || null, steps: [], integrations: form.integrations };

      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create workflow"); return; }

      setWorkflows((prev) => [data.workflow, ...prev]);
      setShowModal(false);
      setForm({ name: "", description: "", integrations: [] });
    } finally {
      setCreating(false);
    }
  }

  const allProviders = Object.values(PROVIDERS);

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
            Automation
          </p>
          <h1 className="text-2xl font-semibold text-white">Workflows</h1>
          <p className="mt-1 text-sm text-white/40">
            Multi-step automations connecting your tools and data.
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(null); }}
          className="glass-hover flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition"
          style={{
            background: "rgba(45,123,255,0.15)",
            border: "1px solid rgba(45,123,255,0.3)",
          }}
        >
          <Plus size={14} />
          New Workflow
        </button>
      </div>

      {/* Existing workflows */}
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-white/30">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : workflows.length > 0 ? (
        <div className="mb-10 space-y-3">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="glass flex items-start gap-4 rounded-2xl p-4"
            >
              <div
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(45,123,255,0.1)",
                  border: "1px solid rgba(45,123,255,0.2)",
                }}
              >
                <GitBranch size={16} className="text-[#2d7bff]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white/90">{wf.name}</p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      color: STATUS_COLORS[wf.status],
                      background: `${STATUS_COLORS[wf.status]}18`,
                      border: `1px solid ${STATUS_COLORS[wf.status]}33`,
                    }}
                  >
                    {STATUS_LABELS[wf.status]}
                  </span>
                </div>
                {wf.description && (
                  <p className="mt-0.5 text-xs text-white/35">{wf.description}</p>
                )}
                {wf.steps && wf.steps.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {wf.steps.map((step, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] text-white/45"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          {step.name}
                        </span>
                        {i < wf.steps.length - 1 && (
                          <ArrowRight size={10} className="text-white/20" />
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-white/25">
                  {wf.run_count} runs
                </span>
                <button
                  onClick={() => deleteWorkflow(wf.id)}
                  className="rounded-lg p-1.5 text-white/25 transition hover:bg-white/05 hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div
          className="mb-10 rounded-2xl px-6 py-10 text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(45,123,255,0.1)",
              border: "1px solid rgba(45,123,255,0.2)",
            }}
          >
            <GitBranch size={20} className="text-[#2d7bff]" />
          </div>
          <p className="mb-1 font-medium text-white/80">No workflows yet</p>
          <p className="mb-6 text-sm text-white/35">
            Start from a template or build your own.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="glass-hover inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white"
            style={{
              background: "rgba(45,123,255,0.15)",
              border: "1px solid rgba(45,123,255,0.3)",
            }}
          >
            <Plus size={14} />
            New Workflow
          </button>
        </div>
      )}

      {/* Template suggestions */}
      <div>
        <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
          Templates
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_EXAMPLES.map((ex) => (
            <div
              key={ex.name}
              className="glass glass-hover cursor-pointer rounded-2xl p-5 transition"
              onClick={() => createWorkflow(ex)}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white leading-snug">{ex.name}</p>
                <span
                  className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: "rgba(45,123,255,0.1)",
                    color: "rgba(45,123,255,0.8)",
                    border: "1px solid rgba(45,123,255,0.2)",
                  }}
                >
                  Use
                </span>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-white/40">{ex.description}</p>
              <div className="flex flex-wrap items-center gap-1">
                {ex.steps.slice(0, 4).map((step, i) => (
                  <span key={step.name} className="flex items-center gap-1">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] text-white/40"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      {step.name}
                    </span>
                    {i < ex.steps.length - 1 && i < 3 && (
                      <ArrowRight size={9} className="text-white/20" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create workflow modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div
            className="relative w-full max-w-md rounded-2xl p-6"
            style={{
              background: "rgba(14,16,26,0.97)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">New Workflow</h2>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white/60">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">Name</label>
                <input
                  className="w-full rounded-xl bg-white/05 px-3.5 py-2.5 text-sm text-white placeholder-white/25 outline-none ring-1 ring-white/10 focus:ring-[#2d7bff]/50"
                  placeholder="e.g. Weekly Ads Report"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">Description (optional)</label>
                <textarea
                  className="w-full resize-none rounded-xl bg-white/05 px-3.5 py-2.5 text-sm text-white placeholder-white/25 outline-none ring-1 ring-white/10 focus:ring-[#2d7bff]/50"
                  rows={2}
                  placeholder="What does this workflow do?"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">Integrations</label>
                <div className="flex flex-wrap gap-2">
                  {allProviders.map((p) => {
                    const sel = form.integrations.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setForm((f) => ({
                          ...f,
                          integrations: sel
                            ? f.integrations.filter((x) => x !== p.id)
                            : [...f.integrations, p.id],
                        }))}
                        className="rounded-xl px-3 py-1.5 text-xs font-medium transition"
                        style={{
                          background: sel ? `${p.color}22` : "rgba(255,255,255,0.04)",
                          border: sel ? `1px solid ${p.color}55` : "1px solid rgba(255,255,255,0.08)",
                          color: sel ? p.color : "rgba(255,255,255,0.45)",
                        }}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-400">{error}</p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl px-4 py-2 text-sm text-white/40 hover:text-white/60"
              >
                Cancel
              </button>
              <button
                onClick={() => createWorkflow()}
                disabled={creating || !form.name.trim()}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{
                  background: "rgba(45,123,255,0.2)",
                  border: "1px solid rgba(45,123,255,0.4)",
                }}
              >
                {creating && <Loader2 size={13} className="animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
