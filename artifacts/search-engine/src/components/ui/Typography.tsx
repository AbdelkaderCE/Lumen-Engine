import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Typography primitives.
 *
 * Centralizing font sizes here is what makes "document title", "snippet",
 * and "relevance score" instantly recognizable across every screen of the
 * app, regardless of where they're rendered.
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
        "inline-flex items-baseline gap-1 font-mono text-sm tabular-nums",
        "text-foreground",
        className,
      )}
    >
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        score
      </span>
      <span className="text-base font-semibold text-primary">
        {value.toFixed(4)}
      </span>
    </span>
  );
}
