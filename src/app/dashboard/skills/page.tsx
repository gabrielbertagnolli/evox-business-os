import { Zap, Plus } from "lucide-react";

const SKILL_EXAMPLES = [
  {
    name: "Generate Ad Report",
    desc: "Pull Meta Ads data and format a performance report in one command.",
    trigger: "/report ads",
  },
  {
    name: "Qualify Lead",
    desc: "Score and tag a new lead based on CRM data and send a Slack alert.",
    trigger: "/qualify lead",
  },
  {
    name: "Daily Briefing",
    desc: "Compile overnight messages, emails, and metrics into a morning summary.",
    trigger: "/briefing",
  },
  {
    name: "Content Draft",
    desc: "Generate a LinkedIn post or video script from a topic prompt.",
    trigger: "/draft content",
  },
];

export default function SkillsPage() {
  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
            Automation
          </p>
          <h1 className="text-2xl font-semibold text-white">Skills</h1>
          <p className="mt-1 text-sm text-white/40">
            Single-command automations triggered by natural language.
          </p>
        </div>
        <button
          className="glass-hover flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition"
          style={{
            background: "rgba(168,85,247,0.12)",
            border: "1px solid rgba(168,85,247,0.25)",
          }}
        >
          <Plus size={14} />
          New Skill
        </button>
      </div>

      {/* Empty state */}
      <div
        className="mb-8 rounded-2xl px-6 py-10 text-center"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px dashed rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            background: "rgba(168,85,247,0.1)",
            border: "1px solid rgba(168,85,247,0.2)",
          }}
        >
          <Zap size={20} className="text-[#a855f7]" />
        </div>
        <p className="mb-1 font-medium text-white/80">No skills yet</p>
        <p className="mb-6 text-sm text-white/35">
          Add single-command automations to your OS.
        </p>
        <button
          className="glass-hover inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white"
          style={{
            background: "rgba(168,85,247,0.12)",
            border: "1px solid rgba(168,85,247,0.25)",
          }}
        >
          <Plus size={14} />
          Create Skill
        </button>
      </div>

      {/* Examples */}
      <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
        Examples
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {SKILL_EXAMPLES.map(({ name, desc, trigger }) => (
          <div key={name} className="glass glass-hover cursor-pointer rounded-2xl p-5 transition">
            <div className="mb-1 flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-white">{name}</p>
              <span
                className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px]"
                style={{
                  background: "rgba(168,85,247,0.1)",
                  color: "rgba(168,85,247,0.8)",
                  border: "1px solid rgba(168,85,247,0.2)",
                }}
              >
                {trigger}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-white/40">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
