export type CoreMessage = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
};

export type AgentRuntimeId = 
  | 'x7_native' 
  | 'cursor' 
  | 'claude' 
  | 'opencode' 
  | 'deepagents' 
  | 'hermes';

export interface AgentRuntimeConfig {
  apiKey?: string;
  baseUrl?: string;
  [key: string]: any;
}

export interface RuntimeAgentPayload {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  provider: string;
  tools: any[];
  runtimeConfig?: AgentRuntimeConfig;
}

export interface RuntimeChatPayload {
  agent: RuntimeAgentPayload;
  messages: CoreMessage[];
  chatId: string;
  userId: string;
  context: any; // the X7 data context
  webSearch?: boolean;
}

export interface RuntimeAdapter {
  id: AgentRuntimeId;
  name: string;
  
  /**
   * Initializes or creates an agent session remotely if the runtime requires it.
   */
  createSession?(agent: RuntimeAgentPayload, chatId: string): Promise<string>;

  /**
   * Executes the chat request using the remote runtime.
   * Returns a standard text response.
   */
  executeChat(payload: RuntimeChatPayload): Promise<string>;
}
