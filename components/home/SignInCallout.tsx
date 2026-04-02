"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SignInCallout() {
  const handleDevSignIn = () => {
    void signIn("dev", { callbackUrl: "/" });
  };

  const handleGoogleSignIn = () => {
    void signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="lg:col-span-12">
      <Card className="border border-[#e9c176]/30 bg-[#201f1f]/80">
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-sm text-[#d1c5b4]">
            Sign in to track career, streak, and daily leaderboard.
          </p>
          <div className="flex flex-wrap gap-2">
            {process.env.NODE_ENV === "development" && (
              <Button type="button" onClick={handleDevSignIn}>
                Dev sign-in
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={handleGoogleSignIn}>
              Continue with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
