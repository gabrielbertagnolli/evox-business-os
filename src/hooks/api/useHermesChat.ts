import { useMutation } from "@tanstack/react-query";

export interface HermesMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
}

export interface HermesSummary {
  connectedSources: number;
  sourceNames: string[];
  activeAgents: number;
  totalAgents: number;
  activeWorkflows: number;
  totalWorkflows: number;
  failingRuns: number;
  latestRunStatus: string | null;
}

export interface HermesChatResponse {
  message: HermesMessage;
  summary: HermesSummary;
}

export function useHermesChat() {
  return useMutation({
    mutationFn: async (messages: HermesMessage[]) => {
      const response = await fetch("/api/hermes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      const data = (await response.json()) as HermesChatResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Hermes no pudo responder.");
      }

      return data;
    },
  });
}
