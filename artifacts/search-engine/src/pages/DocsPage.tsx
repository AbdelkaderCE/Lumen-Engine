import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Book,
  Search,
  Zap,
  Settings,
  ArrowLeft,
  ChevronRight,
  Code,
  Layers,
  Database,
  Cpu,
  Eye,
  BarChart3,
  Box,
  Sparkles,
} from "lucide-react";

import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
} from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import {
  DisplayTitle,
  SectionTitle,
  Snippet,
  Mono,
} from "@/components/ui/Typography";
import { ThemeMenu } from "@/components/ThemeMenu";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Zap,
    content: (
      <div className="flex flex-col gap-6">
        <Snippet>
          Lumen Engine is a modern information retrieval system designed for high-performance corpus searching using both vector space and boolean models.
        </Snippet>
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard className="border-accent/20">
            <GlassCardHeader className="p-4 flex items-center gap-2">
              <Database className="size-5 text-accent" />
              <SectionTitle className="text-sm">Data Ingestion</SectionTitle>
            </GlassCardHeader>
            <GlassCardContent className="p-4 pt-0">
              <Snippet className="text-xs">
                Simply drop your files (.txt, .pdf, .json) into the <Mono className="text-foreground">/data</Mono> directory.
              </Snippet>
            </GlassCardContent>
          </GlassCard>
          <GlassCard className="border-accent/20">
            <GlassCardHeader className="p-4 flex items-center gap-2">
              <Cpu className="size-5 text-accent" />
              <SectionTitle className="text-sm">Indexing</SectionTitle>
            </GlassCardHeader>
            <GlassCardContent className="p-4 pt-0">
              <Snippet className="text-xs">
                Click "Reindex" to process content. The engine uses sub-linear TF scaling and smoothed IDF for robust weighting.
              </Snippet>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    ),
  },
  {
    id: "transparency",
    title: "Transparency & Insights",
    icon: Eye,
    content: (
      <div className="flex flex-col gap-6">
        <Snippet>
          Lumen Engine is built on the principle of "Open-Box IR." Every ranking decision is fully observable through real-time mathematical breakdowns.
        </Snippet>
        <div className="grid gap-4">
          <div className="flex flex-col gap-3 p-4 rounded-xl glass-surface border border-accent/20">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-accent" />
              <Mono className="text-xs font-bold uppercase">Calculation Insights</Mono>
            </div>
            <Snippet className="text-xs leading-relaxed">
              Every search includes a dynamic breakdown of TF, IDF, and final weights. For Boolean queries, the system reveals the exact RPN (Reverse Polish Notation) steps used to evaluate the logic.
            </Snippet>
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-xl glass-surface border border-accent/20">
            <div className="flex items-center gap-2">
              <Box className="size-4 text-accent" />
              <Mono className="text-xs font-bold uppercase">3D Spatial Projection</Mono>
            </div>
            <Snippet className="text-xs leading-relaxed">
              The engine projects a shadow of the high-dimensional vector space into 3D. It focuses on the Top 5 results for clarity, using "Billboarding" to keep all text readable during rotation.
            </Snippet>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "ranking-models",
    title: "Ranking Models",
    icon: Layers,
    content: (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Badge className="w-fit">Vectorial Model</Badge>
          <Snippet>
            Treats documents and queries as vectors in a multi-dimensional space using TF-IDF weighting. Supports multiple similarity measures to rank relevance:
          </Snippet>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Cosine", formula: "(A·B) / (||A|| ||B||)", desc: "Normalized angle between vectors." },
              { name: "Scalar Product", formula: "A·B", desc: "Raw dot product of weights." },
              { name: "Euclidean", formula: "1 / (1 + ||A-B||)", desc: "Inverse of L2 distance." },
              { name: "Jaccard", formula: "sum(min) / sum(max)", desc: "Fuzzy intersection over union." },
              { name: "Dice", formula: "2*sum(min) / (sum+sum)", desc: "Harmonic fuzzy overlap." },
            ].map((sim) => (
              <div key={sim.name} className="flex flex-col gap-1.5 p-3 rounded-lg bg-muted/20 border border-border/50">
                <Mono className="text-accent text-xs font-bold">{sim.name}</Mono>
                <div className="font-mono text-[9px] text-muted-foreground">{sim.formula}</div>
                <Snippet className="text-[10px] leading-tight opacity-70">{sim.desc}</Snippet>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-divider" />
        <div className="flex flex-col gap-4">
          <Badge className="w-fit">Boolean (P-Norm)</Badge>
          <Snippet>
            An extended boolean model that supports fuzzy matching via the p-norm operator. This allows for soft AND/OR operations where the 'p' parameter controls the strictness.
          </Snippet>
          <Snippet className="text-xs italic">
            Lower p values (closer to 1.0) behave like a simple average, while higher p values behave more like classic boolean logic.
          </Snippet>
        </div>
      </div>
    ),
  },
  {
    id: "query-syntax",
    title: "Query Syntax",
    icon: Search,
    content: (
      <div className="flex flex-col gap-4">
        <Snippet>
          The boolean model supports a rich query language including operators and grouping.
        </Snippet>
        <div className="grid gap-3">
          {[
            { op: "AND", desc: "Both terms must be present" },
            { op: "OR", desc: "Either term can be present (default)" },
            { op: "NOT", desc: "Exclude documents containing this term" },
            { op: "( )", desc: "Group operations for complex logic" },
          ].map((item) => (
            <div key={item.op} className="flex items-center gap-3">
              <div className="w-12 text-center py-1 rounded bg-accent/10 border border-accent/20">
                <Mono className="text-accent font-bold">{item.op}</Mono>
              </div>
              <Snippet className="text-xs">{item.desc}</Snippet>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-4 border-t border-border/50">
          <Snippet className="text-xs italic">
            <Sparkles className="size-3 inline mr-2 text-accent" />
            Automatic Prefix Expansion: All query terms are automatically expanded to match the closest terms in the index vocabulary.
          </Snippet>
        </div>
      </div>
    ),
  },
  {
    id: "api",
    title: "API Reference",
    icon: Code,
    content: (
      <div className="flex flex-col gap-4">
        <Snippet>
          Interact with the engine programmatically via the REST API.
        </Snippet>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">GET</Badge>
            <Mono className="text-foreground">/api/status</Mono>
            <Snippet className="ml-auto text-[10px]">Index stats</Snippet>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">POST</Badge>
            <Mono className="text-foreground">/api/search</Mono>
            <Snippet className="ml-auto text-[10px]">Run query</Snippet>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">POST</Badge>
            <Mono className="text-foreground">/api/reindex</Mono>
            <Snippet className="ml-auto text-[10px]">Update index</Snippet>
          </div>
        </div>
      </div>
    ),
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  const currentSection = SECTIONS.find((s) => s.id === activeSection)!;

  return (
    <div className="relative z-10 min-h-screen w-full px-4 py-10 md:py-16">
      <div className="mx-auto w-full max-w-5xl flex flex-col gap-8">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link 
            href="/"
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            Back to Search
          </Link>
          <ThemeMenu />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 items-start px-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                <Book className="size-5 text-accent" />
              </div>
              <SectionTitle className="mt-2">Documentation</SectionTitle>
              <Snippet className="text-[10px] uppercase tracking-wider">Lumen Engine v0.1.0</Snippet>
            </div>

            <nav className="flex flex-col gap-1 mt-4">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 text-left",
                      isActive
                        ? "bg-accent/10 text-accent border border-accent/20 shadow-sm"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent",
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", isActive ? "text-accent" : "text-muted-foreground")} />
                    <span className="flex-1 font-medium">{section.title}</span>
                    {isActive && (
                      <motion.div layoutId="active-indicator">
                        <ChevronRight className="size-3.5" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard variant="strong" className="overflow-hidden">
                  <GlassCardHeader className="border-b border-border/50 bg-muted/5 flex items-center gap-3 py-4">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10">
                      <currentSection.icon className="size-4 text-accent" />
                    </div>
                    <SectionTitle>{currentSection.title}</SectionTitle>
                  </GlassCardHeader>
                  <GlassCardContent className="p-8">
                    {currentSection.content}
                  </GlassCardContent>
                </GlassCard>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between px-2">
              <Mono>© 2026 Lumen Engine Research</Mono>
              <div className="flex items-center gap-4">
                <a href="#" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors">Github</a>
                <a href="#" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors">Spec</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
