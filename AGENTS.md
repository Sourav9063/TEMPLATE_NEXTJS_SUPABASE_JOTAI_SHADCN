# Template Guide

Next.js 16, React 19, Bun, Tailwind v4, shadcn/ui, Biome, Supabase, Nodemailer, JWT, optional Google sign-in. Keep changes small, typed, and local-pattern aligned.

## Commands

`bun run dev`/`start`: port 8080. `bun run build`: Webpack. `bun run lint`: Biome. Add UI: `bunx --bun shadcn@latest add <component>`.

## Boundaries

- `src/repository/`: parameterized SQL and DB mapping only.
- `src/services/`: Zod validation, ownership, business logic; no cookies, redirects, or cache invalidation.
- `src/action/`: Server Actions/transport; `createAction` returns `{ success, data } | { success, error }`; DB errors use `handleDbError`.
- `src/app/api/`: HTTP handlers. Use `withApiHandler` for auth, JSON parsing, and structured `AppError`; call services directly.

Keep DB fields `snake_case` unless a distinct domain vocabulary is needed. Repositories return typed rows. Action errors retain `{ message, statusCode, fields, ... }`: inline field errors, global request errors.

## Auth, config, storage

Routes: `/login` passwordless/Google; `/signup` same with signup copy; `/verify` six-digit code; `/auth/callback` link token; `/(app)` uses `WithUser`.

JWT: HTTP-only `access_token` plus DB `sessions`. Store passwordless credentials only as hashes in `auth_challenges`; send code/link synchronously with Nodemailer so failures reach users. Public config: `src/config/index.ts`; secrets: `src/config/server.ts`, never client-imported. Apply `src/lib/query/auth.sql` and feature SQL. Storage actions require auth, write below `<userId>/`, use server-only Supabase client, compress with `sharp`, and never expose `SUPABASE_SERVICE_ROLE_KEY`.

## UI, state, cache

Server Components fetch; Client Components interact. Local form state; `useTransition` for action pending; `useRouter` from `nextjs-toploader/app`. Interactive features use paired server/client components, direct feature imports (no barrels), global hooks in `src/hooks/`, feature hooks nearby. Use shadcn from `src/components/ui`, `@/*` imports, strict TypeScript (`unknown` then narrow).

Lists: explicitly choose server URL filtering (`searchParams`, SQL, GET form) or client Jotai promise cache (atom holds in-flight action promise, render `Suspense`, replace with resolved data). Shareable filters/pagination live in URL, sync once to Jotai; tables/summaries/empty states use derived atoms; client-only filtering uses `shallow: true`. Server session is auth truth; hydrate display state only below protected layout; never persist or guard from client user atoms. For mutations needing consistent pending/field/request/toast state, use shared typed action runner; scope keys per row, never duplicate global pending/error atoms. Invalidate targeted tags after writes; `router.refresh()` only updates rendered tree.

## Spec-Driven Development

Use SDD for non-trivial work. Read `agents/knowledge/` for architecture constraints and `agents/plans/` for scoped execution notes before coding. If asked to create or refine a plan, write the final plan to a new named file in `agents/plans/` before implementation. Align, execute, then verify against those specs; flag knowledge/plan conflicts immediately.

## Working Rules

- Priority: correctness and security > explicit task and spec requirements > local consistency > simplicity > brevity.
- Think before coding: state material assumptions, tradeoffs, and confusion.
- Unclear plans, designs, or instructions: explore code first, then ask one concise question at a time; use selectable options when supported and useful.
- Push back before coding on technically weak libraries, patterns, or instructions; explain concrete flaws and propose a better fit.
- Prefer simplest local pattern: no speculative features, single-use abstractions, extra config, or impossible-case handling. Follow YAGNI; use one-liners only when clearer.
- Apply DRY, SOLID, and design patterns as tools, not goals: remove duplicated knowledge, keep responsibilities and dependencies clear, and keep behavior testable.
- Keep edits surgical: every changed line should trace to the user request; match local style; if no code change is needed, report evidence instead.
- Clean only own changes: remove newly unused code; mention unrelated dead code or risks without deleting them.
- Multi-step work needs brief plan, explicit success checks, and narrow verification loop until done.
- Continue until the request is satisfied or truly blocked. Assume every change will be rigorously scrutinized by a senior engineer; impress with sound judgment and clever solutions that improve DX without obscuring behavior.

## Communication

Respond like smart caveman: no greetings or filler. Keep technical substance exact: code, APIs, commands, and errors. Prefer `[thing] [action] [reason]`; fragments OK. Use fuller wording when compression risks ambiguity, safety, or irreversible-action clarity.