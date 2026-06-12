// GET /api/integrations/connect?provider=meta
// Initiates the OAuth flow — redirects user to provider authorization page

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROVIDERS, type ProviderId } from "@/lib/integrations/config";

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") as ProviderId | null;

  if (!provider || !PROVIDERS[provider]) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  // Must be authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const config = PROVIDERS[provider];
  const clientId = process.env[config.clientIdEnv];

  if (!clientId) {
    // Provider not configured — redirect back with error
    const url = new URL("/dashboard/integrations", req.url);
    url.searchParams.set("error", `${config.name} is not configured yet. Add ${config.clientIdEnv} to your environment.`);
    return NextResponse.redirect(url);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const redirectUri = `${appUrl}/api/integrations/callback`;

  // Build state — encodes provider + user id for CSRF protection
  const state = Buffer.from(JSON.stringify({ provider, userId: user.id })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });

  // Provider-specific scope param name
  if (config.scopes.length > 0) {
    if (provider === "slack") {
      params.set("scope", config.scopes.join(","));
    } else {
      params.set("scope", config.scopes.join(" "));
    }
  }

  // Google extras
  if (provider === "google") {
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  }

  // Notion needs response_type in a specific place
  if (provider === "notion") {
    params.set("owner", "user");
  }

  return NextResponse.redirect(`${config.authUrl}?${params.toString()}`);
}
