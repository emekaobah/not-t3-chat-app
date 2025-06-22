import { useState } from "react";

export function useGenerateTitle() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTitle = async (
    messages: Array<{ role: string; content: string }>
  ) => {
    if (!messages.length) return "New Chat";

    setIsGenerating(true);
    try {
      // Take first few messages for context (user message + first AI response if available)
      const contextMessages = messages.slice(0, 4); // Max 4 messages for context

      const response = await fetch("/api/generate-title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: contextMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate title");
      }

      const data = await response.json();
      return data.title || "New Chat";
    } catch (error) {
      console.error("Error generating title:", error);
      // Fallback to first message preview
      const firstUserMessage =
        messages.find((m) => m.role === "user")?.content || "";
      if (firstUserMessage) {
        // Truncate to 50 characters and clean up
        return (
          firstUserMessage.slice(0, 50).trim() +
          (firstUserMessage.length > 50 ? "..." : "")
        );
      }
      return "New Chat";
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateTitle, isGenerating };
}
