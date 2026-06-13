import { NextRequest, NextResponse } from "next/server";
import { getX7DataContext, summarizeX7DataContext } from "@/lib/x7/context";
import { createClient } from "@/lib/supabase/server";
import { formatSkillsAsTools, executeSkill } from "@/lib/x7/tools";
import { compressTrajectory } from "@/lib/x7/compressor";

interface X7ChatMessage {
  id?: string;
  role: "assistant" | "user";
  content: string;
}

interface OpenAIResponseOutputText {
  type: "output_text";
  text: string;
}

interface OpenAIResponseMessage {
  type: "message";
  content?: OpenAIResponseOutputText[];
}

interface OpenAIResponseBody {
  output_text?: string;
  output?: OpenAIResponseMessage[];
  error?: { message?: string };
}

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;

function normalizeMessages(value: unknown): X7ChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((message): message is X7ChatMessage => {
      if (!message || typeof message !== "object") {
        return false;
      }

      const candidate = message as Partial<X7ChatMessage>;
      return (candidate.role === "user" || candidate.role === "assistant") && typeof candidate.content === "string";
    })
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, MAX_MESSAGE_LENGTH),
    }));
}

function rankMemoryNodes(nodes: any[], query: string): any[] {
  if (!query || !nodes || nodes.length === 0) {
    return nodes.slice(0, 10);
  }
  
  const stopwords = new Set(["de", "la", "el", "que", "y", "en", "un", "para", "con", "a", "los", "las", "del", "al", "o", "no", "si", "por", "es", "me", "se", "lo"]);
  const queryWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));
    
  if (queryWords.length === 0) {
    return nodes.slice(0, 10);
  }
  
  const scored = nodes.map(node => {
    const contentLower = node.content.toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        score += 1;
      }
    }
    return { node, score };
  });
  
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.node.created_at).getTime() - new Date(a.node.created_at).getTime();
  });
  
  return scored.slice(0, 10).map(s => s.node);
}

function buildFallbackAnswer(messages: X7ChatMessage[], context: Awaited<ReturnType<typeof getX7DataContext>>) {
  const latestQuestion = messages.filter((message) => message.role === "user").at(-1)?.content ?? "";
  const summary = summarizeX7DataContext(context);
  const sourceList = summary.sourceNames.length > 0 ? summary.sourceNames.join(", ") : "ninguna fuente conectada todavía";
  const failingText = summary.failingRuns > 0 ? ` Detecté ${summary.failingRuns} ejecución(es) reciente(s) con error; conviene revisarlas antes de automatizar más.` : " No detecté errores recientes en las ejecuciones visibles.";

  return [
    `Estoy conectado al contexto configurado de Evox: ${summary.connectedSources} fuente(s) (${sourceList}), ${summary.totalAgents} agente(s) y ${summary.totalWorkflows} workflow(s).`,
    `Sobre tu consulta: “${latestQuestion.slice(0, 180)}${latestQuestion.length > 180 ? "…" : ""}”.`,
    `Lectura operativa: hay ${summary.activeAgents} agente(s) activo(s) y ${summary.activeWorkflows} workflow(s) activo(s).${failingText}`,
    "Siguiente acción sugerida: conecta una integración adicional o crea un agente dedicado si quieres que X7 vigile una métrica específica de negocio.",
  ].join("\n\n");
}

function extractOpenAIText(body: OpenAIResponseBody) {
  if (body.output_text) {
    return body.output_text;
  }

  return body.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text)
    .join("\n")
    .trim();
}

