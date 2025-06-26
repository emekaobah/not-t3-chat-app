# React Query v5 Migration Plan

## Overview

This document outlines the step-by-step migration plan from manual data fetching + Zustand to React Query v5 + Zustand (hybrid approach) for the chat application.

## Timeline: 8 Weeks Total

---

## Phase 1: Foundation Setup (Week 1-2)

### Week 1: Installation & Basic Setup

#### Step 1.1: Install Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

#### Step 1.2: Create Query Client Setup

**File: `lib/react-query.ts`** (NEW)

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 401/403
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

#### Step 1.3: Update App Layout

**File: `app/layout.tsx`** (MODIFY)

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/react-query";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          <ClerkProvider>
            {/* ...existing providers */}
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </ClerkProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### Week 2: First Hook Migration (Proof of Concept)

#### Step 2.1: Create API Service Layer

**File: `lib/api/models.ts`** (NEW)

```typescript
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
```

#### Step 2.2: Create React Query Hook

**File: `hooks/queries/useUserModels.ts`** (NEW)

```typescript
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
```

#### Step 2.3: Gradual Migration Strategy

**File: `hooks/useUserModels.ts`** (MODIFY - Temporary Wrapper)

```typescript
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
```

---

## Phase 2: Core Data Fetching (Week 3-4)

### Week 3: Conversations Migration

#### Step 3.1: Create Conversations API

**File: `lib/api/conversations.ts`** (NEW)

```typescript
export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
}

export const conversationsApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await fetch("/api/conversations");
    if (!response.ok) throw new Error("Failed to fetch conversations");
    return response.json();
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const response = await fetch(`/api/conversations/${id}`);
    if (!response.ok) throw new Error("Failed to fetch conversation");
    return response.json();
  },

  createConversation: async (title: string): Promise<Conversation> => {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error("Failed to create conversation");
    return response.json();
  },

  updateConversation: async ({ id, title }: { id: string; title: string }) => {
    const response = await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error("Failed to update conversation");
    return response.json();
  },

  deleteConversation: async (id: string) => {
    const response = await fetch(`/api/conversations/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete conversation");
    return response.json();
  },
};
```

#### Step 3.2: Create Conversation Queries & Mutations

**File: `hooks/queries/useConversations.ts`** (NEW)

```typescript
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
```

#### Step 3.3: Update Conversation Store

**File: `stores/conversationStore.ts`** (MODIFY)

```typescript
import { create } from "zustand";

interface TitleGenerationState {
  [conversationId: string]: {
    isGenerating: boolean;
    hasGenerated: boolean;
  };
}

interface ConversationUIStore {
  // Remove server state, keep only UI state
  titleStates: TitleGenerationState;

  // UI Actions only
  setTitleGenerating: (conversationId: string, isGenerating: boolean) => void;
  setTitleGenerated: (conversationId: string, hasGenerated: boolean) => void;
}

export const useConversationUIStore = create<ConversationUIStore>((set) => ({
  // Only UI state now
  titleStates: {},

  setTitleGenerating: (conversationId, isGenerating) => {
    set((state) => ({
      titleStates: {
        ...state.titleStates,
        [conversationId]: {
          ...state.titleStates[conversationId],
          isGenerating,
          hasGenerated:
            state.titleStates[conversationId]?.hasGenerated || false,
        },
      },
    }));
  },

  setTitleGenerated: (conversationId, hasGenerated) => {
    set((state) => ({
      titleStates: {
        ...state.titleStates,
        [conversationId]: {
          ...state.titleStates[conversationId],
          hasGenerated,
          isGenerating: false,
        },
      },
    }));
  },
}));

// Keep backward compatibility temporarily
export const useConversationStore = useConversationUIStore;
```

### Week 4: Messages Migration

#### Step 4.1: Create Messages API

**File: `lib/api/messages.ts`** (NEW)

```typescript
export interface Message {
  id: string;
  conversation_id: string;
  model: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
  created_at: string;
}

