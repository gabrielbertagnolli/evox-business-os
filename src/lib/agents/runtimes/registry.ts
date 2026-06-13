import { AgentRuntimeId, RuntimeAdapter, RuntimeChatPayload } from "./types";
import { X7NativeAdapter } from "./adapters/x7_native";
import { CursorAdapter } from "./adapters/cursor";
import { ClaudeAdapter } from "./adapters/claude";
import { OpenCodeAdapter } from "./adapters/opencode";
import { DeepAgentsAdapter } from "./adapters/deepagents";
import { HermesAdapter } from "./adapters/hermes";

export class RuntimeRegistry {
  private adapters: Map<AgentRuntimeId, RuntimeAdapter> = new Map();

  constructor() {
    this.registerAdapter(new X7NativeAdapter());
    this.registerAdapter(new CursorAdapter());
    this.registerAdapter(new ClaudeAdapter());
    this.registerAdapter(new OpenCodeAdapter());
    this.registerAdapter(new DeepAgentsAdapter());
    this.registerAdapter(new HermesAdapter());
  }

  public registerAdapter(adapter: RuntimeAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  public getAdapter(id: AgentRuntimeId): RuntimeAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new Error(`Runtime adapter not found for id: ${id}`);
    }
    return adapter;
  }

  public async executeChat(runtimeId: AgentRuntimeId, payload: RuntimeChatPayload): Promise<string> {
    const adapter = this.getAdapter(runtimeId);
    return adapter.executeChat(payload);
  }
}

export const runtimeRegistry = new RuntimeRegistry();
