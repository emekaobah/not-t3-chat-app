import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversation_id = searchParams.get("conversation_id");

  console.log("GET /api/messages - conversationId:", conversation_id);
  console.log("GET /api/messages - userId:", userId);

  if (!conversation_id)
    return NextResponse.json({ error: "No conversation_id" }, { status: 400 });

  // Fetch messages for this conversation, for the current user
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversation_id)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  console.log("GET /api/messages - query result:", { data, error });

  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversation_id, model, role, content } = await req.json();
  
  console.log("POST /api/messages - request:", {
    conversation_id,
    model,
    role,
    content,
    userId
  });

  const { data, error } = await supabase
    .from("messages")
    .insert([{ conversation_id, model, role, content, user_id: userId }])
    .select()
    .single();

  console.log("POST /api/messages - result:", { data, error });

  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json(data);
}
