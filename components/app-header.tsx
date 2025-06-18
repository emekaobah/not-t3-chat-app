import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import React from "react";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";
import Greeting from "./greeting";

const AppHeader = () => {
  return (
    <div className="flex flex-1 gap-6 justify-between items-center">
      <Greeting />
      <div className="flex gap-6">
        <ModeToggle />
        <SignedOut>
          <SignUpButton>
            <Button variant="ghost" className="rounded-3xl" size="lg">
              Sign up for free
            </Button>
          </SignUpButton>
          <SignInButton>
            <Button variant="default" size={"lg"} className="rounded-3xl">
              Log in
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </div>
  );
};

export default AppHeader;