export const messagesApi = {
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await fetch(
      `/api/messages?conversation_id=${conversationId}`
    );
    if (!response.ok) throw new Error("Failed to fetch messages");
    return response.json();
  },

  createMessage: async (message: Omit<Message, "id" | "created_at">) => {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error("Failed to create message");
    return response.json();
  },
};
```

#### Step 4.2: Create Messages Query Hook

**File: `hooks/queries/useMessages.ts`** (NEW)

```typescript
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
```

---

## Phase 3: Advanced Features (Week 5-6)

### Week 5: Settings & Model Preferences

#### Step 5.1: Create Model Preferences Mutations

**File: `hooks/queries/useModelPreferences.ts`** (NEW)

```typescript
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { modelsApi } from "@/lib/api/models";
import { toast } from "sonner";

export const useGroupedUserModels = () => {
  return useQuery({
    queryKey: ["user-models", "grouped"],
    queryFn: () =>
      fetch("/api/user-models?grouped=true").then((res) => res.json()),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateModelPreference = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: modelsApi.updateModelPreference,
    onMutate: async ({ modelId, isEnabled }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: ["user-models"] });

      // Snapshot previous data
      const previousGrouped = queryClient.getQueryData([
        "user-models",
        "grouped",
      ]);
      const previousUserModels = queryClient.getQueryData(["user-models"]);

      // Optimistically update grouped models
      queryClient.setQueryData(["user-models", "grouped"], (old: any) => {
        if (!old) return old;
        const updated = { ...old };
        Object.keys(updated).forEach((type) => {
          updated[type] = updated[type].map((model: any) =>
            model.id === modelId ? { ...model, isEnabled } : model
          );
        });
        return updated;
      });

      return { previousGrouped, previousUserModels };
    },
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousGrouped) {
        queryClient.setQueryData(
          ["user-models", "grouped"],
          context.previousGrouped
        );
      }
      toast.error("Failed to update model preference");
    },
    onSuccess: () => {
      toast.success("Model preference updated");
    },
    onSettled: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["user-models"] });
    },
  });
};

export const useBulkUpdateModels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action }: { action: string }) => {
      const response = await fetch("/api/user-models/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error(`Failed to ${action} models`);
      return response.json();
    },
    onSuccess: (data, { action }) => {
      const actionMap = {
        recommended: "Selected recommended models",
        enable: "Enabled all models",
        disable: "Disabled all models",
        reset: "Reset to default settings",
      };
      toast.success(
        actionMap[action as keyof typeof actionMap] ||
          `Bulk ${action} completed`
      );
    },
    onError: (err, { action }) => {
      toast.error(`Failed to ${action} models`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-models"] });
    },
  });
};
```

### Week 6: Search & Background Sync

#### Step 6.1: Create Search API & Hook

**File: `lib/api/search.ts`** (NEW)

```typescript
export interface SearchResult {
  conversations: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
  messages: Array<{
    id: string;
    content: string;
    created_at: string;
    conversation_id: string;
    conversation_title: string;
  }>;
  query: string;
}

export const searchApi = {
  search: async (query: string): Promise<SearchResult> => {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Search failed");
    return response.json();
  },
};
```

**File: `hooks/queries/useSearch.ts`** (NEW)

```typescript
import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/lib/api/search";
import { useDebounce } from "@/hooks/useDebounce";

export const useSearch = (query: string) => {
  const [debouncedQuery] = useDebounce(query, 300);

  return useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 2 * 60 * 1000, // Cache search results for 2 minutes
  });
};
```

---

## Phase 4: Cleanup & Optimization (Week 7-8)

### Week 7: Remove Old Code & Add Error Boundaries

#### Step 7.1: Create Error Boundary for React Query

**File: `components/QueryErrorBoundary.tsx`** (NEW)

```typescript
"use client";

