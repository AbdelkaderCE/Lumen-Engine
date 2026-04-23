import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import {
  GlassCard,
  GlassCardContent,
} from "@/components/ui/GlassCard";
import {
  DocumentTitle,
  ScoreLabel,
  Snippet,
} from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";
import type { SearchResultItem } from "@/lib/api";

interface ResultCardProps {
  rank: number;
  item: SearchResultItem;
}

/**
 * Highlight the snippet text by score: stronger primary tint for higher rank.
 * The visual emphasis is driven entirely by the design tokens, so adjusting
 * the palette in index.css cascades through every result card automatically.
 */
export function ResultCard({ rank, item }: ResultCardProps) {
  const ext = item.filename.split(".").pop()?.toUpperCase() ?? "DOC";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(rank * 0.04, 0.4) }}
    >
      <GlassCard className="hover:bg-white/[0.03] transition-colors">
        <GlassCardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
              <FileText className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground tabular-nums w-6">
                    #{rank}
                  </span>
                  <DocumentTitle title={item.filename}>
                    {item.filename}
                  </DocumentTitle>
                  <Badge>{ext}</Badge>
                </div>
                <ScoreLabel value={item.score} />
              </div>
              <div className="mt-3">
                <Snippet>{item.snippet}</Snippet>
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </motion.div>
  );
}
