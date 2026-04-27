import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Sparkles, AlertTriangle, Inbox, Book } from "lucide-react";

import {
  GlassCard,
  GlassCardContent,
} from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import {
  DisplayTitle,
  Mono,
  SectionTitle,
  Snippet,
} from "@/components/ui/Typography";
import { SearchBar } from "@/components/SearchBar";
import { ModelControls } from "@/components/ModelControls";
import { ResultCard } from "@/components/ResultCard";
import { StatusBar } from "@/components/StatusBar";
import { ThemeMenu } from "@/components/ThemeMenu";
import { cn } from "@/lib/utils";

import {
  type IndexStatus,
  type SearchModel,
  type SearchResponse,
  getStatus,
  reindex,
  runSearch,
} from "@/lib/api";

export default function SearchPage() {
  // Index + status -----------------------------------------------------------
  const [status, setStatus] = useState<IndexStatus | null>(null);
  const [reindexing, setReindexing] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    getStatus()
      .then(setStatus)
      .catch((e) => setStatusError(String(e)));
  }, []);

  async function handleReindex() {
    setReindexing(true);
    try {
      const next = await reindex();
      setStatus(next);
    } catch (e) {
      setStatusError(String(e));
    } finally {
      setReindexing(false);
    }
  }

  // Search controls ----------------------------------------------------------
  const [model, setModel] = useState<SearchModel>("vectorial");
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [usePrefixExpansion, setUsePrefixExpansion] = useState(true);
  const [p, setP] = useState(2.0);
  const [lastQuery, setLastQuery] = useState("");

  // Search state -------------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [compareResponses, setCompareResponses] = useState<{ vectorial: SearchResponse; boolean: SearchResponse } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(query: string) {
    setLoading(true);
    setError(null);
    setLastQuery(query);
    try {
      if (isCompareMode) {
        const [vectorial, boolean] = await Promise.all([
          runSearch({ query, model: "vectorial", p, topK: 20, usePrefixExpansion }),
          runSearch({ query, model: "boolean", p, topK: 20, usePrefixExpansion }),
        ]);
        setCompareResponses({ vectorial, boolean });
        setResponse(null);
      } else {
        const r = await runSearch({ query, model, p, topK: 20, usePrefixExpansion });
        setResponse(r);
        setCompareResponses(null);
      }
    } catch (e) {
      setError(String(e));
      setResponse(null);
      setCompareResponses(null);
    } finally {
      setLoading(false);
    }
  }

  // Auto-refresh results when settings change
  useEffect(() => {
    if (lastQuery) {
      handleSearch(lastQuery);
    }
  }, [model, p, usePrefixExpansion, isCompareMode]);

  const headerCaption = useMemo(() => {
    if (isCompareMode) return "Comparing Vectorial and Extended Boolean models side-by-side.";
    if (model === "vectorial")
      return "TF-IDF weighting combined with cosine similarity over the document vector space.";
    return "Extended Boolean retrieval using p-norm aggregation of weighted term memberships.";
  }, [model, isCompareMode]);

  return (
    <div className="relative z-10 min-h-screen w-full px-4 py-10 md:py-16">
      <motion.div
        layout
        className={cn(
          "mx-auto w-full flex flex-col gap-8",
          isCompareMode ? "max-w-6xl" : "max-w-4xl",
        )}
      >
        {/* Top bar (theme menu + docs) */}
        <div className="flex justify-end items-center gap-4">
          <Link 
            href="/docs"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-surface text-xs font-medium text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all"
          >
            <Book className="size-3.5" />
            Documentation
          </Link>
          <ThemeMenu />
        </div>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 -mt-6">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Badge variant="outline" className="gap-1.5 border-accent/20 bg-accent/5">
              <Sparkles className="size-3 text-accent" />
              <span className="text-foreground">Information Retrieval Engine</span>
            </Badge>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isCompareMode ? "compare" : model}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center gap-3"
            >
              <DisplayTitle>
                {isCompareMode ? (
                  <>
                    Model <span className="text-accent">Comparison</span> Mode
                  </>
                ) : (
                  <>
                    Search your corpus with{" "}
                    <span className="text-accent">two ranking models</span>
                  </>
                )}
              </DisplayTitle>
              <Snippet className="max-w-2xl">{headerCaption}</Snippet>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Status */}
        <GlassCard variant="strong" layout>
          <GlassCardContent className="p-4">
            <StatusBar
              status={status}
              onReindex={handleReindex}
              reindexing={reindexing}
            />
            {statusError && (
              <div className="mt-3 flex items-start gap-2 text-xs text-destructive">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                <span className="font-mono">{statusError}</span>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Controls + search */}
        <GlassCard variant="strong" layout>
          <GlassCardContent className="flex flex-col gap-6 p-6">
            <ModelControls
              model={model}
              onModelChange={setModel}
              p={p}
              onPChange={setP}
              isCompareMode={isCompareMode}
              onCompareModeChange={setIsCompareMode}
              usePrefixExpansion={usePrefixExpansion}
              onUsePrefixExpansionChange={setUsePrefixExpansion}
            />
            <div className="glass-divider" />
            <SearchBar
              onSearch={handleSearch}
              loading={loading}
              placeholder={
                model === "boolean" || isCompareMode
                  ? "e.g. (information AND retrieval) OR vector"
                  : "e.g. cosine similarity vector model"
              }
            />
            {(model === "boolean" || isCompareMode) && (
              <Mono>
                Operators: <span className="text-foreground">AND</span> ·{" "}
                <span className="text-foreground">OR</span> ·{" "}
                <span className="text-foreground">NOT</span> · parentheses
                supported. Bare queries default to OR.
              </Mono>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Results */}
        <div className="flex flex-col gap-3">
          {error && (
            <GlassCard>
              <GlassCardContent className="p-5 flex items-start gap-3 text-destructive">
                <AlertTriangle className="size-5 mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <SectionTitle className="text-destructive">
                    Search failed
                  </SectionTitle>
                  <Mono>{error}</Mono>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          <AnimatePresence mode="wait">
            {isCompareMode && compareResponses ? (
              <motion.div
                key={`compare-${compareResponses.vectorial.query}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Vectorial Column */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-1">
                    <SectionTitle className="text-sm">Vectorial Model</SectionTitle>
                    <Badge variant="outline">{compareResponses.vectorial.results.length} results</Badge>
                  </div>
                  {compareResponses.vectorial.results.length === 0 ? (
                    <EmptyResults />
                  ) : (
                    compareResponses.vectorial.results.map((item, i) => (
                      <ResultCard key={`v-${item.filename}-${i}`} rank={i + 1} item={item} />
                    ))
                  )}
                </div>

                {/* Boolean Column */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-1">
                    <SectionTitle className="text-sm">Boolean (p={p.toFixed(1)})</SectionTitle>
                    <Badge variant="outline">{compareResponses.boolean.results.length} results</Badge>
                  </div>
                  {compareResponses.boolean.results.length === 0 ? (
                    <EmptyResults />
                  ) : (
                    compareResponses.boolean.results.map((item, i) => (
                      <ResultCard key={`b-${item.filename}-${i}`} rank={i + 1} item={item} />
                    ))
                  )}
                </div>
              </motion.div>
            ) : response ? (
              <motion.div
                key={`${response.model}-${response.query}-${response.results.length}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col gap-2 px-1">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <SectionTitle>
                      {response.results.length} result
                      {response.results.length === 1 ? "" : "s"}
                    </SectionTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-accent/5 border-accent/20">
                        {response.model === "vectorial"
                          ? "Vectorial · cosine"
                          : `Boolean · p=${response.p?.toFixed(1)}`}
                      </Badge>
                      <Mono>“{response.query}”</Mono>
                    </div>
                  </div>
                  {response.expansions && Object.keys(response.expansions).length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Mono>expanded:</Mono>
                      {Object.entries(response.expansions)
                        .map(([raw, terms]) => (
                        <Badge 
                          key={raw} 
                          variant="outline" 
                          className="gap-1.5 bg-accent/5 border-accent/20 whitespace-normal break-words h-auto py-1.5"
                        >
                          <span className="font-mono text-muted-foreground shrink-0">{raw}</span>
                          <span className="text-accent shrink-0">→</span>
                          <span className="font-mono text-foreground font-medium">
                            {terms.join(", ")}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {response.results.length === 0 ? (
                  <EmptyResults />
                ) : (
                  response.results.map((item, i) => (
                    <ResultCard key={`${item.filename}-${i}`} rank={i + 1} item={item} />
                  ))
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {!response && !compareResponses && !error && (
            <GlassCard>
              <GlassCardContent className="p-8 flex flex-col items-center text-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg glass-surface">
                  <Sparkles className="size-6 text-accent" />
                </div>
                <SectionTitle>Run a query to see results</SectionTitle>
                <Snippet className="max-w-md">
                  Drop any{" "}
                  <span className="font-mono text-foreground">.txt</span>,{" "}
                  <span className="font-mono text-foreground">.pdf</span> or{" "}
                  <span className="font-mono text-foreground">.json</span> file
                  into <span className="font-mono text-foreground">/data</span>{" "}
                  and reindex — the engine is content-agnostic.
                </Snippet>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>

        <footer className="text-center pt-4">
          <Mono>
            Built with FastAPI · NumPy · React · Tailwind · Framer Motion
          </Mono>
        </footer>
      </motion.div>
    </div>
  );
}

function EmptyResults() {
  return (
    <GlassCard>
      <GlassCardContent className="p-8 flex flex-col items-center text-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-lg glass-surface">
          <Inbox className="size-6 text-muted-foreground" />
        </div>
        <SectionTitle className="text-sm">No matching documents</SectionTitle>
        <Snippet className="text-xs">
          Try different keywords or broaden the query.
        </Snippet>
      </GlassCardContent>
    </GlassCard>
  );
}