import React from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex items-center justify-center min-h-[200px] p-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-red-600 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export function QueryErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={reset}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

#### Step 7.2: Update Components to Use New Hooks

**File: `components/app-sidebar.tsx`** (MODIFY)

```typescript
// Replace old imports
import {
  useConversations,
  useDeleteConversation,
} from "@/hooks/queries/useConversations";
import { useConversationUIStore } from "@/stores/conversationStore";

export function AppSidebar(props: any) {
  // Replace old store usage
  const { data: conversations = [], isLoading } = useConversations();
  const { titleStates } = useConversationUIStore();
  const deleteConversation = useDeleteConversation();

  // Replace manual delete logic
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation.mutateAsync(conversationId);
      // Navigation handled by mutation success
    } catch (error) {
      // Error already handled by mutation
    }
  };

  // ...rest of component
}
```

### Week 8: Performance Optimization & Monitoring

#### Step 8.1: Add Prefetching

**File: `hooks/queries/usePrefetch.ts`** (NEW)

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { conversationsApi } from "@/lib/api/conversations";
import { messagesApi } from "@/lib/api/messages";

export const usePrefetchData = () => {
  const queryClient = useQueryClient();

  const prefetchConversation = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ["conversations", id],
      queryFn: () => conversationsApi.getConversation(id),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchMessages = (conversationId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["messages", conversationId],
      queryFn: () => messagesApi.getMessages(conversationId),
      staleTime: 30 * 1000,
    });
  };

  return {
    prefetchConversation,
    prefetchMessages,
  };
};
```

#### Step 8.2: Add Performance Monitoring

**File: `lib/react-query.ts`** (MODIFY)

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        // Add error tracking
        console.error("Mutation error:", error);
        // Add to analytics if needed
      },
    },
  },
});

// Add query cache event listeners for monitoring
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "queryUpdated" && event.action.type === "failed") {
    console.error("Query failed:", event.query.queryKey, event.action.error);
  }
});
```

---

## Migration Checklist

### Phase 1 Checklist

- [ ] Install React Query v5 and devtools
- [ ] Set up QueryClient with proper defaults
- [ ] Add QueryClientProvider to app layout
- [ ] Create API service layer for models
- [ ] Migrate useUserModels hook
- [ ] Test model fetching with React Query devtools

### Phase 2 Checklist

- [ ] Create conversations API service
- [ ] Create conversation queries and mutations
- [ ] Update conversation store to only handle UI state
- [ ] Create messages API service
- [ ] Migrate messages hook
- [ ] Test optimistic updates

### Phase 3 Checklist

- [ ] Create model preferences mutations
- [ ] Add optimistic updates for settings
- [ ] Create search API and hook
- [ ] Add debounced search functionality
- [ ] Test all new query hooks

### Phase 4 Checklist

- [x] Add error boundaries
- [x] Update all components to use new hooks
- [x] Remove old manual fetching code
- [x] Add prefetching for better UX
- [x] Set up performance monitoring
- [x] Final testing and optimization

## Risk Mitigation

1. **Backward Compatibility**: Keep old hooks as wrappers during transition
2. **Gradual Migration**: Migrate one feature at a time
3. **Fallback Data**: Provide placeholder data to prevent loading states
4. **Error Handling**: Comprehensive error boundaries and fallbacks
5. **Testing**: Test each phase thoroughly before moving to next

## Expected Benefits After Migration

1. **Performance**: 50% reduction in redundant API calls
2. **UX**: Instant navigation with cached data
3. **Code Quality**: 40% reduction in boilerplate code
4. **Maintainability**: Clear separation of server/client state
5. **Developer Experience**: React Query devtools for debugging

## Rollback Plan

If issues arise, each phase can be rolled back independently:

1. Remove React Query hooks
2. Restore original hook implementations
3. Remove QueryClient provider
4. Uninstall dependencies

The gradual migration approach ensures minimal risk and easy rollback at any point.
