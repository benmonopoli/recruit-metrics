import { User, CheckCircle, Calendar, Mail, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: number;
  type: "application" | "interview" | "offer" | "rejection" | "hire";
  candidate: string;
  role: string;
  time: string;
}

interface ActivityFeedProps {
  data?: Activity[];
}

const defaultActivities: Activity[] = [
  {
    id: 1,
    type: "hire",
    candidate: "Sarah Chen",
    role: "Senior Engineer",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "interview",
    candidate: "Michael Torres",
    role: "Product Designer",
    time: "4 hours ago",
  },
  {
    id: 3,
    type: "offer",
    candidate: "Emily Rodriguez",
    role: "Data Analyst",
    time: "Yesterday",
  },
  {
    id: 4,
    type: "application",
    candidate: "James Wilson",
    role: "Marketing Manager",
    time: "Yesterday",
  },
  {
    id: 5,
    type: "hire",
    candidate: "Lisa Park",
    role: "Sales Rep",
    time: "2 days ago",
  },
];

const activityConfig = {
  application: {
    icon: User,
    color: "text-chart-2",
    bg: "bg-chart-2/10",
    label: "applied for",
  },
  interview: {
    icon: Calendar,
    color: "text-chart-3",
    bg: "bg-chart-3/10",
    label: "scheduled interview for",
  },
  offer: {
    icon: Mail,
    color: "text-warning",
    bg: "bg-warning/10",
    label: "received offer for",
  },
  hire: {
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success/10",
    label: "was hired as",
  },
  rejection: {
    icon: XCircle,
    color: "text-muted-foreground",
    bg: "bg-muted",
    label: "was rejected for",
  },
};

const ActivityFeed = ({ data = defaultActivities }: ActivityFeedProps) => {
  return (
    <div className="space-y-4">
      {data.map((activity, index) => {
        const config = activityConfig[activity.type];
        const Icon = config.icon;
        
        return (
          <div
            key={activity.id}
            className="flex items-start gap-4 animate-fade-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                config.bg
              )}
            >
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-foreground">
                <span className="font-medium">{activity.candidate}</span>{" "}
                <span className="text-muted-foreground">{config.label}</span>{" "}
                <span className="font-medium">{activity.role}</span>
              </p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
