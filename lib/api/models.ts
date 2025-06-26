import { ModelConfig } from "@/lib/models";

export const modelsApi = {
  getAllModels: async (): Promise<ModelConfig[]> => {
    const response = await fetch("/api/models");
    if (!response.ok) throw new Error("Failed to fetch models");
    return response.json();
  },

  getUserModels: async (enabled?: boolean): Promise<ModelConfig[]> => {
    const params = enabled ? "?enabled=true" : "";
    const response = await fetch(`/api/user-models${params}`);
    if (!response.ok) throw new Error("Failed to fetch user models");
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
};
