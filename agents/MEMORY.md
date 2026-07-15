## Constants

- Keep reusable hard-coded values in `src/constants`.

# Auth UX

- Keep Google sign-in/sign-up as the primary visible option; hide the email flow behind a secondary fallback control.

# API Client

- Extend shared API clients through request, response, and error interceptors; register backend-specific behavior on the configured server-only client.

# Toolchain

- Keep TypeScript on 6.x until the Next.js Webpack build resolves `@/*` aliases correctly with TypeScript 7.
