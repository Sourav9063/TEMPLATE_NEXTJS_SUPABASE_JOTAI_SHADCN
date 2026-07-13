"use server";

import { updateTag } from "next/cache";
import { GLOBAL_CACHE_TAG } from "@/constants/cache";
import { createAction } from "@/lib/create-action";

export const clearGlobalCache = createAction.user(async () => {
  updateTag(GLOBAL_CACHE_TAG);
});
