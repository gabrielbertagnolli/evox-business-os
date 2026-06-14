"use client";

import { useState, useTransition, useRef } from "react";
import { Key, Database, Zap, Plus, Trash2, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { saveUserSettings, addCustomProvider, deleteCustomProvider } from "@/actions/x7-providers";
import { useQuery } from "@tanstack/react-query";

interface ProvidersClientPageProps {
  initialSettings: any;
  initialCustomProviders: any[];
}

export default function ProvidersClientPage({ initialSettings, initialCustomProviders }: ProvidersClientPageProps) {
  const [isSavingSettings, startSavingSettings] = useTransition();
  const [isAddingProvider, startAddingProvider] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedModel, setSelectedModel] = useState(initialSettings?.active_model || "");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: providersData } = useQuery({
    queryKey: ["x7-providers"],
    queryFn: async () => {
      const res = await fetch("/api/x7/providers");
      return await res.json();
    }
  });

  const providers = providersData?.providers || [];
  const selectedModelName = providers.find((p: any) => p.id === selectedModel)?.name || selectedModel;

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startSavingSettings(async () => {
      try {
        await saveUserSettings({
          activeProvider: formData.get("activeProvider") as string,
          activeModel: formData.get("activeModel") as string,
          openaiKey: formData.get("openaiKey") as string,
          anthropicKey: formData.get("anthropicKey") as string,
        });
        toast.success("Configuración principal guardada correctamente.");
      } catch (err: any) {
        toast.error("Error al guardar la configuración: " + err.message);
      }
    });
  };

  const handleTestConnection = async () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const url = formData.get("baseUrl") as string;
    const key = formData.get("apiKey") as string;

    if (!url) {
      toast.error("Por favor ingresa la Base URL para verificar.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/x7/providers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, key }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error verificando conexión");
      }
      toast.success(
        `¡Conexión verificada con éxito! Se encontraron ${data.modelsCount} modelos: ${data.models.slice(0, 3).join(", ")}${
          data.modelsCount > 3 ? "..." : ""
        }`
      );
    } catch (err: any) {
      toast.error(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddProvider = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startAddingProvider(async () => {
      try {
        await addCustomProvider({
          name: formData.get("name") as string,
          baseUrl: formData.get("baseUrl") as string,
          apiKey: formData.get("apiKey") as string,
        });
        toast.success("Proveedor personalizado añadido correctamente.");
        form.reset();
      } catch (err: any) {
        toast.error("Error al añadir el proveedor: " + err.message);
      }
    });
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm("¿Eliminar este proveedor personalizado?")) return;
    setDeletingId(id);
    try {
      await deleteCustomProvider(id);
      toast.success("Proveedor eliminado correctamente.");
    } catch (err: any) {
      toast.error("Error al eliminar el proveedor: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };


  return (
    <div className="mx-auto max-w-3xl px-8 py-10 space-y-8">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
          X7 Config
        </p>
        <h1 className="text-2xl font-semibold text-white">LLM Providers & API Keys</h1>
        <p className="mt-1 text-sm text-white/40">
          Configure which AI model powers X7 and provide your own API keys or Base URLs.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            Active Model
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Provider</label>
              <select
                name="activeProvider"
                defaultValue={initialSettings?.active_provider || "openai"}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
              >
                <option value="openai" className="bg-[#14151a]">OpenAI (Default)</option>
                <option value="anthropic" className="bg-[#14151a]">Anthropic</option>
                {initialCustomProviders.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#14151a]">{p.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="mb-1.5 block text-xs font-medium text-white/60">Model Name</label>
              <input type="hidden" name="activeModel" value={selectedModel} />
              
              <button 
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
              >
                <span className="truncate">{selectedModelName}</span>
                <ChevronDown size={16} className="text-white/50" />
              </button>
              
              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-y-auto rounded-xl bg-[#14151a] border border-white/10 shadow-2xl z-50 py-1">
                  <div className="sticky top-0 bg-[#14151a] p-2 border-b border-white/5 z-10">
                    <input 
                      type="text" 
                      placeholder="Buscar modelo..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#2d7bff]"
                    />
                  </div>
                  {providers?.filter((p: any) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.id?.toLowerCase().includes(searchQuery.toLowerCase())).map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedModel(p.id); setIsModelDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors ${selectedModel === p.id ? "text-[#2d7bff]" : "text-white/80"}`}
                    >
                      {p.name}
                    </button>
                  ))}
                  {providers?.filter((p: any) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.id?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-sm text-white/40 text-center">No se encontraron modelos</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Key size={16} />
            API Keys (Bring Your Own Key)
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">OpenAI API Key</label>
              <input
                type="password"
                name="openaiKey"
                defaultValue={initialSettings?.openai_api_key || ""}
                placeholder="sk-proj-..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30 font-mono"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Anthropic API Key</label>
              <input
                type="password"
                name="anthropicKey"
                defaultValue={initialSettings?.anthropic_api_key || ""}
                placeholder="sk-ant-api03-..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30 font-mono"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSavingSettings}
          className="flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
        >
          {isSavingSettings && <Loader2 size={14} className="animate-spin" />}
          Guardar Configuración Principal
        </button>
      </form>

      <hr className="border-white/10" />

      {/* Custom Providers Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-white flex items-center gap-2">
          <Database size={16} className="text-blue-400" />
          Custom Base URLs (Ollama, LMStudio, Groq, etc)
        </h2>
        
        {initialCustomProviders.length > 0 && (
          <div className="space-y-2">
            {initialCustomProviders.map((p) => (
              <div key={p.id} className="glass flex items-center justify-between p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-white/40">{p.base_url}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteProvider(p.id)}
                  disabled={deletingId === p.id}
                  className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  {deletingId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            ))}
          </div>
        )}

        <form ref={formRef} onSubmit={handleAddProvider} className="glass rounded-2xl p-6 space-y-4 border border-white/5">
          <p className="text-xs text-white/40 mb-2">Añade un nuevo proveedor universal. Debe ser compatible con el formato de API REST de OpenAI.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Provider Name</label>
              <input type="text" name="name" required placeholder="e.g. Local Ollama" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Base URL</label>
              <input type="url" name="baseUrl" required placeholder="http://mi-ollama-local:11434/v1" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">API Key (Opcional)</label>
            <input type="password" name="apiKey" placeholder="Dejar en blanco para configuraciones locales" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30" />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isAddingProvider}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-all disabled:opacity-50"
            >
              {isAddingProvider ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Añadir Proveedor
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isVerifying}
              className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              {isVerifying ? <Loader2 size={16} className="animate-spin" /> : null}
              Probar Conexión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
