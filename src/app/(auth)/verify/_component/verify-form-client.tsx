"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { useState, useTransition } from "react";
import { requestAccess, verifyAccessCode } from "@/action/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { getSafeRedirectPath } from "@/lib/utils/redirect";
import { EmailSchema } from "@/types/auth";

const otpSlots = ["one", "two", "three", "four", "five", "six"] as const;

export default function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = getSafeRedirectPath(searchParams.get("redirect-url"));
  const parsedEmail = EmailSchema.safeParse(searchParams.get("email"));
  const email = parsedEmail.success ? parsedEmail.data : null;
  const isSignup = searchParams.get("mode") === "signup";
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!email) {
    return (
      <AuthShell mode={isSignup ? "signup" : "signin"}>
        <p className="text-sm text-destructive">Email address is missing.</p>
        <Button className="mt-5 w-full" asChild>
          <Link href={isSignup ? "/signup" : "/login"}>
            Return to {isSignup ? "signup" : "login"}
          </Link>
        </Button>
      </AuthShell>
    );
  }

  function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      setError(null);
      const result = await verifyAccessCode(email, code);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.replace(redirectUrl);
      router.refresh();
    });
  }

  function resendCode() {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await requestAccess(email, redirectUrl);
      if (!result.success) setError(result.error.message);
      else setMessage("A new code and link were sent.");
    });
  }

  return (
    <AuthShell mode={isSignup ? "signup" : "signin"}>
      <form className="space-y-5" onSubmit={verifyCode}>
        <div className="space-y-2">
          <Label htmlFor="code">Six-digit code</Label>
          <InputOTP
            id="code"
            maxLength={6}
            value={code}
            onChange={setCode}
            disabled={isPending}
            autoFocus
          >
            <InputOTPGroup>
              {otpSlots.map((slot, index) => (
                <InputOTPSlot key={slot} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p className="text-xs text-muted-foreground">
            We sent a code and link to {email}.
          </p>
        </div>
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          className="w-full"
          type="submit"
          disabled={isPending || code.length !== 6}
        >
          {isPending
            ? "Checking…"
            : isSignup
              ? "Verify and sign up"
              : "Verify and sign in"}
        </Button>
        <div className="flex items-center justify-between gap-3 text-sm">
          <Button
            type="button"
            variant="ghost"
            className="px-0"
            onClick={resendCode}
            disabled={isPending}
          >
            Resend code
          </Button>
          <Link
            className="text-muted-foreground underline"
            href={`${isSignup ? "/signup" : "/login"}?redirect-url=${encodeURIComponent(redirectUrl)}`}
          >
            {isSignup ? "Different email" : "Different email"}
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
