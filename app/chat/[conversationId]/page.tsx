"use client";
import { useParams } from "next/navigation";
import AppHeader from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { ModelCard } from "@/components/model-card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useMessages, Message } from "@/hooks/useMessages";
import { useGenerateTitle } from "@/hooks/useGenerateTitle";
import { useConversation } from "@/hooks/useUserConversation";
import { useConversationStore } from "@/stores/conversationStore";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const SUPPORTED_MODELS = ["gpt-4.1-nano", "gemini-2.0-flash"];

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { messages, isLoading, refetch } = useMessages(conversationId);
  const { conversation } = useConversation(conversationId);
  const { generateTitle, isGenerating: isTitleGenerating } = useGenerateTitle();

  // Use conversation store for state management
  const {
    updateConversationTitle,
    setTitleGenerating,
    setTitleGenerated,
    refreshConversations,
  } = useConversationStore();

  // Shared prompt input state (keeps in sync, but not shown as a UI at the top)
  const [sharedInput, setSharedInput] = useState("");
  const [submitSignal, setSubmitSignal] = useState(0);

  // Title generation tracking
  const [hasTitleGenerated, setHasTitleGenerated] = useState(false);

  // Generate title for conversation after we have enough context
  const generateConversationTitle = async (messages: Message[]) => {
    console.log(
      "🎨 Starting title generation for conversation:",
      conversationId
    );

    // Set generating state in store
    setTitleGenerating(conversationId, true);

    try {
      const title = await generateTitle(messages);
      console.log("✅ Generated title:", title);

      // Update the conversation title in the database
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        console.log("💾 Title saved to database");
        // Update the store with the new title
        updateConversationTitle(conversationId, title);
        // Mark as generated
        setTitleGenerated(conversationId, true);
        // Refresh conversations to ensure sidebar is updated
        await refreshConversations();
        toast.success("Chat title generated!");
      } else {
        throw new Error("Failed to save title");
      }
    } catch (error) {
      console.error("❌ Failed to generate title:", error);
      // Don't show error toast as this is a background operation
    } finally {
      // Clear generating state
      setTitleGenerating(conversationId, false);
    }
  };

  // Watch for message changes and trigger title generation
  useEffect(() => {
    // Don't generate if we already have or if we're still loading conversation info
    if (hasTitleGenerated || !messages.length || !conversation) return;

    // Check if conversation already has a meaningful title (not "Untitled" or empty)
    const hasNeedNewTitle =
      !conversation.title ||
      conversation.title === "Untitled" ||
      conversation.title.trim() === "";

    if (!hasNeedNewTitle) {
      console.log("💬 Conversation already has title:", conversation.title);
      setHasTitleGenerated(true); // Prevent future generation
      return;
    }

    // Check if we have at least one user message and one assistant message
    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");

    if (userMessages.length >= 1 && assistantMessages.length >= 1) {
      console.log(
        "🎯 Triggering title generation with messages:",
        messages.length
      );
      setHasTitleGenerated(true);
      generateConversationTitle(messages);
    }
  }, [messages, conversation, hasTitleGenerated]);

  // Group messages by model
  const messagesByModel = (messages as Message[]).reduce(
    (acc: Record<string, Message[]>, msg: Message) => {
      if (!acc[msg.model]) acc[msg.model] = [];
      acc[msg.model].push(msg);
      return acc;
    },
    {}
  );

  // Submitting on any card triggers all cards to send the message
  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharedInput.trim()) return;
    setSubmitSignal((prev) => prev + 1);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 justify-between">
          <SidebarTrigger className="-ml-1" />
          <AppHeader />
        </header>
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full grid grid-rows-1 gap-4 md:grid-cols-2">
            {SUPPORTED_MODELS.map((model, idx) => (
              <ModelCard
                key={model}
                model={model}
                conversationId={conversationId}
                initialMessages={messagesByModel[model] ?? []}
                sharedInput={sharedInput}
                onSharedInputChange={setSharedInput}
                submitSignal={submitSignal}
                onCardSubmit={handleCardSubmit}
                onMessageSent={() => {
                  // Just refetch messages - title generation will be handled by useEffect
                  refetch();
                }}
                index={idx}
                totalCards={SUPPORTED_MODELS.length}
                isGuestMode={false} // This is always for signed-in users
              />
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
