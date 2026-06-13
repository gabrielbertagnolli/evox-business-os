"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Upload, FileText, Trash2, Code2, Bot, Loader2, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AgentBuilderPage({ params }: { params: { id: string } }) {
  const isNew = params.id === "new";
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [knowledgeFiles, setKnowledgeFiles] = useState<any[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch agent if not new
  const { isLoading: isLoadingAgent } = useQuery({
    queryKey: ["x7-agent", params.id],
    queryFn: async () => {
      if (isNew) return null;
      const res = await fetch(`/api/x7/agents/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch agent");
      const data = await res.json();
      setName(data.name || "");
      setDescription(data.description || "");
      setSystemPrompt(data.system_prompt || "");
      setProvider(data.provider || "openai");
      setModel(data.model || "gpt-4o-mini");
      setKnowledgeFiles(data.knowledge_files || []);
      setSelectedSkills(data.skills || []);
      return data;
    },
    enabled: !isNew
  });

  // Fetch available skills
  const { data: availableSkills, isLoading: isLoadingSkills } = useQuery({
    queryKey: ["x7-skills"],
    queryFn: async () => {
      const res = await fetch("/api/x7/skills"); // Note: We might need to ensure this endpoint exists or mock it if it doesn't
      if (!res.ok) return [];
      return await res.json();
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Extract text content from supported files
      if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.csv')) {
        const text = await file.text();
        setKnowledgeFiles(prev => [...prev, {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          content: text // Full-content injection
        }]);
        toast.success(`Archivo ${file.name} cargado correctamente.`);
      } else {
        toast.error(`El archivo ${file.name} no es un formato de texto soportado (.txt, .md, .csv).`);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setKnowledgeFiles(prev => prev.filter(f => f.id !== id));
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
  };

  const saveAgent = async () => {
    if (!name || !systemPrompt) {
      toast.error("El nombre y el System Prompt son requeridos.");
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = {
        name,
        description,
        system_prompt: systemPrompt,
        provider,
        model,
        knowledge_files: knowledgeFiles,
        skills: selectedSkills
      };

      const url = isNew ? "/api/x7/agents" : `/api/x7/agents/${params.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Error al guardar el agente");

      toast.success(isNew ? "Agente creado con éxito" : "Agente actualizado");
      queryClient.invalidateQueries({ queryKey: ["x7-agents"] });
      
      if (isNew) {
        const data = await res.json();
        router.push(`/dashboard/x7?agentId=${data.id}`);
      } else {
        router.push(`/dashboard/x7?agentId=${params.id}`);
      }
    } catch (err) {
      toast.error("Error al guardar el agente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingAgent && !isNew) return <div className="p-8 text-white/50 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Cargando agente...</div>;

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0b0e] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0b0e]/80 backdrop-blur-md border-b border-white/5 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/x7/workspace" className="p-2 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <Bot size={20} className="text-[#2d7bff]" />
              {isNew ? "Crear Nuevo Agente" : "Editar Agente"}
            </h1>
            <p className="text-xs text-white/40 mt-0.5">Configura el comportamiento, conocimiento y herramientas del agente.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(isNew ? "/dashboard/x7/workspace" : `/dashboard/x7?agentId=${params.id}`)}
            className="px-4 py-2 text-sm text-white/50 hover:text-white transition"
          >
            Cancelar
          </button>
          <button
            onClick={saveAgent}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-[#2d7bff] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#2d7bff]/90 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isNew ? "Crear y Probar" : "Guardar Cambios"}
          </button>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main config column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-5">
            <h2 className="text-sm font-medium text-white/80 flex items-center gap-2 mb-2">
              <Sparkles size={16} /> Identidad y Comportamiento
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Nombre del Agente</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Asistente Legal"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#2d7bff]/50 focus:outline-none focus:ring-1 focus:ring-[#2d7bff]/50 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Descripción Breve</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ej: Experto en revisión de contratos"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#2d7bff]/50 focus:outline-none focus:ring-1 focus:ring-[#2d7bff]/50 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">System Prompt (Instrucciones)</label>
              <textarea
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                placeholder="Eres un agente especializado en... Debes responder siempre en español y mantener un tono profesional..."
                className="w-full h-64 resize-none rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-[#2d7bff]/50 focus:outline-none focus:ring-1 focus:ring-[#2d7bff]/50 transition font-mono leading-relaxed"
              />
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white/80 flex items-center gap-2">
                <FileText size={16} /> Conocimiento (Contexto Inyectado)
              </h2>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 text-white/60 px-3 py-1.5 rounded-lg transition"
              >
                <Upload size={14} /> Subir Archivo
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                multiple 
                accept=".txt,.md,.csv,.json"
                className="hidden" 
              />
            </div>
            
            <p className="text-xs text-white/40 mb-4">
              Sube archivos de texto (.txt, .md, .csv) para inyectarlos permanentemente en el contexto del agente. El modelo leerá su contenido en cada interacción.
            </p>

            {knowledgeFiles.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2">
                <FileText size={24} className="text-white/20" />
                <p className="text-sm text-white/30">No hay archivos vinculados.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {knowledgeFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5 group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5 text-[#2d7bff]">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{file.name}</p>
                        <p className="text-xs text-white/40">{(file.size / 1024).toFixed(1)} KB • Extracción de texto completa</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(file.id)}
                      className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-5">
            <h2 className="text-sm font-medium text-white/80 flex items-center gap-2 mb-4">
              <Code2 size={16} /> Herramientas (Skills)
            </h2>
            <p className="text-xs text-white/40 mb-4">
              Selecciona qué Skills personalizadas puede ejecutar este agente de forma autónoma.
            </p>

            {isLoadingSkills ? (
              <div className="text-xs text-white/30 text-center py-4">Cargando skills...</div>
            ) : availableSkills?.length === 0 ? (
              <div className="text-xs text-white/30 text-center py-4 border border-white/5 rounded-xl bg-black/20">
                No hay skills disponibles. Crea una primero en el Workspace.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {availableSkills?.map((skill: any) => (
                  <div 
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      selectedSkills.includes(skill.id) 
                        ? 'bg-[#2d7bff]/10 border-[#2d7bff]/30' 
                        : 'bg-black/30 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition ${
                        selectedSkills.includes(skill.id)
                          ? 'bg-[#2d7bff] border-[#2d7bff]'
                          : 'border-white/20'
                      }`}>
                        {selectedSkills.includes(skill.id) && <X size={12} className="text-white" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${selectedSkills.includes(skill.id) ? 'text-white' : 'text-white/70'}`}>
                          {skill.name}
                        </p>
                        <p className="text-xs text-white/40 mt-1 line-clamp-2">{skill.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
