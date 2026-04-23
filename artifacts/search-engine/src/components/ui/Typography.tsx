import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Theme-aware typography primitives.
 * All colors come from semantic tokens (foreground / muted-foreground /
 * accent) so they automatically adapt to light & dark modes.
 */

export function DisplayTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "font-serif text-4xl md:text-5xl tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DocumentTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base font-semibold text-foreground truncate",
        className,
      )}
      {...props}
    />
  );
}

export function Snippet({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-sm leading-relaxed text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Mono({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("font-mono text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * Relevance score uses the accent color so it pops in both modes and
 * follows whatever palette the user picks (Monochrome / Emerald / Blue).
 */
export function ScoreLabel({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1.5 font-mono text-sm tabular-nums",
        className,
      )}
    >
      <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
        score
      </span>
      <span className="text-base font-semibold text-accent">
        {value.toFixed(4)}
      </span>
    </span>
  );
}
