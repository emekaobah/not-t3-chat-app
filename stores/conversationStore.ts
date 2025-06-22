import { create } from "zustand";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
}

interface TitleGenerationState {
  [conversationId: string]: {
    isGenerating: boolean;
    hasGenerated: boolean;
  };
}

interface ConversationStore {
  // State
  conversations: Conversation[];
  isLoading: boolean;
  titleStates: TitleGenerationState;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setLoading: (loading: boolean) => void;
  addConversation: (conversation: Conversation) => void;
  removeConversation: (conversationId: string) => void;
  updateConversationTitle: (conversationId: string, title: string) => void;
  setTitleGenerating: (conversationId: string, isGenerating: boolean) => void;
  setTitleGenerated: (conversationId: string, hasGenerated: boolean) => void;
  refreshConversations: () => Promise<void>;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  // Initial state
  conversations: [],
  isLoading: false,
  titleStates: {},

  // Actions
  setConversations: (conversations) => set({ conversations }),

  setLoading: (isLoading) => set({ isLoading }),

  addConversation: (conversation) => {
    const { conversations } = get();
    set({ conversations: [conversation, ...conversations] });
  },

  removeConversation: (conversationId) => {
    const { conversations } = get();
    const updatedConversations = conversations.filter(
      (conv) => conv.id !== conversationId
    );
    set({ conversations: updatedConversations });
  },

  updateConversationTitle: (conversationId, title) => {
    const { conversations } = get();
    const updatedConversations = conversations.map((conv) =>
      conv.id === conversationId ? { ...conv, title } : conv
    );
    set({ conversations: updatedConversations });
  },

  setTitleGenerating: (conversationId, isGenerating) => {
    set((state) => ({
      titleStates: {
        ...state.titleStates,
        [conversationId]: {
          ...state.titleStates[conversationId],
          isGenerating,
          hasGenerated:
            state.titleStates[conversationId]?.hasGenerated || false,
        },
      },
    }));
  },

  setTitleGenerated: (conversationId, hasGenerated) => {
    set((state) => ({
      titleStates: {
        ...state.titleStates,
        [conversationId]: {
          ...state.titleStates[conversationId],
          hasGenerated,
          isGenerating: false, // Always clear generating state when setting generated
        },
      },
    }));
  },

  refreshConversations: async () => {
    set({ isLoading: true });
    try {
      console.log("🔄 Refreshing conversations...");
      const res = await fetch("/api/conversations");
      const data = await res.json();
      console.log("📝 Fetched conversations:", data?.length || 0);
      set({ conversations: data || [], isLoading: false });
    } catch (error) {
      console.error("❌ Failed to fetch conversations:", error);
      set({ isLoading: false });
    }
  },
}));
