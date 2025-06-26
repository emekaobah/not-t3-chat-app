"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect } from "react";
import { useUserModels } from "@/hooks/useUserModels";

export function ModelSelector({
  value,
  onChange,
  excludeModels = [],
}: {
  value: string;
  onChange: (v: string) => void;
  excludeModels?: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const { models, isLoading } = useUserModels();

  // Debug logging
  console.log("ModelSelector - models:", models, "isLoading:", isLoading);

  // Filter out excluded models (used by other cards)
  const availableModels = models.filter(
    (model) => !excludeModels.includes(model.name)
  );

  console.log(
    "ModelSelector - availableModels:",
    availableModels,
    "excludeModels:",
    excludeModels
  );

  const frameworks = availableModels.map((model) => ({
    value: model.name,
    label: model.name, // Using model name directly as display name
  }));

  useEffect(() => {
    if (!value && frameworks.length) {
      onChange(frameworks[0].value);
    }
    // Only run on mount or frameworks change
    // eslint-disable-next-line
  }, [frameworks.length]);

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-[200px] justify-between">
        Loading models...
        <ChevronDown className="opacity-50" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? frameworks.find((framework) => framework.value === value)?.label
            : "Select a model"}
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search a model" className="h-9" />
          <CommandList>
            <CommandEmpty>No Model found.</CommandEmpty>
            <CommandGroup>
              {frameworks.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  {framework.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === framework.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
