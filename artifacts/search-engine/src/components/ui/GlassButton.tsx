import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * GlassButton (theme-aware)
 * -------------------------
 * Single button primitive for the entire app.
 *
 * Variants:
 *   - "primary"  -> filled with the active ACCENT color (auto-updates
 *                   when the user picks a new accent in the theme menu).
 *   - "ghost"    -> glass surface, neutral border (toggles, secondary)
 *   - "outline"  -> bordered glass button (cancel, neutral actions)
 *
 * The "glassy" texture is preserved across both light and dark modes
 * because it is driven by the .glass-surface utility (CSS variables).
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
    "bg-accent text-accent-foreground border border-accent hover:brightness-110",
  ghost:
    "glass-surface text-foreground hover:bg-foreground/5",
  outline:
    "bg-transparent text-foreground border border-border hover:bg-foreground/5",
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
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          sizeClasses[size],
          variantClasses[variant],
          active && variant !== "primary" && "border-accent text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);
GlassButton.displayName = "GlassButton";
