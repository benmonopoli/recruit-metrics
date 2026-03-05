import { cn } from "@/lib/utils";
import { ExportStyle } from "./ExportModal";

interface StyleSelectorProps {
  value: ExportStyle;
  onChange: (style: ExportStyle) => void;
}

const styles: { id: ExportStyle; label: string; description: string; preview: React.ReactNode }[] = [
  {
    id: "minimal",
    label: "Snapshot",
    description: "All data on one page",
    preview: (
      <div className="w-full h-16 bg-white rounded border p-1.5 flex flex-col gap-0.5">
        <div className="flex gap-1 h-3">
          <div className="flex-1 bg-primary/30 rounded-sm" />
          <div className="flex-1 bg-primary/20 rounded-sm" />
          <div className="flex-1 bg-primary/25 rounded-sm" />
          <div className="flex-1 bg-primary/15 rounded-sm" />
        </div>
        <div className="flex gap-1 flex-1">
          <div className="flex-1 bg-muted/60 rounded-sm" />
          <div className="flex-1 bg-muted/40 rounded-sm" />
        </div>
        <div className="h-2.5 bg-muted/50 rounded-sm" />
      </div>
    ),
  },
  {
    id: "data-rich",
    label: "Multi-Page",
    description: "Detailed slides per section",
    preview: (
      <div className="w-full h-16 bg-white rounded border overflow-hidden">
        <div className="h-1 bg-primary" />
        <div className="flex h-full">
          <div className="w-1 bg-orange-500" />
          <div className="flex-1 p-1.5 flex flex-col gap-1">
            <div className="h-2 w-12 bg-foreground/80 rounded-sm" />
            <div className="flex gap-1 flex-1">
              <div className="flex-1 bg-primary/20 rounded-sm" />
              <div className="flex-1 bg-primary/30 rounded-sm" />
              <div className="flex-1 bg-violet-500/20 rounded-sm" />
            </div>
            <div className="h-3 bg-muted/60 rounded-sm" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "executive",
    label: "Executive",
    description: "Key highlights, big fonts",
    preview: (
      <div className="w-full h-16 bg-gradient-to-b from-slate-800 to-slate-900 rounded border flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-orange-500 to-primary" />
        <div className="text-center">
          <div className="text-xl font-bold text-white">42</div>
          <div className="text-[6px] text-slate-400 uppercase tracking-wider">Key Metric</div>
        </div>
      </div>
    ),
  },
];

const StyleSelector = ({ value, onChange }: StyleSelectorProps) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {styles.map((style) => {
        const isSelected = value === style.id;

        return (
          <button
            key={style.id}
            onClick={() => onChange(style.id)}
            className={cn(
              "flex flex-col gap-2 p-3 rounded-lg border-2 transition-all text-left",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            {style.preview}
            <div>
              <span className="font-medium text-sm block">{style.label}</span>
              <span className="text-xs text-muted-foreground">{style.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default StyleSelector;
