import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertTriangle, Inbox } from "lucide-react";

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
  const [p, setP] = useState(2.0);

  // Search state -------------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(query: string) {
    setLoading(true);
    setError(null);
    try {
      const r = await runSearch({ query, model, p, topK: 20 });
      setResponse(r);
    } catch (e) {
      setError(String(e));
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }

  const headerCaption = useMemo(() => {
    if (model === "vectorial")
      return "TF-IDF weighting combined with cosine similarity over the document vector space.";
    return "Extended Boolean retrieval using p-norm aggregation of weighted term memberships.";
  }, [model]);

  return (
    <div className="relative z-10 min-h-screen w-full px-4 py-10 md:py-16">
      <div className="mx-auto w-full max-w-4xl flex flex-col gap-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center gap-3"
        >
          <Badge className="gap-1.5">
            <Sparkles className="size-3 text-neutral-300" />
            Information Retrieval Engine
          </Badge>
          <DisplayTitle>
            Search your corpus with{" "}
            <span className="text-white">two ranking models</span>
          </DisplayTitle>
          <Snippet className="max-w-2xl">{headerCaption}</Snippet>
        </motion.div>

        {/* Status */}
        <GlassCard variant="strong">
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
        <GlassCard variant="strong">
          <GlassCardContent className="flex flex-col gap-6 p-6">
            <ModelControls
              model={model}
              onModelChange={setModel}
              p={p}
              onPChange={setP}
            />
            <div className="glass-divider" />
            <SearchBar
              onSearch={handleSearch}
              loading={loading}
              placeholder={
                model === "boolean"
                  ? "e.g. (information AND retrieval) OR vector"
                  : "e.g. cosine similarity vector model"
              }
            />
            {model === "boolean" && (
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
            {response && (
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
                      <Badge>
                        {response.model === "vectorial"
                          ? "Vectorial · cosine"
                          : `Boolean · p=${response.p?.toFixed(1)}`}
                      </Badge>
                      <Mono>“{response.query}”</Mono>
                    </div>
                  </div>
                  {response.expansions && Object.keys(response.expansions).length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Mono className="text-neutral-500">expanded:</Mono>
                      {Object.entries(response.expansions).map(([raw, terms]) => (
                        <Badge key={raw} className="gap-1.5">
                          <span className="font-mono text-neutral-300">{raw}</span>
                          <span className="text-neutral-500">→</span>
                          <span className="font-mono text-neutral-100">
                            {terms.join(", ")}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {response.results.length === 0 ? (
                  <GlassCard>
                    <GlassCardContent className="p-8 flex flex-col items-center text-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-neutral-900/60 border border-neutral-700/60">
                        <Inbox className="size-6 text-neutral-400" />
                      </div>
                      <SectionTitle>No matching documents</SectionTitle>
                      <Snippet>
                        Try different keywords, broaden the query, or lower the
                        p value to make boolean matching more lenient.
                      </Snippet>
                    </GlassCardContent>
                  </GlassCard>
                ) : (
                  response.results.map((item, i) => (
                    <ResultCard key={`${item.filename}-${i}`} rank={i + 1} item={item} />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!response && !error && (
            <GlassCard>
              <GlassCardContent className="p-8 flex flex-col items-center text-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-neutral-900/60 border border-neutral-700/60">
                  <Sparkles className="size-6 text-neutral-300" />
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
      </div>
    </div>
  );
}
