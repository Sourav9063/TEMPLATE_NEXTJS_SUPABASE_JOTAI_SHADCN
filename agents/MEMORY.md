## Constants

- Keep reusable hard-coded values in `src/constants`.

# Auth UX

- Keep Google sign-in/sign-up as the primary visible option; hide the email flow behind a secondary fallback control.

# API Client

- Extend shared API clients through request, response, and error interceptors; register backend-specific behavior on the configured server-only client.

# Error Contracts

- Preserve structured `ActionError` values across Server Actions, API routes, and remote backend calls; normalize only at transport boundaries or when adapting to a local form.
- Use the shared Jotai action runner for promise-based client mutations; scope keys per record and opt out of error toasts when inline feedback is sufficient.

# Toolchain

- Keep TypeScript on 6.x until the Next.js Webpack build resolves `@/*` aliases correctly with TypeScript 7.
