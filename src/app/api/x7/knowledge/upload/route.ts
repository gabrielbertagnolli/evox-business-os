import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const knowledgeBaseId = formData.get("knowledge_base_id") as string;

    if (!file || !knowledgeBaseId) {
      return NextResponse.json({ error: "File and knowledge_base_id are required" }, { status: 400 });
    }

    // Verify ownership of the knowledge base
    const { data: kb, error: kbError } = await supabase
      .from("x7_knowledge")
      .select("id")
      .eq("id", knowledgeBaseId)
      .eq("user_id", user.id)
      .single();

    if (kbError || !kb) {
      return NextResponse.json({ error: "Knowledge base not found or access denied" }, { status: 404 });
    }

    // Read text file content
    const textContent = await file.text();
    
    // Chunking strategy (approx 1000 characters per chunk with 200 overlap)
    const CHUNK_SIZE = 1000;
    const OVERLAP = 200;
    const chunks = [];
    
    for (let i = 0; i < textContent.length; i += (CHUNK_SIZE - OVERLAP)) {
      chunks.push(textContent.substring(i, i + CHUNK_SIZE));
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });

    // Generate Embeddings via OpenAI
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: chunks,
        model: "text-embedding-3-small"
      })
    });

    const embedData = await response.json();
    if (embedData.error) throw new Error(embedData.error.message);

    const fileId = crypto.randomUUID();
    
    // 1. Insert into x7_file
    const { error: fileError } = await supabase.from("x7_file").insert({
      id: fileId,
      user_id: user.id,
      filename: file.name,
      created_at: Date.now(),
      updated_at: Date.now()
    });
    if (fileError) throw new Error(fileError.message);

    // 2. Link file to knowledge base
    const { error: linkError } = await supabase.from("x7_knowledge_file").insert({
      id: crypto.randomUUID(),
      knowledge_id: knowledgeBaseId,
      file_id: fileId,
      user_id: user.id,
      created_at: Date.now(),
      updated_at: Date.now()
    });
    if (linkError) throw new Error(linkError.message);

    // 3. Insert chunks
    const records = chunks.map((chunk, index) => ({
      file_id: fileId,
      content: chunk,
      metadata: { source: file.name, chunk_index: index },
      embedding: embedData.data[index].embedding
    }));

    const { error: insertError } = await supabase
      .from("x7_document_chunks")
      .insert(records);

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ success: true, chunksProcessed: chunks.length, filename: file.name });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process document" }, { status: 500 });
  }
}
