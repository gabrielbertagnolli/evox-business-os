import { NextRequest, NextResponse } from "next/dist/server/web/spec-extension/request";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

// Simple text chunker inspired by Langchain RecursiveCharacterTextSplitter
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    const chunk = text.slice(i, end);
    chunks.push(chunk);
    i += chunkSize - overlap;
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const knowledgeId = formData.get("knowledge_id") as string;

    if (!file || !knowledgeId) {
      return NextResponse.json({ error: "Missing file or knowledge_id" }, { status: 400 });
    }

    // Read text content (MVP supports txt, md, json, csv, etc)
    const textContent = await file.text();
    const chunks = chunkText(textContent);

    // Get Provider Settings for Embeddings
    const { data: settings } = await supabase
      .from("x7_user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const provider = settings?.active_provider || "openai";
    let apiKey = process.env.OPENAI_API_KEY || settings?.openai_api_key;
    let endpoint = "https://api.openai.com/v1/embeddings";

    if (provider !== "openai" && provider !== "anthropic") {
      const { data: customProvider } = await supabase
        .from("x7_llm_providers")
        .select("*")
        .eq("id", provider)
        .single();
      
      if (customProvider) {
        endpoint = `${customProvider.base_url.replace(/\/$/, "")}/embeddings`;
        apiKey = customProvider.api_key || "";
      }
    }

    if (!apiKey && provider === "openai") {
      return NextResponse.json({ error: "OpenAI API Key missing for embeddings" }, { status: 400 });
    }

    const fileId = uuidv4();
    
    // Save File Record (Open-WebUI parity)
    await supabase.from("x7_file").insert({
      id: fileId,
      user_id: user.id,
      filename: file.name,
      meta: { size: file.size, type: file.type },
      created_at: Date.now(),
      updated_at: Date.now()
    });

    // Link File to Knowledge Base
    await supabase.from("x7_knowledge_file").insert({
      id: uuidv4(),
      knowledge_id: knowledgeId,
      file_id: fileId,
      user_id: user.id,
      created_at: Date.now(),
      updated_at: Date.now()
    });

    // Generate Embeddings via OpenAI compatible endpoint
    const embeddingRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: chunks,
        model: "text-embedding-3-small" // Or your custom provider's default embedding model
      })
    });

    if (!embeddingRes.ok) {
      const err = await embeddingRes.text();
      console.error("Embedding API Error:", err);
      return NextResponse.json({ error: "Failed to generate embeddings" }, { status: 500 });
    }

    const embeddingData = await embeddingRes.json();
    const vectors = embeddingData.data;

    // Insert chunks with embeddings into pgvector
    const chunkInserts = chunks.map((chunk, index) => ({
      file_id: fileId,
      content: chunk,
      metadata: { loc: index },
      embedding: vectors[index].embedding
    }));

    const { error: chunkError } = await supabase.from("x7_document_chunks").insert(chunkInserts);

    if (chunkError) {
      console.error("Chunk Insert Error:", chunkError);
      return NextResponse.json({ error: "Failed to save document chunks" }, { status: 500 });
    }

    return NextResponse.json({ success: true, file_id: fileId, chunks_processed: chunks.length });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
