import { useCreateConversation as useCreateConversationRQ } from "./queries/useConversations";

// Backward compatible wrapper
export function useCreateConversation() {
  const createConversationMutation = useCreateConversationRQ();

  const createConversation = async (props: { title?: string } = {}) => {
    const title = props.title || "Untitled";
    return createConversationMutation.mutateAsync(title);
  };

  return { createConversation };
}

// Export React Query version for new code
export { useCreateConversation as useCreateConversationRQ } from "./queries/useConversations";
