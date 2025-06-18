import { useEffect, useState } from "react";

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
}

export function useUserConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConversations = async () => {
    setIsLoading(true);
    const res = await fetch("/api/conversations");
    const data = await res.json();
    setConversations(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return { conversations, isLoading, refetch: fetchConversations };
}
