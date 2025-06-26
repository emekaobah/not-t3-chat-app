"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, CheckCircle, XCircle } from "lucide-react";

interface ModelPreferencesHeaderProps {
  onFilterByFeatures: () => void;
  onSelectRecommended: () => void;
  onUnselectAll: () => void;
  enabledCount: number;
  totalCount: number;
  isLoading?: boolean;
}

export function ModelPreferencesHeader({
  onFilterByFeatures,
  onSelectRecommended,
  onUnselectAll,
  enabledCount,
  totalCount,
  isLoading = false,
}: ModelPreferencesHeaderProps) {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onFilterByFeatures}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filter by features
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectRecommended}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Select Recommended Models
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onUnselectAll}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <XCircle className="h-4 w-4" />
          Unselect All
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-sm">
          {enabledCount} of {totalCount} enabled
        </Badge>
      </div>
    </div>
  );
}
