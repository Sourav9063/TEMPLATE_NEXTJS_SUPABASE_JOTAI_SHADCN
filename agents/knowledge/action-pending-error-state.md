# Action Pending And Error State

When multiple client mutations need the same lifecycle behavior, centralize it
in a typed action runner backed by Jotai. The runner owns pending state,
request identity, error normalization, and optional toast/progress behavior.
Do not create feature-specific pending/error atoms when the shared runner can
own the state.

Shared mutation state lives in:

- `src/constants/action-keys.ts`: typed keys and scoped key factories.
- `src/stores/action-state-store.ts`: one state record per key.
- `src/hooks/use-action-runner.ts`: mutation runner hook.
- `src/lib/utils/error.ts`: error normalization.
- `src/types/action-state.ts`: shared types.

Use constants, never raw strings in components. Scope repeated actions by
record ID so one row cannot display another row's state. `clearActionScopeAtom`
can remove all state for a feature prefix during teardown.

```tsx
const createRunner = useActionRunner(actionKeys.itemCreate, createItem);
const deleteRunner = useActionRunner(
  actionKeys.itemDelete(record.id),
  deleteItem,
);
```

Keep the runner contract small and predictable:

```ts
{ run, pending, isTransitionPending, error, fields, clearError }
```

`run()` starts the transition, executes the Server Action, normalizes the
result, and records success/error under the action key. A monotonically
increasing `requestId` prevents an older response from overwriting a newer
request.

```tsx
const result = await createRunner.run({ name });
if (!result.success) return;
upsertItem(result.data);
```

Use `fields` for inline input errors and the top-level `message` for request
errors. Preserve the contract; do not rename `fields` to `fieldErrors` in the
shared model.

```tsx
const nameError = createRunner.fields.name?.[0];
<Input aria-invalid={Boolean(nameError)} />
{nameError && <p className="text-sm text-destructive">{nameError}</p>}
```

Errors support message, HTTP status, code, one field, field maps, details,
source, and request ID. The runner shows error toasts by default; set
`toastError: false` or provide a predicate when inline-only feedback is better.
Keep synchronous/client-only validation and login errors local when no
asynchronous action ran.

Legacy `useActionState()` form adapters may map `error.message` and
`error.fields` back to their string form-state shape at the boundary.
