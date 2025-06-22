import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

// GET: get a specific conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  if (error || !conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(conversation);
}

// PATCH: update conversation title
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;
  const { title } = await req.json();

  // Verify the conversation belongs to the user
  const { data: conversation, error: fetchError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  // Update the title
  const { data, error } = await supabase
    .from("conversations")
    .update({ title })
    .eq("id", conversationId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// DELETE: delete a conversation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    console.log("❌ DELETE: Unauthorized - no userId");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;
  console.log(
    "🗑️ DELETE: Attempting to delete conversation:",
    conversationId,
    "for user:",
    userId
  );

  // Verify the conversation belongs to the user
  const { data: conversation, error: fetchError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !conversation) {
    console.log(
      "❌ DELETE: Conversation not found or doesn't belong to user:",
      fetchError?.message
    );
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  console.log("✅ DELETE: Conversation verified, proceeding with deletion");

  // Delete all messages in the conversation first
  const { error: messagesError } = await supabase
    .from("messages")
    .delete()
    .eq("conversation_id", conversationId);

  if (messagesError) {
    console.log("❌ DELETE: Failed to delete messages:", messagesError.message);
    return NextResponse.json({ error: messagesError.message }, { status: 400 });
  }

  console.log("✅ DELETE: Messages deleted successfully");

  // Delete the conversation
  const { error: deleteError } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (deleteError) {
    console.log(
      "❌ DELETE: Failed to delete conversation:",
      deleteError.message
    );
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  console.log("✅ DELETE: Conversation deleted successfully");
  return NextResponse.json({ message: "Conversation deleted successfully" });
}
