// DELETE /api/integrations/disconnect?provider=meta
// Removes an integration from the database

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROVIDERS, type ProviderId } from "@/lib/integrations/config";

export async function DELETE(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") as ProviderId | null;

  if (!provider || !PROVIDERS[provider]) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("integrations")
    .delete()
    .match({ user_id: user.id, provider });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
