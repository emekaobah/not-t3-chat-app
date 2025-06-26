export interface Message {
  id: string;
  conversation_id: string;
  model: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
  created_at: string;
}

export const messagesApi = {
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await fetch(
      `/api/messages?conversation_id=${conversationId}`
    );
    if (!response.ok) throw new Error("Failed to fetch messages");
    return response.json();
  },

  createMessage: async (message: Omit<Message, "id" | "created_at">) => {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error("Failed to create message");
    return response.json();
  },
};
