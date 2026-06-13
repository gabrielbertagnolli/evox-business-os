import { AgentRuntimeId, RuntimeAdapter, RuntimeChatPayload } from "../types";

export class ClaudeAdapter implements RuntimeAdapter {
  id: AgentRuntimeId = 'claude';
  name = 'Claude Managed Agents';

  async executeChat(payload: RuntimeChatPayload): Promise<string> {
    const config = payload.agent.runtimeConfig;
    const apiKey = config?.apiKey;
    
    if (!apiKey) {
      return "Para usar el motor de Claude Managed Agents, debes configurar tu API Key de Anthropic en los ajustes del agente.";
    }

    try {
      // Mocked standard implementation based on LAP concept
      const response = await fetch("https://api.anthropic.com/v1/managed-agents/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          agent_id: payload.agent.id,
          messages: payload.messages
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content[0]?.text || "No se recibió respuesta de Claude Managed Agents.";
    } catch (err: any) {
      return `Error al conectar con Claude Managed Agents: ${err.message}`;
    }
  }
}
