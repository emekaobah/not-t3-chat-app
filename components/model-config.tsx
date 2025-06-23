import { Eraser, Plus, SlidersHorizontal } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
type Checked = DropdownMenuCheckboxItemProps["checked"];

const ModelConfig = ({
  onDelete,
  onAddCard,
  onClearChat,
  index = 0,
  totalCards = 0,
}: {
  onDelete?: () => void;
  onAddCard?: () => void;
  onClearChat?: () => void;
  index?: number;
  totalCards?: number;
}) => {
  const [position, setPosition] = React.useState("bottom");
  const [showStatusBar, setShowStatusBar] = React.useState<Checked>(true);
  const [showActivityBar, setShowActivityBar] = React.useState<Checked>(false);
  const [showPanel, setShowPanel] = React.useState<Checked>(false);
  return (
    <div className="flex flex-row gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={"ghost"} size="icon" onClick={onAddCard}>
            <Plus />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add model to compare</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <SlidersHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={showStatusBar}
            onCheckedChange={setShowStatusBar}
          >
            Status Bar
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={showActivityBar}
            onCheckedChange={setShowActivityBar}
            disabled
          >
            Activity Bar
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={showPanel}
            onCheckedChange={setShowPanel}
          >
            Panel
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ModelConfig;
