"use client";

import { useState, useEffect } from "react";
import { ModelConfig } from "@/lib/models";
import { useUser } from "@clerk/nextjs";

interface UseUserModelsReturn {
  models: ModelConfig[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserModels(): UseUserModelsReturn {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useUser();

  const fetchUserModels = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isSignedIn) {
        // For guests, use all available models
        console.log("Fetching all models for guest user");
        const response = await fetch("/api/models");
        if (!response.ok) throw new Error("Failed to fetch models");
        const allModels = await response.json();
        console.log("Received guest models:", allModels);
        setModels(allModels);
      } else {
        // For authenticated users, get their enabled models
        console.log("Fetching enabled models for authenticated user");
        const response = await fetch("/api/user-models?enabled=true");
        if (!response.ok) throw new Error("Failed to fetch user models");
        const userModels = await response.json();
        console.log("Received user models:", userModels);
        setModels(userModels);
      }
    } catch (err) {
      console.error("Error fetching user models:", err);
      setError(err instanceof Error ? err.message : "Unknown error");

      // Fallback to hardcoded models
      setModels([
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
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserModels();
  }, [isSignedIn]);

  return {
    models,
    isLoading,
    error,
    refetch: fetchUserModels,
  };
}
