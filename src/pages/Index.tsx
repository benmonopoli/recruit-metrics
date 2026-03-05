import { useState, useMemo } from "react";
import { Briefcase, Users, UserCheck, CalendarCheck, RefreshCw, AlertCircle, Inbox } from "lucide-react";
import Header from "@/components/dashboard/Header";
import MetricCard from "@/components/dashboard/MetricCard";
import ExpandableMetricCard from "@/components/dashboard/ExpandableMetricCard";
import ChartCard from "@/components/dashboard/ChartCard";
import PipelineFunnel from "@/components/dashboard/PipelineFunnel";
import DepartmentChart from "@/components/dashboard/DepartmentChart";
import OffersByDeptChart from "@/components/dashboard/OffersByDeptChart";
import OpenRolesTable from "@/components/dashboard/OpenRolesTable";
import ExportModal from "@/components/export/ExportModal";
import { useGreenhouseMetrics } from "@/hooks/useGreenhouseMetrics";
import { useDashboardSettings } from "@/hooks/useDashboardSettings";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
const EmptyState = ({ message }: { message: string }) => (
  <div 
    role="status" 
    aria-live="polite"
    className="flex flex-col items-center justify-center py-12 text-center"
  >
    <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden="true" />
    <p className="text-muted-foreground">{message}</p>
  </div>
);

