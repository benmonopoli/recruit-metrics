import { useState } from "react";
import { LucideIcon, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { HireByRole, OpenRole } from "@/hooks/useGreenhouseMetrics";
import { Badge } from "@/components/ui/badge";

interface ExpandableMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
  delay?: number;
  hireDetails?: HireByRole[];
  roleDetails?: OpenRole[];
}

const ExpandableMetricCard = ({
  title,
  value,
  icon: Icon,
  description,
  className,
  delay = 0,
  hireDetails = [],
  roleDetails = [],
}: ExpandableMetricCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = hireDetails.length > 0 || roleDetails.length > 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card card-shadow transition-all duration-300 hover:card-shadow-lg hover:border-primary/20",
        hasDetails && "cursor-pointer",
        isExpanded && "sm:col-span-2 lg:col-span-2",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => hasDetails && setIsExpanded(!isExpanded)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-base font-medium text-muted-foreground">{title}</p>
            <p className="text-4xl font-bold tracking-tight text-foreground">
              {value}
            </p>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50 transition-colors group-hover:bg-primary/20">
              <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            {hasDetails && (
              <div className="text-muted-foreground">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable details section */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="border-t border-border px-6 py-4">
          <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {hireDetails.length > 0 ? "Breakdown by Role" : "Open Positions"}
          </p>
          <div className="grid gap-2 max-h-72 overflow-y-auto pr-2 sm:grid-cols-2">
            {hireDetails.length > 0 && hireDetails.map((role, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-sm font-medium text-foreground">
                    {role.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {role.department}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {role.hires} {role.hires === 1 ? "hire" : "hires"}
                </Badge>
              </div>
            ))}
            {roleDetails.length > 0 && roleDetails.map((role, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-sm font-medium text-foreground">
                    {role.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {role.department}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {role.totalApplicants} applicants
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
};

export default ExpandableMetricCard;
