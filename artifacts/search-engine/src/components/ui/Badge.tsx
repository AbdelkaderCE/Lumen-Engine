import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Lightweight glass badge used for tags, model labels, etc. */
export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 h-6 rounded-full text-xs font-medium",
        "border border-white/10 bg-white/5 text-muted-foreground backdrop-blur-md",
        className,
      )}
      {...props}
    />
  );
}
