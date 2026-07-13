# Next.js Supabase Template

Reusable Next.js 16 template with React 19, Bun, Tailwind CSS v4, shadcn/ui, Jotai, Supabase Postgres, and Nodemailer.

## Included

- Server-side JWT sessions stored in an HTTP-only cookie.
- Passwordless authentication with a six-digit email code and magic link.
- Optional Google sign-in with email-based account deduplication.
- Generic protected home route and permission helpers.
- Supabase Postgres connection through `pg`, ready for repositories and services.
- Authenticated Supabase Storage uploads with server-side image resizing and WebP compression.
- Direct Nodemailer delivery for email codes and magic links.

## Setup

```bash
bun install
cp .env.example .env.local
bun run dev
```

Apply [`src/lib/query/auth.sql`](src/lib/query/auth.sql) to the Supabase SQL editor. Add SMTP credentials to `.env.local`; access requests send the email before returning success, so delivery failures are shown immediately and the user can retry.

To enable Google sign-in, add `NEXT_PUBLIC_OAUTH_CLIENT_ID` and configure that OAuth client’s authorized JavaScript origin for the app URL. Google identities and email-code identities with the same normalized email reuse the same `users` row.

For file uploads, create a private Supabase Storage bucket named `uploads` or set `SUPABASE_STORAGE_BUCKET` to another bucket. Add `NEXT_PUBLIC_SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`. Authenticated uploads use a user-scoped path, accept JPEG/PNG/WebP up to 5 MB, resize to a maximum width of 1600px, and store compressed WebP files. The reusable action is [`src/action/storage.ts`](src/action/storage.ts).

The existing shadcn components live under `src/components/ui`. Add more with `bunx --bun shadcn@latest add <component>`.

## Supabase Keep-Alive

Optional GitHub Actions setup: [Supabase keep-alive](agents/knowledge/supabase-keep-alive.md).

## Commands

```bash
bun run dev
bun run lint
bun run build
```
