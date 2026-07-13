# Permission System, Guards, And Routing

## Permission Hierarchy

Defined in `src/constants/permissions.ts`:

- `user`
- `reviewer`
- `admin`

Admin implies reviewer and user. Reviewer implies user when checked through `PERMISSION_HIERARCHY`.

## Permission Checks

Helpers live in `src/action/permission.ts`:

- `checkAdminPermission()`
- `checkReviewerPermission()`
- `checkUserPermission()`
- `handleAdminPermission()`
- `handleReviewerPermission()`
- `handleUserPermission()`

Handler variants redirect to `/no-permission` on failure.

## Guards

Guards live in `src/components/guards/` and are Server Components:

- `AdminGuard`
- `ReviewerGuard`
- `UserGuard`

Use guards around protected Server Component content. They redirect to `/login` when unauthenticated and `/no-permission` when authenticated without required role.

## Server Actions

Prefer `createAction` from `src/lib/create-action.ts`:

```ts
export const createItem = createAction.user(async (_user, input) => {
  const result = await ItemService.createItem(input);
  revalidatePath("/");
  return result;
});
```

Use levels:

- `createAction.public`
- `createAction.user`

Reviewer/admin actions should call the matching permission helper before their service operation, or extend `createAction` when a project adds those transport levels.

Keep permission checks in transport layer. Services should not know about cookies, redirects, or permissions.
