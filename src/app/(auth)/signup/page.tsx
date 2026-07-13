import type { Metadata } from "next";
import { Suspense } from "react";
import Login from "@/app/(auth)/login/_component/login";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create an account with email or Google.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-muted/30" />}>
      <Login mode="signup" />
    </Suspense>
  );
}
