"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";

interface RestoreChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageCount: number;
  onContinue: () => void;
  onStartFresh: () => void;
}

export const RestoreChatModal = ({
  isOpen,
  onClose,
  messageCount,
  onContinue,
  onStartFresh,
}: RestoreChatModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Continue Previous Conversation?</DialogTitle>
          <DialogDescription>
            You have {messageCount} messages from your previous session. Would
            you like to save and continue this conversation?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onStartFresh}
            className="w-full sm:w-auto"
          >
            Start Fresh
          </Button>
          <Button onClick={onContinue} className="w-full sm:w-auto">
            Continue & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface MessageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MessageLimitModal = ({
  isOpen,
  onClose,
}: MessageLimitModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Free Trial Complete</DialogTitle>
          <DialogDescription>
            You've used your 3 free messages. Sign in to continue chatting with
            unlimited access!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <SignInButton>
            <Button className="w-full sm:w-auto">Sign In to Continue</Button>
          </SignInButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
