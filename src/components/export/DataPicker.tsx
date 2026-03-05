import { useState } from "react";
import { GripVertical, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExportSection } from "./ExportModal";

interface DataPickerProps {
  sections: ExportSection[];
  onToggle: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

const DataPicker = ({ sections, onToggle, onReorder }: DataPickerProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-2">
      {sections.map((section, index) => (
        <div
          key={section.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border bg-card cursor-move transition-all",
            draggedIndex === index && "opacity-50 scale-95",
            dragOverIndex === index && draggedIndex !== index && "border-primary border-2",
            section.enabled ? "border-border" : "border-border/50 bg-muted/30"
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          
          <button
            onClick={() => onToggle(section.id)}
            className={cn(
              "h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
              section.enabled
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30 hover:border-primary"
            )}
          >
            {section.enabled && <Check className="h-3 w-3" />}
          </button>

          <span
            className={cn(
              "flex-1 text-sm",
              section.enabled ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {section.label}
          </span>

          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            #{index + 1}
          </span>
        </div>
      ))}
    </div>
  );
};

export default DataPicker;
