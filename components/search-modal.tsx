"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, MessageSquare, Hash, Clock } from "lucide-react";
import { useDebounce } from "use-debounce";

interface SearchResult {
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
    role: string;
    model: string;
  }>;
  query: string;
}

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);

  const [debouncedQuery] = useDebounce(query, 300);

  // Load recent searches from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("recent-searches");
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to load recent searches:", error);
    }
  }, []);

  // Save search to recent searches
  const saveRecentSearch = React.useCallback((searchQuery: string) => {
    if (searchQuery.trim().length < 2) return;

    setRecentSearches((prev) => {
      const updated = [
        searchQuery,
        ...prev.filter((s) => s !== searchQuery),
      ].slice(0, 5);
      try {
        localStorage.setItem("recent-searches", JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save recent search:", error);
      }
      return updated;
    });
  }, []);

  // Perform search
  React.useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}`
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        } else {
          console.error("Search failed:", response.statusText);
          setResults(null);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Handle navigation to conversation
  const handleNavigateToConversation = React.useCallback(
    (conversationId: string) => {
      saveRecentSearch(query);
      onOpenChange(false);
      router.push(`/chat/${conversationId}`);
    },
    [query, onOpenChange, router, saveRecentSearch]
  );

  // Handle recent search selection
  const handleRecentSearch = React.useCallback((searchQuery: string) => {
    setQuery(searchQuery);
  }, []);

  // Reset query when modal opens
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Truncate long text
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search conversations and messages..."
        value={query}
        onValueChange={setQuery}
        className="text-sm"
      />
      <CommandList className="max-h-[400px]">
        {!query && recentSearches.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {recentSearches.map((search, index) => (
              <CommandItem
                key={index}
                value={search}
                onSelect={() => handleRecentSearch(search)}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{search}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {isLoading && (
          <CommandEmpty>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          </CommandEmpty>
        )}

        {!isLoading && debouncedQuery.length >= 2 && !results && (
          <CommandEmpty>No results found for "{debouncedQuery}"</CommandEmpty>
        )}

        {results && (
          <>
            {results.conversations.length > 0 && (
              <CommandGroup
                heading={`Conversations (${results.conversations.length})`}
              >
                {results.conversations.map((conversation) => (
                  <CommandItem
                    key={conversation.id}
                    value={conversation.title}
                    onSelect={() =>
                      handleNavigateToConversation(conversation.id)
                    }
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {conversation.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(conversation.created_at)}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.messages.length > 0 && (
              <CommandGroup heading={`Messages (${results.messages.length})`}>
                {results.messages.map((message) => (
                  <CommandItem
                    key={message.id}
                    value={message.content}
                    onSelect={() =>
                      handleNavigateToConversation(message.conversation_id)
                    }
                    className="flex items-start gap-3 cursor-pointer"
                  >
                    <Hash className="h-4 w-4 text-green-500 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        {truncateText(message.content)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        in {message.conversation_title} •{" "}
                        {formatDate(message.created_at)}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.conversations.length === 0 &&
              results.messages.length === 0 && (
                <CommandEmpty>
                  No results found for "{debouncedQuery}"
                </CommandEmpty>
              )}
          </>
        )}

        {!query && recentSearches.length === 0 && (
          <CommandEmpty>
            <div className="text-center py-6">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Start typing to search your conversations and messages
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Use <kbd className="search-kbd">⌘K</kbd> to open search
              </p>
            </div>
          </CommandEmpty>
        )}
      </CommandList>
    </CommandDialog>
  );
}
