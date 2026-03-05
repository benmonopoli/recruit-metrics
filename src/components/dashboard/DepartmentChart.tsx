import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DepartmentData {
  name: string;
  openRoles: number;
  totalApplicants: number;
}

interface DepartmentChartProps {
  data?: DepartmentData[];
}

const defaultData: DepartmentData[] = [
  { name: "Engineering", openRoles: 8, totalApplicants: 312 },
  { name: "Sales", openRoles: 5, totalApplicants: 178 },
  { name: "Marketing", openRoles: 4, totalApplicants: 145 },
  { name: "Design", openRoles: 3, totalApplicants: 112 },
  { name: "Data", openRoles: 2, totalApplicants: 67 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-3 card-shadow">
        <p className="mb-2 font-semibold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">
          Open Roles: <span className="font-medium text-primary">{payload[0]?.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const DepartmentChart = ({ data = defaultData }: DepartmentChartProps) => {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border-color)"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--foreground-color)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: "var(--foreground-color)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
          <Bar
            dataKey="openRoles"
            fill="var(--primary-color)"
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-2 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-primary" />
          <span className="text-sm text-foreground">Open Roles</span>
        </div>
      </div>
    </div>
  );
};

export default DepartmentChart;
