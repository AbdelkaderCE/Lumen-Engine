import { useState, useRef, useEffect, type FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

  const [cursorPos, setCursorPos] = useState(0);
  const [cursorOffset, setCursorOffset] = useState(0);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update cursor offset whenever cursorPos or value changes
  useEffect(() => {
    if (mirrorRef.current) {
      setCursorOffset(mirrorRef.current.offsetWidth);
    }
  }, [cursorPos, value]);

  // Global keyboard shortcut (Cmd+K / Ctrl+K) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleFocus(focused: boolean) {
    setIsFocused(focused);
    onFocusChange?.(focused);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    setCursorPos(e.target.selectionStart || 0);
  }

  function handleKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    setCursorPos(inputRef.current?.selectionStart || 0);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }

  // Highlights the operators with "Pseudo-Bold" (no width change)
  function highlightText(text: string) {
    if (!text) return null;
    const parts = text.split(/(\bAND\b|\bOR\b|\bNOT\b|\(|\))/g);
    return parts.map((part, i) => {
      if (["AND", "OR", "NOT"].includes(part)) {
        return (
          <motion.span 
            key={`${i}-${part}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="text-accent inline-block"
            style={{ 
              textShadow: "0.6px 0 0 currentColor, -0.6px 0 0 currentColor",
              filter: "drop-shadow(0 0 10px rgba(var(--accent-rgb), 0.5))"
            }}
          >
            {part}
          </motion.span>
        );
      }
      if (["(", ")"].includes(part)) {
        return <span key={i} className="text-accent/60">{part}</span>;
      }
      return <span key={i} className="text-foreground">{part}</span>;
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-3">
      <div className={cn(
        "relative flex-1 group transition-all duration-500 will-change-transform",
        isFocused ? "scale-[1.02] z-40 transform-gpu" : "z-10"
      )}>
        <Search className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 size-5 transition-colors z-30 pointer-events-none",
          isFocused ? "text-accent" : "text-muted-foreground"
        )} />
        
        {/* Mirror Layer for Cursor Positioning - Fixed Width measurement */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-0 whitespace-pre font-mono text-lg pl-12 h-14 flex items-center overflow-hidden"
        >
          <span ref={mirrorRef} className="inline-block">{value.slice(0, cursorPos)}</span>
        </div>

        {/* The Highlighter Layer */}
        <div 
          className="absolute inset-0 pointer-events-none z-20 flex items-center pl-12 pr-4 h-14 text-lg font-mono overflow-hidden whitespace-pre select-none leading-none"
          aria-hidden="true"
        >
          <div className="relative flex items-center h-full">
            {highlightText(value)}
            
            {/* Custom Stylized Cursor - Luxury Breathing Pulse */}
            {isFocused && (
              <motion.div 
                className="absolute w-0.5 h-6 bg-accent rounded-full"
                initial={false}
                animate={{ 
                  left: cursorOffset,
                  opacity: [1, 0.2, 1],
                  boxShadow: [
                    "0 0 8px rgba(var(--accent-rgb), 0.8)",
                    "0 0 15px rgba(var(--accent-rgb), 1)",
                    "0 0 8px rgba(var(--accent-rgb), 0.8)"
                  ]
                }}
                transition={{ 
                  left: { type: "spring", stiffness: 1000, damping: 35 },
                  opacity: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
                  boxShadow: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                }}
              />
            )}
          </div>

          {!value && (
            <div className="flex flex-1 items-center justify-between text-muted-foreground/50">
              <span>{placeholder ?? "Search the corpus…"}</span>
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-sans text-xs font-medium text-white/50 backdrop-blur-sm transition-all group-hover:bg-white/10 group-hover:text-white/70">
                <span className="text-[13px] leading-none mt-[1px]">⌘</span>K
              </kbd>
            </div>
          )}
        </div>

        {/* The Actual Input Layer */}
        <input
          ref={inputRef}
          value={value}
          onChange={handleInput}
          onKeyUp={handleKeyUp}
          onClick={() => setCursorPos(inputRef.current?.selectionStart || 0)}
          onFocus={() => handleFocus(true)}
          onBlur={() => handleFocus(false)}
          spellCheck={false}
          className={cn(
            "glass-input rounded-xl pl-12 pr-4 h-14 w-full",
            "text-lg font-mono bg-transparent outline-none transition-all duration-500 leading-none",
            isFocused ? "border-accent shadow-[0_0_50px_rgba(var(--accent-rgb),0.2)] bg-black/40" : "border-white/10",
            "relative z-10 text-transparent caret-transparent selection:bg-accent/30"
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
