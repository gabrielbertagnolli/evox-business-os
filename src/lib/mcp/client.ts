import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface McpServerConfig {
  id: string;
  name: string;
  type: "stdio" | "sse";
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export class McpConnectionManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();

  async connect(config: McpServerConfig): Promise<Client> {
    if (this.clients.has(config.id)) {
      return this.clients.get(config.id)!;
    }

    if (config.type === "stdio") {
      const env: Record<string, string> = {};
      for (const [k, v] of Object.entries(process.env)) {
        if (v !== undefined) env[k] = v;
      }
      if (config.env) {
        Object.assign(env, config.env);
      }

      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env
      });

      const client = new Client(
        { name: "evox-business-os", version: "1.0.0" },
        { capabilities: {} }
      );

      await client.connect(transport);
      
      this.transports.set(config.id, transport);
      this.clients.set(config.id, client);

      return client;
    }

    throw new Error(`Unsupported MCP server type: ${config.type}`);
  }

  async getTools(serverId: string) {
    const client = this.clients.get(serverId);
    if (!client) throw new Error("Server not connected");
    
    const res = await client.listTools();
    return res.tools;
  }

  async callTool(serverId: string, toolName: string, args: any) {
    const client = this.clients.get(serverId);
    if (!client) throw new Error("Server not connected");

    return await client.callTool({
      name: toolName,
      arguments: args
    });
  }

  async disconnect(serverId: string) {
    const transport = this.transports.get(serverId);
    if (transport) {
      await transport.close();
      this.transports.delete(serverId);
    }
    this.clients.delete(serverId);
  }

  async disconnectAll() {
    for (const serverId of this.clients.keys()) {
      await this.disconnect(serverId);
    }
  }
}

// Global instance to reuse connections in dev mode and across requests
export const mcpManager = new McpConnectionManager();
