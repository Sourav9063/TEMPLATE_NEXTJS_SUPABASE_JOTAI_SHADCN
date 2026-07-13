"use client";

import type { CredentialResponse } from "@react-oauth/google";
import { GoogleLogin } from "@react-oauth/google";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { useEffect, useState, useTransition } from "react";
import { googleSignIn, requestAccess } from "@/action/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { config } from "@/config";
import { getSafeRedirectPath } from "@/lib/utils/redirect";
import { EmailSchema } from "@/types/auth";

export default function Login({
  mode = "signin",
}: {
  mode?: "signin" | "signup";
}) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = getSafeRedirectPath(searchParams.get("redirect-url"));
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const googleEnabled = Boolean(config.auth.GOOGLE_CLIENT_ID);
  const [showEmailForm, setShowEmailForm] = useState(!googleEnabled);

  useEffect(() => {
    const queryError = searchParams.get("error");
    if (queryError) setError(queryError);
  }, [searchParams]);

  function sendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = EmailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email");
      return;
    }
    startTransition(async () => {
      setError(null);
      const result = await requestAccess(parsed.data, redirectUrl);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.push(
        `/verify?email=${encodeURIComponent(result.data.email)}&mode=${mode}&redirect-url=${encodeURIComponent(redirectUrl)}`,
      );
    });
  }

  function signInWithGoogle(response: CredentialResponse) {
    if (!response.credential) {
      setError(
        `Google ${isSignup ? "sign-up" : "sign-in"} did not return a credential`,
      );
      return;
    }
    startTransition(async () => {
      setError(null);
      const result = await googleSignIn(response.credential);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.replace(redirectUrl);
      router.refresh();
    });
  }

  return (
    <AuthShell mode={mode}>
      {googleEnabled && (
        <div className="space-y-4">
          <GoogleLogin
            onSuccess={signInWithGoogle}
            onError={() =>
              setError(
                `Google ${isSignup ? "sign-up" : "sign-in"} failed. Try again.`,
              )
            }
            useOneTap
            shape="rectangular"
            width="100%"
            text={isSignup ? "signup_with" : "signin_with"}
          />
          {!showEmailForm && (
            <button
              className="w-full text-center text-sm text-muted-foreground underline underline-offset-4"
              type="button"
              onClick={() => setShowEmailForm(true)}
            >
              Continue with email
            </button>
          )}
        </div>
      )}
      {showEmailForm && (
        <form className="mt-6 space-y-5" onSubmit={sendCode} noValidate>
          {googleEnabled && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>or</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isPending}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending
              ? "Sending…"
              : isSignup
                ? "Continue with signup"
                : "Continue with email"}
          </Button>
        </form>
      )}
      {!showEmailForm && error && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account?" : "New user?"}{" "}
        <Link
          className="font-medium text-foreground underline"
          href={`${isSignup ? "/login" : "/signup"}?redirect-url=${encodeURIComponent(redirectUrl)}`}
        >
          {isSignup ? "Sign in" : "Sign up"}
        </Link>
      </p>
    </AuthShell>
  );
}
