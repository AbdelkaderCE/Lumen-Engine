import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * GlassButton (monochromatic)
 * ---------------------------
 * Single button primitive for the entire app.
 * Variants:
 *   - "primary"  -> high-contrast white background, black text (search submit)
 *   - "ghost"    -> transparent dark surface with neutral border (toggles, secondary)
 *   - "outline"  -> bordered neutral button (cancel, neutral actions)
 */
type Variant = "primary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

type GlassButtonProps = HTMLMotionProps<"button"> & {
  variant?: Variant;
  size?: Size;
  active?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-white text-black border border-neutral-300 hover:bg-neutral-100",
  ghost:
    "bg-[#1A1A1A]/70 text-neutral-50 border border-neutral-700/60 hover:bg-neutral-800/70 hover:border-neutral-600",
  outline:
    "bg-transparent text-neutral-50 border border-neutral-600 hover:bg-neutral-900/60",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-lg",
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    { className, variant = "primary", size = "md", active = false, ...props },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 font-medium tracking-tight",
          "select-none cursor-pointer transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400",
          sizeClasses[size],
          variantClasses[variant],
          active && variant !== "primary" && "bg-neutral-800/80 border-neutral-500",
          className,
        )}
        {...props}
      />
    );
  },
);
GlassButton.displayName = "GlassButton";
