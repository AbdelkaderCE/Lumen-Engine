import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Segmented glass toggle. Used to switch between the Vectorial and
 * Extended Boolean models. Built on top of the same surface as GlassCard
 * for visual consistency.
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
}

export function GlassToggleGroup<T extends string>({
  value,
  onChange,
  options,
  className,
}: GlassToggleGroupProps<T>) {
  return (
    <div
      className={cn(
        "glass-surface rounded-xl p-1 inline-flex relative",
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
              "relative px-4 h-9 rounded-lg text-sm font-medium",
              "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
              active ? "text-white" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="glass-toggle-indicator"
                className="absolute inset-0 rounded-lg bg-[linear-gradient(135deg,hsl(265_90%_60%/0.9),hsl(320_80%_60%/0.9))] shadow-md shadow-fuchsia-900/30"
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
