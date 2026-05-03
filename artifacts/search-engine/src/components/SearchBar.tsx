import { useState, type FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
  initialValue?: string;
  placeholder?: string;
  onFocusChange?: (isFocused: boolean) => void;
}

export function SearchBar({
  onSearch,
  loading,
  initialValue = "",
  placeholder,
  onFocusChange,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  function handleFocus(focused: boolean) {
    setIsFocused(focused);
    onFocusChange?.(focused);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
      // Release focus to end the "Spotlight" mode
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }

  // Highlights the operators for the overlay
  function highlightText(text: string) {
    if (!text) return null;
    // Split by operators but keep them in the array
    const parts = text.split(/(\bAND\b|\bOR\b|\bNOT\b|\(|\))/g);
    return parts.map((part, i) => {
      if (["AND", "OR", "NOT"].includes(part)) {
        return (
          <span key={i} className="text-accent font-black drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.4)]">
            {part}
          </span>
        );
      }
      if (["(", ")"].includes(part)) {
        return <span key={i} className="text-accent/60 font-bold">{part}</span>;
      }
      return <span key={i} className="text-foreground">{part}</span>;
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-3">
      <div className={cn(
        "relative flex-1 group transition-all duration-500",
        isFocused ? "scale-[1.02] z-40" : "z-10"
      )}>
        <Search className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 size-5 transition-colors z-30 pointer-events-none",
          isFocused ? "text-accent" : "text-muted-foreground"
        )} />
        
        {/* The Highlighter Layer - Ensure text colors are strong */}
        <div 
          className="absolute inset-0 pointer-events-none z-20 flex items-center pl-12 pr-4 h-14 text-lg font-sans overflow-hidden whitespace-pre select-none"
          aria-hidden="true"
        >
          {highlightText(value)}
          {!value && (
            <span className="text-muted-foreground/50">
              {placeholder ?? "Search the corpus…"}
            </span>
          )}
        </div>

        {/* The Actual Input Layer */}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => handleFocus(true)}
          onBlur={() => handleFocus(false)}
          spellCheck={false}
          className={cn(
            "glass-input rounded-xl px-4 pl-12 pr-4 h-14 w-full",
            "text-lg font-sans bg-transparent outline-none transition-all duration-500",
            isFocused ? "border-accent shadow-[0_0_50px_rgba(var(--accent-rgb),0.2)] bg-black/40" : "border-white/10",
            "relative z-10 text-transparent caret-foreground selection:bg-accent/30"
          )}
          autoFocus
        />
      </div>
      
      <GlassButton type="submit" size="lg" disabled={loading || !value.trim()}>
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Search className="size-4" />
        )}
        <span>Search</span>
      </GlassButton>
    </form>
  );
}
