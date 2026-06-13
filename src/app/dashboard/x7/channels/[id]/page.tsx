"use client";
/* eslint-disable no-restricted-syntax */

import { useState, useRef, useEffect } from "react";
import { Hash, Users, Send, Loader2, Bot } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ChannelMessage {
  id: string;
  content: string;
  role: string;
  created_at: string;
  user_id: string;
  user?: { email: string };
}

export default function X7ChannelChatPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<ChannelMessage[]>({
    queryKey: ["x7-channel-messages", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/x7/channels/${params.id}/messages`);
      if (!res.ok) throw new Error("Error fetching messages");
      return res.json();
    },
    refetchInterval: 3000 // Simple polling for parity, a real app would use Supabase Realtime
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/x7/channels/${params.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error("Error sending message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["x7-channel-messages", params.id] });
      setInput("");
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage.mutate(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0b0e]">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-6">
        <div className="flex items-center gap-3">
          <Hash size={20} className="text-white/40" />
          <h2 className="text-lg font-semibold text-white">Canal {params.id.slice(0, 8)}</h2>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 text-sm text-white/60">
          <Users size={16} /> Colaborativo
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-white/30" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <Hash size={32} className="text-[#2d7bff]" />
            </div>
            <h3 className="text-xl font-semibold text-white">Bienvenido al Canal</h3>
            <p className="max-w-md text-center text-sm text-white/50">
              Este es el comienzo de la historia del canal. Etiqueta a <strong>@x7</strong> para invocar al agente.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/60">
                  {msg.role === "assistant" ? <Bot size={18} className="text-purple-400" /> : <Users size={18} />}
                </div>
                <div className={`flex flex-col ${msg.role === "assistant" ? "items-start" : "items-end"}`}>
                  <span className="text-xs text-white/30 mb-1">
                    {msg.role === "assistant" ? "X7 AI" : msg.user?.email || "Usuario"}
                  </span>
                  <div 
                    className="rounded-2xl px-5 py-3 text-sm text-white/90"
                    style={{ 
                      background: msg.role === "assistant" ? "rgba(255,255,255,0.05)" : "#2d7bff",
                      border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.1)" : "none" 
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-white/5 p-6">
        <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl items-end gap-3">
          <textarea
            placeholder="Escribe un mensaje... (@x7 para llamar a la IA)"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[52px] flex-1 resize-none rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none"
            style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.09)" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || sendMessage.isPending}
            className="flex h-[52px] items-center gap-2 rounded-2xl px-5 text-sm font-medium text-white transition hover:bg-[#2d7bff]/90 disabled:opacity-50"
            style={{ background: "rgba(45,123,255,0.18)", border: "1px solid rgba(45,123,255,0.32)" }}
          >
            {sendMessage.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
