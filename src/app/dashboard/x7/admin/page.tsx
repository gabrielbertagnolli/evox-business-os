"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, MessageSquare, Bot, Activity, DollarSign, Database, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["x7-admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/x7/admin/stats");
      if (!res.ok) throw new Error("Error fetching stats");
      return await res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0a0b0e]">
        <Loader2 className="animate-spin text-white/50" />
      </div>
    );
  }

  const statCards = [
    { title: "Usuarios Activos", value: stats?.totalUsers || 0, icon: <Users size={20} className="text-[#2d7bff]" /> },
    { title: "Chats Creados", value: stats?.totalChats || 0, icon: <MessageSquare size={20} className="text-emerald-400" /> },
    { title: "Mensajes Enviados", value: stats?.totalMessages || 0, icon: <Activity size={20} className="text-purple-400" /> },
    { title: "Agentes Custom", value: stats?.totalAgents || 0, icon: <Bot size={20} className="text-amber-400" /> },
    { title: "Tokens (Estimados)", value: stats?.estimatedTokens?.toLocaleString() || 0, icon: <Database size={20} className="text-cyan-400" /> },
    { title: "Costo API (Estimado)", value: `$${stats?.estimatedCost?.toFixed(4) || "0.0000"}`, icon: <DollarSign size={20} className="text-red-400" /> },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0b0e] overflow-y-auto p-8">
      <div className="max-w-6xl w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">Admin & Analytics</h1>
          <p className="text-white/50">Monitorea el uso de X7, tokens y costos estimados de tu ecosistema.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {statCards.map((stat, i) => (
            <div key={i} className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-white/60">{stat.title}</p>
                <div className="p-2 rounded-lg bg-white/5">
                  {stat.icon}
                </div>
              </div>
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <h2 className="text-xl font-medium text-white mb-6">Estado del Sistema</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${stats?.health?.modelApi === "Operativo" ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                <p className="text-sm text-white/80">API de Modelos</p>
              </div>
              <p className="text-xs text-white/40">{stats?.health?.modelApi || "Comprobando..."}</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${stats?.health?.vectorDb === "Operativo" ? "bg-emerald-500" : "bg-red-500"}`}></div>
                <p className="text-sm text-white/80">Vector Database (pgvector)</p>
              </div>
              <p className="text-xs text-white/40">{stats?.health?.vectorDb || "Comprobando..."}</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${stats?.health?.piston === "Conectado (Piston)" ? "bg-emerald-500" : "bg-red-500"}`}></div>
                <p className="text-sm text-white/80">Sandboxing Terminal</p>
              </div>
              <p className="text-xs text-white/40">{stats?.health?.piston || "Comprobando..."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
