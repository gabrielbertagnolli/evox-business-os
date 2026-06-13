import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface X7Channel {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_private: boolean;
  updated_at: string;
  x7_channel_members: { role: string; is_active: boolean }[];
}

export function useX7Channels() {
  return useQuery({
    queryKey: ["x7-channels"],
    queryFn: async () => {
      const response = await fetch("/api/x7/channels");
      if (!response.ok) throw new Error("Failed to fetch channels");
      return (await response.json()) as X7Channel[];
    },
  });
}

export function useCreateX7Channel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; is_private?: boolean }) => {
      const response = await fetch("/api/x7/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create channel");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["x7-channels"] });
    },
  });
}