const Index = () => {
  const { data, isLoading, isError, error, forceRefresh, isFetching } = useGreenhouseMetrics();
  const [searchQuery, setSearchQuery] = useState("");
  const {
    sections,
    toggleVisibility,
    reorderSections,
    resetToDefaults,
    isSectionVisible,
  } = useDashboardSettings();

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredRoles = useMemo(() => {
    if (!data?.openRoles) return [];
    if (!debouncedSearchQuery.trim()) return data.openRoles;
    const query = debouncedSearchQuery.toLowerCase();
    return data.openRoles.filter(
      role =>
        role.title.toLowerCase().includes(query) ||
        role.department.toLowerCase().includes(query)
    );
  }, [data?.openRoles, debouncedSearchQuery]);

  const hasOpenRoles = filteredRoles.length > 0;
  const hasDepartments = data?.departmentBreakdown && data.departmentBreakdown.length > 0;
  const hasOffersByDept = data?.offersByDepartment && data.offersByDepartment.length > 0;
  const hasPipeline = data?.pipeline && data.pipeline.some(p => p.count > 0);

  // Build ordered sections for rendering
  const orderedSections = sections.filter((s) => s.visible);

  const renderMetrics = () => (
    <div 
      className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      aria-busy={isLoading}
      aria-label="Key metrics"
    >
      {isLoading ? (
        <>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" aria-hidden="true" />
          ))}
        </>
      ) : (
        <>
          <ExpandableMetricCard
            title={`Hires ${data?.previousYear ?? ''}`}
            value={data?.hiresPreviousYear ?? 0}
            icon={UserCheck}
            description="Click to see breakdown"
            className="animate-fade-up"
            delay={0}
            hireDetails={data?.hiresPreviousYearByRole ?? []}
          />
          <ExpandableMetricCard
            title={`Hires ${data?.currentYear ?? ''} YTD`}
            value={data?.hiresYTD ?? 0}
            icon={CalendarCheck}
            description="Click to see breakdown"
            className="animate-fade-up"
            delay={100}
            hireDetails={data?.hiresYTDByRole ?? []}
          />
          <ExpandableMetricCard
            title="Open Roles"
            value={data?.totalOpenRoles ?? 0}
            icon={Briefcase}
            description="Click to see breakdown"
            className="animate-fade-up"
            delay={200}
            roleDetails={data?.openRoles ?? []}
          />
          <MetricCard
            title="Active Applicants"
            value={data?.totalApplicants ?? 0}
            icon={Users}
            description="Across all open roles"
            className="animate-fade-up"
            delay={300}
          />
        </>
      )}
    </div>
  );

  const renderPipeline = () => (
    <ChartCard
      title="Pipeline Overview"
      description="Total candidates at each stage across all roles"
      className="animate-fade-up"
    >
      {isLoading ? (
        <Skeleton className="h-[280px]" />
      ) : hasPipeline ? (
        <PipelineFunnel data={data?.pipeline} />
      ) : (
        <EmptyState message="No candidates in pipeline" />
      )}
    </ChartCard>
  );

  const renderDepartments = () => (
    <ChartCard
      title="Roles by Department"
      description="Open positions per department"
      className="animate-fade-up"
    >
      {isLoading ? (
        <Skeleton className="h-[340px]" />
      ) : hasDepartments ? (
        <DepartmentChart data={data?.departmentBreakdown} />
      ) : (
        <EmptyState message="No department data available" />
      )}
    </ChartCard>
  );

  const renderHires = () => (
    <div className="mb-8">
      <ChartCard
        title={`Hires by Department ${data?.currentYear ?? ''} YTD`}
        description="Accepted offers grouped by department"
        className="animate-fade-up"
      >
        {isLoading ? (
          <Skeleton className="h-[280px]" />
        ) : hasOffersByDept ? (
          <OffersByDeptChart data={data?.offersByDepartment} year={data?.currentYear} />
        ) : (
          <EmptyState message="No hires recorded this year" />
        )}
      </ChartCard>
    </div>
  );

  const renderOpenRoles = () => (
    <div className="mb-8">
      <ChartCard
        title="Open Roles Breakdown"
        description={debouncedSearchQuery ? `Filtered results for "${debouncedSearchQuery}"` : "Applicants per role with stage distribution"}
        className="animate-fade-up"
      >
        {isLoading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading open roles">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" aria-hidden="true" />
            ))}
          </div>
        ) : hasOpenRoles ? (
          <OpenRolesTable data={filteredRoles} />
        ) : (
          <EmptyState message={debouncedSearchQuery ? "No roles match your search" : "No open roles found in Greenhouse"} />
        )}
      </ChartCard>
    </div>
  );

  // Render sections, keeping pipeline and departments side by side
  const renderSections = () => {
    const result: React.ReactNode[] = [];
    const sectionIds = orderedSections.map((s) => s.id);
    const processed = new Set<string>();

    for (const section of orderedSections) {
      if (processed.has(section.id)) continue;

      if (section.id === "metrics") {
        result.push(<div key="metrics">{renderMetrics()}</div>);
        processed.add("metrics");
      } else if (section.id === "pipeline" || section.id === "departments") {
        // Check if both pipeline and departments are visible and adjacent
        const pipelineIdx = sectionIds.indexOf("pipeline");
        const deptIdx = sectionIds.indexOf("departments");
        const bothVisible = pipelineIdx !== -1 && deptIdx !== -1;
        const areAdjacent = bothVisible && Math.abs(pipelineIdx - deptIdx) === 1;

        if (areAdjacent && !processed.has("pipeline") && !processed.has("departments")) {
          // Render them side by side in order
          result.push(
            <div key="charts-row" className="mb-8 grid gap-6 lg:grid-cols-2">
              {pipelineIdx < deptIdx ? (
                <>
                  {renderPipeline()}
                  {renderDepartments()}
                </>
              ) : (
                <>
                  {renderDepartments()}
                  {renderPipeline()}
                </>
              )}
            </div>
          );
          processed.add("pipeline");
          processed.add("departments");
        } else {
          // Render individually
          if (section.id === "pipeline") {
            result.push(<div key="pipeline" className="mb-8">{renderPipeline()}</div>);
            processed.add("pipeline");
          } else {
            result.push(<div key="departments" className="mb-8">{renderDepartments()}</div>);
            processed.add("departments");
          }
        }
      } else if (section.id === "hires") {
        result.push(<div key="hires">{renderHires()}</div>);
        processed.add("hires");
      } else if (section.id === "openRoles") {
        result.push(<div key="openRoles">{renderOpenRoles()}</div>);
        processed.add("openRoles");
      }
    }

    return result;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sections={sections}
        onToggleVisibility={toggleVisibility}
        onReorder={reorderSections}
        onResetSettings={resetToDefaults}
      />
      
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-start justify-between animate-fade-up">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Recruiting Dashboard
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Hiring metrics and open role pipeline overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            {data && <ExportModal data={data} />}
            <Button
              variant="outline"
              size="sm"
              onClick={forceRefresh}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {isError && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="text-foreground">
              Unable to connect to Greenhouse: {error?.message || 'Unknown error'}
            </span>
          </div>
        )}

        {/* Render sections in order */}
        {renderSections()}
      </main>
    </div>
  );
};

export default Index;
