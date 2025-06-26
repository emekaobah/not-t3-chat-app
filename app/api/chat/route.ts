import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import {
  validateUserModelAccess,
  getModelConfigByName,
  createModelProvider,
} from "@/lib/models";

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body.messages;
  // Accept model at the root or inside data
  const model = body.model || (body.data && body.data.model);

  console.log("Received model:", model);
  console.log("Received messages:", messages);

  // Validate user access to model (for authenticated users)
  const { userId } = await auth();
  if (userId) {
    const hasAccess = await validateUserModelAccess(userId, model);
    if (!hasAccess) {
      return new Response("Model not available for user", { status: 403 });
    }
  }

  // Get model configuration from database
  const modelConfig = await getModelConfigByName(model);
  if (!modelConfig) {
    // Fallback to hardcoded models for backward compatibility
    let modelProvider;
    if (
      model === "gpt-4.1-nano" ||
      model === "gpt-3.5-turbo" ||
      model === "gpt-4"
    ) {
      modelProvider = openai(model);
    } else if (model === "gemini-1.5-flash" || model === "gemini-2.0-flash") {
      modelProvider = google(model);
    } else {
      return new Response("Unknown model", { status: 400 });
    }

    const result = streamText({
      model: modelProvider,
      messages,
    });

    return result.toDataStreamResponse();
  }

  // Use database configuration
  const modelProvider = createModelProvider(modelConfig);

  const result = streamText({
    model: modelProvider,
    messages,
  });

  return result.toDataStreamResponse();
}
