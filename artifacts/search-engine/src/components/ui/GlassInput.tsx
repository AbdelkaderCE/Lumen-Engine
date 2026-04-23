import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Standardized glass-styled text input used by the search bar. */
export const GlassInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "glass-input rounded-xl px-4 h-12 w-full",
        "text-base text-foreground placeholder:text-muted-foreground/70",
        "focus:outline-none focus:ring-2 focus:ring-primary/60",
        "transition-shadow",
        className,
      )}
      {...props}
    />
  );
});
GlassInput.displayName = "GlassInput";
