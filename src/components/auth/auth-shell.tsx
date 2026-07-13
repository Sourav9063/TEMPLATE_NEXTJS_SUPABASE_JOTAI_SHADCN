import type { ReactNode } from "react";

type AuthMode = "signin" | "signup";

interface AuthShellProps {
  children: ReactNode;
  mode?: AuthMode;
}

export function AuthShell({ children, mode = "signin" }: AuthShellProps) {
  const isSignup = mode === "signup";

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-6 py-12">
      <section className="w-full max-w-sm rounded-xl border bg-background p-7 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-tight">App Template</p>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            {isSignup ? "Sign up" : "Sign in"} to continue
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your email to receive a {isSignup ? "sign-up" : "sign-in"} link
            and six-digit code.
          </p>
        </div>
        {children}
      </section>
    </main>
  );
}
