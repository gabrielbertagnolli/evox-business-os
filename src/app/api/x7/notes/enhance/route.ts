import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: settings } = await supabase
    .from("x7_user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const provider = settings?.active_provider || "openai";
  const modelName = settings?.active_model || process.env.X7_AI_MODEL || "gpt-4o-mini";
  
  let apiKey: string | null = null;
  let customBaseUrl: string | null = null;

  // Resolve the final provider from the database
  const { data: customProvider } = await supabase
    .from("x7_llm_providers")
    .select("*")
    .eq("id", provider)
    .single();
  
  if (customProvider) {
    customBaseUrl = customProvider.base_url;
    apiKey = customProvider.api_key || "";
  } else {
    // Virtual Providers Fallback (Legacy)
    if (provider.includes("openai")) {
      apiKey = settings?.openai_api_key || process.env.OPENAI_API_KEY || null;
      customBaseUrl = "https://api.openai.com/v1";
    } else if (provider.includes("anthropic")) {
      apiKey = settings?.anthropic_api_key || process.env.ANTHROPIC_API_KEY || null;
    }
  }

  if (!apiKey) {
    return NextResponse.json({ error: "No API key available for AI enhance" }, { status: 400 });
  }

  const { content, instruction } = await req.json();

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const systemPrompt = "Eres un asistente de redacción avanzado. Tu tarea es mejorar el siguiente texto en formato Markdown. Corrige la gramática, mejora la claridad y el flujo, y aplica el formato adecuado si es necesario. Devuelve SOLAMENTE el texto mejorado, sin introducciones ni comentarios extra.";
  const finalInstruction = instruction ? `Instrucción especial: ${instruction}\n\n` : "";
  const userPrompt = `${finalInstruction}Texto a mejorar:\n\n${content}`;

  try {
    const requestBody = {
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    };

    let endpoint = "https://api.openai.com/v1/chat/completions";
    if (customBaseUrl) {
      endpoint = `${customBaseUrl.replace(/\/$/, "")}/chat/completions`;
    }

    const aiRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI Enhance error:", errText);
      return NextResponse.json({ error: "Error from AI provider" }, { status: 500 });
    }

    const aiData = await aiRes.json();
    const enhancedContent = aiData.choices?.[0]?.message?.content || content;

    return NextResponse.json({ enhancedContent });
  } catch (error: any) {
    console.error("AI Enhance error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
