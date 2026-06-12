import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROVIDERS, type ProviderId } from "@/lib/integrations/config";

export async function POST(req: NextRequest) {
  try {
    const { provider, token, accountName } = await req.json();

    if (!provider || !token || !PROVIDERS[provider as ProviderId]) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = PROVIDERS[provider as ProviderId];

    // Upsert integration record
    const { error: dbError } = await supabase
      .from("integrations")
      .upsert(
        {
          user_id: user.id,
          provider: provider as ProviderId,
          provider_account_name: accountName || "Manual Integration",
          access_token: token,
          scopes: config.scopes,
          updated_at: new Date().toISOString(),
          meta: { connection_type: "manual" }
        },
        { onConflict: "user_id,provider" }
      );

    if (dbError) {
      console.error("DB upsert failed", dbError);
      return NextResponse.json({ error: "Failed to save integration" }, { status: 500 });
    }

    return NextResponse.json({ success: true, provider });
  } catch (err) {
    console.error("Manual connection failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
