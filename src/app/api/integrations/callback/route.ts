// GET /api/integrations/callback?code=...&state=...
// Handles the OAuth callback — exchanges code for tokens, saves to DB

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROVIDERS, type ProviderId } from "@/lib/integrations/config";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;

  const redirectBase = `${appUrl}/dashboard/integrations`;

  if (errorParam) {
    return NextResponse.redirect(`${redirectBase}?error=${encodeURIComponent(errorParam)}`);
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${redirectBase}?error=missing_params`);
  }

  // Decode state
  let provider: ProviderId;
  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    provider = decoded.provider;
    userId = decoded.userId;
  } catch {
    return NextResponse.redirect(`${redirectBase}?error=invalid_state`);
  }

  if (!PROVIDERS[provider]) {
    return NextResponse.redirect(`${redirectBase}?error=unknown_provider`);
  }

  // Validate session still matches
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  const config = PROVIDERS[provider];
  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${redirectBase}?error=provider_not_configured`);
  }

  const redirectUri = `${appUrl}/api/integrations/callback`;

  // Exchange code for tokens
  let tokens: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  };

  try {
    const body = new URLSearchParams({
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    };

    // Some providers use Basic auth, others client_id/secret in body
    if (provider === "slack" || provider === "notion") {
      headers["Authorization"] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    } else {
      body.set("client_id", clientId);
      body.set("client_secret", clientSecret);
    }

    const tokenRes = await fetch(config.tokenUrl, {
      method: "POST",
      headers,
      body: body.toString(),
    });

    tokens = await tokenRes.json();
    if (!tokens.access_token) {
      throw new Error("No access_token in response");
    }
  } catch (err) {
    console.error("Token exchange failed", err);
    return NextResponse.redirect(`${redirectBase}?error=token_exchange_failed`);
  }

  // Fetch profile info
  let accountId: string | null = null;
  let accountName: string | null = null;

  try {
    if (config.profileUrl) {
      let profileUrl = config.profileUrl;
      // HubSpot profile needs access token appended
      if (provider === "hubspot") profileUrl += tokens.access_token;

      const profileHeaders: Record<string, string> = {
        Authorization: `Bearer ${tokens.access_token}`,
        "User-Agent": "Evox/1.0",
      };

      // Slack profile endpoint
      if (provider === "slack") {
        const slackTokens = tokens as unknown as { authed_user?: { access_token?: string }; team?: { id?: string; name?: string } };
        accountId = slackTokens.team?.id ?? null;
        accountName = slackTokens.team?.name ?? null;
      } else {
        const profileRes = await fetch(profileUrl, { headers: profileHeaders });
        const profile = await profileRes.json();

        if (provider === "meta") {
          accountId = profile.id;
          accountName = profile.name;
        } else if (provider === "google") {
          accountId = profile.id;
          accountName = profile.name || profile.email;
        } else if (provider === "linkedin") {
          accountId = profile.id;
          accountName = [profile.localizedFirstName, profile.localizedLastName].filter(Boolean).join(" ");
        } else if (provider === "github") {
          accountId = String(profile.id);
          accountName = profile.name || profile.login;
        } else if (provider === "notion") {
          accountId = profile.owner?.user?.id ?? profile.bot_id ?? null;
          accountName = profile.owner?.user?.name ?? profile.workspace_name ?? null;
        } else if (provider === "hubspot") {
          accountId = String(profile.hub_id ?? profile.user_id ?? "");
          accountName = profile.hub_domain || profile.user || null;
        }
      }
    }
  } catch {
    // Profile fetch failing is non-fatal
  }

  // Compute expiry
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  // Upsert integration record
  const { error: dbError } = await supabase
    .from("integrations")
    .upsert(
      {
        user_id: user.id,
        provider,
        provider_account_id: accountId,
        provider_account_name: accountName,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: expiresAt,
        scopes: config.scopes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

  if (dbError) {
    console.error("DB upsert failed", dbError);
    return NextResponse.redirect(`${redirectBase}?error=db_error&details=${encodeURIComponent(dbError.message)}`);
  }

  return NextResponse.redirect(`${redirectBase}?connected=${provider}`);
}
