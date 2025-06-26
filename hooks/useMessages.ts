import { useMessages as useMessagesRQ } from "./queries/useMessages";

// Re-export Message type from API
export type { Message } from "@/lib/api/messages";

// Backward compatible wrapper
export function useMessages(conversationId: string | undefined) {
  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useMessagesRQ(conversationId);

  return {
    messages,
    isLoading,
    refetch: async () => {
      await refetch();
    },
  };
}

// Export React Query version for new code
export {
  useMessages as useMessagesRQ,
  useSendMessage,
} from "./queries/useMessages";
