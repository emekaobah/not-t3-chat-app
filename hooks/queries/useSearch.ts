import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";

// Search result interfaces
export interface SearchResult {
  type: "conversation" | "message";
  id: string;
  title?: string;
  content: string;
  conversationId?: string;
  timestamp: string;
  snippet: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

// Search API
const searchApi = {
  search: async (query: string): Promise<SearchResponse> => {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 20 }),
    });
    if (!response.ok) throw new Error("Search failed");
    return response.json();
  },

  searchConversations: async (query: string): Promise<SearchResult[]> => {
    const response = await fetch(
      `/api/conversations/search?q=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error("Conversation search failed");
    return response.json();
  },
};

// Debounced search hook
export const useSearch = (query: string, enabled: boolean = true) => {
  // Debounce the search query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    enabled: enabled && !!debouncedQuery && debouncedQuery.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes - search results stay fresh briefly
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache longer for back navigation
    retry: 1, // Don't retry search failures aggressively
  });
};

// Conversation-specific search hook
export const useSearchConversations = (
  query: string,
  enabled: boolean = true
) => {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ["search", "conversations", debouncedQuery],
    queryFn: () => searchApi.searchConversations(debouncedQuery),
    enabled: enabled && !!debouncedQuery && debouncedQuery.length >= 2,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// Instant search hook (no debounce, for real-time filtering)
export const useInstantSearch = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["search", "instant", query],
    queryFn: () => searchApi.search(query),
    enabled: enabled && !!query && query.length >= 1,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: false, // No retries for instant search
  });
};

// Export search API for direct usage
export { searchApi };
