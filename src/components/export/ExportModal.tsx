import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { GreenhouseMetrics, OpenRole } from "@/hooks/useGreenhouseMetrics";
import FormatSelector from "./FormatSelector";
import StyleSelector from "./StyleSelector";
import DataPicker from "./DataPicker";
import DepartmentFilter from "./DepartmentFilter";
import ExportPreview from "./ExportPreview";
import { exportToPDF, exportToPPTX, exportToPNG, exportToExcel } from "./exportUtils";
import { toast } from "sonner";

export type ExportFormat = "pdf" | "pptx" | "png" | "excel";
export type ExportStyle = "minimal" | "data-rich" | "executive";

export interface ExportSection {
  id: string;
  label: string;
  enabled: boolean;
}

interface ExportModalProps {
  data: GreenhouseMetrics;
}

const DEFAULT_SECTIONS: ExportSection[] = [
  { id: "summary", label: "Summary Metrics", enabled: true },
  { id: "pipeline", label: "Pipeline Funnel", enabled: true },
  { id: "departments", label: "Department Breakdown", enabled: true },
  { id: "hires", label: "Hires by Role", enabled: true },
  { id: "openRoles", label: "Open Roles Table", enabled: true },
];

const ExportModal = ({ data }: ExportModalProps) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [style, setStyle] = useState<ExportStyle>("minimal");
  const [sections, setSections] = useState<ExportSection[]>(DEFAULT_SECTIONS);
  const [isExporting, setIsExporting] = useState(false);
  const [reportName, setReportName] = useState("RecruitMetrics Report");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  // Extract unique department names from data
  const allDepartments = useMemo(() => {
    const depts = new Set<string>();
    data.departmentBreakdown.forEach((d) => depts.add(d.name));
    data.openRoles.forEach((r) => depts.add(r.department));
    data.offersByDepartment.forEach((o) => depts.add(o.name));
    return Array.from(depts).sort();
  }, [data]);

  // Filter data based on selected departments
  const filteredData = useMemo((): GreenhouseMetrics => {
    // If no specific departments selected, return all data
    if (selectedDepartments.length === 0) {
      return data;
    }

    const filteredOpenRoles = data.openRoles.filter((r) =>
      selectedDepartments.includes(r.department)
    );
    const filteredDepartmentBreakdown = data.departmentBreakdown.filter((d) =>
      selectedDepartments.includes(d.name)
    );
    const filteredOffersByDepartment = data.offersByDepartment.filter((o) =>
      selectedDepartments.includes(o.name)
    );
    const filteredHiresYTDByRole = data.hiresYTDByRole.filter((h) =>
      selectedDepartments.includes(h.department)
    );
    const filteredHiresPreviousYearByRole = data.hiresPreviousYearByRole.filter((h) =>
      selectedDepartments.includes(h.department)
    );

    // Recalculate totals based on filtered data
    const totalOpenRoles = filteredDepartmentBreakdown.reduce(
      (sum, d) => sum + d.openRoles,
      0
    );
    const totalApplicants = filteredOpenRoles.reduce(
      (sum, r) => sum + r.totalApplicants,
      0
    );
    const hiresYTD = filteredHiresYTDByRole.reduce((sum, h) => sum + h.hires, 0);
    const hiresPreviousYear = filteredHiresPreviousYearByRole.reduce(
      (sum, h) => sum + h.hires,
      0
    );

    // Recalculate pipeline for filtered roles
    // Map API stage names (e.g., "Application Review") to role.stages keys
    const stageNameToKey: Record<string, keyof OpenRole["stages"]> = {
      "applicationreview": "applied",
      "recruiterscreen": "phoneScreen",
      "departmentscreen": "interview",
      "facetoface": "finalRound",
      "offer": "offer",
    };

    const filteredPipeline = data.pipeline.map((stage) => {
      const normalizedStageName = stage.stage.toLowerCase().replace(/\s+/g, "");
      const stageKey = stageNameToKey[normalizedStageName];
      
      if (!stageKey) {
        return { ...stage, count: 0 };
      }
      
      const count = filteredOpenRoles.reduce((sum, role) => {
        return sum + (role.stages[stageKey] || 0);
      }, 0);
      return { ...stage, count };
    });

    return {
      ...data,
      openRoles: filteredOpenRoles,
      departmentBreakdown: filteredDepartmentBreakdown,
      offersByDepartment: filteredOffersByDepartment,
      hiresYTDByRole: filteredHiresYTDByRole,
      hiresPreviousYearByRole: filteredHiresPreviousYearByRole,
      pipeline: filteredPipeline,
      totalOpenRoles,
      totalApplicants,
      hiresYTD,
      hiresPreviousYear,
    };
  }, [data, selectedDepartments]);

  const handleToggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    setSections((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      return updated;
    });
  };

  const handleExport = async () => {
    const enabledSections = sections.filter((s) => s.enabled);
    if (enabledSections.length === 0) {
      toast.error("Please select at least one section to export");
      return;
    }

    setIsExporting(true);
    try {
      const exportData = {
        data: filteredData,
        sections: enabledSections,
        style,
        reportName: reportName.trim() || "RecruitMetrics Report",
        departmentFilter: selectedDepartments.length > 0 ? selectedDepartments : undefined,
      };

      switch (format) {
        case "pdf":
          await exportToPDF(exportData);
          break;
        case "pptx":
          await exportToPPTX(exportData);
          break;
        case "png":
          await exportToPNG(exportData);
          break;
        case "excel":
          await exportToExcel(exportData);
          break;
      }

      toast.success(`Exported successfully as ${format.toUpperCase()}`);
      setOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Dashboard</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6 py-4">
          {/* Left: Options */}
          <div className="space-y-6">
            {/* Report Name */}
            <div>
              <h3 className="text-sm font-medium mb-2">Report Name</h3>
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name..."
                className="bg-background"
              />
            </div>

            {/* Department Filter */}
            <div>
              <h3 className="text-sm font-medium mb-2">Filter by Department</h3>
              <DepartmentFilter
                departments={allDepartments}
                selected={selectedDepartments}
                onChange={setSelectedDepartments}
              />
            </div>

            {/* Format Selection */}
            <div>
              <h3 className="text-sm font-medium mb-3">Export Format</h3>
              <FormatSelector value={format} onChange={setFormat} />
            </div>

            {/* Style Selection (not for Excel) */}
            {format !== "excel" && (
              <div>
                <h3 className="text-sm font-medium mb-3">Slide Style</h3>
                <StyleSelector value={style} onChange={setStyle} />
              </div>
            )}

            {/* Data Picker */}
            <div>
              <h3 className="text-sm font-medium mb-3">
                Select Data (drag to reorder priority)
              </h3>
              <DataPicker
                sections={sections}
                onToggle={handleToggleSection}
                onReorder={handleReorder}
              />
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={isExporting || sections.filter((s) => s.enabled).length === 0}
              className="w-full"
            >
              {isExporting ? "Exporting..." : `Export as ${format.toUpperCase()}`}
            </Button>
          </div>

          {/* Right: Preview */}
          {format !== "excel" && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Preview</h3>
              <ExportPreview data={filteredData} sections={sections} style={style} />
              <p className="text-[10px] text-muted-foreground text-center">
                Live preview updates as you change options
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
