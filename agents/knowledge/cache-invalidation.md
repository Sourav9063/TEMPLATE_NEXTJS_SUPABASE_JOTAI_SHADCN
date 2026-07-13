# Cache Invalidation

Invalidate cached data where the underlying data changes, after the write
succeeds. Do not invalidate from layout mounts, client effects, reload
detection, or ordinary navigation.

Mutation boundaries are Server Actions and API route handlers. Prefer a
targeted cache tag for a narrow data surface; use a global tag only when the
write can affect many unrelated reads. Keep privileged/global invalidation
behind the same permission boundary as the mutation.

```ts
"use server";

import { updateTag } from "next/cache";
import { createAction } from "@/lib/create-action";
import { ITEM_CACHE_TAG } from "@/constants/cache";

export const updateItem = createAction.user(async (_user, input) => {
  const item = await ItemService.update(input);
  updateTag(ITEM_CACHE_TAG(input.id));
  return item;
});
```

If the client needs the refreshed Server Component tree, call
`router.refresh()` after the action resolves. The action/route remains
responsible for invalidation; the client only requests a new render.
