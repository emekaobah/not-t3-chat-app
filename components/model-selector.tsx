"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronsDown, ChevronsUpDown } from "lucide-react";

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

const MODEL_DISPLAY_NAMES = {
  "gpt-4.1-nano": "GPT-4.1 Nano",
  "gemini-2.0-flash": "Gemini 2.0 Flash",
  "gemini-2.0-flash-lite-preview-02-05": "Gemini Flash Lite",
};

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

  // Filter out excluded models (used by other cards)
  const availableModels = Object.keys(MODEL_DISPLAY_NAMES).filter(
    (model) => !excludeModels.includes(model)
  );

  const frameworks = availableModels.map((model) => ({
    value: model,
    label: MODEL_DISPLAY_NAMES[model as keyof typeof MODEL_DISPLAY_NAMES],
  }));

  useEffect(() => {
    if (!value && frameworks.length) {
      onChange(frameworks[0].value);
    }
    // Only run on mount or frameworks change
    // eslint-disable-next-line
  }, []);
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
