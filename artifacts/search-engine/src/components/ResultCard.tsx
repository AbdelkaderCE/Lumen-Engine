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

export function ResultCard({ rank, item }: ResultCardProps) {
  // The backend returns paths relative to /data, so split them so we can
  // emphasize the file name and dim the parent folder for readability.
  const lastSlash = item.filename.lastIndexOf("/");
  const folder = lastSlash >= 0 ? item.filename.slice(0, lastSlash + 1) : "";
  const file = lastSlash >= 0 ? item.filename.slice(lastSlash + 1) : item.filename;
  const ext = file.split("#")[0].split(".").pop()?.toUpperCase() ?? "DOC";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(rank * 0.04, 0.4) }}
    >
      <GlassCard className="hover:border-accent/50 transition-colors">
        <GlassCardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg glass-surface">
              <FileText className="size-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground tabular-nums w-6">
                    #{rank}
                  </span>
                  <DocumentTitle title={item.filename} className="flex items-baseline gap-0">
                    {folder && (
                      <span className="text-muted-foreground font-normal">
                        {folder}
                      </span>
                    )}
                    <span>{file}</span>
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
