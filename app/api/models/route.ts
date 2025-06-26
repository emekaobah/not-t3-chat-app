import { NextRequest, NextResponse } from "next/server";
import { getAvailableModels, getGroupedModels } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const grouped = searchParams.get("grouped") === "true";

    if (grouped) {
      const groupedModels = await getGroupedModels();
      return NextResponse.json(groupedModels);
    } else {
      const models = await getAvailableModels();
      return NextResponse.json(models);
    }
  } catch (error) {
    console.error("Error fetching available models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}
