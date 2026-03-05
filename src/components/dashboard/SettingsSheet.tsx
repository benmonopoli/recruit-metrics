import { Moon, Sun, GripVertical, RotateCcw } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DashboardSection } from "@/hooks/useDashboardSettings";

interface SettingsSheetProps {
  children: React.ReactNode;
  sections: DashboardSection[];
  onToggleVisibility: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onReset: () => void;
}

const SettingsSheet = ({
  children,
  sections,
  onToggleVisibility,
  onReorder,
  onReset,
}: SettingsSheetProps) => {
  const { theme, setTheme } = useTheme();

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      onReorder(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < sections.length - 1) {
      onReorder(index, index + 1);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Dashboard Settings</SheetTitle>
          <SheetDescription>
            Customize your dashboard appearance and layout
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Theme Toggle */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Appearance</h4>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                )}
                <Label htmlFor="theme-toggle" className="cursor-pointer">
                  Dark mode
                </Label>
              </div>
              <Switch
                id="theme-toggle"
                checked={theme === "dark"}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
              />
            </div>
          </div>

          <Separator />

          {/* Section Visibility & Ordering */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">
                Dashboard Sections
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 gap-1.5 text-xs text-muted-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Toggle visibility and drag to reorder sections
            </p>

            <div className="space-y-2">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <GripVertical className="h-3 w-3 rotate-90" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === sections.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <GripVertical className="h-3 w-3 -rotate-90" />
                      </button>
                    </div>
                    <Label
                      htmlFor={`section-${section.id}`}
                      className="cursor-pointer text-sm"
                    >
                      {section.label}
                    </Label>
                  </div>
                  <Switch
                    id={`section-${section.id}`}
                    checked={section.visible}
                    onCheckedChange={() => onToggleVisibility(section.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
