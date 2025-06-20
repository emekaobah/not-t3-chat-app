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

const DEFAULT_MODEL = "gpt-4.1-nano";

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
  index: number;
  totalCards: number;
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
  index,
  totalCards,
}: Props) {
  // Each card tracks its own selected model!
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sendMessage = useSendMessage();

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    initialMessages,
    onFinish: async (msg) => {
      if (msg.role === "assistant") {
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

  // On submitSignal, send sharedInput to THIS card's selected model
  useEffect(() => {
    if (submitSignal > 0 && sharedInput.trim()) {
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
      className="h-full flex flex-col border rounded-lg w-full min-w-[400px] max-w-[600px]"
      style={{ minHeight: "100%" }}
    >
      <CardHeader className="p-4 flex flex-row items-center justify-between shrink-0">
        <ModelSelector value={selectedModel} onChange={setSelectedModel} />
        <ModelConfig
          onDelete={onDelete}
          onMoveLeft={onMoveLeft}
          onMoveRight={onMoveRight}
          onAddCard={onAddCard}
          onClearChat={onClearChat}
          index={index}
          totalCards={totalCards}
        />
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
