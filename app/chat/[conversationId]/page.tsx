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
import { useState } from "react";

const SUPPORTED_MODELS = ["gpt-4.1-nano", "gemini-2.0-flash"];

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { messages, isLoading, refetch } = useMessages(conversationId);

  // Shared prompt input state (keeps in sync, but not shown as a UI at the top)
  const [sharedInput, setSharedInput] = useState("");
  const [submitSignal, setSubmitSignal] = useState(0);

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
          <div
            className={`h-full grid auto-rows-fr gap-4 md:grid-cols-${SUPPORTED_MODELS.length}`}
          >
            {SUPPORTED_MODELS.map((model, idx) => (
              <ModelCard
                key={model}
                model={model} // <-- Pass this!
                conversationId={conversationId}
                initialMessages={messagesByModel[model] ?? []}
                sharedInput={sharedInput}
                onSharedInputChange={setSharedInput}
                submitSignal={submitSignal}
                onCardSubmit={handleCardSubmit}
                onMessageSent={refetch}
                index={idx}
                totalCards={SUPPORTED_MODELS.length}
              />
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
