"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SearchForm } from "./search-form";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { Separator } from "./ui/separator";
import { useUserConversations } from "@/hooks/useUserConversation";

export function AppSidebar(props: any) {
  // Get all conversations for this user
  const { conversations, isLoading } = useUserConversations();
  // Get the current conversationId from the URL
  const { conversationId } = useParams<{ conversationId: string }>();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="p-2 space-y-4">
          <div className="mb-4 flex flex-row gap-2 items-center justify-between">
            <h1 className="font-bold">Not T3.chat Pro</h1>
            <Link href={"/"}>
              <Button size="sm" title="New Chat" variant="outline">
                <Plus />
              </Button>
            </Link>
          </div>
        </div>
        <Separator className="mb-2" />
        <SignedIn>
          <SearchForm />
        </SignedIn>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SignedIn>
            {isLoading && <div className="p-2">Loading...</div>}
            {!isLoading &&
              Array.isArray(conversations) &&
              conversations.length === 0 && (
                <div className="p-2 text-xs text-muted-foreground">
                  No chats yet. Start a new conversation!
                </div>
              )}
            {!isLoading &&
              Array.isArray(conversations) &&
              conversations.map((conv) => (
                <SidebarMenuItem key={conv.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={conv.id === conversationId}
                  >
                    <Link href={`/chat/${conv.id}`}>
                      <span className="truncate block max-w-[170px]">
                        {conv.title || "Untitled"}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SignedIn>
          <SignedOut>
            <div className="p-2 space-y-4">
              <div className="mb-4">
                <h2 className="font-semibold text-sm">✨ Features</h2>
              </div>
              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>Compare AI models side-by-side</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>GPT-4, Gemini 2.0 Flash support</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  <span>Save & revisit chat history</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>Modern dark/light theme</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-pink-500">•</span>
                  <span>Secure & private</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <SignInButton>
                  <Button size="sm" className="w-full">
                    Sign in to Save Chats
                  </Button>
                </SignInButton>
              </div>
            </div>
          </SignedOut>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between gap-2">
          <UserButton afterSignOutUrl="/" />
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} MIT License
          </p>
        </div>
        <SidebarRail />
      </SidebarFooter>
    </Sidebar>
  );
}
