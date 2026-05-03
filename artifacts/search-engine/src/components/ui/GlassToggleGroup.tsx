import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Segmented theme-aware toggle. Active option uses the accent color so
 * a theme change propagates instantly without component logic changes.
 */
export interface GlassToggleOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface GlassToggleGroupProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: GlassToggleOption<T>[];
  className?: string;
  layoutId?: string;
}

export function GlassToggleGroup<T extends string>({
  value,
  onChange,
  options,
  className,
  layoutId = "glass-toggle-indicator",
}: GlassToggleGroupProps<T>) {
  return (
    <div
      className={cn(
        "glass-surface rounded-lg p-1 inline-flex relative",
        className,
      )}
      role="radiogroup"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative px-4 h-9 rounded-md text-sm font-medium",
              "transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent",
              active
                ? "text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-md bg-accent border border-accent"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
