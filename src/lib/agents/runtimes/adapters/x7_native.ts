import { AgentRuntimeId, RuntimeAdapter, RuntimeChatPayload } from "../types";
import { createClient } from "@/lib/supabase/server";
import { formatSkillsAsTools, executeSkill } from "@/lib/x7/tools";
import { mcpManager } from "@/lib/mcp/client";
import { performWebSearch } from "@/app/api/x7/functions/webSearch";
import { performWebFetch } from "@/app/api/x7/functions/webFetch";

export class X7NativeAdapter implements RuntimeAdapter {
  id: AgentRuntimeId = 'x7_native';
  name = 'Evox OS Native Engine';

  private rankMemoryNodes(nodes: any[], query: string): any[] {
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

  private buildFallbackAnswer(messages: any[], context: any): string {
    const latestQuestion = messages.filter((message) => message.role === "user").at(-1)?.content ?? "";
    const activeAgents = context.agents?.filter((a: any) => a.is_active)?.length || 0;
    const failingRuns = 0; // Simplified for now
    
    return [
      `Estoy conectado al contexto configurado de Evox. Hay ${activeAgents} agente(s) activo(s).`,
      `Sobre tu consulta: “${latestQuestion.slice(0, 180)}${latestQuestion.length > 180 ? "…" : ""}”.`,
      "No pude completar la solicitud con el motor seleccionado. Verifica tu clave API y proveedor."
    ].join("\n\n");
  }

  async executeChat(payload: RuntimeChatPayload): Promise<string> {
    const { userId, messages, context, webSearch, agent } = payload;
    const supabase = await createClient();

    let provider = agent.provider || "openai";
    let modelName = agent.model || "gpt-4o-mini";
    let apiKey: string | null = null;
    let customBaseUrl: string | null = null;

    if (provider.includes(":")) {
      const [pId, ...modelParts] = provider.split(":");
      provider = pId;
      modelName = modelParts.join(":");
    }

    let customSystemPrompt = agent.systemPrompt;

    // Filter skills based on what the agent definition allowed
    let activeSkills = context.skills || [];
    if (agent.tools && agent.tools.length > 0) {
      activeSkills = activeSkills.filter((s: any) => agent.tools.includes(s.id));
    }

    // Provider check
    const { data: customProvider } = await supabase
      .from("x7_llm_providers")
      .select("*")
      .eq("id", provider)
      .single();
    
    const { data: settings } = await supabase
      .from("x7_user_settings")
      .select("*")
      .eq("user_id", userId)
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
    if (!apiKey && !customBaseUrl) {
      return this.buildFallbackAnswer(messages, context);
    }

    // Embeddings always need OpenAI Key since we hardcode text-embedding-3-small
    const embeddingsKey = settings?.openai_api_key || process.env.OPENAI_API_KEY || null;

    // RAG Context
    const lastUserMessage = messages.slice().reverse().find((m: any) => m.role === "user")?.content;
    let ragContext = "";
    
    if (lastUserMessage && embeddingsKey) {
      try {
        let embedEndpoint = "https://api.openai.com/v1/embeddings";
        if (customBaseUrl && customBaseUrl.includes("openai")) {
          embedEndpoint = `${customBaseUrl.replace(/\/$/, "")}/embeddings`;
        }
        
        const embedRes = await fetch(embedEndpoint, {
          method: "POST",
          headers: { "Authorization": `Bearer ${embeddingsKey}`, "Content-Type": "application/json" },
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
    } else if (lastUserMessage && !embeddingsKey) {
      ragContext = `\n\n[NOTA DEL SISTEMA]: La Base de Conocimientos (RAG) no pudo ser consultada porque no hay una API Key de OpenAI configurada para generar Embeddings. Si el usuario te pide buscar en sus documentos o archivos, dile cortésmente que esa función está desactivada por falta de configuración del motor de embeddings.`;
    }

    const tools = formatSkillsAsTools(activeSkills);
    
    let systemPrompt = (customSystemPrompt || [
      "Eres X7, el copiloto ejecutivo de Evox Business OS.",
      "Responde en español, con tono claro, estratégico y accionable.",
    ].join(" ")) + "\n\n" + [
      "Usa solamente el contexto de datos proporcionado por la plataforma.",
      "Si tienes herramientas (skills) disponibles, úsalas cuando el usuario pida acciones que correspondan a ellas.",
      `Contexto de fuentes y memoria a largo plazo:\n${JSON.stringify({ 
        integrations: context.integrations, 
        agents: context.agents,
        memoryNodes: this.rankMemoryNodes(context.memoryNodes || [], lastUserMessage as string || "")
      }, null, 2)}`,
      ragContext
    ].join(" ");
    
    tools.push({
      type: "function",
      function: {
        name: "read_url",
        description: "Extrae y lee el contenido de una URL web específica y lo devuelve en formato Markdown.",
        parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] }
      }
    });

    const { data: mcpServers } = await supabase
      .from("x7_mcp_servers")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (mcpServers && mcpServers.length > 0) {
      for (const server of mcpServers) {
        try {
          await mcpManager.connect(server);
          const serverTools = await mcpManager.getTools(server.id);
          for (const st of serverTools) {
            tools.push({
              type: "function",
              function: { name: `mcp_${server.id.replace(/-/g, "")}_${st.name}`, description: st.description || `Tool from MCP`, parameters: st.inputSchema as any }
            });
          }
        } catch (err) {
          console.error(`Failed MCP server ${server.name}`, err);
        }
      }
    }

    if (webSearch) {
      systemPrompt += "\n\n[INSTRUCCIÓN CRÍTICA]: DEBES usar 'web_search'.";
      tools.push({
        type: "function",
        function: { name: "web_search", description: "Busca informacion actualizada", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } }
      });
    }

    const openAiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    let finalAnswer = "";
    let loopCount = 0;

    while (loopCount < 5) {
      loopCount++;

      if (provider === "anthropic" && !customBaseUrl) {
        const anthropicMessages = messages.map(m => ({ role: m.role === "system" ? "user" : m.role, content: m.content }));
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey!,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: modelName,
            system: systemPrompt,
            messages: anthropicMessages,
            max_tokens: 4096,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          console.error("Anthropic API Error:", await response.text());
          return this.buildFallbackAnswer(messages, context);
        }

        const body = await response.json();
        finalAnswer = body.content?.[0]?.text || "";
        break; // Tools not supported in this simple shim
      }
      
      const requestBody: any = {
        model: modelName,
        messages: openAiMessages,
        temperature: 0.7,
      };

      if (tools.length > 0) {
        requestBody.tools = tools;
        requestBody.tool_choice = "auto";
      }

      let endpoint = "https://api.openai.com/v1/chat/completions";
      if (customBaseUrl) endpoint = `${customBaseUrl.replace(/\/$/, "")}/chat/completions`;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI API Error:`, errorText);
        return this.buildFallbackAnswer(messages, context);
      }

      const body = await response.json();
      const responseMessage = body.choices?.[0]?.message;
      if (!responseMessage) break;

      openAiMessages.push(responseMessage);

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolResults = await Promise.all(
          responseMessage.tool_calls.map(async (toolCall: any) => {
            const skillName = toolCall.function.name;
            const skillId = skillName.replace("skill_", "").replace(/_/g, "-");
            const skillToRun = activeSkills.find((s: any) => s.id === skillId);
            let toolResult = "Skill not found or inactive";
            
            if (skillName === "web_search") {
              const args = JSON.parse(toolCall.function.arguments || "{}");
              toolResult = await performWebSearch(args.query, process.env.FIRECRAWL_API_KEY);
            } else if (skillName === "read_url") {
              const args = JSON.parse(toolCall.function.arguments || "{}");
              toolResult = await performWebFetch(args.url, process.env.FIRECRAWL_API_KEY);
            } else if (skillName.startsWith("mcp_")) {
              try {
                const args = JSON.parse(toolCall.function.arguments || "{}");
                const matches = skillName.match(/^mcp_([a-f0-9]{32})_(.+)$/);
                if (matches) {
                  const serverId = `${matches[1].slice(0,8)}-${matches[1].slice(8,12)}-${matches[1].slice(12,16)}-${matches[1].slice(16,20)}-${matches[1].slice(20)}`;
                  const mcpRes = await mcpManager.callTool(serverId, matches[2], args);
                  toolResult = JSON.stringify(mcpRes.content);
                }
              } catch (e: any) { toolResult = `Error MCP: ${e.message}`; }
            } else if (skillToRun) {
              const args = JSON.parse(toolCall.function.arguments || "{}");
              toolResult = await executeSkill(skillToRun, args);
            }

            return { role: "tool", tool_call_id: toolCall.id, name: skillName, content: toolResult };
          })
        );
        openAiMessages.push(...toolResults);
        continue;
      }

      finalAnswer = responseMessage.content;
      break;
    }

    return finalAnswer || this.buildFallbackAnswer(messages, context);
  }
}
