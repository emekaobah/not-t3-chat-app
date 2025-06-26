import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
      onError: (error: any) => {
        // Add error tracking for monitoring
        console.error("Mutation error:", error);

        // Track specific error types for debugging
        if (error?.status === 401) {
          console.warn("Authentication error in mutation");
        } else if (error?.status >= 500) {
          console.error("Server error in mutation:", error);
        }
      },
    },
  },
});

// Add query cache event listeners for monitoring
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === "added") {
    console.log("Query added:", event.query.queryKey);
  }

  if (event?.type === "removed") {
    console.log("Query removed from cache:", event.query.queryKey);
  }

  if (event?.type === "updated" && event.action?.type === "failed") {
    console.error("Query failed:", event.query.queryKey, event.action.error);

    // Track API endpoint failures
    if (event.action.error?.status >= 500) {
      console.error("Server error in query:", {
        queryKey: event.query.queryKey,
        error: event.action.error,
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (event?.type === "updated" && event.action?.type === "success") {
    // Log successful cache updates for performance monitoring
    const dataSize = JSON.stringify(event.action.data).length;
    if (dataSize > 50000) {
      // Log large responses
      console.warn("Large response detected:", {
        queryKey: event.query.queryKey,
        dataSize,
        timestamp: new Date().toISOString(),
      });
    }
  }
});

// Add mutation cache monitoring
queryClient.getMutationCache().subscribe((event) => {
  if (event?.type === "added") {
    console.log(
      "Mutation started:",
      event.mutation.options.mutationKey || "unnamed"
    );
  }

  if (event?.type === "updated") {
    const mutation = event.mutation;
    if (mutation.state.status === "error") {
      console.error("Mutation failed:", {
        mutationKey: mutation.options.mutationKey,
        error: mutation.state.error,
        variables: mutation.state.variables,
        timestamp: new Date().toISOString(),
      });
    }

    if (mutation.state.status === "success") {
      console.log("Mutation succeeded:", {
        mutationKey: mutation.options.mutationKey,
        timestamp: new Date().toISOString(),
      });
    }
  }
});
