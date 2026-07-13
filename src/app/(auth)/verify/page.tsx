import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyForm from "@/app/(auth)/verify/_component/verify-form-client";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your email code.",
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-muted/30" />}>
      <VerifyForm />
    </Suspense>
  );
}
