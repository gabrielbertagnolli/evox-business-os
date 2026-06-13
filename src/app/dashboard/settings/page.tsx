import { createClient } from "@/lib/supabase/server";
import { Settings, Save } from "lucide-react";
import { updateWorkspaceSettings } from "@/actions/settings";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }

  // Get current settings (fallback if not created/updated in db yet)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("workspace_name, timezone, language, whatsapp_alerts, email_digests")
    .eq("user_id", user.id)
    .single();

  const workspaceName = profile?.workspace_name ?? "My Workspace";
  const timezone = profile?.timezone ?? "UTC";
  const language = profile?.language ?? "es";
  const whatsappAlerts = profile?.whatsapp_alerts ?? false;
  const emailDigests = profile?.email_digests ?? false;

  return (
    <form action={updateWorkspaceSettings} className="mx-auto max-w-3xl px-8 py-10 space-y-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
            Configuration
          </p>
          <h1 className="text-2xl font-semibold text-white">Settings</h1>
          <p className="mt-1 text-sm text-white/40">
            Manage your workspace preferences and billing.
          </p>
        </div>
        <button
          type="submit"
          className="glass-hover flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
        >
          <Save size={14} />
          Save Changes
        </button>
      </div>

      <div className="space-y-4">
        {/* Section 1: Workspace */}
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
            Workspace
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Workspace Name</label>
              <input
                type="text"
                name="workspaceName"
                defaultValue={workspaceName}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 outline-none transition focus:border-white/30"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Timezone</label>
                <select
                  name="timezone"
                  defaultValue={timezone}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
                >
                  <option value="UTC" className="bg-[#14151a]">UTC</option>
                  <option value="America/Argentina/Buenos_Aires" className="bg-[#14151a]">America/Argentina/Buenos_Aires</option>
                  <option value="America/Sao_Paulo" className="bg-[#14151a]">America/Sao_Paulo</option>
                  <option value="America/New_York" className="bg-[#14151a]">America/New_York</option>
                  <option value="Europe/London" className="bg-[#14151a]">Europe/London</option>
                  <option value="Europe/Madrid" className="bg-[#14151a]">Europe/Madrid</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Language</label>
                <select
                  name="language"
                  defaultValue={language}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/30"
                >
                  <option value="es" className="bg-[#14151a]">Español (es)</option>
                  <option value="en" className="bg-[#14151a]">English (en)</option>
                  <option value="pt" className="bg-[#14151a]">Português (pt)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: X7 AI Agent */}
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
            X7 AI Agent
          </h2>
          <a
            href="/dashboard/settings/x7-providers"
            className="glass-hover flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-white/5"
            style={{ border: "1px solid transparent" }}
          >
            <span className="text-sm text-white/60">LLM Providers & API Keys</span>
            <span className="text-xs text-white/25">Configure →</span>
          </a>
        </div>

        {/* Section 3: Notifications */}
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
            Notifications
          </h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-white/5 cursor-pointer">
              <span className="text-sm text-white/60">WhatsApp alerts</span>
              <input
                type="checkbox"
                name="whatsappAlerts"
                defaultChecked={whatsappAlerts}
                className="rounded border-white/10 bg-white/5 text-[#2d7bff] outline-none"
              />
            </label>
            <label className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-white/5 cursor-pointer">
              <span className="text-sm text-white/60">Email digests</span>
              <input
                type="checkbox"
                name="emailDigests"
                defaultChecked={emailDigests}
                className="rounded border-white/10 bg-white/5 text-[#2d7bff] outline-none"
              />
            </label>
          </div>
        </div>

        {/* Section 4: Billing */}
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
            Billing
          </h2>
          <div className="space-y-1">
            <div className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-white/60">
              <span>Plan</span>
              <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">Starter Free</span>
            </div>
            <div className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-white/60">
              <span>Credits</span>
              <span className="text-xs text-white/45">$1.00 USD remaining</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl p-5"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Settings size={16} className="text-white/20" />
        <p className="text-xs text-white/30">
          Save your changes to apply updates to your workspace environment.
        </p>
      </div>
    </form>
  );
}
