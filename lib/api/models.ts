import { ModelConfig } from "@/lib/models";

// Extended interfaces for the API layer
export interface UserModelPreference {
  id: string;
  user_id: string;
  model_id: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModelWithPreference extends ModelConfig {
  isEnabled: boolean;
}

export interface GroupedModelsWithPreferences {
  text: ModelWithPreference[];
  multimodal: ModelWithPreference[];
  reasoning: ModelWithPreference[];
  visual: ModelWithPreference[];
}

export const modelsApi = {
  getAllModels: async (): Promise<ModelConfig[]> => {
    const response = await fetch("/api/models");
    if (!response.ok) throw new Error("Failed to fetch models");
    return response.json();
  },

  // Get models grouped by type
  getGroupedModels: async (): Promise<Record<string, ModelConfig[]>> => {
    const response = await fetch("/api/models?grouped=true");
    if (!response.ok) throw new Error("Failed to fetch grouped models");
    return response.json();
  },

  getUserModels: async (enabled?: boolean): Promise<ModelConfig[]> => {
    const params = enabled ? "?enabled=true" : "";
    const response = await fetch(`/api/user-models${params}`);
    if (!response.ok) throw new Error("Failed to fetch user models");
    return response.json();
  },

  // Get user models grouped by type with preferences
  getUserModelsGrouped: async (): Promise<GroupedModelsWithPreferences> => {
    const response = await fetch("/api/user-models?grouped=true");
    if (!response.ok) throw new Error("Failed to fetch grouped user models");
    return response.json();
  },

  updateModelPreference: async ({
    modelId,
    isEnabled,
  }: {
    modelId: string;
    isEnabled: boolean;
  }) => {
    const response = await fetch("/api/user-models", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, isEnabled }),
    });
    if (!response.ok) throw new Error("Failed to update preference");
    return response.json();
  },

  // Bulk update model preferences
  bulkUpdateModels: async ({
    modelIds,
    isEnabled,
  }: {
    modelIds: string[];
    isEnabled: boolean;
  }) => {
    const response = await fetch("/api/user-models/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model_ids: modelIds, is_enabled: isEnabled }),
    });
    if (!response.ok) throw new Error("Failed to bulk update models");
    return response.json();
  },

  // Get user's model preferences
  getUserPreferences: async (): Promise<UserModelPreference[]> => {
    const response = await fetch("/api/user-models/preferences");
    if (!response.ok) throw new Error("Failed to fetch user preferences");
    return response.json();
  },

  // Reset to recommended models
  resetToRecommended: async () => {
    const response = await fetch("/api/user-models/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to reset to recommended models");
    return response.json();
  },
};
