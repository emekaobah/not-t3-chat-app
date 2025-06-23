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
import { useCardLayout } from "@/hooks/useCardLayout";

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

  // Card configuration state - manages card positions and models
  const [cardConfigs, setCardConfigs] = useState<CardConfig[]>(() =>
    SUPPORTED_MODELS.map((model, idx) => ({
      id: `card-${idx}`,
      model: model,
      position: idx,
    }))
  );

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

  // Submitting on any card triggers all cards to send the message
  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharedInput.trim()) return;
    setSubmitSignal((prev) => prev + 1);
  };

  // Sort cards by position for rendering
  const sortedCards = [...cardConfigs].sort((a, b) => a.position - b.position);

  // Use responsive layout hook
  const { layout, containerRef } = useCardLayout(sortedCards.length);

  // Dynamic layout classes based on layout type
  const layoutClasses =
    layout.type === "grid"
      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
      : "flex gap-4 overflow-x-auto card-container";

  const cardClasses =
    layout.type === "grid"
      ? "w-full min-w-[400px] max-w-[600px]"
      : "flex-none w-[400px] min-w-[400px]";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 justify-between">
          <SidebarTrigger className="-ml-1" />
          <AppHeader />
        </header>
        <div className="flex-1 p-4 overflow-hidden">
          <div ref={containerRef} className={`h-full ${layoutClasses}`}>
            {sortedCards.map((cardConfig, idx) => (
              <ModelCard
                key={cardConfig.id}
                model={cardConfig.model}
                conversationId={conversationId}
                initialMessages={getMessagesForCard(cardConfig)}
                className={cardClasses}
                sharedInput={sharedInput}
                onSharedInputChange={setSharedInput}
                submitSignal={submitSignal}
                onCardSubmit={handleCardSubmit}
                onMessageSent={() => {
                  // Just refetch messages - title generation will be handled by useEffect
                  refetch();
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
                isGuestMode={false} // This is always for signed-in users
              />
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
