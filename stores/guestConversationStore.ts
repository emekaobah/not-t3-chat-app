import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as React from "react";
import { Message } from "@/hooks/useMessages";

interface ConversationData {
  messages: Message[];
  sharedInput: string;
  timestamp: number;
  models: string[];
}

interface GuestConversationStore {
  // State
  messages: Message[];
  hasActiveConversation: boolean;
  isRestoring: boolean;
  sharedInput: string;

  // Actions
  addMessage: (message: Message) => void;
  addMessages: (messages: Message[]) => void;
  updateSharedInput: (input: string) => void;
  clearConversation: () => void;

  // Restoration
  getConversationData: () => ConversationData | null;
  setRestoring: (restoring: boolean) => void;

  // Internal
  _updateActiveStatus: () => void;
}

export const useGuestConversationStore = create<GuestConversationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      hasActiveConversation: false,
      isRestoring: false,
      sharedInput: "",

      // Add a single message
      addMessage: (message: Message) => {
        const state = get();
        const newMessages = [...state.messages, message];

        set({
          messages: newMessages,
          hasActiveConversation: newMessages.length > 0,
        });

        console.log("📝 Added guest message:", message);
      },

      // Add multiple messages (for restoration)
      addMessages: (messages: Message[]) => {
        const state = get();
        const newMessages = [...state.messages, ...messages];

        set({
          messages: newMessages,
          hasActiveConversation: newMessages.length > 0,
        });

        console.log("📝 Added multiple guest messages:", messages.length);
      },

      // Update shared input
      updateSharedInput: (input: string) => {
        set({ sharedInput: input });
      },

      // Clear all conversation data
      clearConversation: () => {
        console.log("🧹 Clearing guest conversation");
        set({
          messages: [],
          hasActiveConversation: false,
          sharedInput: "",
          isRestoring: false,
        });
      },

      // Get conversation data for restoration
      getConversationData: () => {
        const state = get();

        if (state.messages.length === 0) {
          return null;
        }

        return {
          messages: state.messages,
          sharedInput: state.sharedInput,
          timestamp: Date.now(),
          models: ["gpt-4.1-nano", "gemini-2.0-flash"], // Default supported models
        };
      },

      // Set restoring state
      setRestoring: (restoring: boolean) => {
        set({ isRestoring: restoring });
      },

      // Internal helper
      _updateActiveStatus: () => {
        const state = get();
        set({
          hasActiveConversation: state.messages.length > 0,
        });
      },
    }),
    {
      name: "guest-conversation", // sessionStorage key
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);

// Hook for easy access to the store
export const useGuestConversation = () => {
  const store = useGuestConversationStore();

  // Debug logging for state changes
  React.useEffect(() => {
    console.log("💬 Guest conversation state update:", {
      messageCount: store.messages.length,
      hasActiveConversation: store.hasActiveConversation,
      isRestoring: store.isRestoring,
    });
  }, [store.messages.length, store.hasActiveConversation, store.isRestoring]);

  return {
    // State
    messages: store.messages,
    hasActiveConversation: store.hasActiveConversation,
    isRestoring: store.isRestoring,
    sharedInput: store.sharedInput,
    messageCount: store.messages.length,

    // Actions
    addMessage: store.addMessage,
    addMessages: store.addMessages,
    updateSharedInput: store.updateSharedInput,
    clearConversation: store.clearConversation,
    getConversationData: store.getConversationData,
    setRestoring: store.setRestoring,
  };
};
