import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// User model preference interface
interface ModelPreference {
  modelId: string;
  isEnabled: boolean;
}

interface GroupedUserModels {
  text: Array<{
    id: string;
    name: string;
    isEnabled: boolean;
    [key: string]: any;
  }>;
  multimodal: Array<{
    id: string;
    name: string;
    isEnabled: boolean;
    [key: string]: any;
  }>;
  reasoning: Array<{
    id: string;
    name: string;
    isEnabled: boolean;
    [key: string]: any;
  }>;
  visual: Array<{
    id: string;
    name: string;
    isEnabled: boolean;
    [key: string]: any;
  }>;
}

// API functions
const modelPreferencesApi = {
  getGroupedUserModels: async (): Promise<GroupedUserModels> => {
    const response = await fetch("/api/user-models?grouped=true");
    if (!response.ok) throw new Error("Failed to fetch grouped user models");
    return response.json();
  },

  updateModelPreference: async ({ modelId, isEnabled }: ModelPreference) => {
    const response = await fetch("/api/user-models", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, isEnabled }),
    });
    if (!response.ok) throw new Error("Failed to update model preference");
    return response.json();
  },

  bulkUpdateModels: async ({
    modelIds,
    isEnabled,
  }: {
    modelIds: string[];
    isEnabled: boolean;
  }) => {
    const action = isEnabled ? "enable" : "disable";
    const response = await fetch("/api/user-models/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, modelIds }),
    });
    if (!response.ok) throw new Error("Failed to bulk update models");
    return response.json();
  },
};

// Queries
export const useGroupedUserModels = () => {
  return useQuery({
    queryKey: ["user-models", "grouped"],
    queryFn: modelPreferencesApi.getGroupedUserModels,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutations
export const useUpdateModelPreference = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: modelPreferencesApi.updateModelPreference,
    onMutate: async ({ modelId, isEnabled }) => {
      // Cancel queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["user-models"] });

      // Snapshot previous data for rollback
      const previousGrouped = queryClient.getQueryData([
        "user-models",
        "grouped",
      ]);
      const previousUserModels = queryClient.getQueryData(["user-models"]);

      // Optimistically update grouped models
      queryClient.setQueryData(
        ["user-models", "grouped"],
        (old: GroupedUserModels | undefined) => {
          if (!old) return old;

          const updated = { ...old };
          Object.keys(updated).forEach((type) => {
            const typeKey = type as keyof GroupedUserModels;
            updated[typeKey] = updated[typeKey].map((model) =>
              model.id === modelId ? { ...model, isEnabled } : model
            );
          });
          return updated;
        }
      );

      // Also update regular user-models cache if it exists
      queryClient.setQueryData(["user-models"], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((model: any) =>
          model.id === modelId ? { ...model, isEnabled } : model
        );
      });

      return { previousGrouped, previousUserModels };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousGrouped) {
        queryClient.setQueryData(
          ["user-models", "grouped"],
          context.previousGrouped
        );
      }
      if (context?.previousUserModels) {
        queryClient.setQueryData(["user-models"], context.previousUserModels);
      }

      toast.error("Failed to update model preference");
      console.error("Model preference update error:", err);
    },
    onSuccess: () => {
      toast.success("Model preference updated!");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["user-models"] });
    },
  });
};

export const useBulkUpdateModels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: modelPreferencesApi.bulkUpdateModels,
    onMutate: async ({ modelIds, isEnabled }) => {
      await queryClient.cancelQueries({ queryKey: ["user-models"] });

      const previousGrouped = queryClient.getQueryData([
        "user-models",
        "grouped",
      ]);
      const previousUserModels = queryClient.getQueryData(["user-models"]);

      // Optimistically update all specified models
      queryClient.setQueryData(
        ["user-models", "grouped"],
        (old: GroupedUserModels | undefined) => {
          if (!old) return old;

          const updated = { ...old };
          Object.keys(updated).forEach((type) => {
            const typeKey = type as keyof GroupedUserModels;
            updated[typeKey] = updated[typeKey].map((model) =>
              modelIds.includes(model.id) ? { ...model, isEnabled } : model
            );
          });
          return updated;
        }
      );

      queryClient.setQueryData(["user-models"], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((model: any) =>
          modelIds.includes(model.id) ? { ...model, isEnabled } : model
        );
      });

      return { previousGrouped, previousUserModels };
    },
    onError: (err, variables, context) => {
      if (context?.previousGrouped) {
        queryClient.setQueryData(
          ["user-models", "grouped"],
          context.previousGrouped
        );
      }
      if (context?.previousUserModels) {
        queryClient.setQueryData(["user-models"], context.previousUserModels);
      }

      toast.error("Failed to update model preferences");
      console.error("Bulk model update error:", err);
    },
    onSuccess: (data, { isEnabled }) => {
      const action = isEnabled ? "enabled" : "disabled";
      toast.success(`Models ${action} successfully!`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-models"] });
    },
  });
};

// Export API for direct usage if needed
export { modelPreferencesApi };
