"use client";

import { Hash, Users, Send, Loader2 } from "lucide-react";

export default function X7ChannelChatPage({ params }: { params: { id: string } }) {
  // En una implementación real, aquí haríamos un fetch de los mensajes de este canal (ej. useX7ChannelMessages(params.id))
  
  return (
    <div className="flex h-full w-full flex-col bg-[#0a0b0e]">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-6">
        <div className="flex items-center gap-3">
          <Hash size={20} className="text-white/40" />
          <h2 className="text-lg font-semibold text-white">Canal {params.id.slice(0, 8)}</h2>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 text-sm text-white/60">
          <Users size={16} /> 3 Miembros
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex h-full flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Hash size={32} className="text-[#2d7bff]" />
          </div>
          <h3 className="text-xl font-semibold text-white">Bienvenido al Canal</h3>
          <p className="max-w-md text-center text-sm text-white/50">
            Este es el comienzo de la historia del canal. Los miembros del equipo y los agentes de IA (como X7) pueden colaborar aquí.
          </p>
        </div>
      </div>

      <div className="border-t border-white/5 p-6">
        <form className="mx-auto flex w-full max-w-4xl items-end gap-3">
          <textarea
            placeholder="Escribe un mensaje en este canal..."
            rows={1}
            className="min-h-[52px] flex-1 resize-none rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none"
            style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.09)" }}
          />
          <button
            type="button"
            className="flex h-[52px] items-center gap-2 rounded-2xl px-5 text-sm font-medium text-white transition hover:bg-[#2d7bff]/90"
            style={{ background: "rgba(45,123,255,0.18)", border: "1px solid rgba(45,123,255,0.32)" }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
