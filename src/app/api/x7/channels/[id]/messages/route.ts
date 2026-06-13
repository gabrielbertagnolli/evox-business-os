import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
      .eq("channel_id", params.id)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
        channel_id: params.id,
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
      triggerAIResponse(params.id, content, user.id);
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
    
    // Hardcoded simple AI response for now to demonstrate parity, 
    // ideally it should call OpenAI/Anthropic based on X7Settings.
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are X7, a helpful AI assistant in a team channel." },
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
