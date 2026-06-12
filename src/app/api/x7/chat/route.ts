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

async function generateAIAnswer(userId: string, messages: X7ChatMessage[], context: Awaited<ReturnType<typeof getX7DataContext>>) {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("x7_user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  const provider = settings?.active_provider || "openai";
  const modelName = settings?.active_model || process.env.X7_AI_MODEL || "gpt-4o-mini";
  
  let apiKey = process.env.OPENAI_API_KEY;
  let customBaseUrl: string | null = null;

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

  const tools = formatSkillsAsTools(context.skills);
  
  const systemPrompt = [
    "Eres X7, el copiloto ejecutivo de Evox Business OS.",
    "Responde en español, con tono claro, estratégico y accionable.",
    "Usa solamente el contexto de datos proporcionado por la plataforma.",
    "Si tienes herramientas (skills) disponibles, úsalas cuando el usuario pida acciones que correspondan a ellas.",
    `Contexto de fuentes y memoria a largo plazo:\n${JSON.stringify({ 
      integrations: context.integrations, 
      agents: context.agents,
      memoryNodes: context.memoryNodes // Inyectar memoria a largo plazo al contexto
    }, null, 2)}`
  ].join(" ");

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

    // Si el modelo decide ejecutar una herramienta (Skill)
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      for (const toolCall of responseMessage.tool_calls) {
        const skillName = toolCall.function.name;
        const skillId = skillName.replace("skill_", "").replace(/_/g, "-");
        
        const skillToRun = context.skills.find(s => s.id === skillId);
        let toolResult = "Skill not found or inactive";
        
        if (skillToRun) {
          try {
            const args = JSON.parse(toolCall.function.arguments || "{}");
            toolResult = await executeSkill(skillToRun, args);
          } catch (e: any) {
            toolResult = `Error parsing arguments: ${e.message}`;
          }
        }

        // Agregar el resultado de la herramienta al historial
        openAiMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: skillName,
          content: toolResult
        });
      }
      // Continuar el bucle para que el modelo lea el resultado de la herramienta
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

  const context = await getX7DataContext(user.id);
  const answer = await generateAIAnswer(user.id, messages, context);

  // Intentar comprimir la trayectoria asíncronamente
  compressTrajectory(user.id, messages).catch(console.error);

  return NextResponse.json({
    message: {
      id: crypto.randomUUID(),
      role: "assistant",
      content: answer,
      createdAt: new Date().toISOString(),
    },
    sources: context,
    summary: summarizeX7DataContext(context),
  });
}
