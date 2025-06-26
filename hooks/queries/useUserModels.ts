import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { modelsApi } from "@/lib/api/models";
import { ModelConfig } from "@/lib/models";

export const useUserModels = () => {
  const { isSignedIn } = useUser();

  return useQuery({
    queryKey: ["user-models", { isSignedIn }],
    queryFn: async (): Promise<ModelConfig[]> => {
      if (!isSignedIn) {
        return modelsApi.getAllModels();
      }
      return modelsApi.getUserModels(true);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    // Provide fallback data to prevent loading states
    placeholderData: [
      {
        id: "fallback-1",
        name: "gpt-4.1-nano",
        provider: "openai",
        model_id: "gpt-4.1-nano",
        model_type: "text",
        description: "Fast and efficient OpenAI model",
        capabilities: ["fast", "text"],
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: "fallback-2",
        name: "gemini-2.0-flash",
        provider: "google",
        model_id: "gemini-2.0-flash",
        model_type: "multimodal",
        description: "Google's flagship model",
        capabilities: ["vision", "tool-calling"],
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
      },
    ],
  });
};
