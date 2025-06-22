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

export function useConversation(conversationId: string) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConversation = async () => {
    if (!conversationId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setConversation(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  return { conversation, isLoading, refetch: fetchConversation };
}
