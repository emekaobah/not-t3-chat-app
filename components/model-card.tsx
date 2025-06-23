"use client";
import { useEffect, useState, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ModelSelector } from "./model-selector";
import ModelConfig from "./model-config";
import { useSendMessage } from "@/hooks/useSendMessage";
import { Message } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { useGuestConversation } from "@/stores/guestConversationStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, ArrowLeft, ArrowRight, Trash } from "lucide-react";

const DEFAULT_MODEL = "gpt-4.1-nano";

const MODEL_DISPLAY_NAMES = {
  "gpt-4.1-nano": "GPT-4.1 Nano",
  "gemini-2.0-flash": "Gemini 2.0 Flash",
  "gemini-2.0-flash-lite-preview-02-05": "Gemini Flash Lite",
};

interface Props {
  model: string;
  conversationId: string;
  initialMessages: Message[];
  sharedInput: string;
  onSharedInputChange: (val: string) => void;
  submitSignal: number;
  onCardSubmit: (e: React.FormEvent) => void;
  onMessageSent: () => void;
  onDelete?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onClearChat?: () => void;
  onAddCard?: () => void;
  onDeleteCard?: () => void;
  onModelChange?: (model: string) => void;
  availableModels?: string[];
  className?: string;
  index: number;
  totalCards: number;
  isGuestMode?: boolean;
}

export function ModelCard({
  model,
  conversationId,
  initialMessages,
  sharedInput,
  onSharedInputChange,
  submitSignal,
  onCardSubmit,
  onMessageSent,
  onDelete,
  onMoveLeft,
  onMoveRight,
  onClearChat,
  onAddCard,
  onDeleteCard,
  onModelChange,
  availableModels = [],
  className,
  index,
  totalCards,
  isGuestMode = false,
}: Props) {
  // Each card tracks its own selected model, initialized from the model prop
  const [selectedModel, setSelectedModel] = useState(model || DEFAULT_MODEL);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sendMessage = useSendMessage();
  const guestConversation = useGuestConversation();

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    initialMessages,
    onFinish: async (msg) => {
      if (msg.role === "assistant") {
        // Add assistant message to guest conversation store if in guest mode
        if (isGuestMode) {
          guestConversation.addMessage({
            id: `guest-${Date.now()}-${Math.random()}`,
            conversation_id: "guest",
            role: "assistant",
            content: msg.content,
            model: selectedModel,
            created_at: new Date().toISOString(),
          });
        }

        await sendMessage({
          conversation_id: conversationId,
          model: selectedModel,
          role: "assistant",
          content: msg.content,
        });
        onMessageSent?.();
      }
    },
  });

  // Sync selectedModel when model prop changes (for loaded conversations)
  useEffect(() => {
    if (model && model !== selectedModel) {
      setSelectedModel(model);
    }
  }, [model, selectedModel]);

  // Handle model selection changes
  const handleModelSelection = (newModel: string) => {
    setSelectedModel(newModel);
    onModelChange?.(newModel);
  };

  // On submitSignal, send sharedInput to THIS card's selected model
  useEffect(() => {
    if (submitSignal > 0 && sharedInput.trim()) {
      const userMessage: Message = {
        id: `guest-user-${Date.now()}-${Math.random()}`,
        conversation_id: isGuestMode ? "guest" : conversationId,
        role: "user",
        content: sharedInput,
        model: selectedModel,
        created_at: new Date().toISOString(),
      };

      // Add user message to guest conversation store if in guest mode
      if (isGuestMode) {
        guestConversation.addMessage(userMessage);
      }

      sendMessage({
        conversation_id: conversationId,
        model: selectedModel,
        role: "user",
        content: sharedInput,
      }).then(() => {
        append(
          { role: "user", content: sharedInput },
          { data: { model: selectedModel } }
        );
        onMessageSent?.();
      });
    }
    // eslint-disable-next-line
  }, [submitSignal]);

  // Auto-scroll to bottom when messages change or when streaming
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  // Immediate scroll without animation for faster response during streaming
  const scrollToBottomImmediate = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  };

  // Check if user is near the bottom of the scroll container
  const isNearBottom = () => {
    if (!scrollContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom
  };

  // Handle scroll events to detect if user manually scrolled up
  const handleScroll = () => {
    if (!isNearBottom()) {
      setIsUserScrolledUp(true);
    } else {
      setIsUserScrolledUp(false);
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    // Only auto-scroll if user hasn't manually scrolled up or if we're loading (streaming)
    if (!isUserScrolledUp || isLoading) {
      if (isLoading) {
        scrollToBottomImmediate();
      } else {
        scrollToBottom();
      }
    }
  }, [messages, isLoading, isUserScrolledUp]);

  // Additional scroll trigger for streaming updates
  useEffect(() => {
    if (isLoading && !isUserScrolledUp) {
      // Set up an interval to check for new content during streaming
      const interval = setInterval(() => {
        scrollToBottomImmediate();
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isLoading, isUserScrolledUp]);

  return (
    <div
      className={`h-full flex flex-col border rounded-lg ${
        className || "w-full min-w-[350px]"
      }`}
    >
      <CardHeader className="p-4 flex flex-row items-center justify-between shrink-0">
        <ModelSelector
          value={selectedModel}
          onChange={handleModelSelection}
          excludeModels={availableModels}
        />
        <div className="flex items-center gap-2">
          {/* Card Actions Dropdown */}

          {/* Keep other ModelConfig buttons */}
          <ModelConfig
            onDelete={onDelete}
            onAddCard={onAddCard}
            onClearChat={onClearChat}
            index={index}
            totalCards={totalCards}
            // Remove the move and delete props since they're now in dropdown
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={onMoveLeft}
                disabled={index === 0}
                className="cursor-pointer"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Move Left
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onMoveRight}
                disabled={index === totalCards - 1}
                className="cursor-pointer"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Move Right
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDeleteCard}
                className="cursor-pointer text-destructive focus:text-destructive"
                disabled={totalCards <= 2}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Card
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent
        className="flex-1 overflow-y-auto"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {messages.map((message, idx) => (
          <div
            key={message.id || idx}
            className="whitespace-pre-wrap my-2 text-sm"
          >
            <span
              className={
                message.role === "user" ? "font-bold" : "text-blue-500"
              }
            >
              {message.role === "user" ? "You: " : "AI: "}
            </span>
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className="text-zinc-400">Streaming response...</div>
        )}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </CardContent>
      <CardFooter className="shrink-0 p-4">
        {/* No "Send" button; submit handled by parent signal */}
        <form onSubmit={onCardSubmit} className="w-full flex gap-2">
          <Input
            value={sharedInput}
            onChange={(e) => onSharedInputChange(e.target.value)}
            placeholder="Type your prompt here..."
          />
        </form>
      </CardFooter>
    </div>
  );
}
