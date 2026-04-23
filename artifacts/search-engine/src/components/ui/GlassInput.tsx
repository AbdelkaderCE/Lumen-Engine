import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Standardized monochromatic text input used by the search bar. */
export const GlassInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "glass-input rounded-lg px-4 h-12 w-full",
        "text-base text-neutral-50 placeholder:text-neutral-500",
        "focus:outline-none focus:border-neutral-500",
        "transition-colors",
        className,
      )}
      {...props}
    />
  );
});
GlassInput.displayName = "GlassInput";
