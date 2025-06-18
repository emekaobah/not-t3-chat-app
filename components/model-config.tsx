import {
  ArrowBigLeft,
  ArrowBigRight,
  ArrowRight,
  Eraser,
  Plus,
  SlidersHorizontal,
  Trash,
} from "lucide-react";
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
  onMoveLeft,
  onMoveRight,
  onDelete,
  onAddCard,
  onClearChat,
  index = 0,
  totalCards = 0,
}: {
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon">
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={"secondary"}
            size="icon"
            onClick={onMoveLeft}
            disabled={index === 0}
          >
            <ArrowBigLeft />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Move left</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={"secondary"}
            size="icon"
            onClick={onMoveRight}
            disabled={index === totalCards - 1}
          >
            <ArrowBigRight />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Move right</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={"secondary"} size="icon" onClick={onDelete}>
            <Trash />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Delete chat</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={"secondary"}
            size="icon"
            onClick={onAddCard}
            disabled={totalCards >= 2}
          >
            <Plus />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {totalCards >= 2 ? "Maximum cards reached" : "Add model to compare"}
          </p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={"secondary"} size="icon" onClick={onClearChat}>
            <Eraser />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Clear chat</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default ModelConfig;
