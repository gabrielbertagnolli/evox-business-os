import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// @ts-ignore
import * as pdfParse from "pdf-parse";
const pdf = (pdfParse as any).default || pdfParse;

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

    const { data: settings } = await supabase
      .from("x7_user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const provider = settings?.active_provider || "openai";
    const modelName = settings?.active_model || process.env.X7_AI_MODEL || "gpt-4o-mini";
    
    let openAiKey = settings?.openai_api_key || process.env.OPENAI_API_KEY;
    let activeApiKey = openAiKey;
    let customBaseUrl: string | null = null;
    let activeModel = modelName;

    // Resolve the final provider from the database
    const { data: customProvider } = await supabase
      .from("x7_llm_providers")
      .select("*")
      .eq("id", provider)
      .single();
    
    if (customProvider) {
      customBaseUrl = customProvider.base_url;
      activeApiKey = customProvider.api_key || "";
    } else {
      // Virtual Providers Fallback (Legacy)
      if (provider.includes("openai")) {
        activeApiKey = settings?.openai_api_key || process.env.OPENAI_API_KEY || null;
        customBaseUrl = "https://api.openai.com/v1";
      } else if (provider.includes("anthropic")) {
        activeApiKey = settings?.anthropic_api_key || process.env.ANTHROPIC_API_KEY || null;
      }
    }

    let ocrModel = "gpt-4o";
    let ocrEndpoint = "https://api.openai.com/v1/chat/completions";
    let ocrApiKey = openAiKey;
    let embedEndpoint = "https://api.openai.com/v1/embeddings";

    if (!openAiKey) {
      if (!activeApiKey) return NextResponse.json({ error: "No API key available" }, { status: 500 });
      ocrModel = activeModel;
      ocrApiKey = activeApiKey;
      if (customBaseUrl) {
        ocrEndpoint = `${customBaseUrl.replace(/\/$/, "")}/chat/completions`;
        embedEndpoint = `${customBaseUrl.replace(/\/$/, "")}/embeddings`;
      }
    }

    let textContent = "";
    
    if (file.type === "application/pdf") {
      // PDF Processing
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdf(buffer);
      textContent = pdfData.text;
    } else if (file.type.startsWith("image/")) {
      // Image OCR Processing via OpenAI Vision
      const arrayBuffer = await file.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      
      const visionRes = await fetch(ocrEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ocrApiKey}`
        },
        body: JSON.stringify({
          model: ocrModel,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Eres un motor OCR altamente preciso. Extrae y transcribe todo el texto visible en esta imagen. Devuelve únicamente el texto extraído sin introducciones ni marcas de markdown a menos que sean tablas. Si no hay texto, responde 'NO_TEXT'." },
                { type: "image_url", image_url: { url: `data:${file.type};base64,${base64Image}` } }
              ]
            }
          ]
        })
      });

      if (!visionRes.ok) throw new Error("Error performing OCR with AI provider");
      const visionData = await visionRes.json();
      textContent = visionData.choices[0].message.content || "";
      if (textContent === "NO_TEXT") textContent = "";
    } else {
      // Default plain text processing
      textContent = await file.text();
    }

    if (!textContent || textContent.trim() === "") {
      return NextResponse.json({ error: "No se pudo extraer texto del archivo (posiblemente esté vacío o sea ilegible)" }, { status: 400 });
    }

    // Chunking strategy (approx 1000 characters per chunk with 200 overlap)
    const CHUNK_SIZE = 1000;
    const OVERLAP = 200;
    const chunks = [];
    
    for (let i = 0; i < textContent.length; i += (CHUNK_SIZE - OVERLAP)) {
      chunks.push(textContent.substring(i, i + CHUNK_SIZE));
    }

    // Generate Embeddings
    const response = await fetch(embedEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ocrApiKey}`
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
