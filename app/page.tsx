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
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import Welcome from "@/components/welcome";

const CARD_COUNT = 3; // or however many cards you want

export default function Page() {
  const [sharedInput, setSharedInput] = useState("");
  const [submitSignal, setSubmitSignal] = useState(0);
  const [messagesByModel, setMessagesByModel] = useState({});

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
          {/* <div className="h-full grid grid-rows-1 gap-4 md:grid-cols-3">
            {[...Array(CARD_COUNT)].map((_, idx) => (
              <ModelCard
                key={idx}
                sharedInput={sharedInput}
                onSharedInputChange={setSharedInput}
                submitSignal={submitSignal}
                onSubmit={handleCardSubmit}
              />
            ))}
          </div> */}

          <SignedIn>
            {/*
          If you want SSR/Edge-side auto-redirect, 
          use Next.js middleware or get the user on the server.
          For most use cases, this client-side redirect is fine:
        */}
          </SignedIn>
          <SignedOut>
            <Welcome />
          </SignedOut>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
