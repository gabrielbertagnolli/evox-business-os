"use client";
/* eslint-disable react-hooks/set-state-in-effect, no-restricted-syntax, react/jsx-max-depth */

import { Bot, DatabaseZap, Loader2, Send, ShieldCheck, Sparkles, Zap, Edit2, RotateCw, ThumbsUp, ThumbsDown, Globe, Paperclip, ChevronDown, Mic, Check, X } from "lucide-react";
import { useMemo, useState, useEffect, useRef, type FormEvent } from "react";
import { useX7Chat, useX7ChatDetail, type X7Message, type X7Summary } from "@/hooks/api/useX7Chat";
import { useRouter } from "next/navigation";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { toast } from "sonner";

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

function MessageBubble({ message, onRegenerate, onFeedback, onEdit }: { message: X7Message, onRegenerate?: () => void, onFeedback?: (rating: number) => void, onEdit?: (newContent: string) => void }) {
  const isUser = message.role === "user";
  const [feedback, setFeedback] = useState<number | null>(message.feedback || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const handleFeedback = (rating: number) => {
    setFeedback(rating);
    if (onFeedback) onFeedback(rating);
  };

  const handleConfirmEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(message.content);
    setIsEditing(false);
  };

  return (
    <div className={`group flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-[13px] leading-[1.6] ${isUser ? "text-white" : "text-white/75"}`}
        style={{
          background: isUser ? "rgba(45,123,255,0.2)" : "rgba(255,255,255,0.045)",
          border: isUser ? (isEditing ? "1px solid rgba(45,123,255,0.6)" : "1px solid rgba(45,123,255,0.32)") : "1px solid rgba(255,255,255,0.08)",
          boxShadow: isUser ? "0 0 28px rgba(45,123,255,0.08)" : "none",
        }}
      >
        {!isUser && (
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-[#2d7bff] uppercase">
            <Sparkles size={12} /> X7
          </div>
        )}
        {isUser && isEditing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full min-h-[60px] bg-transparent text-white outline-none resize-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleConfirmEdit();
              }
              if (e.key === "Escape") handleCancelEdit();
            }}
          />
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>

      {/* Acciones de Mensaje */}
      {message.id !== "x7-welcome" && (
        <div className={`mt-1 flex items-center gap-2 ${isEditing ? "opacity-100" : "opacity-0 transition-opacity group-hover:opacity-100"} ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          {isUser ? (
            isEditing ? (
              <>
                <button onClick={handleConfirmEdit} className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" title="Confirmar edición">
                  <Check size={12} />
                </button>
                <button onClick={handleCancelEdit} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400" title="Cancelar">
                  <X size={12} />
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white" title="Editar y bifurcar">
                <Edit2 size={12} />
              </button>
            )
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
  const secondaryChatMutation = useX7Chat();

  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [secondaryModel, setSecondaryModel] = useState<string | null>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isSecondaryDropdownOpen, setIsSecondaryDropdownOpen] = useState(false);
  const [primarySearchQuery, setPrimarySearchQuery] = useState("");
  const [secondarySearchQuery, setSecondarySearchQuery] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string, content: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // For dual model chat, we need a way to group messages or just send to both
  const [secondaryMessages, setSecondaryMessages] = useState<X7Message[]>([]);

  const { data: providersData } = useQuery({
    queryKey: ["x7-providers"],
    queryFn: async () => {
      const res = await fetch("/api/x7/providers");
      return await res.json();
    }
  });

  const providers = providersData?.providers || [];

  // Set the default model from the global setting once it loads, if no chat is loaded
  useEffect(() => {
    if (!chatId && providersData?.activeModel && !selectedModel) {
      setSelectedModel(providersData.activeModel);
    }
  }, [providersData?.activeModel, chatId, selectedModel]);

  useEffect(() => {
    if (chatDetail && chatDetail.chat?.history?.messages) {
      const msgsDict = chatDetail.chat.history.messages;
      const sortedMessages = Object.values(msgsDict)
        .sort((a: any, b: any) => a.timestamp - b.timestamp)
        .map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: new Date(m.timestamp * 1000).toISOString(),
          feedback: m.feedback
        }));
      setMessages(sortedMessages);
      setSecondaryMessages(sortedMessages); // Seed secondary with history as well
      
      if (chatDetail.model_id) {
        setSelectedModel(chatDetail.model_id);
      }
    } else if (!chatId) {
      setMessages([INITIAL_MESSAGE]);
      setSecondaryMessages([INITIAL_MESSAGE]);
    }
  }, [chatDetail, chatId]);

  const visibleSources = useMemo(() => summary.sourceNames.slice(0, 5), [summary.sourceNames]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Tu navegador no soporta entrada por voz.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES'; // Default a español, idealmente se extraería del locale
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInput(transcript);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    
    recognition.start();
  };

  const canSubmit = (input.trim() !== "" || attachedFile !== null) && !chatMutation.isPending;

  async function submitPrompt(prompt: string, parentId?: string) {
    let finalPrompt = prompt.trim();
    let targetModel = selectedModel;

    // Detect @mentions (e.g. "@AsistenteLegal redacta esto")
    const mentionRegex = /^@([a-zA-Z0-9_-]+)\s+([\s\S]*)/;
    const match = finalPrompt.match(mentionRegex);
    if (match && providers) {
      const mentionTag = match[1].toLowerCase();
      // Find agent/provider by name (without spaces) or ID
      const taggedAgent = providers.find((p: any) => 
        p.id === match[1] || 
        (p.name && p.name.toLowerCase().replace(/\s+/g, '') === mentionTag)
      );
      
      if (taggedAgent) {
        targetModel = taggedAgent.id;
        finalPrompt = match[2];
        toast.success(`Mensaje dirigido a: ${taggedAgent.name}`);
      }
    }

    // Append attached file content to prompt if exists
    if (attachedFile) {
      finalPrompt += `\n\n[ARCHIVO ADJUNTO: ${attachedFile.name}]\n${attachedFile.content}\n[/ARCHIVO]`;
    }

    const userMessage: X7Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: finalPrompt,
      createdAt: new Date().toISOString(),
    };
    
    const effectiveParentId = parentId || (messages.length > 1 ? messages[messages.length - 1].id : undefined);
    const nextMessages = [...messages, userMessage];
    const nextSecondaryMessages = [...secondaryMessages, userMessage];
    
    setMessages(nextMessages);
    if (secondaryModel) setSecondaryMessages(nextSecondaryMessages);
    setInput("");
    setAttachedFile(null);

    try {
      // Primary model request
      const primaryRequest = chatMutation.mutateAsync({
        messages: nextMessages,
        chatId: chatId,
        parentId: effectiveParentId !== "x7-welcome" ? effectiveParentId : undefined,
        webSearch: webSearchEnabled,
        model: targetModel
      });

      // Secondary model request if enabled
      let secondaryRequest = null;
      if (secondaryModel) {
        secondaryRequest = secondaryChatMutation.mutateAsync({
          messages: nextSecondaryMessages,
          chatId: chatId,
          parentId: effectiveParentId !== "x7-welcome" ? effectiveParentId : undefined,
          webSearch: webSearchEnabled,
          model: secondaryModel
        });
      }

      const [response, secondaryResponse] = await Promise.all([primaryRequest, secondaryRequest]);
      
      setMessages((currentMessages) => [...currentMessages, response.message]);
      setSummary(response.summary);
      
      if (secondaryResponse) {
        setSecondaryMessages((currentMessages) => [...currentMessages, secondaryResponse.message]);
      }

      if (!chatId && response.chat_id) {
        queryClient.invalidateQueries({ queryKey: ["x7-chats"] });
        router.replace(`/dashboard/x7/${response.chat_id}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al enviar el mensaje");
      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== userMessage.id));
      if (secondaryModel) {
        setSecondaryMessages((currentMessages) => currentMessages.filter((message) => message.id !== userMessage.id));
      }
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
      // Trim history to the point before this response and resubmit
      const trimmedMessages = messages.slice(0, messageIndex - 1);
      setMessages([...trimmedMessages]);
      submitPrompt(parentUserMessage.content);
    }
  }

  function handleEditAndFork(messageId: string, newContent: string) {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex >= 0) {
      // Fork: trim conversation to just before this message and resubmit with new content
      const trimmedMessages = messages.slice(0, messageIndex);
      setMessages([...trimmedMessages]);
      submitPrompt(newContent);
    }
  }

  if (isLoadingDetail) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-white/50" /></div>;
  }

  const currentProviderName = providers?.find((p: any) => p.id === selectedModel)?.name || (selectedModel ? selectedModel.split(":")[0] : "Seleccionar modelo");

  return (
    <div className="mx-auto flex h-full max-w-7xl gap-6 p-6">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[28px]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="relative z-30 border-b border-white/10 px-6 py-5">
          <div className="absolute inset-0 opacity-60" style={{ background: "radial-gradient(circle at top left, rgba(45,123,255,0.18), transparent 34%), radial-gradient(circle at 80% 0%, rgba(139,92,246,0.13), transparent 30%)" }} />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-white/35 uppercase">
                <Bot size={13} className="text-[#2d7bff]" /> X7 AI
              </p>
              
              <div className="relative mt-1 flex items-center gap-4">
                <button 
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-2 text-xl font-semibold text-white hover:text-white/80 transition-colors"
                >
                  {chatDetail?.title || `Chat (${currentProviderName})`}
                  <ChevronDown size={18} className="text-white/50" />
                </button>
                
                {isModelDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-xl bg-[#14151a] border border-white/10 shadow-2xl z-50 py-1">
                    <div className="sticky top-0 bg-[#14151a] p-2 border-b border-white/5 z-10">
                      <input 
                        type="text" 
                        placeholder="Buscar modelo..." 
                        value={primarySearchQuery}
                        onChange={(e) => setPrimarySearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#2d7bff]"
                      />
                    </div>
                    {providers?.filter((p: any) => p.name?.toLowerCase().includes(primarySearchQuery.toLowerCase()) || p.id?.toLowerCase().includes(primarySearchQuery.toLowerCase())).map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedModel(p.id); setIsModelDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors ${selectedModel === p.id ? "text-[#2d7bff]" : "text-white/80"}`}
                      >
                        {p.name}
                      </button>
                    ))}
                    {providers?.filter((p: any) => p.name?.toLowerCase().includes(primarySearchQuery.toLowerCase()) || p.id?.toLowerCase().includes(primarySearchQuery.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-white/40 text-center">No se encontraron modelos</div>
                    )}
                  </div>
                )}

                <div className="relative flex items-center gap-2">
                  <span className="text-white/20">vs</span>
                  <button 
                    onClick={() => setIsSecondaryDropdownOpen(!isSecondaryDropdownOpen)}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${secondaryModel ? "text-white" : "text-white/30 hover:text-white/60"}`}
                  >
                    {secondaryModel ? providers?.find((p: any) => p.id === secondaryModel)?.name : "Añadir Modelo"}
                    <ChevronDown size={14} className="text-white/50" />
                  </button>
                  
                  {secondaryModel && (
                    <button onClick={() => setSecondaryModel(null)} className="text-white/30 hover:text-red-400">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                    </button>
                  )}

                  {isSecondaryDropdownOpen && (
                    <div className="absolute top-full left-4 mt-2 w-64 max-h-80 overflow-y-auto rounded-xl bg-[#14151a] border border-white/10 shadow-2xl z-50 py-1">
                      <div className="sticky top-0 bg-[#14151a] p-2 border-b border-white/5 z-10">
                        <input 
                          type="text" 
                          placeholder="Buscar modelo..." 
                          value={secondarySearchQuery}
                          onChange={(e) => setSecondarySearchQuery(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#2d7bff]"
                        />
                      </div>
                      {providers?.filter((p: any) => p.name?.toLowerCase().includes(secondarySearchQuery.toLowerCase()) || p.id?.toLowerCase().includes(secondarySearchQuery.toLowerCase())).map((p: any) => (
                        <button
                          key={p.id}
                          onClick={() => { setSecondaryModel(p.id); setIsSecondaryDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors ${secondaryModel === p.id ? "text-[#2d7bff]" : "text-white/80"}`}
                        >
                          {p.name}
                        </button>
                      ))}
                      {providers?.filter((p: any) => p.name?.toLowerCase().includes(secondarySearchQuery.toLowerCase()) || p.id?.toLowerCase().includes(secondarySearchQuery.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3 text-sm text-white/40 text-center">No se encontraron modelos</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="hidden items-center gap-2 rounded-full px-3 py-2 text-xs text-white/50 md:flex" style={{ background: "rgba(10,11,14,0.56)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <ShieldCheck size={14} className="text-emerald-400" /> Contexto privado
            </div>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto px-6 py-6 scroll-smooth ${secondaryModel ? "flex gap-6" : ""}`}>
          {/* Primary Model Chat Stream */}
          <div className={`space-y-4 ${secondaryModel ? "w-1/2 border-r border-white/5 pr-6" : ""}`}>
            {messages.map((message) => (
              <MessageBubble 
                key={`primary-${message.id}`} 
                message={message} 
                onRegenerate={() => handleRegenerate(message.id)}
                onFeedback={(rating) => handleFeedback(message.id, rating)}
                onEdit={message.role === "user" ? (newContent) => handleEditAndFork(message.id, newContent) : undefined}
              />
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-white/45" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Loader2 size={14} className="animate-spin text-[#2d7bff]" /> {currentProviderName} está procesando...
                </div>
              </div>
            )}
            {chatMutation.isError && (
              <div className="rounded-2xl px-4 py-3 text-sm text-red-300" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                {chatMutation.error instanceof Error ? chatMutation.error.message : "Error contactando al modelo primario."}
              </div>
            )}
          </div>

          {/* Secondary Model Chat Stream (Arena) */}
          {secondaryModel && (
            <div className="space-y-4 w-1/2">
              {secondaryMessages.map((message) => (
                <MessageBubble 
                  key={`secondary-${message.id}`} 
                  message={message} 
                />
              ))}
              {secondaryChatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-white/45" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Loader2 size={14} className="animate-spin text-purple-400" /> {providers?.find((p: any) => p.id === secondaryModel)?.name} está procesando...
                  </div>
                </div>
              )}
              {secondaryChatMutation.isError && (
                <div className="rounded-2xl px-4 py-3 text-sm text-red-300" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                  {secondaryChatMutation.error instanceof Error ? secondaryChatMutation.error.message : "Error contactando al modelo secundario."}
                </div>
              )}
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
            {attachedFile && (
              <div className="absolute bottom-full left-0 mb-2 rounded-xl bg-[#2d7bff]/20 text-[#2d7bff] px-3 py-1.5 text-xs font-medium border border-[#2d7bff]/30 flex items-center gap-2">
                <Paperclip size={12} />
                {attachedFile.name}
                <button type="button" onClick={() => setAttachedFile(null)} className="ml-2 hover:text-white"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg></button>
              </div>
            )}
            
            {input.startsWith("/") && (
              <div className="absolute bottom-full left-0 mb-2 w-72 rounded-xl bg-[#14151a] p-2 shadow-xl border border-white/10 z-10">
                <p className="text-xs font-semibold text-white/40 mb-2 px-2 uppercase tracking-wider">Comandos Rápidos</p>
                <div className="space-y-1">
                  {[
                    { cmd: "/experto_ventas", prompt: "Actúa como un experto en ventas consultivas B2B. Analiza mi pipeline actual y dame recomendaciones accionables para mejorar la tasa de conversión." },
                    { cmd: "/analizar_datos", prompt: "Analiza los datos disponibles de mis integraciones conectadas. Identifica tendencias, anomalías y genera un resumen ejecutivo con métricas clave." },
                    { cmd: "/reporte_semanal", prompt: "Genera un reporte semanal completo con el estado de agentes, workflows, integraciones y métricas relevantes del negocio." },
                    { cmd: "/optimizar_workflow", prompt: "Revisa mis workflows activos y sugiere optimizaciones, automatizaciones adicionales o pasos que puedan eliminarse." },
                  ].filter(c => c.cmd.startsWith(input)).map(({ cmd, prompt }) => (
                    <button
                      key={cmd}
                      type="button"
                      onClick={() => { setInput(prompt); }}
                      className="w-full text-left rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <span className="font-medium text-[#2d7bff]">{cmd}</span>
                      <p className="text-[11px] text-white/30 mt-0.5 line-clamp-1">{prompt.substring(0, 60)}…</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex flex-1 items-center gap-2 rounded-2xl px-2" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.09)" }}>
              {/* Botón de Adjuntar Archivo */}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt,.md,.json,.csv,.js,.py,.ts,.tsx,.html,.css"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        setAttachedFile({ name: file.name, content: ev.target.result as string });
                      }
                    };
                    reader.readAsText(file);
                  }
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }} 
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-white/40 hover:text-white transition-colors" title="Adjuntar archivo (Texto)">
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
              
              {/* Botón de Dictado por Voz */}
              <button 
                type="button" 
                onClick={toggleRecording}
                className={`p-2 transition-colors rounded-xl ${isRecording ? 'text-red-400 bg-red-500/10 animate-pulse' : 'text-white/40 hover:text-white hover:bg-white/5'}`} 
                title={isRecording ? "Detener grabación" : "Dictado por voz"}
              >
                <Mic size={18} />
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
