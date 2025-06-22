import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "No messages provided" }, { status: 400 });
    }

    // Use gemini-2.0-flash-lite-preview-02-05 for title generation
    const model = google("gemini-2.0-flash-lite-preview-02-05");

    // Create a prompt for title generation
    const contextMessages = messages.slice(0, 4); // Use first 4 messages max
    const conversationContext = contextMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const titlePrompt = `Based on the following conversation, generate a short, descriptive title (3-6 words maximum) that captures the main topic or question being discussed. The title should be concise and clear.

Conversation:
${conversationContext}

Generate only the title, nothing else. Do not use quotes or special formatting.`;

    const result = await generateText({
      model,
      prompt: titlePrompt,
      maxTokens: 20, // Keep it short for titles
      temperature: 0.3, // Lower temperature for more consistent titles
    });

    let title = result.text.trim();

    // Clean up the title - remove quotes, excessive punctuation
    title = title.replace(/^["']|["']$/g, ""); // Remove surrounding quotes
    title = title.replace(/[.!?]+$/, ""); // Remove trailing punctuation
    title = title.slice(0, 60); // Ensure max length

    // Fallback if title is too short or empty
    if (title.length < 3) {
      const firstUserMessage =
        messages.find((m) => m.role === "user")?.content || "";
      if (firstUserMessage) {
        title =
          firstUserMessage.slice(0, 50).trim() +
          (firstUserMessage.length > 50 ? "..." : "");
      } else {
        title = "New Chat";
      }
    }

    return Response.json({ title });
  } catch (error) {
    console.error("Error generating title:", error);
    return Response.json(
      { error: "Failed to generate title" },
      { status: 500 }
    );
  }
}
