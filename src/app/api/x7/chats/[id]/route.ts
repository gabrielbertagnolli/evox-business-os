import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Structure a tree into flat messages array if needed by frontend or keep it as tree
function buildChatHistory(messages: any[]) {
  // OpenWebUI uses a dict of messages and a currentId
  const messagesDict: Record<string, any> = {};
  let latestMsg: any = null;

  messages.forEach(msg => {
    messagesDict[msg.id] = {
      id: msg.id,
      parentId: msg.parent_id,
      role: msg.role,
      content: msg.content,
      model: msg.model,
      feedback: msg.feedback,
      timestamp: new Date(msg.created_at).getTime() / 1000,
    };
    if (!latestMsg || new Date(msg.created_at) > new Date(latestMsg.created_at)) {
      latestMsg = msg;
    }
  });

  return {
    messages: messagesDict,
    currentId: latestMsg?.id || null
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Get Chat Metadata
  const { data: chat, error: chatError } = await supabase
    .from("x7_chats")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (chatError || !chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  // 2. Get Messages (Tree structure from DB)
  const { data: messages, error: messagesError } = await supabase
    .from("x7_messages")
    .select("*")
    .eq("chat_id", id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 });
  }

  // 3. Get Feedbacks for these messages
  const { data: feedbacks } = await supabase
    .from("x7_feedbacks")
    .select("message_id, rating")
    .eq("chat_id", id);

  const feedbackMap = new Map();
  if (feedbacks) {
    feedbacks.forEach(f => feedbackMap.set(f.message_id, f.rating));
  }

  const messagesWithFeedback = (messages || []).map(msg => ({
    ...msg,
    feedback: feedbackMap.get(msg.id) || null
  }));

  const history = buildChatHistory(messagesWithFeedback);

  const responsePayload = {
    id: chat.id,
    user_id: chat.user_id,
    title: chat.title,
    model_id: chat.model_id,
    chat: {
      title: chat.title,
      history: history
    },
    updated_at: new Date(chat.updated_at).getTime() / 1000,
    created_at: new Date(chat.created_at).getTime() / 1000,
    share_id: chat.share_id,
    archived: chat.archived,
    pinned: chat.pinned,
    meta: chat.meta,
    folder_id: chat.folder_id
  };

  return NextResponse.json(responsePayload);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("x7_chats")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
