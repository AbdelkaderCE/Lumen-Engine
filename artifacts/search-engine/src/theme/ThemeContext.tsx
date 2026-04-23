/**
 * Theme system
 * ------------
 * Two orthogonal axes:
 *   - mode:   "dark" | "light"
 *   - accent: "mono" | "emerald" | "blue"
 *
 * Both are persisted to localStorage and applied to <html> as the classes
 * `theme-{mode} accent-{accent}`. Every CSS variable downstream
 * (background, glass tokens, accent color) reacts automatically — the
 * components never need to know which theme is active.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "dark" | "light";
export type AccentName = "mono" | "emerald" | "blue";

interface ThemeContextValue {
  mode: ThemeMode;
  accent: AccentName;
  setMode: (m: ThemeMode) => void;
  setAccent: (a: AccentName) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "search-engine.theme";

interface PersistedTheme {
  mode: ThemeMode;
  accent: AccentName;
}

function loadPersisted(): PersistedTheme {
  if (typeof window === "undefined") return { mode: "dark", accent: "mono" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedTheme>;
      return {
        mode: parsed.mode === "light" ? "light" : "dark",
        accent:
          parsed.accent === "emerald" || parsed.accent === "blue"
            ? parsed.accent
            : "mono",
      };
    }
  } catch {
    /* ignore */
  }
  return { mode: "dark", accent: "mono" };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initial = loadPersisted();
  const [mode, setMode] = useState<ThemeMode>(initial.mode);
  const [accent, setAccent] = useState<AccentName>(initial.accent);

  // Reflect state onto <html> so the CSS variables and Tailwind dark variant
  // both pick it up.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light");
    root.classList.add(`theme-${mode}`);
    // Tailwind v4 dark variant: we registered `dark` to match `.dark` on
    // ancestors, so toggle that class in lockstep with our mode.
    root.classList.toggle("dark", mode === "dark");

    root.classList.remove("accent-mono", "accent-emerald", "accent-blue");
    root.classList.add(`accent-${accent}`);

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ mode, accent }),
      );
    } catch {
      /* ignore quota errors */
    }
  }, [mode, accent]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      accent,
      setMode,
      setAccent,
      toggleMode: () => setMode((m) => (m === "dark" ? "light" : "dark")),
    }),
    [mode, accent],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside a ThemeProvider");
  return ctx;
}

export const ACCENT_OPTIONS: { value: AccentName; label: string; swatch: string }[] = [
  { value: "mono", label: "Monochrome", swatch: "linear-gradient(135deg,#fff,#888)" },
  { value: "emerald", label: "Emerald", swatch: "hsl(158 64% 52%)" },
  { value: "blue", label: "Electric Blue", swatch: "hsl(210 100% 60%)" },
];
