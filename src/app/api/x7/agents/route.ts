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

  const { data: agents, error } = await supabase
    .from("x7_agents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(agents);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, system_prompt, provider, model, knowledge_files, skills, avatar_url } = body;

  if (!name || !system_prompt) {
    return NextResponse.json({ error: "Name and System Prompt are required" }, { status: 400 });
  }

  const agentId = crypto.randomUUID();

  const { error } = await supabase.from("x7_agents").insert({
    id: agentId,
    user_id: user.id,
    name,
    description: description || null,
    system_prompt,
    provider: provider || "openai",
    model: model || "gpt-4o-mini",
    knowledge_files: knowledge_files || [],
    skills: skills || [],
    avatar_url: avatar_url || null,
    is_active: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: agentId, message: "Agent created successfully" });
}
