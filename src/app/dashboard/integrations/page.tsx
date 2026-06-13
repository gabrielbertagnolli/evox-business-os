"use client";

import { useState, useCallback, Suspense } from "react";
import { useMountEffect } from "@/hooks/useMountEffect";
import { useSearchParams, useRouter } from "next/navigation";
import { Plug, CheckCircle2, X, AlertCircle, Loader2, ExternalLink, Key } from "lucide-react";
import { PROVIDERS, INTEGRATION_CATEGORIES, type ProviderId } from "@/lib/integrations/config";

interface Integration {
  id: string;
  provider: string;
  provider_account_id: string | null;
  provider_account_name: string | null;
  scopes: string[] | null;
  connected_at: string;
  updated_at: string;
}

// Provider icon letters with brand colors
function ProviderIcon({ id, color }: { id: string; color: string }) {
  const initials: Record<string, string> = {
    meta: "M",
    google: "G",
    hubspot: "H",
    slack: "S",
    linkedin: "in",
    notion: "N",
    github: "GH",
  };
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
      style={{
        background: `${color}22`,
        border: `1px solid ${color}44`,
        color,
      }}
    >
      {initials[id] ?? id[0].toUpperCase()}
    </div>
  );
}

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  
  // Manual Token Modal State
  const [manualProvider, setManualProvider] = useState<ProviderId | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [manualAccountName, setManualAccountName] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const showToast = (kind: "success" | "error", message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/list");
      if (res.ok) {
        const json = await res.json();
        setIntegrations(json.integrations ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useMountEffect(() => {
    fetchIntegrations();
  });

  // Handle URL params after OAuth redirect
  useMountEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected && PROVIDERS[connected as ProviderId]) {
      showToast("success", `${PROVIDERS[connected as ProviderId].name} connected successfully.`);
      fetchIntegrations();
      router.replace("/dashboard/integrations");
    } else if (error) {
      const messages: Record<string, string> = {
        provider_not_configured: "This provider is not configured yet. Add the OAuth credentials to your environment.",
        token_exchange_failed: "Failed to exchange OAuth token. Please try again.",
        db_error: `Database error: ${searchParams.get("details") || "Please try again."}`,
        missing_params: "OAuth callback missing required parameters.",
        invalid_state: "OAuth state mismatch. Please try again.",
      };
      showToast("error", messages[error] ?? `OAuth error: ${error}`);
      router.replace("/dashboard/integrations");
    }
  });

  const connectedSet = new Set(integrations.map((i) => i.provider));
  const totalConnected = connectedSet.size;

  async function handleDisconnect(provider: ProviderId) {
    if (!confirm(`Disconnect ${PROVIDERS[provider].name}? Agents using this integration will stop working.`)) return;
    setDisconnecting(provider);
    try {
      const res = await fetch(`/api/integrations/disconnect?provider=${provider}`, { method: "DELETE" });
      if (res.ok) {
        setIntegrations((prev) => prev.filter((i) => i.provider !== provider));
        showToast("success", `${PROVIDERS[provider].name} disconnected.`);
      } else {
        showToast("error", "Failed to disconnect. Please try again.");
      }
    } finally {
      setDisconnecting(null);
    }
  }

  function handleConnect(provider: ProviderId) {
    if (provider === "notion") {
      // For Notion, we can offer manual internal token entry
      setManualProvider("notion");
    } else {
      window.location.href = `/api/integrations/connect?provider=${provider}`;
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualProvider || !manualToken.trim()) return;

    setIsSubmittingManual(true);
    try {
      const res = await fetch("/api/integrations/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: manualProvider,
          token: manualToken.trim(),
          accountName: manualAccountName.trim() || undefined,
        }),
      });

      if (res.ok) {
        showToast("success", `${PROVIDERS[manualProvider].name} connected via internal token.`);
        setManualProvider(null);
        setManualToken("");
        setManualAccountName("");
        fetchIntegrations();
      } else {
        const error = await res.json();
        showToast("error", error.error || "Failed to save internal token.");
      }
    } catch (err) {
      showToast("error", "An error occurred.");
    } finally {
      setIsSubmittingManual(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      {/* Toast */}
      {toast && (
        <div
          className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl"
          style={{
            background: toast.kind === "success" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${toast.kind === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            backdropFilter: "blur(16px)",
          }}
        >
          {toast.kind === "success" ? (
            <CheckCircle2 size={14} className="text-green-400 shrink-0" />
          ) : (
            <AlertCircle size={14} className="text-red-400 shrink-0" />
          )}
          <span className="text-sm text-white/80">{toast.message}</span>
        </div>
      )}

      {/* Manual Token Modal */}
      {manualProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 shadow-2xl">
            <h3 className="mb-1 text-lg font-semibold text-white">
              Connect {PROVIDERS[manualProvider].name}
            </h3>
            <p className="mb-6 text-sm text-white/40">
              {manualProvider === "notion" 
                ? "If you're using an Internal Integration, paste your Internal Integration Secret below. If you have a Public Integration configured, you can use the standard OAuth flow."
                : "Enter your API key or token to connect this integration manually."}
            </p>
            
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  Account Name / Workspace (Optional)
                </label>
                <input
                  type="text"
                  value={manualAccountName}
                  onChange={(e) => setManualAccountName(e.target.value)}
                  placeholder="e.g. Acme Corp Workspace"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 outline-none transition focus:border-white/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  Internal Integration Token
                </label>
                <input
                  type="password"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="secret_..."
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 outline-none transition focus:border-white/30"
                />
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setManualProvider(null);
                    setManualToken("");
                    setManualAccountName("");
                  }}
                  className="flex-1 rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual || !manualToken.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
                >
                  {isSubmittingManual ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                  Connect
                </button>
              </div>
            </form>
            
            {manualProvider === "notion" && (
              <div className="mt-4 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => window.location.href = `/api/integrations/connect?provider=${manualProvider}`}
                  className="w-full rounded-lg py-2 text-xs font-medium text-white/40 transition hover:text-white/80 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={12} />
                  Or use Public OAuth flow instead
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
          Data Sources
        </p>
        <h1 className="text-2xl font-semibold text-white">Integrations</h1>
        <p className="mt-1 text-sm text-white/40">
          Connect your tools so agents can access real business data.
        </p>
      </div>

      {/* Status bar */}
      <div
        className="mb-8 flex items-center gap-3 rounded-xl px-4 py-3"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {loading ? (
          <Loader2 size={13} className="text-white/30 animate-spin" />
        ) : (
          <Plug size={13} className={totalConnected > 0 ? "text-green-400" : "text-white/30"} />
        )}
        <span className="text-xs text-white/40">
          {loading
            ? "Loading integrations…"
            : totalConnected === 0
            ? "No integrations connected — connect your first tool to unlock agent capabilities."
            : `${totalConnected} integration${totalConnected > 1 ? "s" : ""} connected`}
        </span>
      </div>

      {/* Integration categories */}
      <div className="space-y-8">
        {INTEGRATION_CATEGORIES.map(({ label, providers }) => (
          <div key={label}>
            <h2 className="mb-3 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
              {label}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((id) => {
                const config = PROVIDERS[id];
                const integration = integrations.find((i) => i.provider === id);
                const isConnected = !!integration;
                const isDisconnecting = disconnecting === id;

                return (
                  <div
                    key={id}
                    className="glass flex flex-col gap-3 rounded-2xl p-4"
                    style={
                      isConnected
                        ? {
                            background: "rgba(34,197,94,0.04)",
                            border: "1px solid rgba(34,197,94,0.15)",
                          }
                        : undefined
                    }
                  >
                    {/* Top row */}
                    <div className="flex items-start gap-3">
                      <ProviderIcon id={id} color={config.color} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-white/85">{config.name}</p>
                          {isConnected && (
                            <CheckCircle2 size={12} className="shrink-0 text-green-400" />
                          )}
                        </div>
                        <p className="truncate text-xs text-white/35">{config.description}</p>
                        {isConnected && integration.provider_account_name && (
                          <p className="mt-0.5 truncate text-xs" style={{ color: config.color + "aa" }}>
                            {integration.provider_account_name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action row */}
                    {isConnected ? (
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-[10px] text-white/30">
                          Connected {new Date(integration.connected_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDisconnect(id)}
                          disabled={isDisconnecting}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                          {isDisconnecting ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <X size={10} />
                          )}
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnect(id)}
                        className="w-full rounded-xl py-2 text-xs font-medium text-white/60 transition hover:text-white"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <ExternalLink size={11} />
                          Connect
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Info note */}
      <p className="mt-10 text-center text-xs text-white/20">
        OAuth credentials are stored securely. Tokens are scoped to read-only access where available.
      </p>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-white/30 text-sm">Loading…</div>}>
      <IntegrationsContent />
    </Suspense>
  );
}
