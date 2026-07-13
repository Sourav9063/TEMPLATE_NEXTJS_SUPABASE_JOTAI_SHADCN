# User Session And Jotai

The server session is the source of truth for authentication and
authorization. Client Jotai state is volatile display/UI state only.

Protected layouts or Server Components should fetch the user with the
server-only `getUser()` path, then optionally hydrate a client `userAtom` for
avatars, menus, and other display concerns. Never use the client atom for
authorization decisions.

```tsx
const user = await getUser();
return (
  <main>
    <AuthUserHydratorClient user={user} />
    {children}
  </main>
);
```

The hydrator may use `useHydrateAtoms()` for the first render and an effect to
keep the atom synchronized if the server user changes while the same Jotai
store remains mounted.

Rules:

- Do not use `atomWithStorage` for user/session data.
- Do not duplicate user data in `localStorage`, `sessionStorage`, or extra cookies.
- Do not read client atoms from Server Components.
- Keep auth checks in Server Actions, route handlers, guards, and layouts.
- On logout, clear volatile user state before invoking server logout.
- Keep login errors local to the login component.
