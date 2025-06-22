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
import { RestoreChatModal, MessageLimitModal } from "@/components/chat-modals";
import { useSendMessage } from "@/hooks/useSendMessage";
import { toast } from "sonner";

const SUPPORTED_MODELS = ["gpt-4.1-nano", "gemini-2.0-flash"];

export default function Page() {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const { createConversation } = useCreateConversation();
  const sendMessage = useSendMessage();

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

  // Temporary chat state
  const [isTemporaryChat, setIsTemporaryChat] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [temporaryMessages, setTemporaryMessages] = useState<Message[]>([]);

  // Modal states
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [hasShownRestoreModal, setHasShownRestoreModal] = useState(false);
  const [restoreModalData, setRestoreModalData] = useState<any>(null);

  // Shared input state
  const [sharedInput, setSharedInput] = useState("");
  const [submitSignal, setSubmitSignal] = useState(0);

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

  // Check for temporary chat restoration after sign-in
  useEffect(() => {
    const checkForTemporaryChat = () => {
      if (isSignedIn && !hasShownRestoreModal) {
        const savedChat = sessionStorage.getItem("tempChatRestore");
        if (savedChat) {
          try {
            const chatData = JSON.parse(savedChat);
            if (chatData.messages && chatData.messages.length > 0) {
              setRestoreModalData(chatData);
              // Show modal after a brief delay to let UI settle
              setTimeout(() => {
                setShowRestoreModal(true);
                setHasShownRestoreModal(true);
              }, 500);
            }
          } catch (e) {
            console.warn("Failed to parse saved chat data:", e);
            sessionStorage.removeItem("tempChatRestore");
          }
        }
      }
    };

    checkForTemporaryChat();
  }, [isSignedIn, hasShownRestoreModal]);

  // Save temporary chat before sign-in (this will be called from sidebar)
  const saveTemporaryChatForRestore = () => {
    if (temporaryMessages.length > 0) {
      sessionStorage.setItem(
        "tempChatRestore",
        JSON.stringify({
          messages: temporaryMessages,
          sharedInput: sharedInput,
          timestamp: Date.now(),
          models: SUPPORTED_MODELS,
        })
      );
    }
  };

  // Expose the save function globally so sidebar can call it
  useEffect(() => {
    (window as any).saveTemporaryChatForRestore = saveTemporaryChatForRestore;
    return () => {
      delete (window as any).saveTemporaryChatForRestore;
    };
  }, [temporaryMessages, sharedInput]);

  // Group temporary messages by model
  const messagesByModel = temporaryMessages.reduce(
    (acc: Record<string, Message[]>, msg: Message) => {
      if (!acc[msg.model]) acc[msg.model] = [];
      acc[msg.model].push(msg);
      return acc;
    },
    {}
  );

  // Handle first message - create conversation for signed-in users
  const handleFirstMessage = async () => {
    if (isTemporaryChat) {
      const newConversation = await createConversation({ title: "" });
      if (newConversation?.id) {
        setConversationId(newConversation.id);
        setIsTemporaryChat(false);
        // Use shallow routing to update URL without full page reload
        window.history.replaceState(null, "", `/chat/${newConversation.id}`);
      }
    }
  };

  // Handle temporary message for logged-out users
  const handleTemporaryMessage = (message: Message) => {
    setTemporaryMessages((prev) => [...prev, message]);
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
    handleTemporaryMessage(message);

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
    if (!restoreModalData) return;

    try {
      // Create new conversation
      const newConversation = await createConversation({ title: "" });

      if (newConversation?.id) {
        // Save all restored messages to the database
        for (const message of restoreModalData.messages) {
          await sendMessage({
            conversation_id: newConversation.id,
            model: message.model,
            role: message.role,
            content: message.content,
          });
        }

        // Update component state
        setConversationId(newConversation.id);
        setIsTemporaryChat(false);
        setTemporaryMessages(restoreModalData.messages);
        setSharedInput(restoreModalData.sharedInput || "");

        // Update URL to go to the conversation page which will load messages from DB
        window.location.href = `/chat/${newConversation.id}`;

        // Clean up
        sessionStorage.removeItem("tempChatRestore");
        setShowRestoreModal(false);

        toast.success("Previous conversation restored and saved!");
      }
    } catch (error) {
      console.error("Failed to restore conversation:", error);
      toast.error("Failed to restore conversation. Starting fresh.");
      handleStartFresh();
    }
  };

  const handleStartFresh = () => {
    sessionStorage.removeItem("tempChatRestore");
    setShowRestoreModal(false);
    setRestoreModalData(null);
    // Component already starts with fresh state
  };

  // This function will be called when any card submits (signed-in users)
  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharedInput.trim()) return;
    setSubmitSignal((prev) => prev + 1);
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
          <SignedIn>
            {/* For signed-in users: show chat interface that will create conversation on first message */}
            <div className="h-full grid grid-rows-1 gap-4 md:grid-cols-2">
              {SUPPORTED_MODELS.map((model, idx) => (
                <ModelCard
                  key={model}
                  model={model}
                  conversationId={conversationId || "temp"}
                  initialMessages={messagesByModel[model] ?? []}
                  sharedInput={sharedInput}
                  onSharedInputChange={setSharedInput}
                  submitSignal={submitSignal}
                  onCardSubmit={handleCardSubmit}
                  onMessageSent={async () => {
                    // Create conversation on first message for signed-in users
                    if (isTemporaryChat && conversationId === "temp") {
                      await handleFirstMessage();
                    }
                  }}
                  index={idx}
                  totalCards={SUPPORTED_MODELS.length}
                />
              ))}
            </div>
          </SignedIn>
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
                />
              ))}
            </div>
          </SignedOut>
        </div>

        {/* Modals */}
        <RestoreChatModal
          isOpen={showRestoreModal}
          onClose={() => setShowRestoreModal(false)}
          messageCount={restoreModalData?.messages?.length || 0}
          onContinue={handleContinueConversation}
          onStartFresh={handleStartFresh}
        />

        <MessageLimitModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
