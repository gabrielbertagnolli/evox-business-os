import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Key, Database, Zap, Plus, Trash2 } from "lucide-react";

export default async function X7ProvidersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-8 text-white/50">Unauthorized</div>;
  }

  // Fetch current settings
  const { data: settings } = await supabase
    .from("x7_user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch custom providers
  const { data: customProviders } = await supabase
    .from("x7_llm_providers")
    .select("*")
    .eq("user_id", user.id);

  async function saveSettings(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      active_provider: formData.get("activeProvider") as string,
      active_model: formData.get("activeModel") as string,
      openai_api_key: formData.get("openaiKey") as string,
      anthropic_api_key: formData.get("anthropicKey") as string,
    };

    await supabase
      .from("x7_user_settings")
      .upsert(payload, { onConflict: "user_id" });
      
    revalidatePath("/dashboard/settings/x7-providers");
  }

  async function addCustomProvider(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("x7_llm_providers").insert({
      user_id: user.id,
      name: formData.get("name") as string,
      base_url: formData.get("baseUrl") as string,
      api_key: formData.get("apiKey") as string,
    });
    
    revalidatePath("/dashboard/settings/x7-providers");
  }

  async function deleteCustomProvider(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const supabase = await createClient();
    await supabase.from("x7_llm_providers").delete().eq("id", id);
    revalidatePath("/dashboard/settings/x7-providers");
  }

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

      <form action={saveSettings} className="space-y-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            Active Model
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Provider</label>
              <select
                name="activeProvider"
                defaultValue={settings?.active_provider || "openai"}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
              >
                <option value="openai" className="bg-neutral-900">OpenAI (Default)</option>
                <option value="anthropic" className="bg-neutral-900">Anthropic</option>
                {customProviders?.map(p => (
                  <option key={p.id} value={p.id} className="bg-neutral-900">{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Model Name</label>
              <input
                type="text"
                name="activeModel"
                defaultValue={settings?.active_model || "gpt-4o-mini"}
                placeholder="e.g. gpt-4o or claude-3-5-sonnet"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
              />
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
                defaultValue={settings?.openai_api_key || ""}
                placeholder="sk-proj-..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30 font-mono"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Anthropic API Key</label>
              <input
                type="password"
                name="anthropicKey"
                defaultValue={settings?.anthropic_api_key || ""}
                placeholder="sk-ant-api03-..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30 font-mono"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
        >
          Save Core Configuration
        </button>
      </form>

      <hr className="border-white/10" />

      {/* Custom Providers Section */}
      <div>
        <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Database size={16} className="text-blue-400" />
          Custom Base URLs (Ollama, LMStudio, Groq, etc)
        </h2>
        
        {customProviders && customProviders.length > 0 && (
          <div className="space-y-2 mb-6">
            {customProviders.map((p) => (
              <div key={p.id} className="glass flex items-center justify-between p-4 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-white/40">{p.base_url}</p>
                </div>
                <form action={deleteCustomProvider}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className="text-red-400 hover:text-red-300 p-2">
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <form action={addCustomProvider} className="glass rounded-2xl p-6 space-y-4">
          <p className="text-xs text-white/40 mb-2">Add a new universal provider. It must be compatible with the OpenAI REST API format.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Provider Name</label>
              <input type="text" name="name" required placeholder="e.g. Local Ollama" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Base URL</label>
              <input type="url" name="baseUrl" required placeholder="http://localhost:11434/v1" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">API Key (Optional)</label>
            <input type="password" name="apiKey" placeholder="Leave empty for local setups" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" />
          </div>
          <button type="submit" className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20">
            <Plus size={16} /> Add Provider
          </button>
        </form>
      </div>

    </div>
  );
}
