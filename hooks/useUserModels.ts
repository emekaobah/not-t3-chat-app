"use client";

import { useUserModels as useUserModelsRQ } from "./queries/useUserModels";

// Temporary wrapper to maintain backward compatibility
export function useUserModels() {
  const { data: models = [], isLoading, error, refetch } = useUserModelsRQ();

  return {
    models,
    isLoading,
    error: error?.message || null,
    refetch: async () => {
      await refetch();
    },
  };
}

// Export the React Query version for new code
export { useUserModels as useUserModelsRQ } from "./queries/useUserModels";
