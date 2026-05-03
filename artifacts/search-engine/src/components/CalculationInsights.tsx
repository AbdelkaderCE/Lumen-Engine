import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Calculator, Binary, Sigma, Table } from "lucide-react";
import { GlassCard, GlassCardContent } from "@/components/ui/GlassCard";
import { SectionTitle, Mono, Snippet } from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { SearchResponse } from "@/lib/api";

interface CalculationInsightsProps {
  response: SearchResponse;
}

export function CalculationInsights({ response }: CalculationInsightsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const debug = response.debug;

  if (!debug) return null;

  return (
    <GlassCard variant="outline" className="overflow-hidden border-accent/20 bg-accent/5">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <Calculator className="size-4" />
          </div>
          <div>
            <SectionTitle className="text-sm">Calculation Insights</SectionTitle>
            <Mono className="text-[10px] uppercase opacity-60">Query vectorization & Mathematical steps</Mono>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <ChevronDown className="size-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="insight-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <GlassCardContent className="p-4 pt-0 border-t border-accent/10 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Sigma className="size-3 text-accent" />
                    <Mono className="text-[10px] uppercase font-bold">Active Formula</Mono>
                  </div>
                  <div className="p-3 rounded-lg bg-black/20 font-mono text-sm border border-white/5 text-primary">
                    {debug.formula ?? "N/A"}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Binary className="size-3 text-accent" />
                    <Mono className="text-[10px] uppercase font-bold">Model Parameters</Mono>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">model: {response.model}</Badge>
                    {response.similarity && <Badge variant="outline">sim: {response.similarity}</Badge>}
                    {response.p && <Badge variant="outline">p: {response.p}</Badge>}
                  </div>
                </div>
              </div>

              {debug.query_vectorization && debug.query_vectorization.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <SectionTitle className="text-xs">Query Vectorization Steps</SectionTitle>
                      <Snippet className="text-[10px]">How each query term was converted into a mathematical weight.</Snippet>
                    </div>
                    <Badge variant="outline" className="gap-1 border-accent/30 text-accent">
                      <Table className="size-3" />
                      Matrix Row
                    </Badge>
                  </div>
                  
                  <div className="overflow-x-auto rounded-lg border border-white/5 bg-black/10">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-white/5 text-muted-foreground uppercase text-[9px]">
                        <tr>
                          <th className="px-3 py-2">Term</th>
                          <th className="px-3 py-2">Raw TF (w)</th>
                          <th className="px-3 py-2">IDF</th>
                          <th className="px-3 py-2 text-right">Final Weight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {debug.query_vectorization.map((step, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="px-3 py-2 font-bold text-foreground">{step.term}</td>
                            <td className="px-3 py-2 text-muted-foreground">{step.tf}</td>
                            <td className="px-3 py-2 text-muted-foreground">{step.idf}</td>
                            <td className="px-3 py-2 text-right text-accent font-bold">{step.final_weight}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {response.model === "boolean" && debug.rpn && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <SectionTitle className="text-xs">Logical Parsing (RPN)</SectionTitle>
                    <Snippet>The query was parsed into Reverse Polish Notation for stack evaluation.</Snippet>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-black/20 border border-white/5">
                    {debug.rpn.map((tok, i) => (
                      <span key={i} className={cn(
                        "font-mono text-sm",
                        ["AND", "OR", "NOT"].includes(tok) ? "text-accent font-bold" : "text-foreground"
                      )}>
                        {tok}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </GlassCardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
