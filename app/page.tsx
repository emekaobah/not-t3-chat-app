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
import { useConversationStore } from "@/stores/conversationStore";
import { useCardLayout } from "@/hooks/useCardLayout";
import { toast } from "sonner";

const SUPPORTED_MODELS = [
  "gpt-4.1-nano",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite-preview-02-05",
];

const MODEL_DISPLAY_NAMES = {
  "gpt-4.1-nano": "GPT-4.1 Nano",
  "gemini-2.0-flash": "Gemini 2.0 Flash",
  "gemini-2.0-flash-lite-preview-02-05": "Gemini Flash Lite",
};

interface CardConfig {
  id: string;
  model: string;
  position: number;
}

export default function Page() {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const { createConversation } = useCreateConversation();
  const sendMessage = useSendMessage();
  const { generateTitle, isGenerating: isTitleGenerating } = useGenerateTitle();

  // Conversation store for checking existing conversations
  const { conversations, refreshConversations } = useConversationStore();

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

  // Card configuration state - manages card positions and models
  const [cardConfigs, setCardConfigs] = useState<CardConfig[]>(() =>
    SUPPORTED_MODELS.map((model, idx) => ({
      id: `card-${idx}`,
      model: model,
      position: idx,
    }))
  );

  // Modal states
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [hasShownRestoreModal, setHasShownRestoreModal] = useState(false);
  const [isRestoringConversation, setIsRestoringConversation] = useState(false);

  // Shared input state for guest users
  const [sharedInput, setSharedInput] = useState("");
  const [submitSignal, setSubmitSignal] = useState(0);

  // Dynamic layout for cards
  const { layout, containerRef } = useCardLayout(cardConfigs.length);

  // Card management functions
  const moveCard = (cardId: string, direction: "left" | "right") => {
    setCardConfigs((prev) => {
      const card = prev.find((c) => c.id === cardId);
      if (!card) return prev;

      const targetPosition =
        direction === "left" ? card.position - 1 : card.position + 1;

      // Find card at target position
      const targetCard = prev.find((c) => c.position === targetPosition);

      if (targetCard) {
        // Swap positions
        return prev.map((c) =>
          c.id === cardId
            ? { ...c, position: targetPosition }
            : c.id === targetCard.id
            ? { ...c, position: card.position }
            : c
        );
      }
      return prev;
    });
  };

  // Helper function to get available models
  const getAvailableModels = (currentCards: CardConfig[]) => {
    const usedModels = currentCards.map((card) => card.model);
    return SUPPORTED_MODELS.filter((model) => !usedModels.includes(model));
  };

  // Add card functionality
  const addCard = () => {
    const availableModels = getAvailableModels(cardConfigs);

    if (availableModels.length === 0) {
      toast.error("All models are already in use");
      return;
    }

    if (cardConfigs.length >= 3) {
      toast.error("Maximum 3 cards allowed");
      return;
    }

    const newModel = availableModels[0];
    const maxPosition = Math.max(...cardConfigs.map((c) => c.position));

    setCardConfigs((prev) => [
      ...prev,
      {
        id: `card-${Date.now()}`,
        model: newModel,
        position: maxPosition + 1,
      },
    ]);

    toast.success(
      `Added ${
        MODEL_DISPLAY_NAMES[newModel as keyof typeof MODEL_DISPLAY_NAMES]
      } card`
    );
  };

  // Delete card functionality
  const deleteCard = (cardId: string) => {
    if (cardConfigs.length <= 2) {
      toast.error("Minimum 2 cards required");
      return;
    }

    const cardToDelete = cardConfigs.find((c) => c.id === cardId);
    const modelName = cardToDelete
      ? MODEL_DISPLAY_NAMES[
          cardToDelete.model as keyof typeof MODEL_DISPLAY_NAMES
        ]
      : "Card";

    setCardConfigs((prev) => {
      const filtered = prev.filter((c) => c.id !== cardId);
      // Reposition remaining cards to fill gaps
      return filtered.map((card, idx) => ({
        ...card,
        position: idx,
      }));
    });

    toast.success(`Removed ${modelName} card`);
  };

  // Handle model change with validation
  const handleModelChange = (cardId: string, newModel: string) => {
    // Validation: ensure model isn't used by another card
    const isModelTaken = cardConfigs.some(
      (c) => c.id !== cardId && c.model === newModel
    );

    if (isModelTaken) {
      toast.error(
        `${
          MODEL_DISPLAY_NAMES[newModel as keyof typeof MODEL_DISPLAY_NAMES]
        } is already in use`
      );
      return;
    }

    setCardConfigs((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, model: newModel } : c))
    );
  };

  const getMessagesForCard = (cardConfig: CardConfig) => {
    return messagesByModel[cardConfig.model] || [];
  };

  // Reset guest message count when user signs in, reinitialize when signs out
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

  // State to prevent auto-redirect after manual navigation to home
  const [preventAutoRedirect, setPreventAutoRedirect] = useState(false);

  // Check if user manually navigated to home page (e.g., after deleting a conversation)
  useEffect(() => {
    // Check sessionStorage for deletion flag
    const deleteFlag = sessionStorage.getItem("just-deleted-conversation");
    if (deleteFlag) {
      console.log(
        "🗑️ User just deleted a conversation, preventing auto-redirect"
      );
      setPreventAutoRedirect(true);
      // Clean up the flag
      sessionStorage.removeItem("just-deleted-conversation");
    }
  }, []);

  // Initialize conversations when user signs in
  useEffect(() => {
    if (isSignedIn) {
      console.log("👤 User signed in, refreshing conversations");
      refreshConversations();
    }
  }, [isSignedIn, refreshConversations]);

  // Redirect signed-in users to create a new conversation if they land on home page
  // BUT only if there's no guest conversation to restore AND no existing conversations
  // AND they didn't manually navigate here (e.g., after deleting a conversation)
  useEffect(() => {
    // Only auto-redirect if user is signed in AND there's no guest conversation to restore
    // AND it's their first time AND they didn't manually navigate here
    if (
      isSignedIn &&
      !guestConversation.hasActiveConversation &&
      !hasShownRestoreModal &&
      !preventAutoRedirect &&
      conversations // Make sure conversations have been loaded
    ) {
      if (conversations.length > 0) {
        console.log(
          "🔄 User has existing conversations, redirecting to most recent"
        );
        // User has existing conversations, redirect to the most recent one
        const mostRecent = conversations[0]; // Assuming conversations are sorted by most recent
        router.push(`/chat/${mostRecent.id}`);
      } else {
        console.log(
          "🚀 New user with no conversations, creating first conversation"
        );
        // No existing conversations, create a new one (first-time user experience)
        // Only if this is truly a first-time user (not someone who just deleted all their conversations)
        const createFirstConversation = async () => {
          const newConversation = await createConversation({
            title: "Untitled",
          });
          if (newConversation?.id) {
            router.push(`/chat/${newConversation.id}`);
          }
        };
        createFirstConversation();
      }
    } else if (isSignedIn && guestConversation.hasActiveConversation) {
      console.log(
        "🔄 Signed-in user has guest conversation - waiting for restore modal"
      );
    } else if (preventAutoRedirect) {
      console.log(
        "🚫 Auto-redirect prevented - user manually navigated to home"
      );
    }
  }, [
    isSignedIn,
    guestConversation.hasActiveConversation,
    hasShownRestoreModal,
    preventAutoRedirect,
    conversations, // Use the conversations from the store
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
    // Prevent double-clicking
    if (isRestoringConversation) {
      console.log("🚫 Already restoring conversation, ignoring click");
      return;
    }

    const conversationData = guestConversation.getConversationData();
    if (!conversationData) {
      console.log("❌ No conversation data found");
      return;
    }

    console.log("🔄 Starting conversation restoration...");
    setIsRestoringConversation(true);
    guestConversation.setRestoring(true);

    try {
      // Generate title from guest conversation messages
      let title = "";
      if (conversationData.messages.length > 0) {
        try {
          console.log("🎨 Generating title for restored conversation...");
          title = await generateTitle(conversationData.messages);
          console.log("✅ Generated title:", title);
        } catch (error) {
          console.error(
            "Failed to generate title for restored conversation:",
            error
          );
          title = ""; // Will use empty title as fallback
        }
      }

      // Create new conversation with generated title
      console.log("📝 Creating new conversation...");
      const newConversation = await createConversation({ title });

      if (newConversation?.id) {
        console.log("💾 Saving restored messages to database...");
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

        console.log("🎉 Conversation restoration complete, navigating...");
        // Navigate to the new conversation page
        router.push(`/chat/${newConversation.id}`);

        toast.success("Previous conversation restored and saved!");
      }
    } catch (error) {
      console.error("❌ Failed to restore conversation:", error);
      toast.error("Failed to restore conversation. Starting fresh.");
      handleStartFresh();
    } finally {
      // Always clear loading states
      setIsRestoringConversation(false);
      guestConversation.setRestoring(false);
    }
  };

  const handleStartFresh = () => {
    console.log("🧹 Starting fresh conversation");
    // Clear guest conversation
    guestConversation.clearConversation();
    setShowRestoreModal(false);
    setIsRestoringConversation(false);
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

  // Sort cards by position for rendering
  const sortedCards = [...cardConfigs].sort((a, b) => a.position - b.position);

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
            <div
              ref={containerRef}
              className={
                layout.type === "grid"
                  ? "h-full grid gap-4 grid-cols-2"
                  : "h-full flex gap-4 overflow-x-auto horizontal-scroll"
              }
            >
              {sortedCards.map((cardConfig, idx) => (
                <ModelCard
                  key={cardConfig.id}
                  model={cardConfig.model}
                  conversationId="guest"
                  initialMessages={getMessagesForCard(cardConfig)}
                  sharedInput={sharedInput}
                  onSharedInputChange={setSharedInput}
                  submitSignal={submitSignal}
                  onCardSubmit={handleGuestCardSubmit}
                  onMessageSent={() => {
                    // Guest message handling is done in handleGuestCardSubmit
                  }}
                  onModelChange={(model) =>
                    handleModelChange(cardConfig.id, model)
                  }
                  onAddCard={addCard}
                  onDeleteCard={() => deleteCard(cardConfig.id)}
                  onMoveLeft={() => moveCard(cardConfig.id, "left")}
                  onMoveRight={() => moveCard(cardConfig.id, "right")}
                  availableModels={getAvailableModels(cardConfigs).filter(
                    (m) => m !== cardConfig.model
                  )}
                  index={idx}
                  totalCards={sortedCards.length}
                  isGuestMode={true} // Guest users
                  className={
                    layout.type === "flex-scroll"
                      ? "flex-shrink-0 w-[400px]"
                      : ""
                  }
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
          isRestoring={isRestoringConversation}
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
              <div>Restoring: {isRestoringConversation ? "Yes" : "No"}</div>
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
