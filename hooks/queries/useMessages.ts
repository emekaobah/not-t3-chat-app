import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesApi, Message } from "@/lib/api/messages";

export const useMessages = (conversationId: string | undefined) => {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messagesApi.getMessages(conversationId!),
    enabled: !!conversationId && conversationId !== "guest",
    staleTime: 30 * 1000, // 30 seconds for real-time feel
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: messagesApi.createMessage,
    onSuccess: (newMessage, variables) => {
      // Add message to cache immediately
      queryClient.setQueryData<Message[]>(
        ["messages", variables.conversation_id],
        (old = []) => [...old, newMessage]
      );
    },
    onError: () => {
      // Error handling can be done in components
    },
  });
};
