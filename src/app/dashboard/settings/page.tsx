import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
          Configuration
        </p>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/40">
          Manage your workspace preferences and billing.
        </p>
      </div>

      <div className="space-y-4">
        {[
          { section: "Workspace", items: [{ name: "Name", href: "#" }, { name: "Timezone", href: "#" }, { name: "Language", href: "#" }] },
          { section: "X7 AI Agent", items: [{ name: "LLM Providers & API Keys", href: "/dashboard/settings/x7-providers" }] },
          { section: "Notifications", items: [{ name: "WhatsApp alerts", href: "#" }, { name: "Email digests", href: "#" }] },
          { section: "Billing", items: [{ name: "Plan", href: "#" }, { name: "Credits", href: "#" }] },
        ].map(({ section, items }) => (
          <div key={section} className="glass rounded-2xl p-5">
            <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
              {section}
            </h2>
            <div className="space-y-1">
              {items.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="glass-hover flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-white/5"
                  style={{ border: "1px solid transparent" }}
                >
                  <span className="text-sm text-white/60">{item.name}</span>
                  <span className="text-xs text-white/25">Configure →</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-6 flex items-center gap-3 rounded-2xl p-5"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Settings size={16} className="text-white/20" />
        <p className="text-xs text-white/30">
          More settings will be available as you add integrations and agents.
        </p>
      </div>
    </div>
  );
}
