import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GREENHOUSE_API_KEY = Deno.env.get('GREENHOUSE_API_KEY');
const GREENHOUSE_BASE_URL = 'https://harvest.greenhouse.io/v1';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// In-memory cache for ultra-fast responses within same instance
let memoryCache: { metrics: any; timestamp: number } | null = null;
let isRefreshing = false;

// Create Supabase client with service role for DB operations
function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// Get cached metrics from database
async function getDbCache(): Promise<{ metrics: any; fetched_at: string } | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('greenhouse_metrics_cache')
      .select('metrics, fetched_at')
      .eq('id', 'latest')
      .maybeSingle();
    
    if (error) {
      console.error('Error reading DB cache:', error);
      return null;
    }
    return data;
  } catch (e) {
    console.error('DB cache read failed:', e);
    return null;
  }
}

// Save metrics to database cache
async function saveDbCache(metrics: any): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('greenhouse_metrics_cache')
      .upsert({
        id: 'latest',
        metrics,
        fetched_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error saving DB cache:', error);
    } else {
      console.log('DB cache updated successfully');
    }
  } catch (e) {
    console.error('DB cache save failed:', e);
  }
}

// Check if cache is from today
function isCacheFromToday(fetchedAt: string | number): boolean {
  const cacheDate = new Date(fetchedAt);
  const today = new Date();
  return cacheDate.toDateString() === today.toDateString();
}

