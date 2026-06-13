import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Plus, Code2, Trash2, Power, PowerOff } from "lucide-react";

export default async function X7SkillsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-8 text-white/50">Unauthorized</div>;
  }

  const { data: skills } = await supabase
    .from("x7_skills")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  async function addSkill(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("x7_skills").insert({
      user_id: user.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      code_payload: formData.get("codePayload") as string,
      is_active: true,
    });
    revalidatePath("/dashboard/x7/skills");
  }

  async function toggleSkill(id: string, currentStatus: boolean) {
    "use server";
    const supabase = await createClient();
    await supabase.from("x7_skills").update({ is_active: !currentStatus }).eq("id", id);
    revalidatePath("/dashboard/x7/skills");
  }

  async function deleteSkill(id: string) {
    "use server";
    const supabase = await createClient();
    await supabase.from("x7_skills").delete().eq("id", id);
    revalidatePath("/dashboard/x7/skills");
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
          X7 Agent
        </p>
        <h1 className="text-2xl font-semibold text-white">Skills</h1>
        <p className="mt-1 text-sm text-white/40">
          Define custom Javascript tools that X7 can execute autonomously.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {skills?.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-white/30">
              No skills configured yet. Add your first skill.
            </div>
          ) : (
            skills?.map((skill) => (
              <div key={skill.id} className="glass rounded-2xl p-6 relative group border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      <Code2 size={16} className="text-white/40" />
                      {skill.name}
                    </h3>
                    <p className="text-sm text-white/50 mt-1">{skill.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={toggleSkill.bind(null, skill.id, skill.is_active)}>
                      <button className={`p-2 rounded-lg transition ${skill.is_active ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>
                        {skill.is_active ? <Power size={14} /> : <PowerOff size={14} />}
                      </button>
                    </form>
                    <form action={deleteSkill.bind(null, skill.id)}>
                      <button className="p-2 rounded-lg bg-white/5 text-white/30 hover:bg-red-500/20 hover:text-red-400 transition">
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>
                </div>
                <div className="bg-black/50 rounded-lg p-4 overflow-x-auto border border-white/5">
                  <pre className="text-xs text-green-400/80 font-mono">
                    {skill.code_payload}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="glass rounded-2xl p-6 h-fit border border-white/5">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Plus size={16} />
            Add New Skill
          </h2>
          <form action={addSkill} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Function Name</label>
              <input
                name="name"
                type="text"
                placeholder="e.g. calculate_metrics"
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 outline-none transition focus:border-white/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Description</label>
              <input
                name="description"
                type="text"
                placeholder="Describe when the AI should use this..."
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 outline-none transition focus:border-white/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Javascript Payload</label>
              <textarea
                name="codePayload"
                rows={8}
                placeholder="return { status: 'success', data: args.input };"
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-green-400/80 font-mono placeholder-white/20 outline-none transition focus:border-white/30"
              />
              <p className="text-[10px] text-white/30 mt-1">Write the function body. Available variables: `args`.</p>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Save Skill
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
