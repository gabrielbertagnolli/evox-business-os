"use client";

import { useX7Chats } from "@/hooks/api/useX7Chats";
import { MessageSquare, Plus, Loader2, Folder, ChevronRight, Hash } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function X7Sidebar() {
  const { data: chats, isLoading } = useX7Chats();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className="flex w-64 flex-col border-r border-white/5 bg-[#0a0b0e]/50 backdrop-blur-xl"
      style={{
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="p-4">
        <button
          onClick={() => router.push("/dashboard/x7")}
          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/5"
          style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2d7bff]/20 text-[#2d7bff]">
              <SparklesIcon size={12} />
            </span>
            Nuevo Chat
          </div>
          <Plus size={16} className="text-white/50" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="mb-4 space-y-1">
          <Link href="/dashboard/x7/channels" className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${pathname.startsWith("/dashboard/x7/channels") ? "bg-white/10 text-white font-medium" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
            <Hash size={16} /> Canales Colaborativos
          </Link>
          <Link href="/dashboard/x7/notes" className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${pathname.startsWith("/dashboard/x7/notes") ? "bg-white/10 text-white font-medium" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
            <Folder size={16} /> Workspace de Notas
          </Link>
        </div>

        <div className="mb-2 px-3 text-xs font-semibold tracking-wider text-white/30 uppercase">
          Historial
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-white/30" size={18} />
          </div>
        ) : chats?.length === 0 ? (
          <p className="px-3 py-4 text-xs text-white/30">No hay chats recientes.</p>
        ) : (
          <div className="space-y-1">
            {chats?.map((chat) => {
              const isActive = pathname === `/dashboard/x7/${chat.id}`;
              return (
                <Link
                  key={chat.id}
                  href={`/dashboard/x7/${chat.id}`}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                    isActive
                      ? "bg-white/10 text-white font-medium"
                      : "text-white/50 hover:bg-white/5 hover:text-white/90"
                  }`}
                >
                  <MessageSquare size={14} className={isActive ? "text-[#2d7bff]" : "text-white/30"} />
                  <span className="truncate">{chat.title}</span>
                </Link>
              );
            })}
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
