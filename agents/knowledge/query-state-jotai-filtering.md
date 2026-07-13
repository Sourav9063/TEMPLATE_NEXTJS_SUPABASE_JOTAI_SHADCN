# URL Query State And Jotai Filtering

Use URL query params for filters users should be able to share, reload, clear,
or revisit with browser back/forward. Use Jotai for the local state graph,
filtered records, and derived counts.

These are two layers, not competing sources of truth:

- URL params are external state.
- A filter atom is local normalized state.
- Derived atoms power the table, summaries, counts, and empty state.
- One synchronization point copies URL values into the filter atom.

```tsx
const [query, setQuery] = useQueryState<string>("q", "", { shallow: true });
const [status, setStatus] = useQueryState<string>("status", "all", {
  shallow: true,
});
```

Use `shallow: true` for client-only filtering so typing does not refetch the
Server Component tree. Pass `null` to remove a parameter and restore its
default. Keep `useQueryState()` in interactive controls.

```ts
export const filtersAtom = atom({ query: "", status: "all" });
export const visibleRecordsAtom = atom((get) =>
  filterRecords(get(recordsAtom), get(filtersAtom)),
);
export const statsAtom = atom((get) => summarize(get(visibleRecordsAtom)));
```

Hydrate initial records and filters from server props/search params. Keep
reusable parsing in `src/lib/utils/search-params.ts` and feature-specific
param/default configuration in `src/constants/`.

Avoid filtering separately in every component, passing filtered data through
props when Jotai already owns the feature state, or updating both URL and
atoms from every event handler. Controls update the URL; one effect syncs the
URL-backed values into the atom.
