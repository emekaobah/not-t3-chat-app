import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsApi, Conversation } from "@/lib/api/conversations";
import { toast } from "sonner";

export const useConversations = () => {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: conversationsApi.getConversations,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useConversation = (id: string) => {
  return useQuery({
    queryKey: ["conversations", id],
    queryFn: () => conversationsApi.getConversation(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: conversationsApi.createConversation,
    onSuccess: (newConversation) => {
      // Optimistically add to conversations list
      queryClient.setQueryData<Conversation[]>(
        ["conversations"],
        (old = []) => [newConversation, ...old]
      );
      toast.success("Conversation created");
    },
    onError: () => {
      toast.error("Failed to create conversation");
    },
  });
};

export const useUpdateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: conversationsApi.updateConversation,
    onMutate: async ({ id, title }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["conversations"] });
      await queryClient.cancelQueries({ queryKey: ["conversations", id] });

      // Snapshot previous values
      const previousConversations = queryClient.getQueryData<Conversation[]>([
        "conversations",
      ]);
      const previousConversation = queryClient.getQueryData<Conversation>([
        "conversations",
        id,
      ]);

      // Optimistically update
      queryClient.setQueryData<Conversation[]>(["conversations"], (old = []) =>
        old.map((conv) => (conv.id === id ? { ...conv, title } : conv))
      );
      queryClient.setQueryData<Conversation>(["conversations", id], (old) =>
        old ? { ...old, title } : old
      );

      return { previousConversations, previousConversation };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(
          ["conversations"],
          context.previousConversations
        );
      }
      if (context?.previousConversation) {
        queryClient.setQueryData(
          ["conversations", variables.id],
          context.previousConversation
        );
      }
      toast.error("Failed to update conversation");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: conversationsApi.deleteConversation,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["conversations"] });

      const previousConversations = queryClient.getQueryData<Conversation[]>([
        "conversations",
      ]);

      // Optimistically remove
      queryClient.setQueryData<Conversation[]>(["conversations"], (old = []) =>
        old.filter((conv) => conv.id !== id)
      );

      return { previousConversations };
    },
    onError: (err, id, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(
          ["conversations"],
          context.previousConversations
        );
      }
      toast.error("Failed to delete conversation");
    },
    onSuccess: () => {
      toast.success("Conversation deleted");
    },
  });
};
