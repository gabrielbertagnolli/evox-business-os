"use client";

import { Bot, DatabaseZap, Loader2, Send, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useHermesChat, type HermesMessage, type HermesSummary } from "@/hooks/api/useHermesChat";

const INITIAL_SUMMARY: HermesSummary = {
  connectedSources: 0,
  sourceNames: [],
  activeAgents: 0,
  totalAgents: 0,
  activeWorkflows: 0,
  totalWorkflows: 0,
  failingRuns: 0,
  latestRunStatus: null,
};

const INITIAL_MESSAGE: HermesMessage = {
  id: "hermes-welcome",
  role: "assistant",
  createdAt: new Date(0).toISOString(),
  content:
    "Soy Hermes, tu copiloto de IA para Evox. Puedo razonar sobre tus integraciones, agentes, workflows y ejecuciones recientes para ayudarte a decidir la siguiente acción.",
};

const SUGGESTED_PROMPTS = [
  "¿Qué fuentes tengo conectadas y qué debería conectar después?",
  "Resume el estado operativo de mis agentes y workflows.",
  "Dime si hay errores recientes y cómo priorizarlos.",
  "Propón una automatización usando mis fuentes actuales.",
];

function formatAssistantText(content: string) {
  const lines = content.split("\n");

  return lines.map((line, index) => (
    <span key={`${line}-${index}`}>
      {line}
      {index < lines.length - 1 && <br />}
    </span>
  ));
}

function SummaryCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.075)",
      }}
    >
      <p className="text-2xl font-semibold text-white tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-medium text-white/50">{label}</p>
      <p className="mt-1 text-[11px] text-white/25">{detail}</p>
    </div>
  );
}

function MessageBubble({ message }: { message: HermesMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${isUser ? "text-white" : "text-white/75"}`}
        style={{
          background: isUser ? "rgba(45,123,255,0.2)" : "rgba(255,255,255,0.045)",
          border: isUser ? "1px solid rgba(45,123,255,0.32)" : "1px solid rgba(255,255,255,0.08)",
          boxShadow: isUser ? "0 0 28px rgba(45,123,255,0.08)" : "none",
        }}
      >
        {!isUser && (
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-[#2d7bff] uppercase">
            <Sparkles size={12} /> Hermes
          </div>
        )}
        <p>{formatAssistantText(message.content)}</p>
      </div>
    </div>
  );
}

export default function HermesChat() {
  const [messages, setMessages] = useState<HermesMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState<HermesSummary>(INITIAL_SUMMARY);
  const chatMutation = useHermesChat();

  const visibleSources = useMemo(() => summary.sourceNames.slice(0, 5), [summary.sourceNames]);
  const canSubmit = input.trim().length > 0 && !chatMutation.isPending;

  async function submitPrompt(prompt: string) {
    const userMessage: HermesMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt.trim(),
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");

    try {
      const response = await chatMutation.mutateAsync(nextMessages);
      setMessages((currentMessages) => [...currentMessages, response.message]);
      setSummary(response.summary);
    } catch {
      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== userMessage.id));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    await submitPrompt(input);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-8 py-8">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[28px]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="relative overflow-hidden border-b border-white/10 px-6 py-5">
          <div className="absolute inset-0 opacity-60" style={{ background: "radial-gradient(circle at top left, rgba(45,123,255,0.18), transparent 34%), radial-gradient(circle at 80% 0%, rgba(139,92,246,0.13), transparent 30%)" }} />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-white/35 uppercase">
                <Bot size={13} className="text-[#2d7bff]" /> Hermes AI
              </p>
              <h1 className="text-2xl font-semibold text-white">Chat operativo conectado a tus datos</h1>
              <p className="mt-1 max-w-2xl text-sm text-white/45">
                Pregunta sobre integraciones, agentes, workflows y ejecuciones recientes sin salir de Evox.
              </p>
            </div>
            <div className="hidden items-center gap-2 rounded-full px-3 py-2 text-xs text-white/50 md:flex" style={{ background: "rgba(10,11,14,0.56)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <ShieldCheck size={14} className="text-emerald-400" /> Contexto privado por usuario
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-white/45" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Loader2 size={14} className="animate-spin text-[#2d7bff]" /> Hermes está consultando tus fuentes…
              </div>
            </div>
          )}
          {chatMutation.isError && (
            <div className="rounded-2xl px-4 py-3 text-sm text-red-300" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
              {chatMutation.error instanceof Error ? chatMutation.error.message : "No se pudo contactar a Hermes."}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => submitPrompt(prompt)}
                disabled={chatMutation.isPending}
                className="rounded-full px-3 py-1.5 text-xs text-white/45 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.075)" }}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Pregúntale a Hermes qué hacer con tus fuentes conectadas…"
              rows={2}
              className="min-h-[52px] flex-1 resize-none rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none"
              style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.09)" }}
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-[52px] items-center gap-2 rounded-2xl px-5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-45"
              style={{ background: "rgba(45,123,255,0.18)", border: "1px solid rgba(45,123,255,0.32)" }}
            >
              {chatMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Enviar
            </button>
          </form>
        </div>
      </section>

      <aside className="hidden w-[340px] shrink-0 space-y-4 xl:block">
        <div className="rounded-[28px] p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="mb-4 flex items-center gap-2">
            <DatabaseZap size={16} className="text-[#2d7bff]" />
            <h2 className="text-sm font-semibold text-white/80">Fuentes conectadas</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label="Fuentes" value={summary.connectedSources} detail="Integraciones activas" />
            <SummaryCard label="Agentes" value={`${summary.activeAgents}/${summary.totalAgents}`} detail="Activos / total" />
            <SummaryCard label="Workflows" value={`${summary.activeWorkflows}/${summary.totalWorkflows}`} detail="Activos / total" />
            <SummaryCard label="Errores" value={summary.failingRuns} detail="Ejecuciones recientes" />
          </div>
          <div className="mt-5 space-y-2">
            {visibleSources.length > 0 ? (
              visibleSources.map((source) => (
                <div key={source} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/55" style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {source}
                </div>
              ))
            ) : (
              <p className="rounded-xl px-3 py-3 text-sm text-white/35" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                Envía un mensaje para que Hermes cargue el contexto de tus fuentes configuradas.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[28px] p-5" style={{ background: "linear-gradient(135deg, rgba(45,123,255,0.11), rgba(139,92,246,0.08))", border: "1px solid rgba(45,123,255,0.16)" }}>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "rgba(45,123,255,0.14)", border: "1px solid rgba(45,123,255,0.24)" }}>
            <Zap size={18} className="text-[#2d7bff]" />
          </div>
          <h3 className="font-semibold text-white/85">Diseñado como Hermes</h3>
          <p className="mt-2 text-sm leading-6 text-white/42">
            La conversación se alimenta de los conectores configurados, el estado de automatizaciones y los logs recientes para devolver recomendaciones ejecutables.
          </p>
        </div>
      </aside>
    </div>
  );
}
