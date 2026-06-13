import { AgentRuntimeId, RuntimeAdapter, RuntimeChatPayload } from "../types";

export class CursorAdapter implements RuntimeAdapter {
  id: AgentRuntimeId = 'cursor';
  name = 'Cursor Agents API';

  async executeChat(payload: RuntimeChatPayload): Promise<string> {
    const config = payload.agent.runtimeConfig;
    const apiKey = config?.apiKey;
    
    if (!apiKey) {
      return "Para usar el motor de Cursor, debes configurar tu API Key de Cursor en los ajustes del agente.";
    }

    const lastMessage = payload.messages[payload.messages.length - 1];

    try {
      const response = await fetch("https://api.cursor.so/v1/agents/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          agent_id: payload.agent.id,
          prompt: lastMessage.content
        })
      });

      if (!response.ok) {
        throw new Error(`Cursor API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || "No se recibió respuesta de Cursor.";
    } catch (err: any) {
      return `Error al conectar con Cursor: ${err.message}`;
    }
  }
}
