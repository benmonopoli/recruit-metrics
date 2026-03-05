import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PipelineData {
  stage: string;
  count: number;
  color: string;
}

interface PipelineFunnelProps {
  data?: PipelineData[];
}

const defaultData: PipelineData[] = [
  { stage: "Applied", count: 847, color: "hsl(var(--chart-1))" },
  { stage: "Phone Screen", count: 423, color: "hsl(var(--chart-2))" },
  { stage: "Interview", count: 256, color: "hsl(var(--chart-3))" },
  { stage: "Final Round", count: 89, color: "hsl(var(--chart-4))" },
  { stage: "Offer", count: 34, color: "hsl(var(--chart-5))" },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-3 card-shadow">
        <p className="font-semibold text-foreground">{data.stage}</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-primary">{data.count}</span> candidates
        </p>
      </div>
    );
  }
  return null;
};

const PipelineFunnel = ({ data = defaultData }: PipelineFunnelProps) => {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="var(--border-color)"
            strokeOpacity={0.5}
          />
          <XAxis
            type="number"
            tick={{ fill: "var(--foreground-color)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="stage"
            tick={{ fill: "var(--foreground-color)", fontSize: 13, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
          <Bar
            dataKey="count"
            radius={[0, 6, 6, 0]}
            maxBarSize={40}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PipelineFunnel;
