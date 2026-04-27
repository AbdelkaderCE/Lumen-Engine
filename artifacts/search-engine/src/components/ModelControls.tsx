import { motion, AnimatePresence } from "framer-motion";
import { GlassToggleGroup } from "@/components/ui/GlassToggleGroup";
import { GlassSlider } from "@/components/ui/GlassSlider";
import { GlassSwitch } from "@/components/ui/GlassSwitch";
import { Mono, SectionTitle } from "@/components/ui/Typography";
import type { SearchModel } from "@/lib/api";

interface ModelControlsProps {
  model: SearchModel;
  onModelChange: (m: SearchModel) => void;
  p: number;
  onPChange: (p: number) => void;
  isCompareMode: boolean;
  onCompareModeChange: (v: boolean) => void;
  expand: boolean;
  onExpandChange: (v: boolean) => void;
}

export function ModelControls({
  model,
  onModelChange,
  p,
  onPChange,
  isCompareMode,
  onCompareModeChange,
  expand,
  onExpandChange,
}: ModelControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <SectionTitle>Ranking model</SectionTitle>
          <Mono className="text-[10px] uppercase tracking-wider">Choose search logic</Mono>
        </div>
        <div className="flex items-center gap-3">
          <GlassToggleGroup
            value={isCompareMode ? "compare" : model}
            onChange={(v: string) => {
              if (v === "compare") {
                onCompareModeChange(true);
              } else {
                onCompareModeChange(false);
                onModelChange(v as SearchModel);
              }
            }}
            options={[
              { value: "vectorial", label: "Vectorial" },
              { value: "boolean", label: "Boolean" },
              { value: "compare", label: "Compare Models" },
            ]}
          />
          <div className="w-px h-6 bg-border/50 mx-1" />
          <GlassSwitch 
            label="Semantic Expansion" 
            checked={expand} 
            onChange={onExpandChange} 
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {(model === "boolean" || isCompareMode) && (
          <motion.div
            key="p-control"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-4 pt-2">
              <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                <div className="flex items-center justify-between">
                  <Mono>p value</Mono>
                  <Mono>
                    p = <span className="text-primary">{p.toFixed(1)}</span>
                  </Mono>
                </div>
                <GlassSlider
                  value={p}
                  min={1}
                  max={10}
                  step={0.1}
                  onChange={onPChange}
                />
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  <span>lenient (fuzzy)</span>
                  <span>strict (boolean)</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
