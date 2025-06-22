import { useState } from "react";

export function useGenerateTitle() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTitle = async (
    messages: Array<{ role: string; content: string }>
  ) => {
    if (!messages.length) return "New Chat";

    setIsGenerating(true);
    console.log("🎨 Generating title from", messages.length, "messages");

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to generate title: ${response.status} ${
            errorData.error || ""
          }`
        );
      }

      const data = await response.json();
      const title = data.title || "New Chat";
      console.log("✅ Generated title:", title);
      return title;
    } catch (error) {
      console.error("❌ Error generating title:", error);
      // Fallback to first message preview
      const firstUserMessage =
        messages.find((m) => m.role === "user")?.content || "";
      if (firstUserMessage) {
        // Truncate to 50 characters and clean up
        const fallbackTitle =
          firstUserMessage.slice(0, 50).trim() +
          (firstUserMessage.length > 50 ? "..." : "");
        console.log("🔄 Using fallback title:", fallbackTitle);
        return fallbackTitle;
      }
      console.log("🔄 Using default title: New Chat");
      return "New Chat";
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateTitle, isGenerating };
}
