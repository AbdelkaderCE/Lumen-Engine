import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Segmented monochromatic toggle. Used to switch between the Vectorial and
 * Extended Boolean models. Active state uses a neutral grey highlight,
 * not a colored gradient.
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
              "transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400",
              active ? "text-white" : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            {active && (
              <motion.span
                layoutId="glass-toggle-indicator"
                className="absolute inset-0 rounded-md bg-neutral-700 border border-neutral-600"
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
