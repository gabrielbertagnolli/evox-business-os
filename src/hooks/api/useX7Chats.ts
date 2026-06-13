import { useQuery } from "@tanstack/react-query";

export interface X7ChatMeta {
  id: string;
  title: string;
  folder_id: string | null;
  pinned: boolean;
  archived: boolean;
  updated_at: string;
}

export function useX7Chats() {
  return useQuery({
    queryKey: ["x7-chats"],
    queryFn: async () => {
      const response = await fetch("/api/x7/chats");
      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }
      const data = await response.json();
      return data.items as X7ChatMeta[];
    },
  });
}
