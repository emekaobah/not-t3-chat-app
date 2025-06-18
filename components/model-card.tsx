"use client";
import { useEffect, useState } from "react";
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
  conversationId: string;
  initialMessages: Message[];
  sharedInput: string;
  onSharedInputChange: (val: string) => void;
  submitSignal: number;
  onCardSubmit: (e: React.FormEvent) => void;
  onMessageSent: () => void;
}

export function ModelCard({
  conversationId,
  initialMessages,
  sharedInput,
  onSharedInputChange,
  submitSignal,
  onCardSubmit,
  onMessageSent,
}: Props) {
  // Each card tracks its own selected model!
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);

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

  return (
    <div className="h-full flex flex-col border rounded-lg w-full">
      <CardHeader className="p-4 flex flex-row items-center justify-between">
        <ModelSelector value={selectedModel} onChange={setSelectedModel} />
        <ModelConfig />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
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
