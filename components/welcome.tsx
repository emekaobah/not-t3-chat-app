"use client";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Welcome() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/chat/new"); // Or you can redirect to latest conversation if you want
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-lg bg-card shadow-xl rounded-2xl p-8 flex flex-col items-center gap-4">
        <h1 className="text-3xl font-bold mb-2">Welcome to Not T3.chat Pro!</h1>
        <p className="text-lg text-muted-foreground text-center">
          <strong>Not T3.chat Pro</strong> is your AI model playground:
          <br />
          <ul className="list-disc text-base text-left pl-5 mt-3">
            <li>Compare multiple AI models side-by-side</li>
            <li>Save and revisit all your chat threads</li>
            <li>Sign in with Google for cloud chat history</li>
            <li>Supports GPT-4, Gemini 2.0 Flash, and more</li>
            <li>Modern dark/light UI, secure & private</li>
          </ul>
        </p>
        <div className="mt-6 flex flex-col gap-2 w-full">
          <SignedOut>
            <SignInButton>
              <Button size="lg" className="w-full rounded-full">
                Sign in with Google to Get Started
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="w-full rounded-full"
            >
              Go to My Conversations
            </Button>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}
