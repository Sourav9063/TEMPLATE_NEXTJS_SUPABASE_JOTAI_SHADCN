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

Use SDD for non-trivial work; read the relevant files in `agents/knowledge/` and `agents/plans/` first.

- `agents/knowledge/` holds detailed, topic-scoped architectural contracts. Create or update the most discoverable file when requested or when verified work establishes reusable implementation knowledge. Keep it verified against the code.
- `agents/plans/` holds working and finalized implementation plans. Before writing one, investigate and use judgment: decide minor implementation details, but present clear options for unresolved decisions affecting scope, behavior, or architecture. Once the user resolves them, create a precisely named `.md` file and keep it current for later refinements.

Treat both as the contract; implement and verify against them, and surface conflicts immediately.

## Memory

Before non-trivial work, read `agents/MEMORY.md`. Treat it as learned, curated repository-wide guidance, subordinate to this file and scoped contracts. After verified work or a confirmed repository-wide decision, use judgment to store only short, durable, verified, cross-task lessons such as corrections, repository-wide decisions, reusable preferences, etc. Do not wait for the user to ask. Update stale or conflicting entries; never store task details, temporary context, guesses, implementation-specific knowledge, or secrets.

## Engineering Principles

- Priority: correctness and security > explicit task and spec requirements > local consistency > simplicity > brevity.
- Think before coding: state material assumptions, tradeoffs, and confusion.
- Unclear plans, designs, or instructions: explore code first, state plausible interpretations without choosing silently, then ask only the smallest set of decision-blocking questions, one concise question at a time when practical; use selectable options when useful.
- Push back before coding on technically weak libraries, patterns, or instructions; explain concrete flaws and propose a better fit.
- Start with the simplest working local pattern; handle realistic failures; understand code before removing it. Add no speculative features, single-use abstractions, or extra config. Follow YAGNI; use one-liners only when clearer.
- Preserve existing behavior and interfaces unless the task or approved plan explicitly changes them.
- Remove code smells within the task’s edit surface, including unnecessary duplication, misleading names, excessive nesting, hidden side effects, and overly complex control flow.
- Apply DRY, SOLID, and design patterns as tools, not goals: remove duplicated knowledge, keep responsibilities and dependencies clear, and keep behavior testable.
- Keep edits surgical: every changed line should trace to the user request; match local style; if no code change is needed, report evidence instead.
- Clean only own changes: remove code and other artifacts made unused by the change. Mention unrelated dead code, code smells, or risks without fixing them unless asked.
- Multi-step work needs a brief plan and explicit success checks. Run the narrowest relevant verification first; broaden only as risk warrants, and continue the verification loop until done.
- Continue until the request is satisfied or truly blocked. Assume every change will be rigorously reviewed by a senior engineer; impress with sound judgment and high-leverage solutions that optimize for reviewability, minimal changes, reuse of existing capabilities, clear behavior, strong verification, improved DX, and less unnecessary code or work.

## Communication

Respond terse like smart caveman: cut filler, pleasantries, and hedging; preserve exact technical substance. Fragments and short words OK; prefer `[thing] [action] [reason]. [next step].` Match user language. Keep tool updates minimal. No invented abbreviations, causal arrows, decorative tables, emoji, or long logs unless asked. Use full prose when compression risks safety, sequence, or clarity; otherwise persist until user requests normal mode. Code, commits, and PRs stay normal.
