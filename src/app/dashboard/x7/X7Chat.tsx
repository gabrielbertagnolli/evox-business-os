"use client";

import { Bot, DatabaseZap, Loader2, Send, ShieldCheck, Sparkles, Zap, Edit2, RotateCw, ThumbsUp, ThumbsDown, Globe, Paperclip, ChevronDown } from "lucide-react";
import { useMemo, useState, useEffect, type FormEvent } from "react";
import { useX7Chat, useX7ChatDetail, type X7Message, type X7Summary } from "@/hooks/api/useX7Chat";
import { useRouter } from "next/navigation";
import { useQueryClient, useQuery } from "@tanstack/react-query";

const INITIAL_SUMMARY: X7Summary = {
  connectedSources: 0,
  sourceNames: [],
  activeAgents: 0,
  totalAgents: 0,
  activeWorkflows: 0,
  totalWorkflows: 0,
  failingRuns: 0,
  latestRunStatus: null,
  learnedSkills: 0,
  memoryNodes: 0,
};

const INITIAL_MESSAGE: X7Message = {
  id: "x7-welcome",
  role: "assistant",
  createdAt: new Date(0).toISOString(),
  content:
    "Soy X7, tu copiloto de IA para Evox. Estoy aprendiendo de tus integraciones. Puedo crear habilidades (Skills), automatizar procesos (Cron) y recordar tus preferencias a largo plazo.",
};

