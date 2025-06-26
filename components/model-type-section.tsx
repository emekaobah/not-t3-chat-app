"use client";

import { ModelConfig } from "@/lib/models";
import { ModelCard } from "./model-card-settings";

interface ModelTypeSectionProps {
  modelType: string;
  models: (ModelConfig & { isEnabled: boolean })[];
  onToggle: (modelId: string, enabled: boolean) => void;
  isLoading?: boolean;
}

export function ModelTypeSection({
  modelType,
  models,
  onToggle,
  isLoading = false,
}: ModelTypeSectionProps) {
  if (models.length === 0) return null;

  const formatModelTypeName = (type: string) => {
    switch (type) {
      case "text":
        return "Text Models";
      case "multimodal":
        return "Multimodal Models";
      case "reasoning":
        return "Reasoning Models";
      case "visual":
        return "Visual Models";
      default:
        return `${type.charAt(0).toUpperCase() + type.slice(1)} Models`;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{formatModelTypeName(modelType)}</h3>
      <div className="space-y-3">
        {models.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            onToggle={(enabled) => onToggle(model.id, enabled)}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
