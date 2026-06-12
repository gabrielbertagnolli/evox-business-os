import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Database, Plus, Trash2, Folder, File as FileIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default async function KnowledgePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-8 text-white/50">Unauthorized</div>;
  }

  const { data: knowledgeBases } = await supabase
    .from("x7_knowledge")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  async function addKnowledgeBase(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("x7_knowledge").insert({
      id: uuidv4(),
      user_id: user.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      created_at: Date.now(),
      updated_at: Date.now()
    });
    
    revalidatePath("/dashboard/x7/knowledge");
  }

  async function deleteKnowledgeBase(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const supabase = await createClient();
    await supabase.from("x7_knowledge").delete().eq("id", id);
    revalidatePath("/dashboard/x7/knowledge");
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-10 space-y-8">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-white/30 uppercase">
          X7 Workspace
        </p>
        <h1 className="text-2xl font-semibold text-white">Knowledge Bases (RAG)</h1>
        <p className="mt-1 text-sm text-white/40">
          Upload documents and group them into Knowledge Bases. X7 will intelligently search them to answer your questions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar: Add new KB */}
        <div className="col-span-1 space-y-6">
          <form action={addKnowledgeBase} className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              <Plus size={16} /> New Knowledge Base
            </h2>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Name</label>
              <input type="text" name="name" required placeholder="e.g. Employee Handbook" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Description (Optional)</label>
              <textarea name="description" placeholder="What kind of documents are here?" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none h-20 resize-none" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90">
              Create Collection
            </button>
          </form>
        </div>

        {/* Main: List KBs */}
        <div className="col-span-2 space-y-4">
          {knowledgeBases?.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-white/40 text-sm">
              No Knowledge Bases found. Create one to get started.
            </div>
          ) : (
            knowledgeBases?.map(kb => (
              <div key={kb.id} className="glass rounded-2xl p-6 relative group overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      <Folder size={18} className="text-blue-400" />
                      {kb.name}
                    </h3>
                    {kb.description && <p className="text-sm text-white/40 mt-1">{kb.description}</p>}
                  </div>
                  <form action={deleteKnowledgeBase}>
                    <input type="hidden" name="id" value={kb.id} />
                    <button type="submit" className="text-red-400/50 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-white/5">
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>

                <div className="bg-black/20 -mx-6 -mb-6 p-4 mt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="text-xs text-white/40 flex items-center gap-2">
                    <Database size={14} />
                    Ready for uploads (API route pending)
                  </div>
                  <button disabled className="text-xs font-medium text-white/30 bg-white/5 px-3 py-1.5 rounded border border-white/5 cursor-not-allowed">
                    Upload File
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
