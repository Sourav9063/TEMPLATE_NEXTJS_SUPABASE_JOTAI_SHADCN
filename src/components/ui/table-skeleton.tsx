import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <Card className="bg-card/60 backdrop-blur-sm gap-2">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <div className="bg-muted/40 px-4 py-3 flex gap-4">
            {Array.from({ length: cols }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton columns
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
            <div key={i} className="px-4 py-3 flex gap-4 border-t">
              {Array.from({ length: cols }).map((_, j) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton columns
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
