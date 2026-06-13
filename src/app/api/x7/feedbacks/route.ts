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

  const body = await req.json();
  const { chat_id, message_id, rating, comment, meta } = body;

  const feedbackId = crypto.randomUUID();

  // Upsert feedback
  const { error } = await supabase
    .from("x7_feedbacks")
    .upsert({
      id: feedbackId,
      user_id: user.id,
      chat_id,
      message_id,
      rating, // 1 for upvote, -1 for downvote
      comment: comment || null,
      meta: meta || {},
      updated_at: new Date().toISOString()
    }, { onConflict: "message_id, user_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Feedback submitted successfully" });
}
