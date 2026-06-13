import { AgentRuntimeId, RuntimeAdapter, RuntimeChatPayload } from "../types";

export class DeepAgentsAdapter implements RuntimeAdapter {
  id: AgentRuntimeId = 'deepagents';
  name = 'DeepAgents';

  async executeChat(payload: RuntimeChatPayload): Promise<string> {
    const config = payload.agent.runtimeConfig;
    const apiKey = config?.apiKey;
    
    if (!apiKey) {
      return "Para usar el motor de DeepAgents, debes configurar tu API Key en los ajustes del agente.";
    }

    try {
      const response = await fetch("https://api.deepagents.ai/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          agent: payload.agent.id,
          messages: payload.messages
        })
      });

      if (!response.ok) {
        throw new Error(`DeepAgents API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message || "No se recibió respuesta de DeepAgents.";
    } catch (err: any) {
      return `Error al conectar con DeepAgents: ${err.message}`;
    }
  }
}
