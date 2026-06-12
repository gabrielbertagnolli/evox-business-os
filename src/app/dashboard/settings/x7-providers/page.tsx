import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Key, Database, Zap } from "lucide-react";

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

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
          X7 Config
        </p>
        <h1 className="text-2xl font-semibold text-white">LLM Providers & API Keys</h1>
        <p className="mt-1 text-sm text-white/40">
          Configure which AI model powers X7 and provide your own API keys.
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
                <option value="openai" className="bg-neutral-900">OpenAI</option>
                <option value="anthropic" className="bg-neutral-900">Anthropic</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Model Name</label>
              <input
                type="text"
                name="activeModel"
                defaultValue={settings?.active_model || "gpt-4o-mini"}
                placeholder="e.g. gpt-4o or claude-3-5-sonnet-20240620"
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
          <p className="text-xs text-white/40 mb-6">
            Leave blank to use Evox default keys (if available on your plan). 
            If provided, X7 will use these keys to query the models.
          </p>

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
          Save Configuration
        </button>
      </form>
    </div>
  );
}
