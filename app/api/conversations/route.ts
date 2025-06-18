import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server"; // If using the Clerk middleware

// GET: list all conversations for current user
export async function GET(req: NextRequest) {
  const { userId } = await auth(); // Clerk
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json(data);
}

// POST: create a new conversation
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await req.json();
  const { data, error } = await supabase
    .from("conversations")
    .insert([{ user_id: userId, title }])
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json(data);
}
