import { create } from "zustand";

interface TitleGenerationState {
  [conversationId: string]: {
    isGenerating: boolean;
    hasGenerated: boolean;
  };
}

interface ConversationUIStore {
  // Remove server state, keep only UI state
  titleStates: TitleGenerationState;

  // UI Actions only
  setTitleGenerating: (conversationId: string, isGenerating: boolean) => void;
  setTitleGenerated: (conversationId: string, hasGenerated: boolean) => void;
}

export const useConversationUIStore = create<ConversationUIStore>((set) => ({
  // Only UI state now
  titleStates: {},

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
          isGenerating: false,
        },
      },
    }));
  },
}));

// Keep backward compatibility temporarily
export const useConversationStore = useConversationUIStore;
