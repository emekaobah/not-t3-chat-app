"use client";
import AppHeader from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { ModelCard } from "@/components/model-card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { useCreateConversation } from "@/hooks/useCreateConversation";
import { Message } from "@/hooks/useMessages";
import { useGuestMessageLimiter } from "@/stores/guestMessageStore";
import { useGuestConversation } from "@/stores/guestConversationStore";
import { RestoreChatModal, MessageLimitModal } from "@/components/chat-modals";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useGenerateTitle } from "@/hooks/useGenerateTitle";
import { toast } from "sonner";

const SUPPORTED_MODELS = ["gpt-4.1-nano", "gemini-2.0-flash"];

export default function Page() {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const { createConversation } = useCreateConversation();
  const sendMessage = useSendMessage();
  const { generateTitle, isGenerating: isTitleGenerating } = useGenerateTitle();

  // Guest message limiting
  const {
    guestMessageCount,
    remainingMessages,
    isLimitReached,
    incrementMessageCount,
    canSendMessage,
    resetOnSignIn,
    forceReinitialize,
    clearAllStorage, // DEBUG function
  } = useGuestMessageLimiter();

  // Guest conversation management
  const guestConversation = useGuestConversation();

  // Modal states
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [hasShownRestoreModal, setHasShownRestoreModal] = useState(false);

  // Shared input state for guest users
  const [sharedInput, setSharedInput] = useState("");
  const [submitSignal, setSubmitSignal] = useState(0); // Reset guest message count when user signs in, reinitialize when signs out
  useEffect(() => {
    if (isSignedIn) {
      console.log("🔄 User signed in, resetting guest message count");
      resetOnSignIn();

      // Add a small delay to ensure state updates
      setTimeout(() => {
        console.log("✅ Guest count reset complete");
      }, 100);
    } else {
      console.log("👤 User is signed out, reinitializing guest limiting");
      // Force reinitialization when user signs out to properly apply limits
      setTimeout(() => {
        forceReinitialize();
      }, 100);
    }
  }, [isSignedIn, resetOnSignIn, forceReinitialize]);

  // Redirect signed-in users to create a new conversation if they land on home page
  useEffect(() => {
    if (isSignedIn && !guestConversation.hasActiveConversation) {
      // If signed-in user lands on home page, redirect to create new conversation
      const createNewConversation = async () => {
        const newConversation = await createConversation({ title: "Untitled" });
        if (newConversation?.id) {
          router.push(`/chat/${newConversation.id}`);
        }
      };
      createNewConversation();
    }
  }, [
    isSignedIn,
    guestConversation.hasActiveConversation,
    createConversation,
    router,
  ]);

  // Check for guest conversation restoration after sign-in
  useEffect(() => {
    const checkForRestoration = () => {
      if (
        isSignedIn &&
        !hasShownRestoreModal &&
        guestConversation.hasActiveConversation
      ) {
        console.log("🔍 Found guest conversation to restore:", {
          messageCount: guestConversation.messageCount,
          hasActiveConversation: guestConversation.hasActiveConversation,
        });

        // Show modal after a brief delay to let UI settle
        setTimeout(() => {
          setShowRestoreModal(true);
          setHasShownRestoreModal(true);
        }, 500);
      }
    };

    checkForRestoration();
  }, [
    isSignedIn,
    hasShownRestoreModal,
    guestConversation.hasActiveConversation,
    guestConversation.messageCount,
  ]);

  // Group messages by model for display
  const messagesByModel = guestConversation.messages.reduce(
    (acc: Record<string, Message[]>, msg: Message) => {
      if (!acc[msg.model]) acc[msg.model] = [];
      acc[msg.model].push(msg);
      return acc;
    },
    {}
  );

  // Generate title for conversation after we have enough context
  const generateConversationTitle = async (
    conversationId: string,
    messages: Message[]
  ) => {
    try {
      const title = await generateTitle(messages);

      // Update the conversation title in the database
      await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      toast.success("Chat title generated!");
    } catch (error) {
      console.error("Failed to generate title:", error);
      // Don't show error toast as this is a background operation
    }
  };

  // Handle guest message with limit checking
  const handleGuestMessage = (message: Message) => {
    console.log("🔍 Guest message handler called:", {
      canSendMessage,
      messageCount: guestMessageCount,
      isLimitReached,
    });

    if (!canSendMessage) {
      console.log("🚫 Cannot send message, showing limit modal");
      setShowLimitModal(true);
      return false;
    }

    const newCount = incrementMessageCount();

    // Add message to guest conversation store
    guestConversation.addMessage(message);

    console.log("📨 Guest message processed:", {
      newCount,
      remaining: 3 - newCount,
    });

    // Show toast notification
    const remaining = 3 - newCount;
    if (remaining > 0) {
      toast.info(`${remaining} free messages remaining`);
    } else {
      toast.warning("Message limit reached. Sign in to continue!");
    }

    return true;
  };

  // Restoration modal handlers
  const handleContinueConversation = async () => {
    const conversationData = guestConversation.getConversationData();
    if (!conversationData) return;

    guestConversation.setRestoring(true);

    try {
      // Generate title from guest conversation messages
      let title = "";
      if (conversationData.messages.length > 0) {
        try {
          title = await generateTitle(conversationData.messages);
        } catch (error) {
          console.error(
            "Failed to generate title for restored conversation:",
            error
          );
          title = ""; // Will use empty title as fallback
        }
      }

      // Create new conversation with generated title
      const newConversation = await createConversation({ title });

      if (newConversation?.id) {
        // Save all restored messages to the database
        for (const message of conversationData.messages) {
          await sendMessage({
            conversation_id: newConversation.id,
            model: message.model,
            role: message.role,
            content: message.content,
          });
        }

        // Update component state
        setSharedInput(conversationData.sharedInput || "");

        // Clear guest conversation and close modal
        guestConversation.clearConversation();
        setShowRestoreModal(false);
        guestConversation.setRestoring(false);

        // Navigate to the new conversation page
        router.push(`/chat/${newConversation.id}`);

        toast.success("Previous conversation restored and saved!");
      }
    } catch (error) {
      console.error("Failed to restore conversation:", error);
      toast.error("Failed to restore conversation. Starting fresh.");
      guestConversation.setRestoring(false);
      handleStartFresh();
    }
  };

  const handleStartFresh = () => {
    // Clear guest conversation
    guestConversation.clearConversation();
    setShowRestoreModal(false);
    // Component already starts with fresh state
  };

  // This function will be called when guest users try to submit
  const handleGuestCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharedInput.trim()) return;

    console.log("🔍 Guest submit attempt:", {
      messageCount: guestMessageCount,
      canSendMessage,
      isLimitReached,
      remainingMessages,
    });

    // Check message limit before proceeding - CRITICAL FIX
    if (!canSendMessage || isLimitReached) {
      console.log("🚫 Message limit reached, showing modal");
      setShowLimitModal(true);
      return; // STOP HERE - do not proceed with sending
    }

    // Only increment and send if we can send
    console.log("✅ Sending guest message...");
    const newCount = incrementMessageCount();
    const remaining = 3 - newCount;

    // Show appropriate toast
    if (remaining > 0) {
      toast.info(`${remaining} free messages remaining`);
    } else {
      toast.warning("Message limit reached. Sign in to continue!");
    }

    // Only trigger submit if we haven't reached the limit
    if (newCount <= 3) {
      setSubmitSignal((prev) => prev + 1);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 justify-between">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            {/* DEBUG: Temporary clear button */}
            <SignedOut>
              <button
                onClick={() => {
                  clearAllStorage();
                  window.location.reload();
                }}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                title="DEBUG: Clear guest storage"
              >
                🧹 Clear Storage
              </button>
            </SignedOut>
            <AppHeader />
          </div>
        </header>
        <div className="flex-1 p-4 overflow-hidden">
          <SignedOut>
            {/* For signed-out users: show same chat interface but temporary with limits */}
            <div className="h-full grid grid-rows-1 gap-4 md:grid-cols-2">
              {SUPPORTED_MODELS.map((model, idx) => (
                <ModelCard
                  key={model}
                  model={model}
                  conversationId="guest"
                  initialMessages={messagesByModel[model] ?? []}
                  sharedInput={sharedInput}
                  onSharedInputChange={setSharedInput}
                  submitSignal={submitSignal}
                  onCardSubmit={handleGuestCardSubmit}
                  onMessageSent={() => {
                    // Guest message handling is done in handleGuestCardSubmit
                  }}
                  index={idx}
                  totalCards={SUPPORTED_MODELS.length}
                  isGuestMode={true} // Guest users
                />
              ))}
            </div>
          </SignedOut>
        </div>

        {/* Modals */}
        <RestoreChatModal
          isOpen={showRestoreModal}
          onClose={() => setShowRestoreModal(false)}
          messageCount={guestConversation.messages.length}
          onContinue={handleContinueConversation}
          onStartFresh={handleStartFresh}
        />

        <MessageLimitModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
        />

        {/* DEBUG: Add a button to help test guest conversation state */}
        {!isSignedIn && (
          <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 text-xs">
            <div className="space-y-2">
              <div>
                <strong>Debug Info:</strong>
              </div>
              <div>Messages: {guestConversation.messages.length}</div>
              <div>
                Has Active:{" "}
                {guestConversation.hasActiveConversation ? "Yes" : "No"}
              </div>
              <div>Remaining: {remainingMessages}</div>
              <div>Limit Reached: {isLimitReached ? "Yes" : "No"}</div>
              <div>
                Title Gen: {isTitleGenerating ? "Generating..." : "Idle"}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => clearAllStorage()}
                  className="px-2 py-1 bg-red-500 text-white text-xs rounded"
                >
                  Clear All
                </button>
                <button
                  onClick={() => guestConversation.clearConversation()}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                >
                  Clear Guest Conv
                </button>
                <button
                  onClick={() => setShowRestoreModal(true)}
                  className="px-2 py-1 bg-green-500 text-white text-xs rounded"
                  disabled={!guestConversation.hasActiveConversation}
                >
                  Test Restore Modal
                </button>
              </div>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
