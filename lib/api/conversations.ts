export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
}

export const conversationsApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await fetch("/api/conversations");
    if (!response.ok) throw new Error("Failed to fetch conversations");
    return response.json();
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const response = await fetch(`/api/conversations/${id}`);
    if (!response.ok) throw new Error("Failed to fetch conversation");
    return response.json();
  },

  createConversation: async (title: string): Promise<Conversation> => {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error("Failed to create conversation");
    return response.json();
  },

  updateConversation: async ({ id, title }: { id: string; title: string }) => {
    const response = await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error("Failed to update conversation");
    return response.json();
  },

  deleteConversation: async (id: string) => {
    const response = await fetch(`/api/conversations/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete conversation");
    return response.json();
  },
};
