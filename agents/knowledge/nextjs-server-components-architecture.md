# Next.js App Router And Server Components

## Server vs Client Separation

Interactive features should split data fetching from browser-only behavior.

Pattern:

- `<Feature>` Server Component: parses `searchParams`, calls actions/services, renders initial data.
- `<FeatureClient>` Client Component: owns interactivity, local state, URL updates, and browser APIs.

Feature pattern:

- The server component fetches records on the server.
- A client component owns URL-synced filters when the feature needs them.
- A client form submits a Server Action when the feature needs mutations.

## URL State

Prefer URL state for shareable filters and pagination:

- Server reads `searchParams`.
- Client updates URL with `useQueryState`.
- Refresh/share/back-forward preserve state.

Use stable param names such as `page`, `q`, `status`, or `selectedId`.

## Client-Only Dependencies

Libraries that access `window`, `document`, storage, canvas, browser APIs, or DOM measurements must stay in Client Components.

If a dependency cannot render on server:

1. Create dedicated Client Component wrapper.
2. Import dependency inside that wrapper.
3. Use `next/dynamic({ ssr: false })` only inside Client Component wrappers.
4. Keep Server Component page free of browser-only imports.

## Record Fetching

When fetching one specific entity, use stable primary key `id`, not display labels, grouping keys, names, or derived values. Keep row-to-domain mapping in service layer so Server Components receive domain objects, not raw database rows.
