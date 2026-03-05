import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OpenRole {
  id: number;
  title: string;
  department: string;
  totalApplicants: number;
  stages: {
    applied: number;
    phoneScreen: number;
    interview: number;
    finalRound: number;
    offer: number;
  };
}

export interface DepartmentBreakdown {
  name: string;
  openRoles: number;
  totalApplicants: number;
}

export interface OfferByDepartment {
  name: string;
  hires: number;
}

export interface HireByRole {
  title: string;
  department: string;
  hires: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
  color: string;
}

export interface GreenhouseMetrics {
  hiresYTD: number;
  hiresPreviousYear: number;
  totalOpenRoles: number;
  totalApplicants: number;
  openRoles: OpenRole[];
  departmentBreakdown: DepartmentBreakdown[];
  offersByDepartment: OfferByDepartment[];
  hiresYTDByRole: HireByRole[];
  hiresPreviousYearByRole: HireByRole[];
  pipeline: PipelineStage[];
  currentYear: number;
  previousYear: number;
}

async function fetchGreenhouseMetrics(forceRefresh = false): Promise<GreenhouseMetrics> {
  const { data, error } = await supabase.functions.invoke("greenhouse-metrics", {
    body: forceRefresh ? { refresh: true } : {},
  });

  if (error) {
    console.error("Error fetching Greenhouse metrics:", error);
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    hiresYTD: data?.hiresYTD ?? 0,
    hiresPreviousYear: data?.hiresPreviousYear ?? 0,
    totalOpenRoles: data?.totalOpenRoles ?? 0,
    totalApplicants: data?.totalApplicants ?? 0,
    currentYear: data?.currentYear ?? new Date().getFullYear(),
    previousYear: data?.previousYear ?? new Date().getFullYear() - 1,
    openRoles: data?.openRoles ?? [],
    departmentBreakdown: data?.departmentBreakdown ?? [],
    offersByDepartment: data?.offersByDepartment ?? [],
    hiresYTDByRole: data?.hiresYTDByRole ?? [],
    hiresPreviousYearByRole: data?.hiresPreviousYearByRole ?? [],
    pipeline: data?.pipeline ?? [],
  };
}

export function useGreenhouseMetrics() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["greenhouse-metrics"],
    queryFn: () => fetchGreenhouseMetrics(false),
    // Cache locally for the session - server handles daily refresh logic
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  // Force refresh - triggers background refresh on server and refetches after delay
  const forceRefresh = async () => {
    // Trigger server-side background refresh
    await queryClient.fetchQuery({
      queryKey: ["greenhouse-metrics"],
      queryFn: () => fetchGreenhouseMetrics(true),
      staleTime: 0,
    });
    
    // Poll for fresh data after background refresh completes (~30s)
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["greenhouse-metrics"] });
    }, 35000);
  };

  return { ...query, forceRefresh };
}
