import type { Metadata } from "next";
import { Suspense } from "react";
import Login from "@/app/(auth)/login/_component/login";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div></div>}>
      <Login />
    </Suspense>
  );
}
