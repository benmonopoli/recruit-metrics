import { Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SettingsSheet from "./SettingsSheet";
import { DashboardSection } from "@/hooks/useDashboardSettings";
import rmLogo from "@/assets/rm-logo.png";

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  sections: DashboardSection[];
  onToggleVisibility: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onResetSettings: () => void;
}

const Header = ({
  searchQuery = "",
  onSearchChange,
  sections,
  onToggleVisibility,
  onReorder,
  onResetSettings,
}: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img src={rmLogo} alt="RecruitMetrics logo" className="h-9 w-9 rounded-lg" />
          <span className="text-xl font-semibold text-foreground">RecruitMetrics</span>
        </div>

        <div className="hidden md:flex md:flex-1 md:justify-center md:px-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="h-10 w-full pl-10 bg-muted/50 border-transparent focus:border-primary focus:bg-card"
            />
          </div>
        </div>

        <SettingsSheet
          sections={sections}
          onToggleVisibility={onToggleVisibility}
          onReorder={onReorder}
          onReset={onResetSettings}
        >
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Button>
        </SettingsSheet>
      </div>
    </header>
  );
};

export default Header;
