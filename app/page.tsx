"use client";
import AppHeader from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { ModelCard } from "@/components/model-card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useCreateConversation } from "@/hooks/useCreateConversation";
import { Message } from "@/hooks/useMessages";

const SUPPORTED_MODELS = ["gpt-4.1-nano", "gemini-2.0-flash"];

export default function Page() {
  const router = useRouter();
  const { createConversation } = useCreateConversation();

  // Temporary chat state
  const [isTemporaryChat, setIsTemporaryChat] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [temporaryMessages, setTemporaryMessages] = useState<Message[]>([]);

  // Shared input state
  const [sharedInput, setSharedInput] = useState("");
  const [submitSignal, setSubmitSignal] = useState(0);

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

  // This function will be called when any card submits
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
            {/* For signed-out users: show same chat interface but temporary */}
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
                  onCardSubmit={handleCardSubmit}
                  onMessageSent={() => {
                    // Guest users don't persist messages
                  }}
                  index={idx}
                  totalCards={SUPPORTED_MODELS.length}
                />
              ))}
            </div>
          </SignedOut>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
