import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendData {
  month: string;
  hires: number;
  applications: number;
}

interface HiringTrendProps {
  data?: TrendData[];
}

const defaultData: TrendData[] = [
  { month: "Jul", hires: 4, applications: 89 },
  { month: "Aug", hires: 6, applications: 112 },
  { month: "Sep", hires: 8, applications: 134 },
  { month: "Oct", hires: 5, applications: 98 },
  { month: "Nov", hires: 9, applications: 156 },
  { month: "Dec", hires: 7, applications: 142 },
  { month: "Jan", hires: 11, applications: 178 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-3 card-shadow">
        <p className="mb-2 font-semibold text-foreground">{label}</p>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Hires: <span className="font-medium text-primary">{payload[0]?.value}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Applications: <span className="font-medium text-chart-2">{payload[1]?.value}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const HiringTrend = ({ data = defaultData }: HiringTrendProps) => {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(173, 58%, 39%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(173, 58%, 39%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(214, 20%, 91%)"
          />
          <XAxis
            dataKey="month"
            tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="hires"
            stroke="hsl(173, 58%, 39%)"
            strokeWidth={2}
            fill="url(#colorHires)"
          />
          <Area
            type="monotone"
            dataKey="applications"
            stroke="hsl(199, 89%, 48%)"
            strokeWidth={2}
            fill="url(#colorApps)"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Hires</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-chart-2" />
          <span className="text-sm text-muted-foreground">Applications</span>
        </div>
      </div>
    </div>
  );
};

export default HiringTrend;
