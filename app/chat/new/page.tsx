"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateConversation } from "@/hooks/useCreateConversation";

export default function NewChatPage() {
  const router = useRouter();
  const { createConversation } = useCreateConversation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function createAndRedirect() {
      const newConversation = await createConversation({ title: "" });
      if (newConversation?.id) {
        router.replace(`/chat/${newConversation.id}`);
      } else {
        setLoading(false);
      }
    }
    createAndRedirect();
  }, [createConversation, router]);

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen">
      <div className="text-lg text-muted-foreground">
        Creating a new chat...
      </div>
    </div>
  );
}
