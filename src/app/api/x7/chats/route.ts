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

  // Get query params for pagination or filtering
  const url = new URL(req.url);
  const skip = parseInt(url.searchParams.get("skip") || "0", 10);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const archived = url.searchParams.get("archived") === "true";

  // Fetch chats
  const { data: chats, error, count } = await supabase
    .from("x7_chats")
    .select("id, title, updated_at, created_at, folder_id, pinned, archived", { count: "exact" })
    .eq("user_id", user.id)
    .eq("archived", archived)
    .order("updated_at", { ascending: false })
    .range(skip, skip + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: chats, total: count || 0 });
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
  const chatId = body.id || crypto.randomUUID();
  const title = body.title || "New Chat";

  const { error } = await supabase.from("x7_chats").insert({
    id: chatId,
    user_id: user.id,
    title: title,
    system_prompt: body.system_prompt || null,
    model_id: body.model_id || null,
    meta: body.meta || {}
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: chatId, title: title, message: "Chat created" });
}
