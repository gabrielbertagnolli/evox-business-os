"use client";

import { useX7Chats } from "@/hooks/api/useX7Chats";
import { MessageSquare, Plus, Loader2, Folder, ChevronRight, Hash, ShieldCheck, Sparkles, PanelLeftClose, PanelLeftOpen, Pin } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface X7SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function X7Sidebar({ isCollapsed = false, onToggle }: X7SidebarProps) {
  const { data: chats, isLoading } = useX7Chats();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const togglePin = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const res = await fetch(`/api/x7/chats/${id}/pin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned }),
      });
      if (!res.ok) throw new Error("Error pinning chat");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["x7-chats"] });
    },
    onError: () => {
      toast.error("Error al actualizar chat");
    }
  });

  const pinnedChats = chats?.filter(c => c.pinned) || [];
  const recentChats = chats?.filter(c => !c.pinned) || [];

  return (
    <aside
      className={`flex flex-col border-r border-white/5 bg-[#0a0b0e]/50 backdrop-blur-xl transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}
      style={{
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <button
            onClick={() => router.push("/dashboard/x7")}
            className="flex flex-1 items-center justify-between rounded-xl px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/5 mr-2"
            style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2d7bff]/20 text-[#2d7bff]">
                <Sparkles size={12} />
              </span>
              Nuevo Chat
            </div>
            <Plus size={16} className="text-white/50" />
          </button>
        )}
        
        {isCollapsed && (
          <button
            onClick={() => router.push("/dashboard/x7")}
            className="flex items-center justify-center rounded-xl p-2.5 text-white transition-all hover:bg-white/5 mb-2"
            style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}
            title="Nuevo Chat"
          >
            <Plus size={16} />
          </button>
        )}

        {onToggle && (
          <button 
            onClick={onToggle}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition"
            title={isCollapsed ? "Expandir panel" : "Colapsar panel"}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'} py-2`}>
        <div className="mb-4 space-y-1">
          <Link href="/dashboard/x7/channels" className={`flex items-center gap-3 rounded-xl ${isCollapsed ? 'justify-center p-2' : 'px-3 py-2'} text-sm transition-colors ${pathname.startsWith("/dashboard/x7/channels") ? "bg-white/10 text-white font-medium" : "text-white/60 hover:bg-white/5 hover:text-white"}`} title="Canales Colaborativos">
            <Hash size={16} /> {!isCollapsed && "Canales"}
          </Link>
          <Link href="/dashboard/x7/notes" className={`flex items-center gap-3 rounded-xl ${isCollapsed ? 'justify-center p-2' : 'px-3 py-2'} text-sm transition-colors ${pathname.startsWith("/dashboard/x7/notes") ? "bg-white/10 text-white font-medium" : "text-white/60 hover:bg-white/5 hover:text-white"}`} title="Workspace de Notas">
            <Folder size={16} /> {!isCollapsed && "Notas"}
          </Link>
          <Link href="/dashboard/x7/admin" className={`flex items-center gap-3 rounded-xl ${isCollapsed ? 'justify-center p-2' : 'px-3 py-2'} text-sm transition-colors ${pathname.startsWith("/dashboard/x7/admin") ? "bg-white/10 text-white font-medium" : "text-white/60 hover:bg-white/5 hover:text-white"}`} title="Admin & Analytics">
            <ShieldCheck size={16} /> {!isCollapsed && "Admin"}
          </Link>
        </div>

        {!isCollapsed && (
          <div className="mb-2 px-3 text-xs font-semibold tracking-wider text-white/30 uppercase">
            Historial
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-white/30" size={18} />
          </div>
        ) : chats?.length === 0 ? (
          !isCollapsed && <p className="px-3 py-4 text-xs text-white/30">No hay chats recientes.</p>
        ) : (
          <div className="space-y-4">
            {pinnedChats.length > 0 && (
              <div className="space-y-1">
                {!isCollapsed && <div className="px-3 text-[10px] font-semibold text-white/20 uppercase">Fijados</div>}
                {pinnedChats.map((chat) => {
                  const isActive = pathname === `/dashboard/x7/${chat.id}`;
                  return (
                    <div key={chat.id} className="relative group flex items-center">
                      <Link
                        href={`/dashboard/x7/${chat.id}`}
                        title={isCollapsed ? chat.title : undefined}
                        className={`flex flex-1 items-center gap-3 rounded-xl ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'} text-sm transition-all ${
                          isActive
                            ? "bg-white/10 text-white font-medium"
                            : "text-white/50 hover:bg-white/5 hover:text-white/90"
                        }`}
                      >
                        <Pin size={14} className={isActive ? "text-[#2d7bff]" : "text-white/40"} />
                        {!isCollapsed && <span className="truncate">{chat.title}</span>}
                      </Link>
                      {!isCollapsed && (
                        <button 
                          onClick={() => togglePin.mutate({ id: chat.id, pinned: false })}
                          className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-md text-white/40 hover:text-white transition"
                        >
                          <Pin size={12} className="fill-current" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {recentChats.length > 0 && (
              <div className="space-y-1">
                {!isCollapsed && pinnedChats.length > 0 && <div className="px-3 text-[10px] font-semibold text-white/20 uppercase mt-4">Recientes</div>}
                {recentChats.map((chat) => {
                  const isActive = pathname === `/dashboard/x7/${chat.id}`;
                  return (
                    <div key={chat.id} className="relative group flex items-center">
                      <Link
                        href={`/dashboard/x7/${chat.id}`}
                        title={isCollapsed ? chat.title : undefined}
                        className={`flex flex-1 items-center gap-3 rounded-xl ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'} text-sm transition-all ${
                          isActive
                            ? "bg-white/10 text-white font-medium"
                            : "text-white/50 hover:bg-white/5 hover:text-white/90"
                        }`}
                      >
                        <MessageSquare size={14} className={isActive ? "text-[#2d7bff]" : "text-white/30"} />
                        {!isCollapsed && <span className="truncate">{chat.title}</span>}
                      </Link>
                      {!isCollapsed && (
                        <button 
                          onClick={() => togglePin.mutate({ id: chat.id, pinned: true })}
                          className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-md text-white/40 hover:text-white transition"
                        >
                          <Pin size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