const SUGGESTED_PROMPTS = [
  "¿Qué habilidades has aprendido recientemente?",
  "Resume el estado operativo de mis agentes y workflows.",
  "Configura una nueva regla en tu memoria para mis reportes.",
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

function MessageBubble({ message, onRegenerate, onFeedback }: { message: X7Message, onRegenerate?: () => void, onFeedback?: (rating: number) => void }) {
  const isUser = message.role === "user";
  const [feedback, setFeedback] = useState<number | null>(null);

  const handleFeedback = (rating: number) => {
    setFeedback(rating);
    if (onFeedback) onFeedback(rating);
  };

  return (
    <div className={`group flex flex-col ${isUser ? "items-end" : "items-start"}`}>
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
            <Sparkles size={12} /> X7
          </div>
        )}
        <p>{formatAssistantText(message.content)}</p>
      </div>

      {/* Acciones de Mensaje */}
      {message.id !== "x7-welcome" && (
        <div className={`mt-1 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          {isUser ? (
            <button className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white" title="Editar y bifurcar">
              <Edit2 size={12} />
            </button>
          ) : (
            <>
              <button onClick={onRegenerate} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white" title="Regenerar respuesta">
                <RotateCw size={12} />
              </button>
              <button onClick={() => handleFeedback(1)} className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${feedback === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`} title="Buena respuesta">
                <ThumbsUp size={12} />
              </button>
              <button onClick={() => handleFeedback(-1)} className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${feedback === -1 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`} title="Mala respuesta">
                <ThumbsDown size={12} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function X7Chat({ chatId }: { chatId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: chatDetail, isLoading: isLoadingDetail } = useX7ChatDetail(chatId);
  const [messages, setMessages] = useState<X7Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState<X7Summary>(INITIAL_SUMMARY);
  const chatMutation = useX7Chat();

  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState("openai");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const { data: providers } = useQuery({
    queryKey: ["x7-providers"],
    queryFn: async () => {
      const res = await fetch("/api/x7/providers");
      return await res.json();
    }
  });

  useEffect(() => {
    if (chatDetail && chatDetail.x7_messages?.length > 0) {
      const sortedMessages = chatDetail.x7_messages
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.created_at
        }));
      setMessages(sortedMessages);
    } else if (!chatId) {
      setMessages([INITIAL_MESSAGE]);
    }
  }, [chatDetail, chatId]);

  const visibleSources = useMemo(() => summary.sourceNames.slice(0, 5), [summary.sourceNames]);
  const canSubmit = input.trim().length > 0 && !chatMutation.isPending;

  async function submitPrompt(prompt: string, parentId?: string) {
    const userMessage: X7Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt.trim(),
      createdAt: new Date().toISOString(),
    };
    
    const effectiveParentId = parentId || (messages.length > 1 ? messages[messages.length - 1].id : undefined);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");

    try {
      const response = await chatMutation.mutateAsync({
        messages: nextMessages,
        chatId: chatId,
        parentId: effectiveParentId !== "x7-welcome" ? effectiveParentId : undefined,
        webSearch: webSearchEnabled,
        model: selectedModel
      });
      
      setMessages((currentMessages) => [...currentMessages, response.message]);
      setSummary(response.summary);

      if (!chatId && response.chat_id) {
        queryClient.invalidateQueries({ queryKey: ["x7-chats"] });
        router.replace(`/dashboard/x7/${response.chat_id}`);
      }
    } catch {
      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== userMessage.id));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    await submitPrompt(input);
  }

  async function handleFeedback(messageId: string, rating: number) {
    if (!chatId) return;
    try {
      await fetch("/api/x7/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, rating })
      });
    } catch (e) {
      console.error("Error enviando feedback", e);
    }
  }

  function handleRegenerate(messageId: string) {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex > 0) {
      const parentUserMessage = messages[messageIndex - 1];
      submitPrompt(parentUserMessage.content);
    }
  }

  if (isLoadingDetail) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-white/50" /></div>;
  }

  const currentProviderName = providers?.find((p: any) => p.id === selectedModel)?.name || "OpenAI";

  return (
    <div className="mx-auto flex h-full max-w-7xl gap-6 p-6">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[28px]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="relative overflow-hidden border-b border-white/10 px-6 py-5">
          <div className="absolute inset-0 opacity-60" style={{ background: "radial-gradient(circle at top left, rgba(45,123,255,0.18), transparent 34%), radial-gradient(circle at 80% 0%, rgba(139,92,246,0.13), transparent 30%)" }} />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-white/35 uppercase">
                <Bot size={13} className="text-[#2d7bff]" /> X7 AI
              </p>
              
              {/* Dropdown Selector de Modelos */}
              <div className="relative mt-1">
                <button 
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-2 text-xl font-semibold text-white hover:text-white/80 transition-colors"
                >
                  {chatDetail?.title || `Chat (${currentProviderName})`}
                  <ChevronDown size={18} className="text-white/50" />
                </button>
                
                {isModelDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-[#14151a] border border-white/10 shadow-2xl z-20 py-1">
                    {providers?.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedModel(p.id); setIsModelDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedModel === p.id ? 'bg-[#2d7bff]/20 text-[#2d7bff]' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="hidden items-center gap-2 rounded-full px-3 py-2 text-xs text-white/50 md:flex" style={{ background: "rgba(10,11,14,0.56)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <ShieldCheck size={14} className="text-emerald-400" /> Contexto privado
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6 scroll-smooth">
          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              onRegenerate={() => handleRegenerate(message.id)}
              onFeedback={(rating) => handleFeedback(message.id, rating)}
            />
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-white/45" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Loader2 size={14} className="animate-spin text-[#2d7bff]" /> X7 está procesando tu solicitud…
              </div>
            </div>
          )}
          {chatMutation.isError && (
            <div className="rounded-2xl px-4 py-3 text-sm text-red-300" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
              {chatMutation.error instanceof Error ? chatMutation.error.message : "No se pudo contactar a X7."}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-5">
          {messages.length <= 1 && (
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
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-3 relative">
            {input.startsWith("/") && (
              <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl bg-[#14151a] p-2 shadow-xl border border-white/10 z-10">
                <p className="text-xs font-semibold text-white/40 mb-2 px-2 uppercase tracking-wider">Comandos (Prompts)</p>
                <div className="space-y-1">
                  <button type="button" className="w-full text-left rounded-lg px-2 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white">/experto_ventas</button>
                  <button type="button" className="w-full text-left rounded-lg px-2 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white">/analizar_datos</button>
                </div>
              </div>
            )}
            
            <div className="flex flex-1 items-center gap-2 rounded-2xl px-2" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.09)" }}>
              {/* Botón de Adjuntar Archivo */}
              <button type="button" className="p-2 text-white/40 hover:text-white transition-colors" title="Adjuntar archivo">
                <Paperclip size={18} />
              </button>
              
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Pregúntale a X7 o usa '/' para comandos rápidos…"
                rows={1}
                className="my-3 min-h-[24px] flex-1 resize-none bg-transparent text-sm text-white placeholder-white/25 outline-none"
              />

              {/* Botón de Web Search Toggle */}
              <button 
                type="button" 
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className={`p-2 transition-colors rounded-xl ${webSearchEnabled ? 'text-blue-400 bg-blue-500/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`} 
                title={webSearchEnabled ? "Búsqueda web activada" : "Búsqueda web desactivada"}
              >
                <Globe size={18} />
              </button>
            </div>
            
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
            <SummaryCard label="Workflows" value={`${summary.activeWorkflows}/${summary.totalWorkflows}`} detail="Activos / total" />
            <SummaryCard label="Skills" value={summary.learnedSkills || 0} detail="Habilidades aprendidas" />
            <SummaryCard label="Memoria" value={summary.memoryNodes || 0} detail="Nodos de contexto" />
          </div>
        </div>

        <div className="rounded-[28px] p-5" style={{ background: "linear-gradient(135deg, rgba(45,123,255,0.11), rgba(139,92,246,0.08))", border: "1px solid rgba(45,123,255,0.16)" }}>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "rgba(45,123,255,0.14)", border: "1px solid rgba(45,123,255,0.24)" }}>
            <Zap size={18} className="text-[#2d7bff]" />
          </div>
          <h3 className="font-semibold text-white/85">Diseñado como X7</h3>
          <p className="mt-2 text-sm leading-6 text-white/42">
            La conversación se alimenta de los conectores configurados, el estado de automatizaciones y los logs recientes para devolver recomendaciones ejecutables.
          </p>
        </div>
      </aside>
    </div>
  );
}
