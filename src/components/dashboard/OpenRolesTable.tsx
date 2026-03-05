import { useState, useMemo } from "react";
import { OpenRole } from "@/hooks/useGreenhouseMetrics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface OpenRolesTableProps {
  data?: OpenRole[];
}

type SortKey = "title" | "department" | "totalApplicants" | "applied" | "phoneScreen" | "interview" | "finalRound" | "offer";
type SortDirection = "asc" | "desc";

const defaultData: OpenRole[] = [
  {
    id: 1,
    title: "Senior Software Engineer",
    department: "Engineering",
    totalApplicants: 156,
    stages: { applied: 89, phoneScreen: 34, interview: 22, finalRound: 8, offer: 3 },
  },
  {
    id: 2,
    title: "Product Designer",
    department: "Design",
    totalApplicants: 98,
    stages: { applied: 52, phoneScreen: 24, interview: 15, finalRound: 5, offer: 2 },
  },
];

const stageBadgeStyles = {
  applied: "bg-primary/25 text-foreground hover:bg-primary/35",
  phoneScreen: "bg-chart-2/25 text-foreground hover:bg-chart-2/35",
  interview: "bg-chart-3/25 text-foreground hover:bg-chart-3/35",
  finalRound: "bg-warning/25 text-foreground hover:bg-warning/35",
  offer: "bg-success/25 text-foreground hover:bg-success/35",
};

const OpenRolesTable = ({ data = defaultData }: OpenRolesTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortKey === "title" || sortKey === "department") {
        aValue = a[sortKey].toLowerCase();
        bValue = b[sortKey].toLowerCase();
      } else if (sortKey === "totalApplicants") {
        aValue = a.totalApplicants;
        bValue = b.totalApplicants;
      } else {
        aValue = a.stages[sortKey];
        bValue = b.stages[sortKey];
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDirection]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  };

  const SortableHeader = ({ columnKey, children, className = "" }: { columnKey: SortKey; children: React.ReactNode; className?: string }) => (
    <TableHead 
      className={`font-semibold cursor-pointer hover:bg-muted/50 transition-colors select-none ${className}`}
      onClick={() => handleSort(columnKey)}
    >
      <div className="flex items-center justify-center gap-0.5">
        {children}
        <SortIcon columnKey={columnKey} />
      </div>
    </TableHead>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead 
              className="font-semibold cursor-pointer hover:bg-muted/50 transition-colors select-none"
              onClick={() => handleSort("title")}
            >
              <div className="flex items-center gap-0.5">
                Role
                <SortIcon columnKey="title" />
              </div>
            </TableHead>
            <TableHead 
              className="font-semibold cursor-pointer hover:bg-muted/50 transition-colors select-none"
              onClick={() => handleSort("department")}
            >
              <div className="flex items-center gap-0.5">
                Department
                <SortIcon columnKey="department" />
              </div>
            </TableHead>
            <SortableHeader columnKey="totalApplicants" className="text-center">Total</SortableHeader>
            <SortableHeader columnKey="applied" className="text-center">Application Review</SortableHeader>
            <SortableHeader columnKey="phoneScreen" className="text-center">Recruiter Screen</SortableHeader>
            <SortableHeader columnKey="interview" className="text-center">Department Screen</SortableHeader>
            <SortableHeader columnKey="finalRound" className="text-center">Face to Face</SortableHeader>
            <SortableHeader columnKey="offer" className="text-center">Offer</SortableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((role, index) => (
            <TableRow
              key={role.id}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TableCell className="font-medium">{role.title}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-normal border-foreground/30 text-foreground">
                  {role.department}
                </Badge>
              </TableCell>
              <TableCell className="text-center font-semibold">
                {role.totalApplicants}
              </TableCell>
              <TableCell className="text-center">
                <Badge className={stageBadgeStyles.applied}>
                  {role.stages.applied}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge className={stageBadgeStyles.phoneScreen}>
                  {role.stages.phoneScreen}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge className={stageBadgeStyles.interview}>
                  {role.stages.interview}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge className={stageBadgeStyles.finalRound}>
                  {role.stages.finalRound}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge className={stageBadgeStyles.offer}>
                  {role.stages.offer}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OpenRolesTable;
