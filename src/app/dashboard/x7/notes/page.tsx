"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, FileText, Pin, Check, X, Save, Loader2, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { toast } from "sonner";

export default function NotesWorkspacePage() {
  const queryClient = useQueryClient();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: notes, isLoading } = useQuery({
    queryKey: ["x7-notes"],
    queryFn: async () => {
      const res = await fetch("/api/x7/notes");
      if (!res.ok) throw new Error("Error fetching notes");
      return await res.json();
    }
  });

  const createNote = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/x7/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nueva Nota", content: "" })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al crear la nota");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      // Optimistically add the new note to cache immediately
      queryClient.setQueryData(["x7-notes"], (oldNotes: any[] | undefined) => {
        const newNote = {
          id: data.id,
          title: "Nueva Nota",
          content: "",
          is_pinned: false,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          tags: []
        };
        return oldNotes ? [newNote, ...oldNotes] : [newNote];
      });
      queryClient.invalidateQueries({ queryKey: ["x7-notes"] });
      setActiveNoteId(data.id);
      setDraftTitle("Nueva Nota");
      setDraftContent("");
      setIsEditing(true);
      toast.success("Nota creada correctamente.");
    },
    onError: (err: any) => {
      toast.error(err.message || "No se pudo crear la nota. Verifica que la base de datos esté configurada.");
    }
  });

  const updateNote = useMutation({
    mutationFn: async (data: { id: string, title?: string, content?: string, is_pinned?: boolean }) => {
      const res = await fetch(`/api/x7/notes/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al guardar la nota");
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      // Optimistically update the note in the cache list
      queryClient.setQueryData(["x7-notes"], (oldNotes: any[] | undefined) => {
        if (!oldNotes) return [];
        return oldNotes.map((note) => {
          if (note.id === variables.id) {
            return {
              ...note,
              ...variables,
              updated_at: new Date().toISOString()
            };
          }
          return note;
        });
      });
      queryClient.invalidateQueries({ queryKey: ["x7-notes"] });
      toast.success("Nota guardada correctamente.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al guardar la nota.");
    }
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/x7/notes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al eliminar la nota");
      }
      return await res.json();
    },
    onSuccess: (_, id) => {
      // Optimistically remove the deleted note from the cache list
      queryClient.setQueryData(["x7-notes"], (oldNotes: any[] | undefined) => {
        if (!oldNotes) return [];
        return oldNotes.filter((note) => note.id !== id);
      });
      queryClient.invalidateQueries({ queryKey: ["x7-notes"] });
      setActiveNoteId(null);
      toast.success("Nota eliminada correctamente.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al eliminar la nota.");
    }
  });

  const enhanceWithAI = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/x7/notes/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      if (!res.ok) {
        throw new Error("Error al mejorar con IA");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      setDraftContent(data.enhancedContent);
      toast.success("Texto mejorado con AI.");
    },
    onError: () => {
      toast.error("Error al comunicarse con el modelo de AI.");
    }
  });

  const activeNote = notes?.find((n: any) => n.id === activeNoteId);

  const handleSave = () => {
    if (activeNoteId) {
      updateNote.mutate({ id: activeNoteId, title: draftTitle, content: draftContent });
      setIsEditing(false);
    }
  };

  const handleSelectNote = (note: any) => {
    setActiveNoteId(note.id);
    setDraftTitle(note.title);
    setDraftContent(note.content || "");
    setIsEditing(false);
  };

  return (
    <div className="flex h-full w-full bg-[#0a0b0e]">
      {/* Sidebar List */}
      <div className="w-80 border-r border-white/5 flex flex-col" style={{ borderRight: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="p-4 flex items-center justify-between border-b border-white/5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-white font-semibold flex items-center gap-2"><FileText size={18} /> Notes</h2>
          <button 
            onClick={() => createNote.mutate()}
            disabled={createNote.isPending}
            className="p-1.5 bg-white/10 text-white rounded hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isLoading ? (
            <p className="text-xs text-white/30 p-2">Cargando...</p>
          ) : notes?.length === 0 ? (
            <p className="text-xs text-white/30 p-2 text-center mt-4">No hay notas creadas.</p>
          ) : notes?.map((note: any) => (
            <button
              key={note.id}
              onClick={() => handleSelectNote(note)}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group ${activeNoteId === note.id ? "bg-white/10" : "hover:bg-white/5"}`}
            >
              <FileText size={16} className={`mt-0.5 shrink-0 ${activeNoteId === note.id ? "text-emerald-400" : "text-white/30"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm truncate font-medium ${activeNoteId === note.id ? "text-white" : "text-white/70"}`}>
                    {note.title}
                  </p>
                  {note.is_pinned && <Pin size={10} className="text-amber-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-white/30 mt-1">
                  {new Date(note.updated_at).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {activeNoteId ? (
          <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full p-8">
            <div className="flex items-center justify-between mb-8">
              {isEditing ? (
                <input 
                  type="text" 
                  value={draftTitle} 
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="text-3xl font-semibold bg-transparent text-white outline-none w-full border-b border-white/20 pb-2 focus:border-emerald-400/50 transition-colors"
                  placeholder="Título de la nota"
                />
              ) : (
                <h1 className="text-3xl font-semibold text-white">{activeNote?.title}</h1>
              )}

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => updateNote.mutate({ id: activeNoteId, is_pinned: !activeNote?.is_pinned })}
                  className={`p-2 rounded-lg transition-colors ${activeNote?.is_pinned ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:bg-white/10 hover:text-white"}`}
                  title={activeNote?.is_pinned ? "Desfijar" : "Fijar nota"}
                >
                  <Pin size={18} />
                </button>

                {isEditing ? (
                  <>
                    <button 
                      onClick={() => enhanceWithAI.mutate(draftContent)} 
                      disabled={enhanceWithAI.isPending || draftContent.trim().length === 0}
                      className="flex items-center gap-2 px-3 py-2 bg-[#2d7bff]/20 text-[#2d7bff] hover:bg-[#2d7bff]/30 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                      title="Reescribir y mejorar con AI"
                    >
                      {enhanceWithAI.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      <span className="hidden sm:inline">Mejorar con AI</span>
                    </button>
                    <button onClick={() => setIsEditing(false)} className="p-2 text-white/40 hover:bg-white/10 hover:text-white rounded-lg transition-colors ml-2">
                      <X size={18} />
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors font-medium text-sm">
                      <Save size={16} /> Guardar
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setDraftTitle(activeNote.title); setDraftContent(activeNote.content || ""); setIsEditing(true); }} className="p-2 text-white/40 hover:bg-white/10 hover:text-white rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => { if(confirm("¿Eliminar nota?")) deleteNote.mutate(activeNoteId) }}
                      className="p-2 text-white/40 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-12">
              {isEditing ? (
                <textarea 
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="w-full h-full min-h-[500px] bg-transparent text-white/80 resize-none outline-none leading-relaxed"
                  placeholder="Escribe tu contenido en Markdown aquí..."
                />
              ) : (
                <div className="prose prose-invert prose-emerald max-w-none">
                  {activeNote?.content ? (
                    <MarkdownRenderer content={activeNote.content} />
                  ) : (
                    <div className="text-white/40 italic">No hay contenido.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <FileText size={32} className="text-white/20" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">Workspace de Notas</h2>
            <p className="text-white/40 max-w-sm mb-6">
              Crea notas, borradores o documentos técnicos. X7 puede leer y editar estas notas si le das permiso.
            </p>
            <button 
              onClick={() => createNote.mutate()}
              disabled={createNote.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {createNote.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              Crear tu primera nota
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
