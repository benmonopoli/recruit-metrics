# Recruit Metrics — Greenhouse Recruiting Dashboard

A real-time recruiting metrics dashboard that pulls live data from Greenhouse and presents it in a clean, actionable format. Built because Greenhouse's native reporting is painful.

## The problem

Greenhouse is a great ATS, but its built-in reporting has real limitations — custom reports are clunky to build, the UI buries key metrics across multiple views, and there's no quick way to get a live snapshot of pipeline health. Getting answers to basic questions like "how many open roles do we have across engineering?" or "how many hires have we made this year vs last?" requires too many clicks and too much manual effort.

Recruit Metrics solves this by pulling data directly from the Greenhouse Harvest API and presenting it as a fast, visual dashboard. It's intentionally simple to start — covering the core metrics most recruiting teams need daily — and is designed to be easily extended with additional pipeline, time-to-hire, source quality, and other custom metrics as your reporting needs grow.

## What it tracks

- **Hires YTD** vs previous year
- **Open roles** count and per-department breakdown
- **Pipeline funnel** — candidates by stage across all active roles
- **Offers by department**
- **Hiring trend** over time
- **Source breakdown** — where candidates are coming from
- **Open roles table** — per-role applicant counts and stage distribution
- **Activity feed** — recent pipeline movements

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (database cache, edge functions)
- **Integrations:** Greenhouse Harvest API

## How it works

A single Supabase Edge Function (`greenhouse-metrics`) fetches jobs, applications, and offers from the Greenhouse Harvest API, computes metrics server-side, and caches the result in Supabase. The frontend reads from cache for fast loads; a manual refresh triggers a background re-fetch. Cache is keyed to the current day.

Data can be exported from the dashboard in CSV or JSON format — useful for sharing metrics with leadership or pulling into a spreadsheet for ad hoc analysis.

## Getting started

### Prerequisites

- Node.js 18+ or Bun
- A Supabase project
- Greenhouse Harvest API key (Greenhouse → Configure → Dev Center → API Credential Management)

**Greenhouse API permissions required:** The Harvest API key needs read access to Jobs, Applications, Offers, and Users. A read-only key is sufficient — Recruit Metrics does not write to Greenhouse.

### Setup

```bash
# Clone the repo
git clone https://github.com/benmonopoli/recruit-metrics.git
cd recruit-metrics

# Install dependencies
npm install
# or
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start the dev server
npm run dev
```

### Environment variables

See `.env.example` for frontend variables. The Greenhouse API key is set as a Supabase Edge Function secret:

```bash
supabase secrets set GREENHOUSE_API_KEY=your-key
```

### Deploy Supabase function

```bash
supabase functions deploy greenhouse-metrics
```

### Run database migrations

```bash
supabase db push
```

## Project structure

```
src/
├── components/
│   ├── dashboard/    # Metric cards, charts, pipeline funnel, open roles table
│   ├── export/       # Data export modal and utilities
│   └── ui/           # shadcn/ui component library
├── hooks/            # Data fetching and dashboard settings hooks
├── integrations/     # Supabase client + types
├── lib/              # Utilities
└── pages/            # Route-level page components
supabase/
├── functions/
│   └── greenhouse-metrics/   # Fetches, computes, and caches all metrics
└── migrations/               # Database schema
```

## Extending it

The dashboard is designed to grow. Some natural next metrics to add:

- **Time to hire** — days from application to offer accepted, by role or department
- **Conversion rates** — stage-to-stage drop-off across the funnel
- **Interview-to-offer ratio** — signal on process efficiency
- **Source quality** — which sources produce the most hires vs just volume
- **Pipeline velocity** — how long candidates sit at each stage
- **Headcount plan tracking** — open roles vs hiring targets

The edge function computes everything from raw Greenhouse API responses, so adding a new metric is typically adding an aggregation function and wiring it to a chart component.

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Lint
```
