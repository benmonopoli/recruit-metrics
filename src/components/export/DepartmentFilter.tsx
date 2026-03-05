import { Check, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DepartmentFilterProps {
  departments: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const DepartmentFilter = ({ departments, selected, onChange }: DepartmentFilterProps) => {
  const allSelected = selected.length === 0 || selected.length === departments.length;

  const handleToggle = (dept: string) => {
    if (selected.includes(dept)) {
      onChange(selected.filter((d) => d !== dept));
    } else {
      onChange([...selected, dept]);
    }
  };

  const handleSelectAll = () => {
    onChange([]);
  };

  const displayText = allSelected
    ? "All Departments"
    : selected.length === 1
    ? selected[0]
    : `${selected.length} departments`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 bg-background">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-left truncate">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          {/* All option */}
          <button
            onClick={handleSelectAll}
            className={cn(
              "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors",
              allSelected
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
            )}
          >
            <div
              className={cn(
                "h-4 w-4 rounded border flex items-center justify-center",
                allSelected
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              )}
            >
              {allSelected && <Check className="h-3 w-3" />}
            </div>
            <span>All Departments</span>
          </button>

          <div className="h-px bg-border my-2" />

          {/* Individual departments */}
          {departments.map((dept) => {
            const isSelected = selected.includes(dept);
            return (
              <button
                key={dept}
                onClick={() => handleToggle(dept)}
                className={cn(
                  "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors",
                  isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded border flex items-center justify-center",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
                <span className="truncate">{dept}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DepartmentFilter;
