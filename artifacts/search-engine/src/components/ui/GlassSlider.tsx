import { cn } from "@/lib/utils";

/** Theme-aware glass-styled range slider used to set the p value. */
interface GlassSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

export function GlassSlider({
  value,
  min,
  max,
  step = 0.1,
  onChange,
  className,
}: GlassSliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "w-full h-2 rounded-full appearance-none cursor-pointer",
        "bg-foreground/10",
        "focus:outline-none focus:ring-2 focus:ring-accent",
        className,
      )}
      style={{ accentColor: "hsl(var(--accent))" }}
    />
  );
}
