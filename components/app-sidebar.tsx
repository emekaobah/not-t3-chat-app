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
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { Separator } from "./ui/separator";
import { useUserConversations } from "@/hooks/useUserConversation";
import { useGuestMessageLimiter } from "@/stores/guestMessageStore";
import { useGuestConversation } from "@/stores/guestConversationStore";
import { useConversationStore } from "@/stores/conversationStore";
import { useCreateConversation } from "@/hooks/useCreateConversation";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export function AppSidebar(props: any) {
  // Use conversation store for real-time updates
  const {
    conversations,
    isLoading,
    titleStates,
    addConversation,
    refreshConversations,
  } = useConversationStore();

  // Get the current conversationId from the URL
  const { conversationId } = useParams<{ conversationId: string }>();
  // Get guest message limiter for signed-out users
  const { remainingMessages, isLimitReached } = useGuestMessageLimiter();
  const guestConversation = useGuestConversation();

  // Add hooks for creating new conversations
  const { createConversation } = useCreateConversation();
  const router = useRouter();

  // Initialize conversations on mount
  React.useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Handle creating a new chat
  const handleNewChat = async () => {
    try {
      // Create new conversation with "Untitled" title initially
      const newConversation = await createConversation({ title: "Untitled" });
      if (newConversation?.id) {
        // Add to store immediately for real-time UI update
        addConversation(newConversation);
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
          <SearchForm />
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
                <SidebarMenuItem key={conv.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={conv.id === conversationId}
                  >
                    <Link href={`/chat/${conv.id}`}>
                      <span className="truncate block max-w-[170px]">
                        {getConversationTitle(conv)}
                      </span>
                    </Link>
                  </SidebarMenuButton>
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
    </Sidebar>
  );
}
