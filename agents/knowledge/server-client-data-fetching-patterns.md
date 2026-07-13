# Server And Client Data-Fetching Patterns

Use two explicit patterns for feature data. Choose one per feature surface;
do not mix server-fetched initial props and a separate client cache unless the
client needs a deliberate refresh/hydration boundary.

## Server Component Data

Use this for searchable lists, pagination, and pages whose URL state should
drive the database query.

- Page receives `searchParams` and validates/normalizes them on the server.
- Server Component calls the Server Action/service with those filters.
- Repository applies filters and pagination in SQL.
- The rendered form uses a normal GET submission so the URL is shareable.
- Mutations use Server Action form actions and revalidate the route.

```tsx
export async function ItemPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const result = await getItems({ query: params.q });
  return <ItemTable items={result.success ? result.data : []} />;
}
```

This keeps filtering on the server and avoids duplicating a large result set
in browser state.

## Client Promise-Cache Data

Use this for interactive surfaces that load on demand or need client-side
derived state after the initial request. Cache the in-flight promise and then
replace it with resolved data:

```ts
const itemCacheAtom = atom<Item[] | Promise<Item[]> | null>(null);

const itemDataAtom = atom((get) => {
  const value = get(itemCacheAtom);
  if (value instanceof Promise) throw value;
  if (value === null) throw new Error("Items were not loaded.");
  return value;
});
```

The loader write atom should:

1. Skip if the cache already contains a promise or data.
2. Call the Server Action.
3. Store the promise immediately so Suspense can render a fallback.
4. Replace it with data on success and clear it on failure.

Components render the data atom inside `Suspense`. Mutations update the
resolved cache through focused write atoms. Use scoped action keys for row
pending/error state.

The client pattern should not be used for shareable server queries or
unbounded lists; use the Server Component pattern there.
