import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { getUserEnabledModels, getAvailableModels } from "@/lib/models";

// GET: Get user's model preferences with model details
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const enabledOnly = searchParams.get("enabled") === "true";
    const grouped = searchParams.get("grouped") === "true";

    if (enabledOnly) {
      // Return only user's enabled models
      const enabledModels = await getUserEnabledModels(userId);
      return NextResponse.json(enabledModels);
    }

    // Return all available models with user's preference status
    const availableModels = await getAvailableModels();

    // Get user's preferences
    const { data: preferences, error } = await supabase
      .from("user_model_preferences")
      .select("model_id, is_enabled")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user preferences:", error);
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }

    // Create preference map
    const preferenceMap = new Map(
      preferences?.map((p) => [p.model_id, p.is_enabled]) || []
    );

    // Combine models with user preferences (default enabled if no preference)
    const modelsWithPreferences = availableModels.map((model) => ({
      ...model,
      isEnabled: preferenceMap.get(model.id) ?? true,
    }));

    if (grouped) {
      // Group by model type
      const grouped = {
        text: modelsWithPreferences.filter((m) => m.model_type === "text"),
        multimodal: modelsWithPreferences.filter(
          (m) => m.model_type === "multimodal"
        ),
        reasoning: modelsWithPreferences.filter(
          (m) => m.model_type === "reasoning"
        ),
        visual: modelsWithPreferences.filter((m) => m.model_type === "visual"),
      };
      return NextResponse.json(grouped);
    }

    return NextResponse.json(modelsWithPreferences);
  } catch (error) {
    console.error("Error in GET /api/user-models:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update user's model preferences (individual toggle)
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { modelId, isEnabled } = await req.json();

    if (!modelId || typeof isEnabled !== "boolean") {
      return NextResponse.json(
        { error: "modelId and isEnabled are required" },
        { status: 400 }
      );
    }

    // Verify model exists and is active
    const { data: model, error: modelError } = await supabase
      .from("available_models")
      .select("id")
      .eq("id", modelId)
      .eq("is_active", true)
      .single();

    if (modelError || !model) {
      return NextResponse.json(
        { error: "Model not found or inactive" },
        { status: 404 }
      );
    }

    // Upsert user preference with proper conflict resolution
    const { data, error } = await supabase
      .from("user_model_preferences")
      .upsert(
        {
          user_id: userId,
          model_id: modelId,
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,model_id",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating user model preference:", error);
      return NextResponse.json(
        { error: "Failed to update preference" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/user-models:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
