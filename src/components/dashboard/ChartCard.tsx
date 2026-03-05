import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

const ChartCard = ({
  title,
  description,
  children,
  className,
  action,
}: ChartCardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 card-shadow",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-1 text-base text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
};

export default ChartCard;
