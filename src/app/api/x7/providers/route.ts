import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch custom providers
  const { data: customProviders } = await supabase
    .from("x7_llm_providers")
    .select("id, name")
    .eq("user_id", user.id);

  // Fetch custom agents (Modelfiles)
  const { data: customAgents } = await supabase
    .from("x7_agents")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("is_active", true);

  // Default models + Providers + Agents
  const providers = [
    { id: "openai", name: "OpenAI" },
    { id: "anthropic", name: "Anthropic" },
    ...(customProviders || []),
    ...(customAgents?.map(a => ({ id: a.id, name: `Agent: ${a.name}` })) || []),
  ];

  return NextResponse.json(providers);
}
