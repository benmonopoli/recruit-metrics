import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon: LucideIcon;
  description?: string;
  className?: string;
  delay?: number;
}

const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  description,
  className,
  delay = 0,
}: MetricCardProps) => {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-6 card-shadow transition-all duration-300 hover:card-shadow-lg hover:border-primary/20",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-base font-medium text-muted-foreground">{title}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  change.type === "increase"
                    ? "text-success"
                    : "text-destructive"
                )}
              >
                {change.type === "increase" ? "+" : "-"}
                {Math.abs(change.value)}%
              </span>
              <span className="text-sm text-muted-foreground">vs last month</span>
            </div>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50 transition-colors group-hover:bg-primary/20">
          <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
      </div>
      
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
};

export default MetricCard;
