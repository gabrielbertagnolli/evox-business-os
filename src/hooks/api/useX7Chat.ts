import { useMutation, useQuery } from "@tanstack/react-query";

export interface X7Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
  feedback?: number | null;
}

export interface X7Summary {
  connectedSources: number;
  sourceNames: string[];
  activeAgents: number;
  totalAgents: number;
  activeWorkflows: number;
  totalWorkflows: number;
  failingRuns: number;
  latestRunStatus: string | null;
  learnedSkills: number;
  memoryNodes: number;
}

export interface X7ChatResponse {
  message: X7Message;
  summary: X7Summary;
  chat_id: string;
}

export function useX7Chat() {
  return useMutation({
    mutationFn: async ({ messages, chatId, parentId, webSearch, model }: { messages: X7Message[], chatId?: string, parentId?: string, webSearch?: boolean, model?: string }) => {
      const response = await fetch("/api/x7/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, chat_id: chatId, parent_id: parentId, web_search: webSearch, model }),
      });

      const data = (await response.json()) as X7ChatResponse & { error?: string, chat_id?: string };

      if (!response.ok) {
        const error = new Error(data.error ?? "X7 no pudo responder.");
        // Attach chat_id so the UI doesn't lose the created chat ID even if an error occurs
        (error as any).chat_id = data.chat_id;
        throw error;
      }

      return data;
    },
  });
}

export function useX7ChatDetail(chatId?: string) {
  return useQuery({
    queryKey: ["x7-chat", chatId],
    queryFn: async () => {
      if (!chatId) return null;
      const response = await fetch(`/api/x7/chats/${chatId}`);
      if (!response.ok) throw new Error("Failed to fetch chat");
      return await response.json();
    },
    enabled: !!chatId,
  });
}
