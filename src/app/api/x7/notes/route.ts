import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  let dbQuery = supabase
    .from("x7_notes")
    .select("id, title, updated_at, is_pinned, tags")
    .eq("user_id", user.id)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (query) {
    dbQuery = dbQuery.ilike("title", `%${query}%`);
  }

  const { data: notes, error } = await dbQuery;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, content, tags } = body;

  const noteId = crypto.randomUUID();

  const { error } = await supabase.from("x7_notes").insert({
    id: noteId,
    user_id: user.id,
    title: title || "Sin título",
    content: content || "",
    tags: tags || [],
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: noteId, message: "Note created successfully" });
}
