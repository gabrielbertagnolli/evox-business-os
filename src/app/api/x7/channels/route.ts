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

    const { data: channels, error } = await supabase
      .from("x7_channels")
      .select("*, x7_channel_members(role, is_active, is_channel_muted, is_channel_pinned)")
      .or(`user_id.eq.${user.id}`)
      .is("deleted_at", null)
      .is("archived_at", null)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[x7_channels GET] Database Error:", error);
      return NextResponse.json({ error: "Error al obtener canales de la base de datos." }, { status: 500 });
    }

    return NextResponse.json(channels || []);
  } catch (error: any) {
    console.error("[x7_channels GET] Server Error:", error);
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
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { name, description, type, is_private, data, meta } = body;
    const channelId = crypto.randomUUID();

    const { error: insertError } = await supabase.from("x7_channels").insert({
      id: channelId,
      user_id: user.id,
      type: type || "group",
      name,
      description: description || null,
      is_private: is_private || false,
      data: data || {},
      meta: meta || {},
    });

    if (insertError) {
      console.error("[x7_channels POST] Database Error on channel insert:", insertError);
      return NextResponse.json({ error: "Error al crear el canal en la base de datos." }, { status: 500 });
    }

    const memberId = crypto.randomUUID();
    const { error: memberError } = await supabase.from("x7_channel_members").insert({
      id: memberId,
      channel_id: channelId,
      user_id: user.id,
      role: "manager",
      status: "joined",
      invited_by: user.id
    });

    if (memberError) {
        console.error("[x7_channels POST] Warning: could not add initial member:", memberError);
        // We do not fail the request completely if the channel was created, but log it.
    }

    return NextResponse.json({ id: channelId, message: "Channel created successfully" });
  } catch (error: any) {
    console.error("[x7_channels POST] Server Error:", error);
    return NextResponse.json({ error: "Error interno del servidor.", details: error.message }, { status: 500 });
  }
}
