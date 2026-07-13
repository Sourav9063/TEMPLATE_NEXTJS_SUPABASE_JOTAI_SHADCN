"use client";

import { useRouter } from "nextjs-toploader/app";
import { useTransition } from "react";
import { clearGlobalCache } from "@/action/cache";
import { Button } from "@/components/ui/button";

export function RefreshCacheButtonClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      const result = await clearGlobalCache();
      if (result.success) router.refresh();
    });
  }

  return (
    <Button disabled={isPending} onClick={handleRefresh} type="button">
      {isPending ? "Refreshing…" : "Refresh data"}
    </Button>
  );
}
