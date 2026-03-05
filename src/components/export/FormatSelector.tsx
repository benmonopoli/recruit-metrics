import { FileText, Image, Table, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExportFormat } from "./ExportModal";

interface FormatSelectorProps {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
}

const formats: { id: ExportFormat; label: string; icon: React.ElementType; description: string }[] = [
  { id: "pdf", label: "PDF", icon: FileText, description: "Universal document" },
  { id: "pptx", label: "PowerPoint", icon: Presentation, description: "Editable slides" },
  { id: "png", label: "PNG", icon: Image, description: "Image snapshot" },
  { id: "excel", label: "Excel", icon: Table, description: "Raw data" },
];

const FormatSelector = ({ value, onChange }: FormatSelectorProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {formats.map((format) => {
        const Icon = format.icon;
        const isSelected = value === format.id;

        return (
          <button
            key={format.id}
            onClick={() => onChange(format.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-6 w-6" />
            <span className="font-medium text-sm">{format.label}</span>
            <span className="text-xs text-muted-foreground">{format.description}</span>
          </button>
        );
      })}
    </div>
  );
};

export default FormatSelector;
