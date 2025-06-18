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

const CARD_COUNT = 2; // or any number of models/cards you want shown

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { messages, isLoading, refetch } = useMessages(conversationId);

  // Shared prompt input
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

  // Submit from any card triggers all
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
        {/* TOP INPUT REMOVED! */}
        <div className="flex-1 p-4 overflow-hidden">
          {isLoading && <div>Loading messages...</div>}
          <div
            className={`h-full grid auto-rows-fr gap-4 md:grid-cols-${CARD_COUNT}`}
          >
            {[...Array(CARD_COUNT)].map((_, idx) => (
              <ModelCard
                key={idx}
                conversationId={conversationId}
                initialMessages={[]} // can pass [] or messagesByModel[model] if you want to persist per model
                sharedInput={sharedInput}
                onSharedInputChange={setSharedInput}
                submitSignal={submitSignal}
                onCardSubmit={handleCardSubmit}
                onMessageSent={refetch}
              />
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
