import { Suspense } from "react";
import { WithUser } from "@/components/with-user";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-svh bg-muted/30" />}>
      <WithUser>{children}</WithUser>
    </Suspense>
  );
}
