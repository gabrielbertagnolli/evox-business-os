export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { getX7DataContext, summarizeX7DataContext } from "@/lib/x7/context";
import { createClient } from "@/lib/supabase/server";
import { formatSkillsAsTools, executeSkill } from "@/lib/x7/tools";
import { compressTrajectory } from "@/lib/x7/compressor";
import { mcpManager } from "@/lib/mcp/client";
import { performWebSearch } from "../functions/webSearch";
import { performWebFetch } from "../functions/webFetch";
import { runtimeRegistry } from "@/lib/agents/runtimes/registry";
import { RuntimeAgentPayload, AgentRuntimeId } from "@/lib/agents/runtimes/types";

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

// generateAIAnswer logic has been moved to src/lib/agents/runtimes/adapters/x7_native.ts

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
      model_id: body.model || null,
      updated_at: new Date().toISOString()
    });
  } else {
    // Actualizar el updated_at y model_id del chat
    await supabase.from("x7_chats").update({ 
      updated_at: new Date().toISOString(),
      model_id: body.model || null
    }).eq("id", chatId);
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
  
  // Resolve Agent/Runtime to dispatch
  const requestedProvider = body.model;
  let agentRuntimeId: AgentRuntimeId = 'x7_native';
  let agentPayload: RuntimeAgentPayload = {
    id: requestedProvider || 'default',
    name: 'Default Agent',
    systemPrompt: '',
    provider: requestedProvider || '',
    model: '',
    tools: []
  };

  if (requestedProvider) {
    const { data: customAgent } = await supabase
      .from("x7_agents")
      .select("*")
      .eq("id", requestedProvider)
      .single();
    
    if (customAgent) {
      agentRuntimeId = (customAgent.runtime as AgentRuntimeId) || 'x7_native';
      agentPayload = {
        id: customAgent.id,
        name: customAgent.name,
        systemPrompt: customAgent.system_prompt,
        provider: customAgent.provider,
        model: customAgent.model,
        tools: customAgent.skills || [],
        runtimeConfig: customAgent.runtime_config || {}
      };
    }
  }

  const chatPayload = {
    agent: agentPayload,
    messages: processedMessages as any[],
    chatId: chatId,
    userId: user.id,
    context: context,
    webSearch: body.web_search
  };

  let answer: string;
  try {
    answer = await runtimeRegistry.executeChat(agentRuntimeId, chatPayload);

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
  } catch (error: any) {
    console.error("Error executing chat runtime:", error);
    return NextResponse.json({
      error: error.message || "Error interno del modelo LLM",
      chat_id: chatId
    }, { status: 500 });
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
