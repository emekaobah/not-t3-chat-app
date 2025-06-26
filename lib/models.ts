import { supabase } from "./supabase";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

export interface ModelConfig {
  id: string;
  name: string; // Used for both API and display
  provider: string; // 'openai' | 'google' | 'anthropic'
  model_id: string; // Provider-specific identifier
  model_type: "text" | "multimodal" | "reasoning" | "visual";
  description: string;
  capabilities: string[]; // ['vision', 'tool-calling', 'fast', 'web-search']
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface GroupedModels {
  text: ModelConfig[];
  multimodal: ModelConfig[];
  reasoning: ModelConfig[];
  visual: ModelConfig[];
}

export interface UserModelPreferences {
  [modelId: string]: boolean;
}

/**
 * Get all available models from database
 */
export async function getAvailableModels(): Promise<ModelConfig[]> {
  const { data, error } = await supabase
    .from("available_models")
    .select("*")
    .eq("is_active", true)
    .order("model_type", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching available models:", error);
    throw error;
  }

  return data.map((model) => ({
    id: model.id,
    name: model.name,
    provider: model.provider,
    model_id: model.model_id,
    model_type: model.model_type,
    description: model.description || "",
    capabilities: model.capabilities || [],
    is_active: model.is_active,
    sort_order: model.sort_order,
    created_at: model.created_at,
  }));
}

/**
 * Get available models grouped by type
 */
export async function getGroupedModels(): Promise<GroupedModels> {
  const models = await getAvailableModels();

  const grouped: GroupedModels = {
    text: [],
    multimodal: [],
    reasoning: [],
    visual: [],
  };

  models.forEach((model) => {
    if (grouped[model.model_type as keyof GroupedModels]) {
      grouped[model.model_type as keyof GroupedModels].push(model);
    }
  });

  return grouped;
}

/**
 * Get user's enabled models with full model details
 */
export async function getUserEnabledModels(
  userId: string
): Promise<ModelConfig[]> {
  const { data, error } = await supabase
    .from("user_model_preferences")
    .select(
      `
      is_enabled,
      available_models (
        id,
        name,
        provider,
        model_id,
        model_type,
        description,
        capabilities,
        is_active,
        sort_order
      )
    `
    )
    .eq("user_id", userId)
    .eq("is_enabled", true)
    .eq("available_models.is_active", true);

  if (error) {
    console.error("Error fetching user enabled models:", error);
    throw error;
  }

  // If user has no preferences yet, return all available models as enabled by default
  if (!data || data.length === 0) {
    console.log(
      "No user preferences found, returning all available models as default"
    );
    return await getAvailableModels();
  }

  return data.map((item: any) => {
    const model = item.available_models;
    return {
      id: model.id,
      name: model.name,
      provider: model.provider,
      model_id: model.model_id,
      model_type: model.model_type,
      description: model.description || "",
      capabilities: model.capabilities || [],
      is_active: model.is_active,
      sort_order: model.sort_order,
      created_at: model.created_at,
    };
  });
}

/**
 * Validate if user has access to a specific model
 */
export async function validateUserModelAccess(
  userId: string,
  modelName: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_model_preferences")
    .select(
      `
      is_enabled,
      available_models!inner (name, is_active)
    `
    )
    .eq("user_id", userId)
    .eq("available_models.name", modelName)
    .eq("available_models.is_active", true)
    .single();

  if (error || !data) {
    // If no preference found, check if model exists and create default preference
    const { data: modelData, error: modelError } = await supabase
      .from("available_models")
      .select("id, name")
      .eq("name", modelName)
      .eq("is_active", true)
      .single();

    if (modelError || !modelData) {
      return false;
    }

    // Create default enabled preference for user
    await supabase.from("user_model_preferences").insert({
      user_id: userId,
      model_id: modelData.id,
      is_enabled: true,
    });

    return true;
  }

  return data.is_enabled;
}

/**
 * Get model configuration by name
 */
export async function getModelConfigByName(
  modelName: string
): Promise<ModelConfig | null> {
  const { data, error } = await supabase
    .from("available_models")
    .select("*")
    .eq("name", modelName)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    provider: data.provider,
    model_id: data.model_id,
    model_type: data.model_type,
    description: data.description || "",
    capabilities: data.capabilities || [],
    is_active: data.is_active,
    sort_order: data.sort_order,
    created_at: data.created_at,
  };
}

/**
 * Create model provider instance based on configuration
 */
export function createModelProvider(modelConfig: ModelConfig) {
  switch (modelConfig.provider) {
    case "openai":
      return openai(modelConfig.model_id);
    case "google":
      return google(modelConfig.model_id);
    default:
      throw new Error(`Unknown provider: ${modelConfig.provider}`);
  }
}

/**
 * Create default user preferences for all available models
 */
export async function createDefaultUserPreferences(
  userId: string
): Promise<void> {
  const models = await getAvailableModels();

  const preferences = models.map((model) => ({
    user_id: userId,
    model_id: model.id,
    is_enabled: true,
  }));

  const { error } = await supabase
    .from("user_model_preferences")
    .insert(preferences);

  if (error) {
    console.error("Error creating default user preferences:", error);
    throw error;
  }
}
