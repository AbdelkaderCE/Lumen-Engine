import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings2, Sun, Moon, Check } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { Mono } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import {
  ACCENT_OPTIONS,
  useTheme,
  type AccentName,
} from "@/theme/ThemeContext";

/**
 * Theme customizer dropdown.
 * - Light/Dark switch (animated)
 * - Accent color swatches (Monochrome / Emerald / Electric Blue)
 *
 * Stays inside the design system: built from GlassButton + glass surface,
 * so it inherits the frosted look in both themes.
 */
export function ThemeMenu() {
  const { mode, accent, toggleMode, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <GlassButton
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Theme settings"
      >
        <Settings2 className="size-3.5" />
        <span>Theme</span>
      </GlassButton>

      <AnimatePresence>
        {open && (
          <motion.div
            key="theme-menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-64 z-50 origin-top-right"
            role="menu"
          >
            <div className="glass-surface-strong rounded-xl p-3 flex flex-col gap-3">
              {/* Mode row */}
              <div className="flex flex-col gap-1.5">
                <Mono className="px-1">Appearance</Mono>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-lg glass-surface">
                  <ModeOption
                    label="Dark"
                    icon={<Moon className="size-3.5" />}
                    active={mode === "dark"}
                    onClick={() => mode !== "dark" && toggleMode()}
                  />
                  <ModeOption
                    label="Light"
                    icon={<Sun className="size-3.5" />}
                    active={mode === "light"}
                    onClick={() => mode !== "light" && toggleMode()}
                  />
                </div>
              </div>

              {/* Accent row */}
              <div className="flex flex-col gap-1.5">
                <Mono className="px-1">Accent</Mono>
                <div className="flex flex-col gap-1">
                  {ACCENT_OPTIONS.map((opt) => (
                    <AccentOption
                      key={opt.value}
                      label={opt.label}
                      swatch={opt.swatch}
                      active={accent === opt.value}
                      onClick={() => setAccent(opt.value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModeOption({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-medium",
        "transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="theme-mode-indicator"
          className="absolute inset-0 rounded-md bg-accent/15 border border-accent/40"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  );
}

function AccentOption({
  label,
  swatch,
  active,
  onClick,
}: {
  label: AccentName | string;
  swatch: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-3 px-2.5 h-9 rounded-md text-sm",
        "transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent",
        active
          ? "bg-foreground/5 text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
      )}
    >
      <span className="flex items-center gap-2.5">
        <span
          className="size-4 rounded-full border border-border"
          style={{ background: swatch }}
        />
        {label}
      </span>
      {active && <Check className="size-4 text-accent" />}
    </button>
  );
}
