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

  // Find channels where user is the owner OR user has an access grant
  // In a real SCIM setup, we would join x7_access_grants or x7_channel_members
  const { data: channels, error } = await supabase
    .from("x7_channels")
    .select("*, x7_channel_members(role, is_active, is_channel_muted, is_channel_pinned)")
    .or(`user_id.eq.${user.id}`)
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(channels);
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
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Automatically add the creator as a manager
  const memberId = crypto.randomUUID();
  await supabase.from("x7_channel_members").insert({
    id: memberId,
    channel_id: channelId,
    user_id: user.id,
    role: "manager",
    status: "joined",
    invited_by: user.id
  });

  return NextResponse.json({ id: channelId, message: "Channel created successfully" });
}
