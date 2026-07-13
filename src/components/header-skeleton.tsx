import { Skeleton } from "@/components/ui/skeleton";

export function HeaderSkeleton() {
  return (
    <header className="sticky h-16 top-0 right-0 z-40 w-full border-b backdrop-blur-sm">
      <div className="flex h-16 px-4 items-center justify-end space-x-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-9 w-9 rounded-md" /> {/* Theme Toggle */}
          <Skeleton className="h-10 w-10 rounded-full" /> {/* Avatar */}
        </div>
      </div>
    </header>
  );
}
