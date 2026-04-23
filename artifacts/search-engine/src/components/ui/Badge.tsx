import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Lightweight monochromatic badge used for tags, model labels, etc. */
export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 h-6 rounded-md text-xs font-medium",
        "border border-neutral-700/60 bg-[#1A1A1A]/70 text-neutral-300",
        className,
      )}
      {...props}
    />
  );
}
