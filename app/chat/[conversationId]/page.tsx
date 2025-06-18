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
  const [cards, setCards] = useState(
    [...Array(CARD_COUNT)].map((_, i) => ({ id: i }))
  );

  // Group messages by model
  const messagesByModel = (messages as Message[]).reduce(
    (acc: Record<string, Message[]>, msg: Message) => {
      if (!acc[msg.model]) acc[msg.model] = [];
      acc[msg.model].push(msg);
      return acc;
    },
    {}
  );

  const handleCardDelete = (index: number) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  const handleMoveCard = (index: number, direction: "left" | "right") => {
    const newCards = [...cards];
    const newIndex = direction === "left" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < cards.length) {
      [newCards[index], newCards[newIndex]] = [
        newCards[newIndex],
        newCards[index],
      ];
      setCards(newCards);
    }
  };

  const handleAddCard = () => {
    setCards([...cards, { id: cards.length }]);
  };

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
        <div className="flex-1 p-4 overflow-hidden">
          {isLoading && <div>Loading messages...</div>}
          <div
            className={`h-full grid auto-rows-fr gap-4 ${
              cards.length === 1 ? "place-items-center" : ""
            }`}
            style={{
              gridTemplateColumns: cards.length === 1 ? "1fr" : "1fr 1fr",
            }}
          >
            {cards.slice(0, 2).map((card, idx) => (
              <ModelCard
                key={card.id}
                conversationId={conversationId}
                initialMessages={[]} // can pass messagesByModel[model] if needed
                sharedInput={sharedInput}
                onSharedInputChange={setSharedInput}
                submitSignal={submitSignal}
                onCardSubmit={handleCardSubmit}
                onMessageSent={refetch}
                onDelete={() => handleCardDelete(idx)}
                onMoveLeft={() => handleMoveCard(idx, "left")}
                onMoveRight={() => handleMoveCard(idx, "right")}
                onAddCard={cards.length < 2 ? handleAddCard : undefined}
                index={idx}
                totalCards={cards.length}
              />
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
