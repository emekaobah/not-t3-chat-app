import { useQueryClient } from "@tanstack/react-query";
import { conversationsApi } from "@/lib/api/conversations";
import { messagesApi } from "@/lib/api/messages";
import { modelsApi } from "@/lib/api/models";

export const usePrefetchData = () => {
  const queryClient = useQueryClient();

  const prefetchConversation = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ["conversations", id],
      queryFn: () => conversationsApi.getConversation(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const prefetchMessages = (conversationId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["messages", conversationId],
      queryFn: () => messagesApi.getMessages(conversationId),
      staleTime: 30 * 1000, // 30 seconds
    });
  };

  const prefetchConversations = () => {
    queryClient.prefetchQuery({
      queryKey: ["conversations"],
      queryFn: conversationsApi.getConversations,
      staleTime: 1 * 60 * 1000, // 1 minute
    });
  };

  const prefetchUserModels = () => {
    queryClient.prefetchQuery({
      queryKey: ["user-models", "grouped"],
      queryFn: modelsApi.getUserModelsGrouped,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const prefetchAllModels = () => {
    queryClient.prefetchQuery({
      queryKey: ["models"],
      queryFn: modelsApi.getAllModels,
      staleTime: 10 * 60 * 1000, // 10 minutes - models change rarely
    });
  };

  // Prefetch conversation and its messages together
  const prefetchConversationWithMessages = (id: string) => {
    prefetchConversation(id);
    prefetchMessages(id);
  };

  // Prefetch common data for faster navigation
  const prefetchCommonData = () => {
    prefetchConversations();
    prefetchAllModels();
    prefetchUserModels();
  };

  return {
    prefetchConversation,
    prefetchMessages,
    prefetchConversations,
    prefetchUserModels,
    prefetchAllModels,
    prefetchConversationWithMessages,
    prefetchCommonData,
  };
};
