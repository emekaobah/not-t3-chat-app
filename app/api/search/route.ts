import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ conversations: [], messages: [] });
  }

  const searchQuery = query.trim();
  console.log("🔍 Search query:", searchQuery, "for user:", userId);

  try {
    // Search conversations by title
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .eq("user_id", userId)
      .or(`title.ilike.%${searchQuery}%`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (convError) {
      console.error("❌ Conversation search error:", convError);
    }

    // Search messages by content
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select(
        `
        id,
        content,
        created_at,
        role,
        model,
        conversation_id,
        conversations!inner(id, title)
      `
      )
      .eq("user_id", userId)
      .eq("role", "user") // Only search user messages for privacy
      .ilike("content", `%${searchQuery}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (msgError) {
      console.error("❌ Message search error:", msgError);
    }

    // Transform messages to include conversation info
    const transformedMessages =
      messages?.map((msg) => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        role: msg.role,
        model: msg.model,
        conversation_id: msg.conversation_id,
        conversation_title:
          (msg.conversations as any)?.title || "Untitled Chat",
      })) || [];

    console.log("✅ Search results:", {
      conversations: conversations?.length || 0,
      messages: transformedMessages.length,
    });

    return NextResponse.json({
      conversations: conversations || [],
      messages: transformedMessages,
      query: searchQuery,
    });
  } catch (error) {
    console.error("❌ Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
