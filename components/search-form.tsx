"use client";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from "@/components/ui/sidebar";

interface SearchFormProps extends React.ComponentProps<"form"> {
  onSearchClick?: () => void;
}

export function SearchForm({ onSearchClick, ...props }: SearchFormProps) {
  const handleInputClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSearchClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearchClick?.();
    }
  };

  return (
    <form {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <SidebarInput
            id="search"
            placeholder="Search chats..."
            className="pl-8 h-9 cursor-pointer"
            onClick={handleInputClick}
            onKeyDown={handleKeyDown}
            readOnly
          />
          <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  );
}
