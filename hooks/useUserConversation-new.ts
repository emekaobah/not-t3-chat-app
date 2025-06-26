import {
  useConversations,
  useConversation as useConversationRQ,
} from "./queries/useConversations";

// Re-export types
export type { Conversation } from "@/lib/api/conversations";

// Backward compatible wrapper for conversations list
export function useUserConversations() {
  const { data: conversations = [], isLoading, refetch } = useConversations();

  return {
    conversations,
    isLoading,
    refetch: async () => {
      await refetch();
    },
  };
}

// Backward compatible wrapper for single conversation
export function useConversation(conversationId: string) {
  const {
    data: conversation = null,
    isLoading,
    refetch,
  } = useConversationRQ(conversationId);

  return {
    conversation,
    isLoading,
    refetch: async () => {
      await refetch();
    },
  };
}

// Export React Query versions for new code
export {
  useConversations,
  useConversation as useConversationRQ,
  useCreateConversation,
  useUpdateConversation,
  useDeleteConversation,
} from "./queries/useConversations";
