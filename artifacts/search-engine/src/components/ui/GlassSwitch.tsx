import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function GlassSwitch({ checked, onChange, label, className }: GlassSwitchProps) {
  return (
    <label className={cn("flex items-center gap-3 cursor-pointer group", className)}>
      {label && <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>}
      <div 
        className={cn(
          "relative w-10 h-5 rounded-full transition-colors duration-200",
          "glass-surface",
          checked ? "bg-accent/20 border-accent/40" : "bg-muted/20 border-border/50"
        )}
        onClick={() => onChange(!checked)}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full shadow-sm transition-colors",
            checked ? "bg-accent" : "bg-muted-foreground"
          )}
        />
      </div>
    </label>
  );
}
