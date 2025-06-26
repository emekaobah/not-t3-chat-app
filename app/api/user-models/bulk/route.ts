import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

// POST: Bulk enable/disable operations
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, modelType, modelIds } = await req.json();

    if (
      !action ||
      !["enable", "disable", "recommended", "reset"].includes(action)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid action. Must be: enable, disable, recommended, or reset",
        },
        { status: 400 }
      );
    }

    let targetModelIds: string[] = [];

    if (action === "reset") {
      // Enable all available models
      const { data: models, error } = await supabase
        .from("available_models")
        .select("id")
        .eq("is_active", true);

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch models" },
          { status: 500 }
        );
      }

      targetModelIds = models.map((m) => m.id);
    } else if (action === "recommended") {
      // Enable recommended models (you can customize this logic)
      const { data: models, error } = await supabase
        .from("available_models")
        .select("id, capabilities")
        .eq("is_active", true);

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch models" },
          { status: 500 }
        );
      }

      // Example: recommend models that are fast or have multiple capabilities
      targetModelIds = models
        .filter(
          (m) =>
            m.capabilities?.includes("fast") ||
            (m.capabilities?.length || 0) >= 2
        )
        .map((m) => m.id);
    } else if (modelType) {
      // Enable/disable all models of specific type
      const { data: models, error } = await supabase
        .from("available_models")
        .select("id")
        .eq("model_type", modelType)
        .eq("is_active", true);

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch models" },
          { status: 500 }
        );
      }

      targetModelIds = models.map((m) => m.id);
    } else if (modelIds && Array.isArray(modelIds)) {
      // Custom selection
      targetModelIds = modelIds;
    } else {
      return NextResponse.json(
        { error: "Must provide modelType or modelIds" },
        { status: 400 }
      );
    }

    if (targetModelIds.length === 0) {
      return NextResponse.json(
        { error: "No models found to update" },
        { status: 400 }
      );
    }

    const isEnabled =
      action === "enable" || action === "recommended" || action === "reset";

    // Create upsert data for all target models
    const upsertData = targetModelIds.map((modelId) => ({
      user_id: userId,
      model_id: modelId,
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
    }));

    // Bulk upsert preferences with proper conflict resolution
    const { data, error } = await supabase
      .from("user_model_preferences")
      .upsert(upsertData, {
        onConflict: "user_id,model_id",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error("Error bulk updating user model preferences:", error);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Successfully ${action}d ${targetModelIds.length} models`,
      updated: data.length,
    });
  } catch (error) {
    console.error("Error in POST /api/user-models/bulk:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
