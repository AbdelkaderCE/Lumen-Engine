import { Database, RefreshCw, Loader2 } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { Mono } from "@/components/ui/Typography";
import type { IndexStatus } from "@/lib/api";

interface StatusBarProps {
  status: IndexStatus | null;
  onReindex: () => void;
  reindexing: boolean;
}

export function StatusBar({ status, onReindex, reindexing }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Database className="size-4 text-muted-foreground" />
        {status ? (
          <Mono>
            <span className="text-foreground">{status.documents}</span> documents ·{" "}
            <span className="text-foreground">{status.vocabulary}</span> unique terms
          </Mono>
        ) : (
          <Mono>loading index…</Mono>
        )}
      </div>
      <GlassButton
        variant="ghost"
        size="sm"
        onClick={onReindex}
        disabled={reindexing}
      >
        {reindexing ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <RefreshCw className="size-3.5" />
        )}
        <span>Reindex /data</span>
      </GlassButton>
    </div>
  );
}
