import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // SEC-FIX: Validate explicitly that the user is an admin or reject it.
  // For now, we block this endpoint strictly to prevent data exposure of system-wide stats.
  const adminEmails = ["evoxuser@example.com", "admin@evox.com"]; // Replace with env variable in production
  if (!user.email || !adminEmails.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
  }
  
  try {
    const [{ count: usersCount }, { count: chatsCount }, { count: messagesCount }, { count: agentsCount }] = await Promise.all([
      supabase.from("x7_settings").select("*", { count: "exact", head: true }),
      supabase.from("x7_chats").select("*", { count: "exact", head: true }),
      supabase.from("x7_messages").select("*", { count: "exact", head: true }),
      supabase.from("x7_agents").select("*", { count: "exact", head: true })
    ]);

    const { data: messages } = await supabase.from("x7_messages").select("content").limit(1000);
    let estimatedTokens = 0;
    if (messages) {
        estimatedTokens = messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);
    }

    let vectorDbOk = true;
    try {
      const { error } = await supabase.from("x7_agents").select("id").limit(1);
      if (error) vectorDbOk = false;
    } catch {
      vectorDbOk = false;
    }

    let hasProviders = false;
    try {
      const { data: providersList } = await supabase.from("x7_llm_providers").select("id").limit(1);
      if (providersList && providersList.length > 0) hasProviders = true;
    } catch {
      hasProviders = false;
    }

    let pistonOk = true;
    try {
      const pRes = await fetch("https://emkc.org/api/v2/piston/runtimes", { method: "HEAD", next: { revalidate: 60 } });
      if (!pRes.ok) pistonOk = false;
    } catch {
      pistonOk = false;
    }

    return NextResponse.json({
      totalUsers: usersCount || 1,
      totalChats: chatsCount || 0,
      totalMessages: messagesCount || 0,
      totalAgents: agentsCount || 0,
      estimatedTokens,
      estimatedCost: (estimatedTokens / 1000) * 0.002,
      health: {
        modelApi: hasProviders || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY ? "Operativo" : "Faltan Proveedores",
        vectorDb: vectorDbOk ? "Operativo" : "Error de Conexión",
        piston: pistonOk ? "Conectado (Piston)" : "Desconectado"
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
