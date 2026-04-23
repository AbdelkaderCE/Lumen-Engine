import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Typography primitives (monochromatic).
 *
 * Centralizing font sizes and colors here is what makes "document title",
 * "snippet", and "relevance score" instantly recognizable across every
 * screen of the app, regardless of where they're rendered.
 */

export function DisplayTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "font-serif text-4xl md:text-5xl tracking-tight text-neutral-50",
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
        "text-lg font-semibold tracking-tight text-neutral-50",
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
        "text-base font-semibold text-neutral-50 truncate",
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
        "text-sm leading-relaxed text-neutral-400",
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
      className={cn("font-mono text-xs text-neutral-400", className)}
      {...props}
    />
  );
}

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
      <span className="text-[10px] text-neutral-500 uppercase tracking-[0.15em]">
        score
      </span>
      <span className="text-base font-semibold text-white">
        {value.toFixed(4)}
      </span>
    </span>
  );
}
