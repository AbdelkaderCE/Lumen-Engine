import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Calculator, Binary, Sigma, Table, Layers, Activity } from "lucide-react";

function AnimatedCounter({ value, decimals = 4 }: { value: number, decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000; // 1s
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out expo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setDisplayValue(start + (end - start) * ease);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value]);

  return <span>{displayValue.toFixed(decimals)}</span>;
}
import { 
  GlassCard, 
  GlassCardContent 
} from "@/components/ui/GlassCard";
import { 
  SectionTitle, 
  Snippet, 
  Mono 
} from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { SearchResponse } from "@/lib/api";

function VectorialWeights({ debug }: { debug: any }) {
  if (!debug.query_vectorization) return null;
  return (
    <div className="flex flex-col gap-4">
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
            {debug.query_vectorization.map((step: any, i: number) => (
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
  );
}

function BooleanRPN({ debug, topScore }: { debug: any, topScore: number }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-accent" />
          <Mono className="text-xs font-bold uppercase">RPN Execution Stack</Mono>
        </div>
        <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-accent/5 border border-accent/10">
          {debug.rpn?.map((token: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                "px-2 py-1 rounded font-mono text-xs",
                ["AND", "OR", "NOT"].includes(token) 
                  ? "bg-accent/20 text-accent font-bold" 
                  : "bg-muted text-muted-foreground"
              )}>
                {token}
              </div>
              {i < debug.rpn.length - 1 && <div className="text-muted-foreground/30">→</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-accent" />
          <Mono className="text-xs font-bold uppercase">Top Result Logical Trace</Mono>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
            <Snippet className="text-[10px] uppercase font-bold text-muted-foreground mb-3">Fuzzy Truth Values (μ)</Snippet>
            <div className="flex flex-col gap-2">
              {Object.entries(debug.top_memberships || {}).map(([term, val]: [string, any]) => (
                <div key={term} className="flex items-center justify-between">
                  <Mono className="text-xs">{term}</Mono>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1 rounded-full bg-border overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(val as number) * 100}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                        className="h-full bg-accent" 
                      />
                    </div>
                    <Mono className="text-[10px] font-bold">
                      <AnimatedCounter value={val as number} decimals={3} />
                    </Mono>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-accent/5 border border-accent/10 flex flex-col justify-center">
             <Snippet className="text-[10px] uppercase font-bold text-muted-foreground mb-2">P-Norm Aggregation</Snippet>
             <div className="font-mono text-lg text-accent font-bold">
                <AnimatedCounter value={topScore} decimals={4} />
             </div>
             <Snippet className="text-[10px] opacity-70 mt-1">Final document membership degree</Snippet>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CalculationInsightsProps {
  response: SearchResponse;
}

export function CalculationInsights({ response }: CalculationInsightsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const debug = response.debug;

  // DIAGNOSTIC: Log the data to console to see what reaches the frontend
  if (debug) {
    console.log("DEBUG FRONTEND: Calculation Insights Data:", debug);
  }

  if (!debug) return null;

  // Use the actual top result score if debug.top_score is missing or 0
  const actualTopScore = debug.top_score || (response.results.length > 0 ? response.results[0].score : 0);

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
            key="insights-panel"
            initial={{ height: 0, opacity: 0, scale: 0.98 }}
            animate={{ height: "auto", opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 100, damping: 18 }}
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

              {response.model === "vectorial" && debug.query_vectorization && (
                <VectorialWeights debug={debug} />
              )}

              {response.model === "boolean" && debug.rpn && (
                <BooleanRPN debug={debug} topScore={actualTopScore} />
              )}
            </GlassCardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
