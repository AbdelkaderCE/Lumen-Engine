import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * GlassButton
 * -----------
 * Single button primitive for the entire app.
 * Variants:
 *   - "primary"  -> gradient action button (search submit, reindex)
 *   - "ghost"    -> transparent glass button (toggles, secondary actions)
 *   - "outline"  -> bordered glass button (cancel, neutral actions)
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
    "text-white shadow-lg shadow-fuchsia-900/30 " +
    "bg-[linear-gradient(135deg,hsl(265_90%_60%),hsl(320_80%_60%))] " +
    "border border-white/15 hover:brightness-110",
  ghost:
    "text-foreground/90 glass-surface hover:bg-white/10",
  outline:
    "text-foreground/90 border border-white/15 bg-white/5 hover:bg-white/10",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
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
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          sizeClasses[size],
          variantClasses[variant],
          active && variant !== "primary" && "ring-1 ring-primary/60 bg-white/10",
          className,
        )}
        {...props}
      />
    );
  },
);
GlassButton.displayName = "GlassButton";
