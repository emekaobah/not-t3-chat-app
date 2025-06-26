"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles } from "lucide-react";
import { ModelConfig } from "@/lib/models";

interface ModelCardProps {
  model: ModelConfig & { isEnabled: boolean };
  onToggle: (enabled: boolean) => void;
  isLoading?: boolean;
}

export function ModelCard({
  model,
  onToggle,
  isLoading = false,
}: ModelCardProps) {
  const getModelIcon = (modelType: string) => {
    switch (modelType) {
      case "multimodal":
        return <Sparkles className="h-5 w-5 text-purple-500" />;
      case "reasoning":
        return <Sparkles className="h-5 w-5 text-blue-500" />;
      case "visual":
        return <Sparkles className="h-5 w-5 text-green-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCapabilityColor = (capability: string) => {
    switch (capability) {
      case "vision":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "tool-calling":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "fast":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "web-search":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "text":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatCapabilityName = (capability: string) => {
    switch (capability) {
      case "tool-calling":
        return "Tool Calling";
      case "web-search":
        return "Web Search";
      default:
        return capability.charAt(0).toUpperCase() + capability.slice(1);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="mt-1">{getModelIcon(model.model_type)}</div>
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-medium">{model.name}</h3>
              <p className="text-sm text-muted-foreground">
                {model.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {model.capabilities.map((capability) => (
                <Badge
                  key={capability}
                  variant="secondary"
                  className={`text-xs ${getCapabilityColor(capability)}`}
                >
                  {formatCapabilityName(capability)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {model.capabilities.includes("web-search") && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          <Switch
            checked={model.isEnabled}
            onCheckedChange={onToggle}
            disabled={isLoading}
          />
        </div>
      </div>
    </Card>
  );
}
