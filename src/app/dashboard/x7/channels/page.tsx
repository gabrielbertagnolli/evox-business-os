"use client";

import { useState } from "react";
import { Hash, Plus, Loader2, Users, Lock, Unlock, MessageSquare } from "lucide-react";
import { useX7Channels, useCreateX7Channel } from "@/hooks/api/useX7Channels";
import Link from "next/link";

export default function X7ChannelsPage() {
  const { data: channels, isLoading } = useX7Channels();
  const createChannel = useCreateX7Channel();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    await createChannel.mutateAsync({ name: newChannelName, description: newChannelDesc, is_private: isPrivate });
    setIsModalOpen(false);
    setNewChannelName("");
    setNewChannelDesc("");
    setIsPrivate(false);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0b0e] p-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Canales Colaborativos</h1>
            <p className="mt-2 text-sm text-white/50">Espacios de trabajo donde tu equipo y X7 pueden interactuar juntos.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#2d7bff] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2d7bff]/90"
          >
            <Plus size={16} /> Crear Canal
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="animate-spin text-white/30" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {channels?.map((channel) => (
              <Link
                key={channel.id}
                href={`/dashboard/x7/channels/${channel.id}`}
                className="group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-1"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {channel.is_private ? <Lock size={16} className="text-white/40" /> : <Hash size={16} className="text-white/40" />}
                    <h3 className="font-semibold text-white group-hover:text-[#2d7bff] transition-colors">{channel.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Users size={12} /> {channel.x7_channel_members?.length || 1}
                  </div>
                </div>
                <p className="text-sm text-white/40 line-clamp-2 min-h-[40px]">
                  {channel.description || "Sin descripción"}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#2d7bff] opacity-0 transition-opacity group-hover:opacity-100">
                  <MessageSquare size={14} /> Entrar al canal
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="w-full max-w-md rounded-[28px] p-6 shadow-2xl" style={{ background: "#14151a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 className="mb-6 text-xl font-semibold text-white">Crear nuevo canal</h2>
            
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-white/60">Nombre del canal</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="ej. equipo-marketing"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#2d7bff]"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  required
                />
              </div>
              
              <div>
                <label className="mb-2 block text-xs font-medium text-white/60">Descripción (Opcional)</label>
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="De qué trata este canal..."
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#2d7bff]"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#2d7bff]"
                />
                <label htmlFor="private" className="text-sm text-white/80">Canal Privado</label>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createChannel.isPending}
                className="flex items-center gap-2 rounded-xl bg-[#2d7bff] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#2d7bff]/90 disabled:opacity-50"
              >
                {createChannel.isPending && <Loader2 size={14} className="animate-spin" />}
                Crear
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
