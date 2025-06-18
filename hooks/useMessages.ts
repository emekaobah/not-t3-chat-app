import { useEffect, useState } from "react";

export interface Message {
  id: string;
  conversation_id: string;
  model: string;
  role: "user" | "assistant" | "system" | "data"; // <--- updated
  content: string;
  created_at: string;
}

export function useMessages(conversationId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = async () => {
    if (!conversationId) return;
    setIsLoading(true);
    const res = await fetch(`/api/messages?conversation_id=${conversationId}`);
    const data = await res.json();
    setMessages(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return { messages, isLoading, refetch: fetchMessages };
}
