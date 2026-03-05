import { useState } from "react";
import { GreenhouseMetrics } from "@/hooks/useGreenhouseMetrics";
import { ExportSection, ExportStyle } from "./ExportModal";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportPreviewProps {
  data: GreenhouseMetrics;
  sections: ExportSection[];
  style: ExportStyle;
}

const ExportPreview = ({ data, sections, style }: ExportPreviewProps) => {
  const enabledSections = sections.filter((s) => s.enabled);
  const isSnapshot = style === "minimal";
  const [currentSlide, setCurrentSlide] = useState(0);

  // For snapshot, there's only 1 slide. For others, title + each section
  const totalSlides = isSnapshot ? 1 : 1 + enabledSections.length;

  const metrics = [
    { label: "Open", value: data.totalOpenRoles, color: "text-primary" },
    { label: "Apps", value: data.totalApplicants, color: "text-violet-500" },
    { label: "Hires", value: data.hiresYTD, color: "text-emerald-500" },
  ];

  if (enabledSections.length === 0) {
    return (
      <div className="space-y-2">
        <div className="aspect-[11/8.5] bg-muted/30 border rounded-lg flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Select sections to preview</p>
        </div>
      </div>
    );
  }

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  const isExecutive = style === "executive";

  // Render title slide
  const renderTitleSlide = () => (
    <div className={cn(
      "w-full h-full flex items-center justify-center relative overflow-hidden rounded-lg",
      isExecutive 
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        : "bg-gradient-to-br from-blue-800 to-blue-900"
    )}>
      {isExecutive ? (
        <>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-orange-500 to-primary" />
          <div className="text-center">
            <div className="text-lg font-bold text-white tracking-tight">RecruitMetrics</div>
            <div className="text-[7px] text-slate-400 uppercase tracking-widest mt-1">Executive Summary</div>
          </div>
        </>
      ) : (
        <>
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary/40" />
          <div className="absolute bottom-1 right-4 w-3 h-3 rounded-full bg-orange-500/60" />
          <div className="text-center">
            <div className="text-sm font-bold text-white">RecruitMetrics</div>
            <div className="text-[8px] text-blue-200">Analytics Report</div>
            <div className="text-[6px] text-blue-300 mt-1">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Render section slide
  const renderSectionSlide = (section: ExportSection) => {
    if (isExecutive) {
      return renderExecutiveSectionSlide(section);
    }
    return (
      <div className="w-full h-full bg-white rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-1 bg-primary" />
        <div className="flex flex-1">
          <div className="w-1 bg-orange-500" />
          <div className="flex-1 p-2">
            <div className="text-[10px] font-semibold text-foreground mb-1">{section.label}</div>
            <div className="h-px bg-border mb-2" />
            {renderSectionContent(section.id)}
          </div>
        </div>
      </div>
    );
  };

  // Executive style - big numbers, minimal detail
  const renderExecutiveSectionSlide = (section: ExportSection) => (
    <div className="w-full h-full bg-gradient-to-b from-slate-50 to-white rounded-lg overflow-hidden flex flex-col">
      <div className="h-0.5 bg-gradient-to-r from-primary via-orange-500 to-primary" />
      <div className="flex-1 flex flex-col items-center justify-center p-3">
        {renderExecutiveContent(section.id)}
      </div>
    </div>
  );

  const renderExecutiveContent = (sectionId: string) => {
    switch (sectionId) {
      case "summary":
        return (
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{data.totalOpenRoles}</div>
            <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Open Roles</div>
            <div className="flex gap-3 mt-2">
              <div className="text-center">
                <div className="text-lg font-bold text-violet-500">{data.totalApplicants}</div>
                <div className="text-[6px] text-muted-foreground">Applicants</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-500">{data.hiresYTD}</div>
                <div className="text-[6px] text-muted-foreground">Hires</div>
              </div>
            </div>
          </div>
        );
      case "pipeline":
        const totalInPipeline = data.pipeline[0]?.count || 0;
        return (
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{totalInPipeline.toLocaleString()}</div>
            <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Total in Pipeline</div>
            <div className="text-[6px] text-muted-foreground mt-1">{data.pipeline.length} stages tracked</div>
          </div>
        );
      case "departments":
        const topDept = data.departmentBreakdown[0];
        return (
          <div className="text-center">
            <div className="text-xl font-bold text-primary">{topDept?.name || "—"}</div>
            <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Most Active Department</div>
            <div className="flex gap-3 mt-2">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-500">{topDept?.openRoles || 0}</div>
                <div className="text-[6px] text-muted-foreground">Roles</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-violet-500">{topDept?.totalApplicants || 0}</div>
                <div className="text-[6px] text-muted-foreground">Apps</div>
              </div>
            </div>
          </div>
        );
      case "hires":
        return (
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-500">{data.hiresYTD}</div>
            <div className="text-[8px] text-muted-foreground uppercase tracking-wider">{data.currentYear} Hires</div>
            <div className="text-sm text-muted-foreground mt-1">vs {data.hiresPreviousYear} in {data.previousYear}</div>
          </div>
        );
      case "openRoles":
        return (
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{data.openRoles.length}</div>
            <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Active Positions</div>
            <div className="text-[6px] text-muted-foreground mt-1">{data.departmentBreakdown.length} departments hiring</div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case "summary":
        return (
          <div className="flex gap-1">
            {metrics.map((m, i) => (
              <div key={i} className="flex-1 bg-slate-50 rounded p-1 text-center">
                <div className={cn("text-[10px] font-bold", m.color)}>{m.value}</div>
                <div className="text-[5px] text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>
        );
      case "pipeline":
        return (
          <div className="space-y-1">
            {data.pipeline.slice(0, 4).map((stage, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="text-[5px] text-muted-foreground w-8 truncate">{stage.stage.split(" ")[0]}</div>
                <div className="flex-1 h-2 bg-slate-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded"
                    style={{ width: `${Math.max(10, (stage.count / Math.max(...data.pipeline.map(p => p.count))) * 100)}%` }}
                  />
                </div>
                <div className="text-[5px] font-medium w-4 text-right">{stage.count}</div>
              </div>
            ))}
          </div>
        );
      case "departments":
        return (
          <div className="grid grid-cols-2 gap-1">
            {data.departmentBreakdown.slice(0, 4).map((dept, i) => (
              <div key={i} className="bg-slate-50 rounded p-1">
                <div className="text-[5px] font-medium truncate">{dept.name}</div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[8px] font-bold text-primary">{dept.openRoles}</span>
                  <span className="text-[4px] text-muted-foreground">roles</span>
                </div>
              </div>
            ))}
          </div>
        );
      case "hires":
        return (
          <div className="flex gap-2">
            <div className="bg-primary text-white rounded p-1 text-center flex-1">
              <div className="text-[10px] font-bold">{data.hiresYTD}</div>
              <div className="text-[5px]">{data.currentYear}</div>
            </div>
            <div className="bg-slate-500 text-white rounded p-1 text-center flex-1">
              <div className="text-[10px] font-bold">{data.hiresPreviousYear}</div>
              <div className="text-[5px]">{data.previousYear}</div>
            </div>
          </div>
        );
      case "openRoles":
        return (
          <div>
            <div className="bg-primary h-2 rounded-t flex items-center px-1">
              <span className="text-[4px] text-white">Role</span>
            </div>
            {data.openRoles.slice(0, 3).map((role, i) => (
              <div key={i} className={cn("h-2 flex items-center px-1", i % 2 === 0 ? "bg-white" : "bg-slate-50")}>
                <span className="text-[4px] truncate">{role.title}</span>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  // Snapshot: Everything on one slide
  const renderSnapshotSlide = () => (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="h-3 bg-primary flex items-center px-2">
        <span className="text-[6px] text-white font-medium">RecruitMetrics Snapshot</span>
      </div>

      <div className="p-1.5 space-y-1.5 flex-1 overflow-hidden">
        {/* Summary row */}
        {enabledSections.find((s) => s.id === "summary") && (
          <div className="flex gap-1">
            {metrics.map((m, i) => (
              <div key={i} className="flex-1 bg-slate-50 rounded p-1">
                <div className={cn("text-[8px] font-bold", m.color)}>{m.value}</div>
                <div className="text-[4px] text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Two column layout */}
        <div className="flex gap-1.5">
          {enabledSections.find((s) => s.id === "pipeline") && (
            <div className="flex-1">
              <div className="text-[5px] font-medium mb-0.5">Pipeline</div>
              {data.pipeline.slice(0, 4).map((_, i) => (
                <div key={i} className="h-1.5 bg-slate-100 rounded mb-0.5 overflow-hidden">
                  <div className="h-full bg-primary/70 rounded" style={{ width: `${100 - i * 18}%` }} />
                </div>
              ))}
            </div>
          )}
          {enabledSections.find((s) => s.id === "departments") && (
            <div className="flex-1">
              <div className="text-[5px] font-medium mb-0.5">Depts</div>
              {data.departmentBreakdown.slice(0, 4).map((_, i) => (
                <div key={i} className="flex items-center gap-0.5 mb-0.5">
                  <div className="w-5 h-1.5 bg-slate-200 rounded" />
                  <div className="flex-1 h-1.5 bg-primary/30 rounded" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open roles table */}
        {enabledSections.find((s) => s.id === "openRoles") && (
          <div>
            <div className="text-[5px] font-medium mb-0.5">Roles</div>
            <div className="bg-primary h-1.5 rounded-t" />
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn("h-1.5", i % 2 === 0 ? "bg-white" : "bg-slate-50")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const getSlideLabel = () => {
    if (isSnapshot) return "Snapshot";
    if (currentSlide === 0) return "Title";
    return enabledSections[currentSlide - 1]?.label || "";
  };

  return (
    <div className="space-y-2">
      {/* Slide display */}
      <div className="aspect-[11/8.5] border rounded-lg overflow-hidden shadow-sm bg-slate-100">
        {isSnapshot ? (
          renderSnapshotSlide()
        ) : currentSlide === 0 ? (
          renderTitleSlide()
        ) : (
          renderSectionSlide(enabledSections[currentSlide - 1])
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={prevSlide}
          disabled={currentSlide === 0 || isSnapshot}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>

        <div className="text-center">
          <div className="text-[10px] font-medium">{getSlideLabel()}</div>
          <div className="text-[8px] text-muted-foreground">
            {isSnapshot ? "1 page" : `${currentSlide + 1} / ${totalSlides}`}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1 || isSnapshot}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Slide dots */}
      {!isSnapshot && totalSlides > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i === currentSlide ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportPreview;
