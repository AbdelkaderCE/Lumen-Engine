import { useState, type FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
  initialValue?: string;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  loading,
  initialValue = "",
  placeholder,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/70 pointer-events-none" />
        <GlassInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder ?? "Search the corpus…"}
          className="pl-12 pr-4 h-14 text-lg"
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
