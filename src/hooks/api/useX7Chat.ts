import { useMutation } from "@tanstack/react-query";

export interface X7Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
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
}

export function useX7Chat() {
  return useMutation({
    mutationFn: async (messages: X7Message[]) => {
      const response = await fetch("/api/x7/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      const data = (await response.json()) as X7ChatResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "X7 no pudo responder.");
      }

      return data;
    },
  });
}
