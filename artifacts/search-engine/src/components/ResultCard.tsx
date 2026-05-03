import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ChevronDown, Target, Activity } from "lucide-react";
import {
  GlassCard,
  GlassCardContent,
} from "@/components/ui/GlassCard";
import {
  DocumentTitle,
  ScoreLabel,
  Snippet,
  Mono
} from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { SearchResultItem } from "@/lib/api";

interface ResultCardProps {
  rank: number;
  item: SearchResultItem;
}

export function ResultCard({ rank, item }: ResultCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const lastSlash = item.filename.lastIndexOf("/");
  const folder = lastSlash >= 0 ? item.filename.slice(0, lastSlash + 1) : "";
  const file = lastSlash >= 0 ? item.filename.slice(lastSlash + 1) : item.filename;
  const ext = file.split("#")[0].split(".").pop()?.toUpperCase() ?? "DOC";

  const hasDebug = !!item.debug && (!!item.debug.contributions || !!item.debug.memberships);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(rank * 0.04, 0.4) }}
    >
      <GlassCard className="hover:border-accent/50 transition-colors overflow-hidden">
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
                <div className="flex items-center gap-3">
                  <ScoreLabel value={item.score} />
                  {hasDebug && (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowDetails(!showDetails);
                      }}
                      className={cn(
                        "p-1.5 rounded-md hover:bg-accent/10 transition-all",
                        showDetails ? "text-accent bg-accent/10 rotate-180" : "text-muted-foreground"
                      )}
                      aria-label={showDetails ? "Hide details" : "Show details"}
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <Snippet>{item.snippet}</Snippet>
              </div>

              <AnimatePresence initial={false}>
                {showDetails && (
                  <motion.div
                    key="details-area"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex flex-col gap-4">
                        {item.debug?.contributions && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1.5">
                              <Target className="size-3 text-accent" />
                              <Mono className="text-[10px] uppercase font-bold text-muted-foreground">Overlap Contributions</Mono>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(item.debug.contributions).map(([term, score]) => (
                                <div key={term} className="flex items-center gap-2 px-2 py-1 rounded bg-accent/5 border border-accent/10">
                                  <Mono className="text-[10px]">{term}</Mono>
                                  <div className="w-1 h-1 rounded-full bg-accent/30" />
                                  <Mono className="text-[10px] text-accent font-bold">{score.toFixed(4)}</Mono>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.debug?.memberships && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1.5">
                              <Activity className="size-3 text-accent" />
                              <Mono className="text-[10px] uppercase font-bold text-muted-foreground">Fuzzy Term Memberships</Mono>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(item.debug.memberships).map(([term, degree]) => (
                                <div key={term} className="flex flex-col gap-0.5 min-w-[80px] p-2 rounded bg-muted/20 border border-border/30">
                                  <Mono className="text-[10px] opacity-70">{term}</Mono>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                                      <div className="h-full bg-accent" style={{ width: `${degree * 100}%` }} />
                                    </div>
                                    <Mono className="text-[10px] font-bold">{(degree * 100).toFixed(0)}%</Mono>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </motion.div>
  );
}
