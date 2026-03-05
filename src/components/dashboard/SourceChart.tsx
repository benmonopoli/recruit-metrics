import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface SourceData {
  name: string;
  value: number;
  color: string;
}

interface SourceChartProps {
  data?: SourceData[];
}

const defaultData: SourceData[] = [
  { name: "LinkedIn", value: 342, color: "hsl(173, 58%, 39%)" },
  { name: "Referrals", value: 218, color: "hsl(199, 89%, 48%)" },
  { name: "Indeed", value: 156, color: "hsl(262, 52%, 47%)" },
  { name: "Career Site", value: 89, color: "hsl(38, 92%, 50%)" },
  { name: "Other", value: 42, color: "hsl(215, 16%, 60%)" },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-3 card-shadow">
        <p className="font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-primary">{data.value}</span> candidates
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-4">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const SourceChart = ({ data = defaultData }: SourceChartProps) => {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SourceChart;
