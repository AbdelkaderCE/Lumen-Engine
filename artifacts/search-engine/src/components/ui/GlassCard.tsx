import { forwardRef, type HTMLAttributes } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * GlassCard (monochromatic)
 * -------------------------
 * The base container of the design system. Every panel, card, or modal
 * uses this so visual consistency is mechanical.
 */
type GlassCardProps = HTMLMotionProps<"div"> & {
  variant?: "default" | "strong";
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-xl",
          variant === "strong" ? "glass-surface-strong" : "glass-surface",
          className,
        )}
        {...props}
      />
    );
  },
);
GlassCard.displayName = "GlassCard";

export function GlassCardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pb-4", className)} {...props} />;
}

export function GlassCardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-2", className)} {...props} />;
}

export function GlassCardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}