async function generateAIAnswer(userId: string, messages: X7ChatMessage[], context: Awaited<ReturnType<typeof getX7DataContext>>, requestedModelId?: string, webSearch?: boolean) {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("x7_user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  let provider = requestedModelId || settings?.active_provider || "openai";
  let modelName = settings?.active_model || process.env.X7_AI_MODEL || "gpt-4o-mini";

  // If the provider string contains a colon, split it into provider and actual modelName!
  if (provider.includes(":")) {
    const [pId, ...modelParts] = provider.split(":");
    provider = pId;
    modelName = modelParts.join(":");
  }

  let customSystemPrompt: string | null = null;
  
  let apiKey = process.env.OPENAI_API_KEY;
  let customBaseUrl: string | null = null;

  if (provider !== "openai" && provider !== "anthropic") {
    // Check if it's a Custom Agent (Modelfile)
    const { data: customAgent } = await supabase
      .from("x7_agents")
      .select("*")
      .eq("id", provider)
      .single();

    if (customAgent) {
      customSystemPrompt = customAgent.system_prompt;
      provider = customAgent.provider || "openai";
      modelName = customAgent.model || "gpt-4o-mini";
    }
  }

  if (provider === "openai" && settings?.openai_api_key) apiKey = settings.openai_api_key;
  else if (provider === "anthropic") apiKey = settings?.anthropic_api_key || process.env.ANTHROPIC_API_KEY;
  else if (provider !== "openai" && provider !== "anthropic") {
    // Es un custom provider UUID
    const { data: customProvider } = await supabase
      .from("x7_llm_providers")
      .select("*")
      .eq("id", provider)
      .single();
    
    if (customProvider) {
      customBaseUrl = customProvider.base_url;
      apiKey = customProvider.api_key || "";
    }
  }

  if (!apiKey) {
    return buildFallbackAnswer(messages, context);
  }

  // --- RAG (Retrieval-Augmented Generation) ---
  const lastUserMessage = messages.slice().reverse().find((m: any) => m.role === "user")?.content;
  let ragContext = "";
  
  if (lastUserMessage) {
    try {
      let embedEndpoint = "https://api.openai.com/v1/embeddings";
      if (customBaseUrl) {
        embedEndpoint = `${customBaseUrl.replace(/\/$/, "")}/embeddings`;
      }
      
      const embedRes = await fetch(embedEndpoint, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input: lastUserMessage, model: "text-embedding-3-small" })
      });
      
      if (embedRes.ok) {
        const embedData = await embedRes.json();
        const queryEmbedding = embedData.data[0].embedding;
        
        const { data: chunks } = await supabase.rpc("match_x7_document_chunks", {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 5
        });
        
        if (chunks && chunks.length > 0) {
          ragContext = `\n\n--- RELEVANT KNOWLEDGE BASE DOCUMENTS ---\n` + chunks.map((c: any) => `Document ID: ${c.file_id}\nContent: ${c.content}`).join("\n\n") + `\n-----------------------------------------\nUse the above documents to answer the user's question if relevant.`;
        }
      }
    } catch (err) {
      console.error("RAG Error:", err);
    }
  }

  const tools = formatSkillsAsTools(context.skills);
  
  let systemPrompt = (customSystemPrompt || [
    "Eres X7, el copiloto ejecutivo de Evox Business OS.",
    "Responde en español, con tono claro, estratégico y accionable.",
  ].join(" ")) + "\n\n" + [
    "Usa solamente el contexto de datos proporcionado por la plataforma.",
    "Si tienes herramientas (skills) disponibles, úsalas cuando el usuario pida acciones que correspondan a ellas.",
    `Contexto de fuentes y memoria a largo plazo:\n${JSON.stringify({ 
      integrations: context.integrations, 
      agents: context.agents,
      memoryNodes: rankMemoryNodes(context.memoryNodes, lastUserMessage || "")
    }, null, 2)}`,
    ragContext
  ].join(" ");
  // Inject native read_url tool (Hermes Extractor)
  tools.push({
    type: "function",
    function: {
      name: "read_url",
      description: "Extrae y lee el contenido de una URL web específica y lo devuelve en formato Markdown. Útil para leer documentación, artículos o repositorios.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "La URL completa (http/https) a leer." }
        },
        required: ["url"]
      }
    }
  });

  if (webSearch) {
    systemPrompt += "\n\n[INSTRUCCIÓN CRÍTICA]: El usuario activó explícitamente la búsqueda web. DEBES usar la herramienta 'web_search' ahora mismo antes de darle tu respuesta final.";
    
    // Inject native web_search tool
    tools.push({
      type: "function",
      function: {
        name: "web_search",
        description: "Busca informacion actualizada en internet usando un motor de busqueda. Devuelve un resumen en Markdown de los resultados mas relevantes.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "La consulta o pregunta a buscar en internet" }
          },
          required: ["query"]
        }
      }
    });
  }

  const openAiMessages: any[] = [
    { role: "system", content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  let finalAnswer = "";
  let loopCount = 0;
  const MAX_LOOPS = 5; // Evitar bucles infinitos en Serverless

  while (loopCount < MAX_LOOPS) {
    loopCount++;
    
    const requestBody: any = {
      model: modelName,
      messages: openAiMessages,
    };

    if (tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = "auto";
    }

    // Multi-LLM Routing
    let endpoint = "https://api.openai.com/v1/chat/completions";
    
    if (customBaseUrl) {
      endpoint = `${customBaseUrl.replace(/\/$/, "")}/chat/completions`;
    }

    let headers: any = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    if (provider === "anthropic") {
      endpoint = "https://api.anthropic.com/v1/messages";
      headers = {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      };
      
      requestBody.system = systemPrompt;
      requestBody.messages = messages.map(m => ({ role: m.role, content: m.content }));
      requestBody.max_tokens = 4000;
      delete requestBody.tools;
      delete requestBody.tool_choice;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const body = await response.json();

    if (!response.ok) {
      console.error("OpenAI Error:", body);
      return buildFallbackAnswer(messages, context);
    }

    let responseMessage;
    if (provider === "anthropic") {
      responseMessage = { role: "assistant", content: body.content?.[0]?.text };
    } else {
      responseMessage = body.choices?.[0]?.message;
    }
    
    if (!responseMessage) break;

    openAiMessages.push(responseMessage);

    // Si el modelo decide ejecutar una herramienta (Skill) en paralelo
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolResults = await Promise.all(
        responseMessage.tool_calls.map(async (toolCall: any) => {
          const skillName = toolCall.function.name;
          const skillId = skillName.replace("skill_", "").replace(/_/g, "-");
          
          const skillToRun = context.skills.find(s => s.id === skillId);
          let toolResult = "Skill not found or inactive";
          
          if (skillName === "web_search") {
            try {
              const args = JSON.parse(toolCall.function.arguments || "{}");
              const res = await fetch(`https://s.jina.ai/${encodeURIComponent(args.query)}`);
              toolResult = (await res.text()).substring(0, 8000);
            } catch (e: any) {
              toolResult = `Error en la búsqueda web: ${e.message}`;
            }
          } else if (skillName === "read_url") {
            try {
              const args = JSON.parse(toolCall.function.arguments || "{}");
              const res = await fetch(`https://r.jina.ai/${encodeURIComponent(args.url)}`);
              toolResult = (await res.text()).substring(0, 8000); // Limit to 8k chars to prevent context overflow
            } catch (e: any) {
              toolResult = `Error al leer la URL: ${e.message}`;
            }
          } else if (skillToRun) {
            try {
              const args = JSON.parse(toolCall.function.arguments || "{}");
              toolResult = await executeSkill(skillToRun, args);
            } catch (e: any) {
              toolResult = `Error parsing arguments: ${e.message}`;
            }
          }

          return {
            role: "tool",
            tool_call_id: toolCall.id,
            name: skillName,
            content: toolResult
          };
        })
      );

      // Agregar todos los resultados de las herramientas al historial
      openAiMessages.push(...toolResults);
      // Continuar el bucle para que el modelo lea los resultados de las herramientas
      continue;
    }

    // Si no hay más tool_calls, tenemos nuestra respuesta final
    finalAnswer = responseMessage.content;
    break;
  }

  return finalAnswer || buildFallbackAnswer(messages, context);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const messages = normalizeMessages(body.messages);

  if (messages.length === 0 || messages.at(-1)?.role !== "user") {
    return NextResponse.json({ error: "A user message is required" }, { status: 400 });
  }

  const lastUserMessage = messages.at(-1)!.content;
  let chatId = body.chat_id;
  let parentId = body.parent_id || null;

  // Si no hay chat_id, creamos un nuevo chat (Phase 8: Persistence)
  if (!chatId) {
    chatId = crypto.randomUUID();
    const title = lastUserMessage.length > 40 ? lastUserMessage.substring(0, 40) + "..." : lastUserMessage;
    await supabase.from("x7_chats").insert({
      id: chatId,
      user_id: user.id,
      title: title,
      updated_at: new Date().toISOString()
    });
  } else {
    // Actualizar el updated_at del chat
    await supabase.from("x7_chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId);
  }

  // Guardar el mensaje del usuario en el árbol
  const userMessageId = crypto.randomUUID();
  await supabase.from("x7_messages").insert({
    id: userMessageId,
    chat_id: chatId,
    user_id: user.id,
    parent_id: parentId,
    role: "user",
    content: lastUserMessage
  });

  // Fetch and apply active 'filter' functions (Phase 9)
  const { data: filterFunctions } = await supabase
    .from("x7_functions")
    .select("content")
    .eq("user_id", user.id)
    .eq("type", "filter")
    .eq("is_active", true);

  let processedMessages = [...messages];
  if (filterFunctions && filterFunctions.length > 0) {
    for (const func of filterFunctions) {
      try {
        const filterExecution = new Function("messages", `
          ${func.content};
          if (typeof filter === 'function') {
            return filter(messages);
          }
          return messages;
        `);
        processedMessages = filterExecution(processedMessages);
      } catch (err) {
        console.error("Error executing pre-filter:", err);
      }
    }
  }

  const context = await getX7DataContext(user.id);
  let answer = await generateAIAnswer(user.id, processedMessages, context, body.model, body.web_search);

  // Apply post-filters
  if (filterFunctions && filterFunctions.length > 0) {
    for (const func of filterFunctions) {
      try {
        const postFilterExecution = new Function("answer", `
          ${func.content};
          if (typeof postFilter === 'function') {
            return postFilter(answer);
          }
          return answer;
        `);
        answer = postFilterExecution(answer);
      } catch (err) {
        console.error("Error executing post-filter:", err);
      }
    }
  }

  // Intentar comprimir la trayectoria asíncronamente (Long-term memory)
  compressTrajectory(user.id, processedMessages).catch(console.error);

  // Guardar el mensaje del asistente en el árbol
  const assistantMessageId = crypto.randomUUID();
  await supabase.from("x7_messages").insert({
    id: assistantMessageId,
    chat_id: chatId,
    user_id: user.id,
    parent_id: userMessageId,
    role: "assistant",
    content: answer
  });

  return NextResponse.json({
    chat_id: chatId,
    message: {
      id: assistantMessageId,
      parent_id: userMessageId,
      role: "assistant",
      content: answer,
      createdAt: new Date().toISOString(),
    },
    sources: context,
    summary: summarizeX7DataContext(context),
  });
}
