import { useSendMessage as useSendMessageRQ } from "./queries/useMessages";

export function useSendMessage() {
  const sendMessageMutation = useSendMessageRQ();

  const sendMessage = async ({
    conversation_id,
    model,
    role,
    content,
  }: {
    conversation_id: string;
    model: string;
    role: "user" | "assistant" | "system" | "data";
    content: string;
  }) => {
    // Skip API calls for guest users
    if (conversation_id === "guest" || conversation_id === "temp") {
      return { message: "Guest message - not persisted" };
    }

    return sendMessageMutation.mutateAsync({
      conversation_id,
      model,
      role,
      content,
    });
  };

  return sendMessage;
}

// Export React Query version for new code
export { useSendMessage as useSendMessageRQ } from "./queries/useMessages";
