import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data: messages, error } = await supabase
      .from("x7_channel_messages")
      .select(`
        id,
        content,
        role,
        created_at,
        user_id,
        user:user_id(email)
      `)
      .eq("channel_id", id)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from("x7_channel_messages")
      .insert({
        channel_id: id,
        user_id: user.id,
        content,
        role: "user"
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // AI Mention logic (Mentions @x7)
    if (content.toLowerCase().includes("@x7")) {
      // Non-blocking trigger AI response
      triggerAIResponse(id, content, user.id);
    }

    return NextResponse.json(message);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Background AI generator function
async function triggerAIResponse(channelId: string, userMessage: string, userId: string) {
  try {
    const supabase = await createClient();
    
    // Get user active provider settings
    const { data: settings } = await supabase
      .from("x7_user_settings")
      .select("*")
      .eq("user_id", userId)
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
      if (provider.includes("openai")) {
        apiKey = settings?.openai_api_key || process.env.OPENAI_API_KEY || null;
        customBaseUrl = "https://api.openai.com/v1";
      } else if (provider.includes("anthropic")) {
        apiKey = settings?.anthropic_api_key || process.env.ANTHROPIC_API_KEY || null;
      }
    }

    if (!apiKey) return;

    let endpoint = "https://api.openai.com/v1/chat/completions";
    if (customBaseUrl) {
      endpoint = `${customBaseUrl.replace(/\/$/, "")}/chat/completions`;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: "Eres X7, un asistente de IA útil en el canal de equipo de Evox." },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || "No pude generar una respuesta.";

    await supabase.from("x7_channel_messages").insert({
      channel_id: channelId,
      user_id: userId, // Using same user ID but with assistant role, or we could use a dedicated bot uuid
      content: aiText,
      role: "assistant"
    });

  } catch (error) {
    console.error("AI trigger error:", error);
  }
}
