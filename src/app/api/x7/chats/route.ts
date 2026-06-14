import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const archived = url.searchParams.get("archived") === "true";

    const { data: chats, error, count } = await supabase
      .from("x7_chats")
      .select("id, title, updated_at, created_at, folder_id, pinned, archived", { count: "exact" })
      .eq("user_id", user.id)
      .eq("archived", archived)
      .order("updated_at", { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error("[x7_chats GET] Database Error:", error);
      return NextResponse.json({ error: "Error interno en base de datos al obtener chats." }, { status: 500 });
    }

    return NextResponse.json({ items: chats || [], total: count || 0 });
  } catch (error: any) {
    console.error("[x7_chats GET] Server Error:", error);
    return NextResponse.json({ error: "Error interno del servidor.", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
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
      console.error("[x7_chats POST] Database Error:", error);
      return NextResponse.json({ error: "No se pudo crear el chat en la base de datos." }, { status: 500 });
    }

    return NextResponse.json({ id: chatId, title: title, message: "Chat created" });
  } catch (error: any) {
    console.error("[x7_chats POST] Server Error:", error);
    return NextResponse.json({ error: "Error interno del servidor.", details: error.message }, { status: 500 });
  }
}
