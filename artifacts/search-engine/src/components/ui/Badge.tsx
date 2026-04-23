import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Lightweight theme-aware glass badge used for tags, model labels, etc. */
export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 h-6 rounded-md text-xs font-medium",
        "glass-surface text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
