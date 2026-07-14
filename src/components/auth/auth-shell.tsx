import type { ReactNode } from "react";

type AuthMode = "signin" | "signup";

interface AuthShellProps {
  children: ReactNode;
  description?: string;
  mode?: AuthMode;
  title?: string;
}

export function AuthShell({
  children,
  description,
  mode = "signin",
  title,
}: AuthShellProps) {
  const isSignup = mode === "signup";

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-8 sm:px-6">
      <section className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm sm:p-8">
        <header className="mb-6">
          <p className="text-sm font-semibold tracking-tight">App Template</p>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            {title ?? `${isSignup ? "Sign up" : "Sign in"} to continue`}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description ??
              `Use your email to receive a ${isSignup ? "sign-up" : "sign-in"} link and six-digit code.`}
          </p>
        </header>
        {children}
      </section>
    </main>
  );
}
