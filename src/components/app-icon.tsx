import { Blocks } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
    >
      <Blocks className="size-7" />
    </div>
  );
}
