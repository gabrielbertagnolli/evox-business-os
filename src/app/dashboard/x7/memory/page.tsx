import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Trash2, BrainCircuit } from "lucide-react";

export default async function X7MemoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-8 text-white/50">Unauthorized</div>;
  }

  const { data: memories } = await supabase
    .from("x7_memory_nodes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  async function deleteMemory(id: string) {
    "use server";
    const supabase = await createClient();
    await supabase.from("x7_memory_nodes").delete().eq("id", id);
    revalidatePath("/dashboard/x7/memory");
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
          X7 Agent
        </p>
        <h1 className="text-2xl font-semibold text-white">Long-Term Memory</h1>
        <p className="mt-1 text-sm text-white/40">
          Review and manage the facts and rules X7 has learned from past conversations.
        </p>
      </div>

      <div className="space-y-4">
        {memories?.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-sm text-white/30">
            <BrainCircuit size={32} className="mx-auto mb-4 text-white/10" />
            Memory is empty. X7 will automatically compress and learn facts as you chat.
          </div>
        ) : (
          memories?.map((memory) => (
            <div key={memory.id} className="glass rounded-xl p-5 border border-white/5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded text-white/60">
                    {memory.type}
                  </span>
                  <span className="text-xs text-white/30">
                    {new Date(memory.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {memory.content}
                </p>
              </div>
              <form action={deleteMemory.bind(null, memory.id)}>
                <button className="p-2 rounded-lg bg-white/5 text-white/30 hover:bg-red-500/20 hover:text-red-400 transition shrink-0">
                  <Trash2 size={14} />
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
