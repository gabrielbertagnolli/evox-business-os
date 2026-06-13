import { AgentRuntimeId, RuntimeAdapter, RuntimeChatPayload } from "../types";

export class OpenCodeAdapter implements RuntimeAdapter {
  id: AgentRuntimeId = 'opencode';
  name = 'OpenCode Agents';

  async executeChat(payload: RuntimeChatPayload): Promise<string> {
    const config = payload.agent.runtimeConfig;
    const baseUrl = config?.baseUrl || process.env.OPENCODE_API_URL || "http://127.0.0.1:8000";
    
    try {
      const response = await fetch(`${baseUrl}/v1/agents/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: payload.agent.id,
          messages: payload.messages
        })
      });

      if (!response.ok) {
        throw new Error(`OpenCode API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || "No se recibió respuesta de OpenCode.";
    } catch (err: any) {
      return `Error al conectar con OpenCode Agents: ${err.message}`;
    }
  }
}
