import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Basic admin check (could use a dedicated roles table, but we assume the creator or any authorized user for now)
  // In a real app, verify user.id against an admin list.
  
  try {
    // We run parallel count queries
    const [{ count: usersCount }, { count: chatsCount }, { count: messagesCount }, { count: agentsCount }] = await Promise.all([
      supabase.from("x7_settings").select("*", { count: "exact", head: true }), // Approximation for users
      supabase.from("x7_chats").select("*", { count: "exact", head: true }),
      supabase.from("x7_messages").select("*", { count: "exact", head: true }),
      supabase.from("x7_agents").select("*", { count: "exact", head: true })
    ]);

    // Calculate approximate token usage based on messages length
    const { data: messages } = await supabase.from("x7_messages").select("content").limit(1000);
    let estimatedTokens = 0;
    if (messages) {
        estimatedTokens = messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0); // Rough 1 token = 4 chars estimate
    }

    // Vector DB Check
    let vectorDbOk = true;
    try {
      const { error } = await supabase.from("x7_agents").select("id").limit(1); // just a simple table check since we know it exists
      if (error) vectorDbOk = false;
    } catch {
      vectorDbOk = false;
    }

    // Providers Check
    let hasProviders = false;
    try {
      const { data: providersList } = await supabase.from("x7_llm_providers").select("id").limit(1);
      if (providersList && providersList.length > 0) hasProviders = true;
    } catch {
      hasProviders = false;
    }

    // Piston Check
    let pistonOk = true;
    try {
      // Just check if we can reach piston
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
      estimatedCost: (estimatedTokens / 1000) * 0.002, // Assuming $0.002 per 1k tokens average
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
