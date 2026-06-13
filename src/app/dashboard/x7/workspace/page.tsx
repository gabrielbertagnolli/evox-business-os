"use client";

import { useState } from "react";
import { Folder, Play, FileCode2, Plus, Sparkles, AlertCircle, Save, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<"agents" | "functions">("functions");
  const queryClient = useQueryClient();

  const { data: functions, isLoading: isLoadingFunctions } = useQuery({
    queryKey: ["x7-functions"],
    queryFn: async () => {
      const res = await fetch("/api/x7/functions");
      if (!res.ok) throw new Error("Error fetching functions");
      return await res.json();
    }
  });

  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["x7-agents"],
    queryFn: async () => {
      const res = await fetch("/api/x7/agents");
      if (!res.ok) throw new Error("Error fetching agents");
      return await res.json();
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFuncName, setNewFuncName] = useState("");
  const [newFuncType, setNewFuncType] = useState("filter");
  const [newFuncCode, setNewFuncCode] = useState("");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [newAgentPrompt, setNewAgentPrompt] = useState("");

  const createFunction = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/x7/functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Error saving");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["x7-functions"] });
      setIsModalOpen(false);
    }
  });

  const createAgent = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/x7/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Error saving agent");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["x7-agents"] });
      setIsModalOpen(false);
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "functions") {
      createFunction.mutate({
        name: newFuncName,
        type: newFuncType,
        content: newFuncCode,
        is_active: true
      });
    } else {
      createAgent.mutate({
        name: newFuncName,
        description: newAgentDesc,
        system_prompt: newAgentPrompt,
      });
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0b0e] p-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Workspace</h1>
            <p className="mt-2 text-sm text-white/50">Crea modelos personalizados, filtros y pipelines para X7.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
          >
            <Plus size={16} /> Crear {activeTab === "functions" ? "Función" : "Agente"}
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-white/10 pb-4">
          <button 
            onClick={() => setActiveTab("functions")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === "functions" ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"}`}
          >
            <FileCode2 size={16} /> Functions (Pipelines)
          </button>
          <button 
            onClick={() => setActiveTab("agents")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === "agents" ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"}`}
          >
            <Sparkles size={16} /> Modelfiles (Agents)
          </button>
        </div>

        {/* Content */}
        {activeTab === "functions" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isLoadingFunctions ? (
              <p className="text-sm text-white/30">Cargando...</p>
            ) : functions?.map((func: any) => (
              <div key={func.id} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">{func.name}</h3>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider ${func.type === 'filter' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {func.type}
                  </span>
                </div>
                <div className="rounded-xl bg-black/50 p-3 font-mono text-xs text-white/60 overflow-hidden h-24">
                  {func.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "agents" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isLoadingAgents ? (
              <p className="text-sm text-white/30">Cargando agentes...</p>
            ) : agents?.length === 0 ? (
              <div className="col-span-full rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                <Sparkles size={32} className="mx-auto text-white/20 mb-4" />
                <h3 className="text-white font-medium mb-2">No hay Modelfiles personalizados</h3>
                <p className="text-sm text-white/40 max-w-md mx-auto">
                  Crea agentes con system prompts y herramientas específicas (equivalente a los GPTs).
                </p>
              </div>
            ) : agents?.map((agent: any) => (
              <div key={agent.id} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">{agent.name}</h3>
                  <a href={`/dashboard/x7?agent=${agent.id}`} className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20">
                    <Play size={12} /> Run
                  </a>
                </div>
                <p className="text-xs text-white/60 mb-3">{agent.description || "Sin descripción"}</p>
                <div className="rounded-xl bg-black/50 p-3 font-mono text-xs text-white/40 overflow-hidden h-24">
                  {agent.system_prompt}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCreate} className="w-full max-w-2xl rounded-[28px] p-6 shadow-2xl flex flex-col max-h-[90vh]" style={{ background: "#14151a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-semibold text-white">{activeTab === "functions" ? "Nueva Función JS (Middleware)" : "Nuevo Agente (Modelfile)"}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/60">Nombre</label>
                  <input
                    type="text"
                    value={newFuncName}
                    onChange={(e) => setNewFuncName(e.target.value)}
                    placeholder={activeTab === "functions" ? "ej. censura-pci" : "ej. Agente de Ventas"}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    required
                  />
                </div>
                {activeTab === "functions" ? (
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/60">Tipo</label>
                    <select
                      value={newFuncType}
                      onChange={(e) => setNewFuncType(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <option value="filter" className="bg-[#14151a]">Filter (Interceptor)</option>
                      <option value="pipe" className="bg-[#14151a]">Pipe (Action)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/60">Descripción (Opcional)</label>
                    <input
                      type="text"
                      value={newAgentDesc}
                      onChange={(e) => setNewAgentDesc(e.target.value)}
                      placeholder="Experto en cierre de ventas"
                      className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="mb-2 block text-xs font-medium text-white/60">{activeTab === "functions" ? "Código Javascript" : "System Prompt"}</label>
                <div className="bg-[#0a0b0e] rounded-xl border border-white/10 p-4">
                  {activeTab === "functions" && (
                    <p className="text-xs text-white/30 mb-3 font-mono">
                      {`// Ejemplo de Filtro
function filter(messages) {
  // modificar messages
  return messages;
}

function postFilter(answer) {
  return answer + "\\n\\n[Filtrado por X7]";
}`}
                    </p>
                  )}
                  <textarea
                    value={activeTab === "functions" ? newFuncCode : newAgentPrompt}
                    onChange={(e) => activeTab === "functions" ? setNewFuncCode(e.target.value) : setNewAgentPrompt(e.target.value)}
                    placeholder={activeTab === "functions" ? "Escribe tu código JS aquí..." : "Eres un agente experto en..."}
                    className={`w-full min-h-[200px] bg-transparent text-sm outline-none resize-y ${activeTab === "functions" ? "text-emerald-400 font-mono" : "text-white"}`}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 shrink-0">
              <button
                type="submit"
                disabled={activeTab === "functions" ? createFunction.isPending : createAgent.isPending}
                className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                <Save size={16} />
                {activeTab === "functions" ? "Guardar Función" : "Guardar Agente"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
