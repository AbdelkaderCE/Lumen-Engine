import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { GlassCard, GlassCardContent } from "@/components/ui/GlassCard";
import { DisplayTitle, Snippet } from "@/components/ui/Typography";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      <GlassCard variant="strong" className="w-full max-w-md">
        <GlassCardContent className="p-8 flex flex-col items-center text-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
            <AlertCircle className="size-8 text-destructive" />
          </div>
          
          <div className="flex flex-col gap-2">
            <DisplayTitle className="text-3xl font-serif">404</DisplayTitle>
            <Snippet>This page has vanished into the vector space.</Snippet>
          </div>

          <Link href="/">
            <a className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity">
              <ArrowLeft className="size-4" />
              Back to Search
            </a>
          </Link>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
