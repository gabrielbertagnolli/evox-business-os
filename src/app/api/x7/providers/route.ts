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

  // Fetch custom providers (including base_url and api_key)
  const { data: customProviders } = await supabase
    .from("x7_llm_providers")
    .select("id, name, base_url, api_key")
    .eq("user_id", user.id);

  // Fetch custom agents (Modelfiles)
  const { data: customAgents } = await supabase
    .from("x7_agents")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("is_active", true);

  // Get user settings to check for legacy keys
  const { data: settings } = await supabase
    .from("x7_user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const providers: { id: string; name: string }[] = [];

  // Create virtual providers if there are legacy keys or env keys and no custom provider exists for them
  const openAiKey = settings?.openai_api_key || process.env.OPENAI_API_KEY;
  if (openAiKey && !customProviders?.find(p => p.id === "openai" || p.base_url?.includes("openai.com"))) {
    customProviders?.push({
      id: "openai_virtual",
      name: "OpenAI (Virtual)",
      base_url: "https://api.openai.com/v1",
      api_key: openAiKey
    });
  }

  const anthropicKey = settings?.anthropic_api_key || process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && !customProviders?.find(p => p.id === "anthropic" || p.base_url?.includes("anthropic.com"))) {
    // Note: Anthropic doesn't exactly match the /v1/models OpenAI spec usually, but we assume it's proxy-wrapped or we manually add it.
    providers.push({ id: "anthropic_virtual:claude-3-5-sonnet-latest", name: "Anthropic: Claude 3.5 Sonnet" });
  }

  // Fetch models for each custom provider concurrently with a timeout
  if (customProviders && customProviders.length > 0) {
    const fetchPromises = customProviders.map(async (provider) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const baseUrl = provider.base_url.replace(/\/$/, "");
        const isGemini = baseUrl.includes("generativelanguage.googleapis.com") && !baseUrl.includes("/openai");

        let modelsUrl: string;
        const headers: Record<string, string> = { 
          "Content-Type": "application/json",
          "HTTP-Referer": "https://evox.app",
          "X-Title": "Evox Business OS"
        };

        const effectiveKey = provider.api_key || settings?.openai_api_key || process.env.OPENAI_API_KEY || "";

        if (isGemini) {
          modelsUrl = `${baseUrl}/models?key=${effectiveKey}`;
        } else {
          modelsUrl = `${baseUrl}/models`;
          if (effectiveKey) {
            headers["Authorization"] = `Bearer ${effectiveKey}`;
          } else if (!baseUrl.includes("localhost") && !baseUrl.includes("127.0.0.1")) {
            headers["Authorization"] = `Bearer none`;
          }
        }

        const res = await fetch(modelsUrl, {
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const body = await res.json();
        
        if (isGemini) {
          // Gemini returns { models: [{ name: "models/gemini-2.0-flash", displayName: "Gemini 2.0 Flash", ... }] }
          const geminiModels = body.models || [];
          return geminiModels
            .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
            .map((m: any) => {
              const modelId = m.name?.replace("models/", "") || m.name;
              return {
                id: `${provider.id}:${modelId}`,
                name: `${provider.name}: ${m.displayName || modelId}`,
              };
            });
        }

        // OpenAI-compatible format
        const modelsList = Array.isArray(body) ? body : (body.data || []);
        
        return modelsList.map((m: any) => {
          const modelId = m.id || m.name;
          return {
            id: `${provider.id}:${modelId}`,
            name: `${provider.name}: ${modelId}`,
          };
        });
      } catch (err) {
        console.error(`Failed to fetch models for provider ${provider.name}:`, err);
        return [
          {
            id: `${provider.id}:default`,
            name: `${provider.name} (Error al cargar modelos)`,
          },
        ];
      }
    });

    const results = await Promise.all(fetchPromises);
    for (const modelGroup of results) {
      providers.push(...modelGroup);
    }
  }

  // Add custom agents/Modelfiles
  if (customAgents && customAgents.length > 0) {
    providers.push(
      ...customAgents.map(a => ({ id: a.id, name: `Agent: ${a.name}` }))
    );
  }

  return NextResponse.json({
    providers,
    activeModel: settings?.active_model || (providers.length > 0 ? providers[0].id : "")
  });
}
