"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SearchForm } from "./search-form";
import { SearchModal } from "./search-modal";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Plus, MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import { Separator } from "./ui/separator";
import { useUserConversations } from "@/hooks/useUserConversation";
import { useConversations } from "@/hooks/queries/useConversations";
import { useGuestMessageLimiter } from "@/stores/guestMessageStore";
import { useGuestConversation } from "@/stores/guestConversationStore";
import { useConversationStore } from "@/stores/conversationStore";
import { useCreateConversation } from "@/hooks/useCreateConversation";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function AppSidebar(props: any) {
  // Use React Query for conversations data
  const {
    data: conversations = [],
    isLoading,
    refetch: refetchConversations,
  } = useConversations();

  // Use conversation store only for UI state (title generation)
  const { titleStates } = useConversationStore();

  // Get the current conversationId from the URL
  const { conversationId } = useParams<{ conversationId: string }>();
  // Get guest message limiter for signed-out users
  const { remainingMessages, isLimitReached } = useGuestMessageLimiter();
  const guestConversation = useGuestConversation();

  // Add hooks for creating new conversations
  const { createConversation } = useCreateConversation();
  const router = useRouter();

  // State for managing conversation actions
  const [editingConversationId, setEditingConversationId] = React.useState<
    string | null
  >(null);
  const [editingTitle, setEditingTitle] = React.useState("");
  const [hoveredConversationId, setHoveredConversationId] = React.useState<
    string | null
  >(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [conversationToDelete, setConversationToDelete] = React.useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] =
    React.useState(false);
  const [searchModalOpen, setSearchModalOpen] = React.useState(false);

  // Initialize conversations on mount
  React.useEffect(() => {
    refetchConversations();
  }, [refetchConversations]);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle creating a new chat
  const handleNewChat = async () => {
    try {
      // Create new conversation with "Untitled" title initially
      const newConversation = await createConversation({ title: "Untitled" });
      if (newConversation?.id) {
        // React Query handles optimistic updates automatically
        // Navigate to the new conversation
        router.push(`/chat/${newConversation.id}`);
      }
    } catch (error) {
      console.error("Failed to create new conversation:", error);
    }
  };

  // Helper function to get conversation title with loading states
  const getConversationTitle = (conv: any) => {
    const titleState = titleStates[conv.id];

    // Show skeleton while generating
    if (titleState?.isGenerating) {
      return <Skeleton className="h-4 w-32" />;
    }

    // If we don't have a meaningful title yet
    if (!conv.title || conv.title === "Untitled" || conv.title.trim() === "") {
      // If we've generated but still don't have a title, show "New Chat"
      if (titleState?.hasGenerated) {
        return <span className="text-muted-foreground italic">New Chat</span>;
      }
      // Otherwise show "Untitled"
      return <span className="text-muted-foreground italic">Untitled</span>;
    }

    // Show the actual title
    return conv.title;
  };

  // Handle starting rename
  const handleStartRename = (conv: any) => {
    setEditingConversationId(conv.id);
    setEditingTitle(conv.title || "");
  };

  // Handle saving renamed title
  const handleSaveRename = async (conversationId: string) => {
    if (!editingTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    try {
      // Update in database
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: editingTitle.trim() }),
      });

      if (response.ok) {
        // Refetch conversations to update the cache
        refetchConversations();
        toast.success("Conversation renamed!");
      } else {
        throw new Error("Failed to rename conversation");
      }
    } catch (error) {
      console.error("Failed to rename conversation:", error);
      toast.error("Failed to rename conversation");
    } finally {
      setEditingConversationId(null);
      setEditingTitle("");
    }
  };

  // Handle canceling rename
  const handleCancelRename = () => {
    setEditingConversationId(null);
    setEditingTitle("");
  }; // Handle deleting conversation
  const handleDeleteConversation = (conv: { id: string; title: string }) => {
    setConversationToDelete(conv);
    setDeleteConfirmOpen(true);
  };

  // Handle confirming delete
  const handleConfirmDelete = async () => {
    if (!conversationToDelete || isDeletingConversation) return;

    setIsDeletingConversation(true);

    try {
      console.log(
        "🗑️ Attempting to delete conversation:",
        conversationToDelete.id
      );
      const response = await fetch(
        `/api/conversations/${conversationToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      console.log("📡 Delete response status:", response.status);

      if (response.ok) {
        // Refetch conversations to update the cache
        refetchConversations();
        toast.success("Conversation deleted!");

        // If we're currently viewing the deleted conversation, redirect to home
        if (conversationToDelete.id === conversationId) {
          // Set flag to prevent auto-redirect after deletion
          sessionStorage.setItem("just-deleted-conversation", "true");
          router.push("/");
        }
      } else {
        // Get the error details from response
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "❌ Delete failed with status:",
          response.status,
          "Error:",
          errorData
        );
        throw new Error(
          `Failed to delete conversation: ${response.status} ${
            errorData.error || ""
          }`
        );
      }
    } catch (error) {
      console.error("❌ Failed to delete conversation:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setIsDeletingConversation(false);
      setDeleteConfirmOpen(false);
      setConversationToDelete(null);
    }
  };

  // Handle canceling delete
  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setConversationToDelete(null);
    setIsDeletingConversation(false);
  };

  // Debug logging for sidebar
  React.useEffect(() => {
    console.log("🔧 Sidebar state:", {
      conversations: conversations?.length || 0,
      isLoading,
      titleStates: Object.keys(titleStates).length,
      remainingMessages,
      isLimitReached,
    });
  }, [
    conversations,
    isLoading,
    titleStates,
    remainingMessages,
    isLimitReached,
  ]);

  // Handle hover with slight delay to prevent flickering
  const handleMouseEnter = (convId: string) => {
    setHoveredConversationId(convId);
  };

  const handleMouseLeave = () => {
    setHoveredConversationId(null);
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="p-2 space-y-4">
          <div className="mb-4 flex flex-row gap-2 items-center justify-between">
            <h1 className="font-bold">Not T3.chat Pro</h1>
            <SignedIn>
              <Button
                size="sm"
                title="New Chat"
                variant="outline"
                onClick={handleNewChat}
              >
                <Plus />
              </Button>
            </SignedIn>
            <SignedOut>
              <Link href={"/"}>
                <Button size="sm" title="Home" variant="outline">
                  <Plus />
                </Button>
              </Link>
            </SignedOut>
          </div>
        </div>
        <Separator className="mb-2" />
        <SignedIn>
          <SearchForm onSearchClick={() => setSearchModalOpen(true)} />
        </SignedIn>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SignedIn>
            {isLoading && <div className="p-2">Loading...</div>}
            {!isLoading &&
              Array.isArray(conversations) &&
              conversations.length === 0 && (
                <div className="p-2 text-xs text-muted-foreground">
                  No chats yet. Start a new conversation!
                </div>
              )}
            {!isLoading &&
              Array.isArray(conversations) &&
              conversations.map((conv) => (
                <SidebarMenuItem
                  key={conv.id}
                  onMouseEnter={() => handleMouseEnter(conv.id)}
                  onMouseLeave={handleMouseLeave}
                  className="group relative"
                >
                  {editingConversationId === conv.id ? (
                    // Rename mode
                    <div className="flex items-center gap-2 px-2 py-1">
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveRename(conv.id);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleCancelRename();
                          }
                        }}
                        onBlur={() => {
                          // Only save if there's content, otherwise cancel
                          if (editingTitle.trim()) {
                            handleSaveRename(conv.id);
                          } else {
                            handleCancelRename();
                          }
                        }}
                        autoFocus
                        className="h-7 text-sm"
                        placeholder="Enter conversation title..."
                      />
                    </div>
                  ) : (
                    // Normal mode - integrated dropdown inside the button
                    <SidebarMenuButton
                      asChild
                      isActive={conv.id === conversationId}
                      className="w-full justify-between group/item"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Link
                          href={`/chat/${conv.id}`}
                          className="flex-1 flex items-center min-w-0"
                        >
                          <span className="truncate block">
                            {getConversationTitle(conv)}
                          </span>
                        </Link>

                        {/* Dropdown menu - integrated inside the button */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 w-6 p-0 ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity ${
                                hoveredConversationId === conv.id
                                  ? "opacity-100"
                                  : ""
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(conv);
                              }}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation({
                                  id: conv.id,
                                  title: conv.title || "Untitled",
                                });
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
          </SignedIn>
          <SignedOut>
            <div className="p-2 space-y-4">
              <div className="mb-4">
                <h2 className="font-semibold text-sm">✨ Features</h2>
              </div>
              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>Compare AI models side-by-side</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>GPT-4, Gemini 2.0 Flash support</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  <span>Save & revisit chat history</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>Modern dark/light theme</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-pink-500">•</span>
                  <span>Secure & private</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <SignInButton>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // Save temporary chat before sign-in
                      if (
                        typeof window !== "undefined" &&
                        (window as any).saveTemporaryChatForRestore
                      ) {
                        (window as any).saveTemporaryChatForRestore();
                      }
                    }}
                  >
                    Sign in to Save Chats
                  </Button>
                </SignInButton>
              </div>

              {/* Message counter for guests */}
              <div className="pt-2 border-t mt-2">
                <div className="text-xs text-center text-muted-foreground">
                  {remainingMessages > 0 ? (
                    <span className="text-primary font-medium">
                      {remainingMessages} free messages, login for more
                    </span>
                  ) : (
                    <span className="text-destructive font-medium">
                      Message limit reached
                    </span>
                  )}
                </div>
              </div>
            </div>
          </SignedOut>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between gap-2">
          <UserButton afterSignOutUrl="/" />
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} MIT License
          </p>
        </div>
        <SidebarRail />
      </SidebarFooter>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{conversationToDelete?.title}"?
              This action cannot be undone and will permanently remove all
              messages in this conversation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              className="w-full sm:w-auto"
              disabled={isDeletingConversation}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="w-full sm:w-auto"
              disabled={isDeletingConversation}
            >
              {isDeletingConversation ? "Deleting..." : "Delete Conversation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Modal */}
      <SearchModal open={searchModalOpen} onOpenChange={setSearchModalOpen} />
    </Sidebar>
  );
}