// Helper to make authenticated Greenhouse API requests
async function greenhouseRequest(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${GREENHOUSE_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  const credentials = btoa(`${GREENHOUSE_API_KEY}:`);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Greenhouse API error: ${response.status} - ${errorText}`);
    throw new Error(`Greenhouse API error: ${response.status}`);
  }

  return response.json();
}

// Helper to fetch all pages for endpoints that return arrays
async function greenhouseRequestAllPages<T = any>(
  endpoint: string,
  params: Record<string, string> = {},
  options: { perPage?: number; maxPages?: number } = {}
): Promise<T[]> {
  const perPage = options.perPage ?? 100;
  const maxPages = options.maxPages ?? 1000;

  const results: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const pageData = await greenhouseRequest(endpoint, {
      ...params,
      per_page: String(perPage),
      page: String(page),
    });

    if (!Array.isArray(pageData) || pageData.length === 0) break;

    results.push(...(pageData as T[]));

    if (pageData.length < perPage) break;
  }

  return results;
}

async function getJobs() {
  try {
    return await greenhouseRequestAllPages('/jobs');
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
}

async function getActiveApplications() {
  try {
    return await greenhouseRequestAllPages('/applications', { status: 'active' });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
}

async function getOffers() {
  try {
    return await greenhouseRequestAllPages('/offers');
  } catch (error) {
    console.error('Error fetching offers:', error);
    return [];
  }
}

function calculateHiresForYear(offers: any[], year: number) {
  return offers.filter((offer) => {
    const startDateStr = offer.start_date || offer.starts_at;
    if (!startDateStr) return false;

    const startDate = new Date(startDateStr);
    if (startDate.getFullYear() !== year) return false;

    return offer.status === 'accepted';
  }).length;
}

function getHiresByRole(offers: any[], jobs: any[], year: number) {
  const jobInfoMap: Record<number, { name: string; department: string }> = {};
  jobs.forEach(job => {
    jobInfoMap[job.id] = {
      name: job.name,
      department: job.departments?.[0]?.name || 'Uncategorized',
    };
  });

  const yearOffers = offers.filter((offer) => {
    const startDateStr = offer.start_date || offer.starts_at;
    if (!startDateStr) return false;
    const startDate = new Date(startDateStr);
    return startDate.getFullYear() === year && offer.status === 'accepted';
  });

  const roleCount: Record<number, { title: string; department: string; hires: number }> = {};
  
  yearOffers.forEach(offer => {
    const jobId = offer.job_id || offer.job?.id || offer.application?.jobs?.[0]?.id;
    if (!jobId) return;
    
    const jobInfo = jobInfoMap[jobId] || { name: 'Unknown Role', department: 'Uncategorized' };
    
    if (!roleCount[jobId]) {
      roleCount[jobId] = { title: jobInfo.name, department: jobInfo.department, hires: 0 };
    }
    roleCount[jobId].hires += 1;
  });

  return Object.values(roleCount).sort((a, b) => b.hires - a.hires);
}

function getOffersByDepartment(offers: any[], jobs: any[], year: number) {
  const jobDeptMap: Record<number, string> = {};
  jobs.forEach(job => {
    jobDeptMap[job.id] = job.departments?.[0]?.name || 'Uncategorized';
  });

  const ytdOffers = offers.filter((offer) => {
    const startDateStr = offer.start_date || offer.starts_at;
    if (!startDateStr) return false;
    const startDate = new Date(startDateStr);
    return startDate.getFullYear() === year && offer.status === 'accepted';
  });

  const deptCount: Record<string, number> = {};
  ytdOffers.forEach(offer => {
    const jobId = offer.job_id || offer.job?.id || offer.application?.jobs?.[0]?.id;
    const dept = jobDeptMap[jobId] || 'Uncategorized';
    deptCount[dept] = (deptCount[dept] || 0) + 1;
  });

  return Object.entries(deptCount)
    .map(([name, hires]) => ({ name, hires }))
    .sort((a, b) => b.hires - a.hires);
}

function getOpenRolesWithStages(jobs: any[], applications: any[]) {
  const openJobs = jobs.filter(job => job.status === 'open');

  return openJobs.map(job => {
    const jobApps = applications.filter(app => {
      if (app.status !== 'active') return false;
      if (Array.isArray(app.jobs)) {
        return app.jobs.some((j: any) => j?.id === job.id);
      }
      return false;
    });

    const stageCount: Record<string, number> = {};
    jobApps.forEach(app => {
      const stageName = app?.current_stage?.name || 'Unknown';
      stageCount[stageName] = (stageCount[stageName] || 0) + 1;
    });

    const stages = {
      applied: 0,
      phoneScreen: 0,
      interview: 0,
      finalRound: 0,
      offer: 0,
    };

    Object.entries(stageCount).forEach(([stage, count]) => {
      const lowerStage = stage.toLowerCase();
      
      if (lowerStage.includes('application review') || lowerStage.includes('application') || lowerStage.includes('applied') || lowerStage.includes('new')) {
        stages.applied += count;
      } else if (lowerStage.includes('recruiter screen') || lowerStage.includes('recruiter') || lowerStage.includes('phone')) {
        stages.phoneScreen += count;
      } else if (lowerStage.includes('department screen') || lowerStage.includes('department')) {
        stages.interview += count;
      } else if (lowerStage.includes('face to face') || lowerStage.includes('f2f') || lowerStage.includes('onsite') || lowerStage.includes('final')) {
        stages.finalRound += count;
      } else if (lowerStage.includes('background check') || lowerStage.includes('reference check')) {
        // Skip background/reference check stages — not part of the active pipeline funnel
      } else if (lowerStage.includes('offer')) {
        stages.offer += count;
      } else if (lowerStage.includes('interview') || lowerStage.includes('technical')) {
        stages.interview += count;
      } else if (lowerStage.includes('screen')) {
        stages.phoneScreen += count;
      } else {
        stages.applied += count;
      }
    });

    const totalApplicants = jobApps.length;

    return {
      id: job.id,
      title: job.name,
      department: job.departments?.[0]?.name || 'Uncategorized',
      totalApplicants,
      stages,
    };
  });
}

function getRolesByDepartment(openRoles: any[]) {
  const deptMap: Record<string, { count: number; totalApplicants: number }> = {};
  
  openRoles.forEach(role => {
    const dept = role.department;
    if (!deptMap[dept]) {
      deptMap[dept] = { count: 0, totalApplicants: 0 };
    }
    deptMap[dept].count += 1;
    deptMap[dept].totalApplicants += role.totalApplicants;
  });

  return Object.entries(deptMap)
    .map(([name, data]) => ({
      name,
      openRoles: data.count,
      totalApplicants: data.totalApplicants,
    }))
    .sort((a, b) => b.openRoles - a.openRoles);
}

function calculatePipelineMetrics(openRoles: any[]) {
  const totals = {
    applied: 0,
    phoneScreen: 0,
    interview: 0,
    finalRound: 0,
    offer: 0,
  };

  openRoles.forEach(role => {
    totals.applied += role.stages.applied;
    totals.phoneScreen += role.stages.phoneScreen;
    totals.interview += role.stages.interview;
    totals.finalRound += role.stages.finalRound;
    totals.offer += role.stages.offer;
  });

  return [
    { stage: 'Application Review', count: totals.applied, color: 'hsl(173, 58%, 39%)' },
    { stage: 'Recruiter Screen', count: totals.phoneScreen, color: 'hsl(199, 89%, 48%)' },
    { stage: 'Department Screen', count: totals.interview, color: 'hsl(262, 52%, 47%)' },
    { stage: 'Face to Face', count: totals.finalRound, color: 'hsl(38, 92%, 50%)' },
    { stage: 'Offer', count: totals.offer, color: 'hsl(152, 69%, 40%)' },
  ];
}

// Fetch fresh data from Greenhouse and build metrics
async function fetchFreshMetrics() {
  console.log('Fetching fresh Greenhouse data...');
  
  const [jobs, applications, offers] = await Promise.all([
    getJobs(),
    getActiveApplications(),
    getOffers(),
  ]);

  console.log(`Fetched: ${jobs.length} jobs, ${applications.length} active applications, ${offers.length} offers`);

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const hiresYTD = calculateHiresForYear(offers, currentYear);
  const hiresPreviousYear = calculateHiresForYear(offers, previousYear);
  const openRoles = getOpenRolesWithStages(jobs, applications);
  const totalOpenRoles = openRoles.length;
  const departmentBreakdown = getRolesByDepartment(openRoles);
  const offersByDepartment = getOffersByDepartment(offers, jobs, currentYear);
  const hiresYTDByRole = getHiresByRole(offers, jobs, currentYear);
  const hiresPreviousYearByRole = getHiresByRole(offers, jobs, previousYear);
  const pipeline = calculatePipelineMetrics(openRoles);
  const totalApplicants = openRoles.reduce((sum, role) => sum + role.totalApplicants, 0);

  return {
    hiresYTD,
    hiresPreviousYear,
    totalOpenRoles,
    totalApplicants,
    openRoles: openRoles.sort((a, b) => b.totalApplicants - a.totalApplicants),
    departmentBreakdown,
    offersByDepartment,
    hiresYTDByRole,
    hiresPreviousYearByRole,
    pipeline,
    currentYear,
    previousYear,
  };
}

// Background refresh - updates both memory and DB cache
async function refreshInBackground() {
  if (isRefreshing) {
    console.log('Background refresh already in progress, skipping');
    return;
  }
  
  isRefreshing = true;
  console.log('Starting background refresh...');
  
  try {
    const metrics = await fetchFreshMetrics();
    
    // Update memory cache
    memoryCache = { metrics, timestamp: Date.now() };
    
    // Update DB cache
    await saveDbCache(metrics);
    
    console.log('Background refresh complete');
  } catch (error) {
    console.error('Background refresh failed:', error);
  } finally {
    isRefreshing = false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GREENHOUSE_API_KEY) {
      console.error('GREENHOUSE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Greenhouse API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for force refresh in request body
    let forceRefresh = false;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        forceRefresh = body?.refresh === true;
      } catch {
        // Empty body - use cached data
      }
    }

    // PRIORITY 1: Memory cache (ultra-fast, same instance)
    if (!forceRefresh && memoryCache && isCacheFromToday(memoryCache.timestamp)) {
      console.log('Returning memory cache (instant)');
      return new Response(
        JSON.stringify(memoryCache.metrics),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Cache': 'MEMORY',
          } 
        }
      );
    }

    // PRIORITY 2: DB cache (fast, persists across cold starts)
    const dbCache = await getDbCache();
    
    if (!forceRefresh && dbCache && isCacheFromToday(dbCache.fetched_at)) {
      console.log('Returning DB cache (fast)');
      
      // Populate memory cache for future requests
      memoryCache = { metrics: dbCache.metrics, timestamp: new Date(dbCache.fetched_at).getTime() };
      
      return new Response(
        JSON.stringify(dbCache.metrics),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Cache': 'DATABASE',
          } 
        }
      );
    }

    // FORCE REFRESH: Return cached data immediately, refresh in background
    if (forceRefresh && (memoryCache || dbCache)) {
      console.log('Force refresh requested - returning cached data and refreshing in background');
      
      const cachedMetrics = memoryCache?.metrics || dbCache?.metrics;
      
      // Trigger background refresh (don't await)
      refreshInBackground();
      
      return new Response(
        JSON.stringify({ ...cachedMetrics, _refreshing: true }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Cache': 'CACHED_REFRESHING',
          } 
        }
      );
    }

    // PRIORITY 3: Fresh fetch (first of day or no cache available)
    console.log('First fetch of the day or no cache, getting fresh data...');
    
    const metrics = await fetchFreshMetrics();

    // Update both caches
    memoryCache = { metrics, timestamp: Date.now() };
    await saveDbCache(metrics);

    return new Response(
      JSON.stringify(metrics),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Cache': 'FRESH'
        } 
      }
    );
  } catch (error) {
    console.error('Error in greenhouse-metrics function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Fallback to any available cache on error
    if (memoryCache) {
      console.log('Returning memory cache as fallback after error');
      return new Response(
        JSON.stringify(memoryCache.metrics),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Cache': 'FALLBACK',
          } 
        }
      );
    }
    
    const dbCache = await getDbCache();
    if (dbCache) {
      console.log('Returning DB cache as fallback after error');
      return new Response(
        JSON.stringify(dbCache.metrics),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Cache': 'FALLBACK',
          } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
