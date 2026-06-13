import { AgentRuntimeId, RuntimeAdapter, RuntimeChatPayload } from "../types";

export class HermesAdapter implements RuntimeAdapter {
  id: AgentRuntimeId = 'hermes';
  name = 'Hermes Agent';

  async executeChat(payload: RuntimeChatPayload): Promise<string> {
    const config = payload.agent.runtimeConfig;
    const apiKey = config?.apiKey;
    
    if (!apiKey) {
      return "Para usar el motor de Hermes, debes configurar tu API Key en los ajustes del agente.";
    }

    try {
      const response = await fetch("https://api.hermes-ai.com/v1/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          agent_id: payload.agent.id,
          messages: payload.messages
        })
      });

      if (!response.ok) {
        throw new Error(`Hermes API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.output || "No se recibió respuesta de Hermes.";
    } catch (err: any) {
      return `Error al conectar con Hermes Agent: ${err.message}`;
    }
  }
}
