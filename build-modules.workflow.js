export const meta = {
  name: 'police-twin-modules',
  description: 'Build remaining POLICE TWIN AI modules (Copilot, Risk, Predictive, Emergency, Dashboard) + backend + docs on the verified foundation',
  phases: [
    { title: 'Build', detail: 'One agent per module / backend / docs' },
    { title: 'Verify', detail: 'Cross-check imports, client/server boundaries, contract adherence; fix in place' },
  ],
};

const ROOT = 'C:/Users/Hossa/.claude/projects/Dubai Police';
const FE = `${ROOT}/frontend`;

const CONTRACT = `
# POLICE TWIN AI — FOUNDATION API CONTRACT (already built & type-checks clean)

You are extending an existing Next.js 14 (App Router) + TypeScript + TailwindCSS app located at:
${FE}
Project root (your cwd): ${ROOT}
Path alias: "@/*" -> the frontend/ root. So "@/components/ui" = ${FE}/components/ui.

When using the Write tool, ALWAYS pass ABSOLUTE paths with forward slashes, e.g.
  ${FE}/app/copilot/page.tsx

## VISUAL LANGUAGE (match the existing Command Center at ${FE}/app/page.tsx — READ IT FIRST)
Premium dark "command center" with glassmorphism. Deep navy/black background (already global).
Tailwind tokens available:
- Colors: ink.{950,900,850,800,750,700,600,500} (dark surfaces), command.{50..900} (cyan accent),
  cognition.{300,400,500,600} (violet = AI), risk.{low,guarded,elevated,high,severe,critical},
  status.{ok,warn,crit,offline,info}. Standard tailwind colors (slate, emerald, amber, orange, red) also fine.
- Utility classes (in globals.css): .glass, .glass-strong, .glass-hover, .sheen, .chip, .data-num
  (mono tabular numbers), .section-label (uppercase tracking label), .focus-ring, .scanlines.
- Shadows: shadow-glow (cyan), shadow-glow-violet, shadow-glow-red.
- Animations: animate-pulse-ring, animate-float-slow, animate-fade-in-up, animate-shimmer.
- Fonts: numbers/metrics should use the .data-num class (JetBrains mono). Body uses Inter (default).
Keep it elegant and information-dense but not cluttered. Generous rounded-2xl glass cards, subtle borders (border-white/[0.06]), soft glows on accents.

## SHARED UI COMPONENTS  — import { ... } from '@/components/ui'
- GlassCard: props { children, className?, glow?: 'none'|'command'|'violet'|'red', hover?: boolean, sheen?: boolean, padded?: boolean }
- KpiCard (client): { icon: ReactNode, label, value: number, decimals?, prefix?, suffix?, accent?: 'command'|'violet'|'emerald'|'amber'|'orange'|'red'|'slate', delta?: { value:number, direction:'up'|'down'|'flat', positiveIsGood?:boolean, label?:string }, footer?: ReactNode, valueText?: string (overrides numeric), index?: number (stagger) }
- RiskGauge (client): { score:number, category: RiskCategory, size?:number, label?:string } — animated 270° gauge.
- HealthBar (client): { value:number (0-100), max?:number, color?:string (hex), height?:number, delay?:number, className? } — animated bar.
- Sparkline (client): { data: TrendPoint[], color?:string, height?:number }
- AnimatedNumber (client): { value:number, decimals?, prefix?, suffix?, duration?, className? }
- Pill, SeverityBadge ({ severity: Severity }), StatusBadge ({ status: AssetStatus }), LiveBadge ({ label? })
- PageHeader: { eyebrow?, title, subtitle?, actions?: ReactNode, icon?: ReactNode }
- SectionTitle: { title, hint?, right?: ReactNode, className? }
- FadeIn (client): { children, className?, delay?, y? }
- Stagger / StaggerItem (client): stagger container + items
- Stat: { label, value: ReactNode, className? }

## CHARTS — import { ... } from '@/components/charts'  (ALL are client components)
- TrendAreaChart: { data:any[], xKey:string, series:{key,label,color}[], height?, stacked?, unit?, valueFormatter?:(n)=>string, showGrid?, xInterval? }
- TrendLineChart: { data:any[], xKey, series:{key,label,color}[], height?, unit?, valueFormatter?, yDomain?:[number|'auto',number|'auto'] }
- CategoryBarChart: { data:any[], xKey, barKey, barLabel, color?, colorByValue?:(n)=>string, height?, unit?, layout?:'horizontal'|'vertical', valueFormatter? }
- DonutChart: { data:{name,value,color}[], height?, centerLabel?, centerValue?, unit?, valueFormatter? }
- CustomTooltip (used internally)

## PANEL — import { AlarmFeed } from '@/components/panels/AlarmFeed'
- AlarmFeed: { alarms: Alarm[], limit?: number, className? }  (server-renderable)

## UTILS — import { ... } from '@/lib/utils'
cn(...classes), formatNumber(n,dp?), formatKwh(n), formatCurrency(n), relativeTime(iso), formatTime(iso), formatDate(iso),
isoMinusHours(h), isoPlusDays(d), isoMinusDays(d), NOW (Date), NOW_ISO (string), round(n,dp?), clamp(n,min,max),
severityMeta[severity]->{label,text,bg,border,dot}, assetStatusMeta[status]->{label,text,bg,border,dot,hex},
riskCategoryMeta(category)->{hex,text,glow}, riskCategoryFromScore(score)->RiskCategory, healthColor(pct)->hex,
seededRandom(seed).
NEVER call Math.random() or Date.now() or argless new Date() at module scope or render (SSR hydration). Use NOW/NOW_ISO.

## TYPES — import type { ... } from '@/lib/types'
Severity ('critical'|'high'|'medium'|'low'), AssetStatus ('operational'|'warning'|'critical'|'offline'),
AssetCategory ('HVAC'|'UPS'|'Electrical'|'FireSystem'|'Camera'|'AccessControl'|'Sensor'|'Network'),
AlarmType, AlarmStatus, RiskCategory ('Low'|'Guarded'|'Elevated'|'High'|'Severe'), RiskDomain ('security'|'energy'|'equipment'|'occupancy'),
Building, Floor (id,buildingId,level,name,areaSqm,capacity,zones:Zone[]), Zone (id,floorId,name,type,critical),
Asset (id,tag,name,category,floorId,zoneId,position{x,y,z},status,healthPct,manufacturer,model,installDate,lastServiceDate,predictedFailureDays:number|null,failureProbability,mtbfDays,recommendation:string|null,telemetry:Record<string,number|string>),
Alarm (id,type,severity,title,message,assetId:string|null,floorId,zoneId:string|null,status,timestamp,source,acknowledgedBy?),
MaintenanceEvent (id,assetId,assetName,kind:'predictive'|'preventive'|'corrective',status:'scheduled'|'in_progress'|'completed'|'overdue',priority:Severity,title,description,scheduledDate,technician:string|null,estimatedHours,costEstimate),
RiskFactor (domain,label,score,weight,contribution,trend:'up'|'down'|'flat',detail,signals:string[]),
RiskRecommendation (id,priority:Severity,domain,action,rationale,impact:string),
RiskAssessment (score,category,trendDelta,generatedAt,summary,factors:RiskFactor[],recommendations:RiskRecommendation[],confidence),
PredictiveInsight (assetId,assetTag,assetName,category,floorName,healthPct,status,predictedFailureDays:number|null,failureProbability,recommendation,driverSignals:string[],estimatedDowntimeHours,costAvoided),
CopilotResponse (intent,answer:string,bullets:string[],citations:{label,value}[],followUps:string[]),
EmergencyScenario (id,type:'fire'|'power_outage'|'unauthorized_access'|'equipment_failure',name,severity,description,triggerNarrative,impactedZones:{zoneId,zoneName,floorName,impact:'severe'|'major'|'moderate'|'minor'}[],responsePlan:{order,actor,action,etaMinutes,automated:boolean}[],estimatedRecoveryMinutes,affectedAssets,affectedOccupants,cascadeRisks:string[]),
TrendPoint ({date,value}), MultiTrendPoint ({label, [series]:number}), KpiSummary, EnergyReading, OccupancyReading, OccupancyZonePoint, EnergyBreakdown.

## DATA — import from these modules
'@/lib/data/facility': building, floors (Floor[], 6 floors level -1..4), allZones, floorById(id), floorName(id), zoneById(id), zoneName(id), FOOTPRINT, floorY(level).
'@/lib/data/assets': assets (Asset[], ~48), assetById(id), assetsByFloor(id), assetsByCategory(cat), assetCategoryLabels (Record<AssetCategory,string>), assetCounts { total, online, warning, critical, offline, byCategory: Record<AssetCategory,number> }.
'@/lib/data/alarms': alarms (Alarm[], 13), activeAlarms, criticalAlarms, alarmsByType()-> {type,count,active}[].
'@/lib/data/telemetry': energyReadings (24 hourly: {timestamp:'HH:00',kwh,hvacKwh,lightingKwh,itKwh,baseline}), currentPowerKw, energyTodayKwh, energyBaselineToday, energyDeltaPct, energyBreakdown ({category,kwh,pctOfTotal}[]), occupancyByFloor (OccupancyReading[]: {floorId,timestamp,count,capacity}), occupancyTotal, occupancyCapacity, occupancyPct, occupancyZonePoints (OccupancyZonePoint[]: {zoneId,zoneName,count,capacity,anomaly}), occupancyHourly (TrendPoint[24]), riskTrend/alarmTrend/energyTrend/assetHealthTrend (TrendPoint[30]), trendOverview (MultiTrendPoint[30]: {label,risk,alarms,energyMWh,health}).
'@/lib/data/maintenance': maintenanceEvents (MaintenanceEvent[]), openMaintenance, overdueMaintenance.
'@/lib/data/emergency': emergencyScenarios (EmergencyScenario[4]), scenarioById(id).
'@/lib/ai': riskAssessment (RiskAssessment, current score ~64 'High'), computeRiskAssessment(), predictiveInsights (PredictiveInsight[]), predictiveSummary { atRisk, critical, within7Days, avgHealth, totalCostAvoided }, copilotRespond(query:string)->CopilotResponse, suggestedQuestions (string[6]), kpiSummary (KpiSummary), buildKpiSummary().
'@/lib/nav': navItems (NavItem[] with {href,label,short,icon:LucideIcon,description,module}).

## RULES
- Page files: app/<route>/page.tsx with a default-exported React component. Use a PageHeader at the top with eyebrow "Module 0X · <Name>".
- Add 'use client' at the very top of ANY file that: uses useState/useEffect/other hooks, framer-motion, recharts, onClick/onChange handlers, or browser APIs. KpiCard/RiskGauge/HealthBar/charts are already client; a server page may render them as children fine, but a page needing its own state must be (or delegate to) a client component.
- Do NOT modify any existing/shared file (anything under lib/, components/ui/, components/charts/, components/panels/, components/layout/, app/layout.tsx, app/globals.css, app/page.tsx, app/digital-twin/, tailwind/ts configs). Only CREATE the files assigned to you.
- Deterministic only. No Math.random()/Date.now() at module/render scope.
- Icons from 'lucide-react'. Animations from 'framer-motion'.
- Make it genuinely polished and executive-grade: thoughtful spacing, hierarchy, micro-interactions, empty states, hover states. Avoid lorem ipsum — use the real data.
- Your returned text is consumed by an orchestrator, not a human. Return ONLY the structured object.
`;

const OUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    files: { type: 'array', items: { type: 'string' }, description: 'Absolute paths of files created' },
    clientComponents: { type: 'array', items: { type: 'string' }, description: 'Files that begin with "use client"' },
    summary: { type: 'string', description: 'One-paragraph summary of what was built' },
  },
  required: ['files', 'clientComponents', 'summary'],
};

const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    checked: { type: 'array', items: { type: 'string' } },
    issuesFound: { type: 'array', items: { type: 'string' } },
    fixesApplied: { type: 'array', items: { type: 'string' } },
    status: { type: 'string', enum: ['clean', 'fixed', 'needs-attention'] },
  },
  required: ['checked', 'issuesFound', 'fixesApplied', 'status'],
};

const items = [
  {
    id: 'copilot',
    label: 'Module 3 · AI Copilot',
    build: `${CONTRACT}

# YOUR TASK — Module 3: AI Facility Copilot
Create a premium conversational AI assistant page.

Files to CREATE:
1. ${FE}/components/copilot/CopilotChat.tsx  ('use client')
2. ${FE}/app/copilot/page.tsx  (server component that renders <CopilotChat/> plus PageHeader and a right-hand "live context" rail)

Requirements for CopilotChat (client):
- Chat thread UI: alternating user + assistant messages in chat bubbles. Assistant messages use a violet/cognition AI avatar (Bot icon), user messages a neutral avatar.
- Use copilotRespond(query) from '@/lib/ai' to generate responses. Render the response: answer (string with **bold** markdown — implement a small renderRich() that splits on ** and wraps odd segments in <strong className="font-semibold text-white">), bullets (list with subtle markers, also rich-rendered), citations (small chips row: label + value using .chip), followUps (clickable suggestion chips that submit that question).
- Suggested questions: on first load show an assistant welcome message + the suggestedQuestions (from '@/lib/ai') as clickable chips.
- Input: a text box pinned at the bottom with a send button (Send icon). Enter submits. Clear input after send.
- Simulated "thinking": when a query is submitted, push the user message, show an animated typing indicator (three pulsing dots) for ~600-900ms via setTimeout, then push the assistant response. Use framer-motion for message entrance animations (AnimatePresence + motion.div).
- Auto-scroll to the newest message (useRef + useEffect scrollIntoView).
- Keep messages in useState. Each message {id, role:'user'|'assistant', response?: CopilotResponse, text?: string}.
- Make it look like a real product: header strip inside the chat card ("AI Facility Copilot — grounded on live facility state"), a small online/active indicator, nice bubble styling, max width, good typography.

Requirements for the page:
- PageHeader eyebrow "Module 03 · AI Facility Copilot", title "Facility Copilot", subtitle about conversational intelligence grounded on live data, icon Bot, actions LiveBadge.
- Layout: chat takes the main column (e.g. lg:col-span-8), a right rail (lg:col-span-4) with a GlassCard "Live Context" showing current riskAssessment.score/category, activeAlarms count, predictiveSummary.within7Days, energyDeltaPct, occupancyPct (pull from '@/lib/ai' kpiSummary / riskAssessment and '@/lib/data/telemetry'), and a "What I can do" capability list. The rail is static/server-rendered.
- The chat card should be tall (e.g. h-[640px]) with the thread scrollable and input fixed at bottom.

Polish matters — this is a flagship demo screen. Return the structured object.`,
  },
  {
    id: 'risk-engine',
    label: 'Module 4 · Risk Engine',
    build: `${CONTRACT}

# YOUR TASK — Module 4: AI Risk Engine
Create an explainable risk-scoring page.

Files to CREATE:
1. ${FE}/components/risk/RiskSimulator.tsx  ('use client') — interactive what-if simulator
2. ${FE}/app/risk-engine/page.tsx

Use riskAssessment from '@/lib/ai' (it has .score ~64, .category 'High', .trendDelta, .summary, .factors RiskFactor[] (4 domains: equipment, security, energy, occupancy — each with score, weight, contribution, detail, signals[], trend), .recommendations RiskRecommendation[], .confidence). Also riskTrend (TrendPoint[30]) from '@/lib/data/telemetry'.

Page sections (top to bottom):
- PageHeader eyebrow "Module 04 · AI Risk Engine", title "Facility Risk Intelligence", subtitle, icon Gauge, actions LiveBadge.
- Hero row: left a big GlassCard with <RiskGauge score category size={240}/> + the riskAssessment.summary + confidence chip + trendDelta. Right a GlassCard with the 4 factor contributions as a DonutChart (each factor.contribution as value; colors: equipment #06AEDB, security #EF4444, energy #F4C152, occupancy #8B5CF6) with centerValue = score, centerLabel "Risk".
- Factor breakdown: a grid (2 cols) of 4 GlassCards, one per RiskFactor: domain label, sub-score (big, colored), a HealthBar of the score in the domain color, weight & contribution, detail text, and the signals[] as a bulleted evidence list (use small icons / dots). Show the trend with an arrow.
- Recommendations: a GlassCard listing riskAssessment.recommendations — each row with a SeverityBadge(priority), action (bold), rationale, and the impact chip (e.g. "-11 pts"). Order by priority.
- Methodology explainer: a GlassCard describing the weighted model (equipment 40%, security 30%, energy 16%, occupancy 14%), how each domain is scored from live signals, and that it is deterministic & auditable.
- 30-day risk trend: a GlassCard with TrendLineChart(data=riskTrend, xKey="date", series=[{key:'value',label:'Risk Index',color:'#F97316'}], yDomain=[0,100]).
- RiskSimulator (client): a "What-If Simulator" GlassCard with 4 range sliders (one per domain) initialized to each factor's current score (0-100). As the user drags, recompute the overall score live using the SAME weights {equipment:0.40, security:0.30, energy:0.16, occupancy:0.14} (overall = sum(score_i * weight_i), rounded). Show the recomputed score, its category (use riskCategoryFromScore from '@/lib/utils'), the delta vs the current baseline (riskAssessment.score), and a colored indicator (use riskCategoryMeta). Include a "Reset to live" button. Animated number for the score. This demonstrates how mitigations move the score — make it feel responsive and premium.

Return the structured object.`,
  },
  {
    id: 'predictive-maintenance',
    label: 'Module 5 · Predictive Maintenance',
    build: `${CONTRACT}

# YOUR TASK — Module 5: Predictive Maintenance
Create the predictive maintenance command screen.

Files to CREATE:
1. ${FE}/components/maintenance/AssetHealthTable.tsx  ('use client') — filterable/sortable table
2. ${FE}/app/predictive-maintenance/page.tsx

Use predictiveInsights (PredictiveInsight[]) and predictiveSummary ({atRisk, critical, within7Days, avgHealth, totalCostAvoided}) from '@/lib/ai'; maintenanceEvents/openMaintenance/overdueMaintenance from '@/lib/data/maintenance'; assets/assetCounts from '@/lib/data/assets'; healthColor from '@/lib/utils'.

Page sections:
- PageHeader eyebrow "Module 05 · Predictive Maintenance", title "Predictive Maintenance", subtitle, icon Wrench, actions LiveBadge.
- KPI row (4 KpiCards): Assets at Risk (predictiveSummary.atRisk, accent amber), Predicted Failures <7d (within7Days, accent red), Avg Fleet Health (avgHealth + '%', accent emerald), Downtime Exposure Mitigated (totalCostAvoided, prefix '$', accent command). Use index for stagger.
- Two-column row:
  (a) "Priority Predictions" GlassCard (lg:col-span-7): for the top ~5 predictiveInsights, a rich card each: assetTag + assetName + floorName, StatusBadge(status), HealthBar(healthPct, healthColor), "days to predicted failure" (red if <=7, show 'Offline' if <=0, '—' if null), failureProbability as a percent, the recommendation in an amber callout, and driverSignals[] as small chips. estimatedDowntimeHours and costAvoided shown.
  (b) "Health Distribution" GlassCard (lg:col-span-5): a CategoryBarChart of assets bucketed by health band [0-40 Critical, 40-60 Poor, 60-80 Fair, 80-100 Good] with counts, colorByValue or per-band colors (red/orange/amber/emerald). Build the buckets from assets in the page and pass to the chart. Below it, a small breakdown of asset status counts (operational/warning/critical/offline) with dots.
- AssetHealthTable (client, full width): a table/list of ALL assets (from '@/lib/data/assets') with columns: Tag, Name, Category, Floor (use floorName from '@/lib/data/facility'), Health (HealthBar + %), Status (StatusBadge), Predicted failure (days). Controls above the table: a category filter (All + each AssetCategory), a status filter (All/operational/warning/critical/offline), and sortable by Health (asc/desc) and Days-to-failure. Implement filtering/sorting in useState. Show a count of filtered rows. Rows for critical/offline subtly highlighted. Make it clean and dense.
- Work Orders GlassCard (full width or below): list maintenanceEvents — each with kind badge (predictive/preventive/corrective), status (scheduled/in_progress/completed/overdue — color overdue red, in_progress amber, completed emerald), priority SeverityBadge, title, assetName, scheduledDate (formatDate), technician, estimatedHours, costEstimate (formatCurrency). Sort open/overdue first.

Return the structured object.`,
  },
  {
    id: 'emergency',
    label: 'Module 6 · Emergency Center',
    build: `${CONTRACT}

# YOUR TASK — Module 6: Emergency Simulation Center
Create an interactive crisis simulation screen.

Files to CREATE:
1. ${FE}/components/emergency/EmergencySimulator.tsx  ('use client')
2. ${FE}/app/emergency/page.tsx

Use emergencyScenarios (EmergencyScenario[4]) from '@/lib/data/emergency'. Each scenario has: type ('fire'|'power_outage'|'unauthorized_access'|'equipment_failure'), name, severity, description, triggerNarrative, impactedZones[{zoneId,zoneName,floorName,impact:'severe'|'major'|'moderate'|'minor'}], responsePlan[{order,actor,action,etaMinutes,automated}], estimatedRecoveryMinutes, affectedAssets, affectedOccupants, cascadeRisks[].

Page:
- PageHeader eyebrow "Module 06 · Emergency Simulation Center", title "Emergency Response Simulation", subtitle, icon Siren, actions LiveBadge.
- Render <EmergencySimulator/> below.

EmergencySimulator (client):
- Scenario selector: 4 selectable cards (one per scenario) across the top — each with an icon by type (fire->Flame, power_outage->ZapOff/Zap, unauthorized_access->ShieldAlert, equipment_failure->Wrench), name, severity SeverityBadge, short description. The selected card is highlighted (command/red glow). Default to the first scenario.
- When a scenario is selected, show a detail area:
  * A summary strip: severity, estimatedRecoveryMinutes (format like "4h 00m" or "90m"), affectedAssets, affectedOccupants — as stat tiles.
  * triggerNarrative in a callout.
  * Impacted Zones: a list/grid of impactedZones with an impact pill colored by severity (severe=red, major=orange, moderate=amber, minor=slate) and floorName.
  * Response Playbook: the responsePlan steps as an animated vertical timeline (ordered). Each step: order number, actor, action, etaMinutes ("T+Xm"), and an "AUTO" chip if automated else "MANUAL".
  * Cascade Risks: cascadeRisks[] in a warning-styled list.
- "RUN SIMULATION" button: when clicked, animate the response timeline step-by-step — reveal/activate each step sequentially with a delay (e.g. 700ms each) using useState for an "activeStep" index and setInterval/timeouts; show a progress bar and a running "elapsed" indicator; mark steps complete with a check as they pass; when done show "Response complete — estimated recovery {recovery}". Provide a "Reset" button. Use framer-motion for step reveals. Make it feel like a live command-center drill.
- Clean up timers on unmount / scenario change (clear intervals in useEffect cleanup).

This is a showcase interactive screen — make the animation smooth and the layout dramatic but professional. Return the structured object.`,
  },
  {
    id: 'dashboard',
    label: 'Module 7 · Executive Dashboard',
    build: `${CONTRACT}

# YOUR TASK — Module 7: Executive Dashboard
Create an analytics/trends dashboard.

Files to CREATE:
1. ${FE}/app/dashboard/page.tsx  (may be a server component rendering the client charts; if you add a period toggle, create a small client wrapper ${FE}/components/dashboard/DashboardCharts.tsx and import it)

Use from '@/lib/data/telemetry': riskTrend, alarmTrend, energyTrend, assetHealthTrend (each TrendPoint[30] {date,value}), trendOverview (MultiTrendPoint[30] {label,risk,alarms,energyMWh,health}), energyBreakdown ({category,kwh,pctOfTotal}[]), occupancyHourly (TrendPoint[24]). From '@/lib/data/alarms': alarmsByType()-> {type,count,active}[]. From '@/lib/data/assets': assetCounts (byCategory, and status counts). From '@/lib/ai': kpiSummary.

Page:
- PageHeader eyebrow "Module 07 · Executive Dashboard", title "Trends & Analytics", subtitle "30-day operational trends across risk, alarms, energy and asset health.", icon LineChart (from lucide), actions LiveBadge + an optional period chip group (Last 7 / 30 days — cosmetic toggle is fine if you make it client; otherwise just show "Last 30 days").
- A KPI summary strip (4 small stat tiles or KpiCards) from kpiSummary: risk score, active alarms, energy today, occupancy %.
- Charts grid (each in a GlassCard with SectionTitle + a relevant chip showing latest value or delta):
  * Risk Trend — TrendLineChart(riskTrend, xKey 'date', series [{key:'value',label:'Risk Index',color:'#F97316'}], yDomain [0,100]).
  * Alarm Trend — CategoryBarChart(alarmTrend, xKey 'date', barKey 'value', barLabel 'Alarms', color '#06AEDB') OR TrendAreaChart; bars look good here.
  * Energy Trend — TrendAreaChart(energyTrend, xKey 'date', series [{key:'value',label:'Energy (MWh)',color:'#06AEDB'}], unit ' MWh').
  * Asset Health Trend — TrendLineChart(assetHealthTrend, xKey 'date', series [{key:'value',label:'Avg Health %',color:'#10B981'}], yDomain [70,100]).
- A combined overview: TrendAreaChart or TrendLineChart using trendOverview (xKey 'label', series for risk/alarms/health — pick 2-3 that share a scale, or just show risk + health). Full width.
- Distribution row (2-3 DonutCharts or bar charts):
  * Energy mix — DonutChart from energyBreakdown (map to {name:category, value:kwh, color}) — colors: HVAC #06AEDB, IT #8B5CF6, Lighting #F4C152, Security/Other #64748B. centerValue total formatKwh.
  * Alarms by type — CategoryBarChart(alarmsByType(), xKey 'type', barKey 'count', barLabel 'Alarms', layout 'vertical').
  * Assets by category — DonutChart or CategoryBarChart from assetCounts.byCategory (Object.entries -> {name,value,color}). Pick distinct colors.
- 24h occupancy — TrendAreaChart(occupancyHourly, xKey 'date', series [{key:'value',label:'Occupancy',color:'#8B5CF6'}]) somewhere.
Lay it out responsively (grid-cols-12). Make value chips show real latest numbers. Polished and executive-grade. Return the structured object.`,
  },
  {
    id: 'backend',
    label: 'Backend · Express + PostgreSQL',
    build: `${CONTRACT}

# YOUR TASK — Backend reference implementation (Node.js + Express + PostgreSQL)
Build a clean, runnable backend under ${ROOT}/backend that mirrors the frontend's data contracts and exposes a REST API + an AI engine. It must run standalone with \`npm install && npm start\` and degrade gracefully to in-memory data if PostgreSQL is not configured. Use CommonJS (require/module.exports), Node 18+, Express 4. Do NOT use TypeScript for the backend (plain .js) to keep it dependency-light and runnable.

Files to CREATE (all under ${ROOT}/backend):
1. backend/package.json — name "police-twin-ai-api", scripts: { "start": "node src/server.js", "dev": "nodemon src/server.js", "seed": "node db/seed.js" }, deps: express ^4.19, cors ^2.8, pg ^8.11, dotenv ^16, morgan ^1.10; devDeps: nodemon ^3.
2. backend/.env.example — PORT=4000, DATABASE_URL=postgres://postgres:postgres@localhost:5432/police_twin, USE_DB=false (when false the API serves in-memory data).
3. backend/.gitignore — node_modules, .env
4. backend/src/server.js — Express app: cors, morgan, express.json; mounts routes; GET /api/health; central error handler; listens on PORT; logs startup banner.
5. backend/src/db.js — pg Pool from DATABASE_URL; exports pool + a helper query(text,params) + a boolean dbEnabled (from process.env.USE_DB==='true'). Wrap connection so missing DB does not crash.
6. backend/src/data/dataset.js — Export the FULL in-memory datasets mirroring the frontend (building, floors[], assets[] (~30+, with category/status/healthPct/predictedFailureDays/floorId), alarms[], energyReadings(24h), occupancyByFloor, occupancyZonePoints, maintenanceEvents[], emergencyScenarios[4], and the 30-day trends riskTrend/alarmTrend/energyTrend/assetHealthTrend). Keep it deterministic (a small seeded RNG ok). It does not need to be byte-identical to the frontend but must be coherent and realistic, matching the same shapes/fields. This is the source of truth when USE_DB=false and for seeding.
7. backend/src/services/aiEngine.js — computeRisk(dataset) -> { score, category, trendDelta, summary, factors[], recommendations[], confidence } using a weighted model (equipment 0.40, security 0.30, energy 0.16, occupancy 0.14), computePredictive(dataset) -> insights[], buildKpiSummary(dataset), and copilotRespond(query, dataset) -> { intent, answer, bullets[], citations[], followUps[] } using keyword intent matching (risk/alarms/maintenance/last 24h/energy/occupancy/recommendations). Mirror the frontend logic conceptually.
8. backend/src/routes/index.js — an Express Router wiring all endpoints to controllers. Endpoints:
   GET /api/facility (building + floor count), GET /api/floors, GET /api/floors/:id,
   GET /api/assets (supports ?category= & ?floorId= & ?status= filters), GET /api/assets/:id,
   GET /api/alarms (?status= filter), GET /api/telemetry/energy, GET /api/telemetry/occupancy,
   GET /api/maintenance, GET /api/risk, GET /api/predictive, GET /api/kpis,
   GET /api/emergency, GET /api/emergency/:id,
   POST /api/copilot (body { query }) -> copilotRespond.
   Each route reads from the dataset (in-memory) — keep controllers inline or in a controllers file, your choice; keep it clean.
9. backend/db/schema.sql — full PostgreSQL DDL: tables for buildings, floors, zones, assets, alarms, energy_readings, occupancy_readings, maintenance_events, emergency_scenarios (+ child tables or JSONB for nested arrays like impacted_zones/response_plan — use JSONB where sensible), with PKs, FKs, sensible types, indexes (e.g. on assets.floor_id, alarms.status, alarms.timestamp), and comments. Include a few helpful VIEWs (e.g. v_active_alarms, v_asset_health_summary).
10. backend/db/seed.js — Node script that, using pg, creates the schema (runs schema.sql) and inserts the dataset rows (idempotent: TRUNCATE or INSERT ... ON CONFLICT). Reads DATABASE_URL from env. Console-logs progress. Guard so it errors clearly if DB unreachable.
11. backend/README.md — how to run (with and without DB), env vars, endpoint list with example curl + sample JSON responses, and how seeding works.

Make the code clean, commented, and genuinely runnable. Return the structured object (files = absolute paths).`,
  },
  {
    id: 'docs',
    label: 'Documentation suite',
    build: `${CONTRACT}

# YOUR TASK — Documentation & deliverables
Write the complete documentation suite. This is for an EXECUTIVE-GRADE product demo (POLICE TWIN AI — AI command center & digital twin for smart police facilities). Be specific and reference the ACTUAL implemented features, routes, modules, data and stack. Professional, confident, well-structured Markdown with tables, code blocks, and diagrams.

Context you can rely on (already built):
- Frontend: Next.js 14 App Router + TypeScript + TailwindCSS + Three.js (@react-three/fiber + drei) + Framer Motion + Recharts, at frontend/. Runs with \`npm install && npm run dev\` on http://localhost:3000 — NO database required (self-contained mock data + mock AI engine).
- Backend: Node.js + Express + PostgreSQL reference API at backend/ (runs standalone; degrades to in-memory when USE_DB=false). Endpoints under /api/* (facility, floors, assets, alarms, telemetry/energy, telemetry/occupancy, maintenance, risk, predictive, kpis, emergency, copilot[POST]).
- Modules / routes:
  1. Command Center  (/)             — KPIs (risk, alarms, energy, occupancy, security, maintenance), AI situation brief, risk breakdown, energy chart, active alarms, predictive highlights, occupancy by floor, module launchpad.
  2. Digital Twin    (/digital-twin) — interactive 3D facility (6 floors, ~48 assets), floor selector, asset-layer toggles, click markers for live telemetry, orbit/zoom.
  3. AI Copilot      (/copilot)      — conversational assistant grounded on live state (risk, alarms, maintenance, last-24h, energy, occupancy, recommendations).
  4. Risk Engine     (/risk-engine)  — explainable weighted risk model (equipment 40%, security 30%, energy 16%, occupancy 14%), factor signals, recommendations, what-if simulator, 30-day trend.
  5. Predictive Maintenance (/predictive-maintenance) — failure prediction, asset health %, days-to-failure, recommendations, filterable asset table, work orders, cost avoided.
  6. Emergency Center (/emergency)    — 4 simulatable scenarios (fire, power outage, unauthorized access, equipment failure): impacted zones, animated response playbook, recovery time, cascade risks.
  7. Executive Dashboard (/dashboard) — 30-day trend charts (risk/alarm/energy/health), distributions (energy mix, alarms by type, assets by category), 24h occupancy.
- Facility modeled: "Central Command HQ" (code PTX-HQ-01), 6 levels (B1 plant, L1 public, L2 operations/dispatch, L3 investigations, L4 detention, L5 secure core), ~48 assets across HVAC/UPS/Electrical/Fire/Camera/AccessControl/Sensor/Network, 13 alarms, predictive insights, etc.
- AI layer is a deterministic mock reasoning engine: risk scoring, predictive maintenance simulation, copilot intent engine.

Files to CREATE:
1. ${ROOT}/README.md — the hero doc: product name + one-line pitch, banner-style intro, key capabilities (bulleted by module), tech stack table, screenshots/section descriptions, monorepo structure (frontend/ + backend/ + docs/), quickstart (frontend first: \`cd frontend && npm install && npm run dev\`), link to the other docs, "who it's for" (executives, innovation labs, smart-city programs, security orgs), and a short note that all data/AI is simulated for demo. Make it visually rich (badges as shields.io-style markdown is fine, emojis sparingly, tables).
2. ${ROOT}/docs/INSTALLATION.md — prerequisites (Node 18+, npm; optional PostgreSQL 14+), step-by-step frontend setup, optional backend setup (with and without DB, env vars, seeding), ports, troubleshooting (e.g. node version, port in use), how to do a production build (\`npm run build && npm start\`).
3. ${ROOT}/docs/DEMO_WALKTHROUGH.md — a guided 8-12 minute executive demo script: a suggested click-path through all 7 modules with what to say/point at at each step ("Open the Command Center → note the AI Situation Brief calling out High risk driven by power & access faults… → click into Risk Engine → drag the simulator to show mitigation…"). Include suggested copilot questions to ask live. Frame the business value at each stop.
4. ${ROOT}/docs/ARCHITECTURE.md — system architecture: a Mermaid diagram (graph TD) of the layered architecture (Presentation/Next.js modules → Component & design system → Data + AI layer (mock engine) → optional Express API → PostgreSQL), an ASCII fallback diagram too, data-flow description, the deterministic-mock-AI rationale, the dual frontend-data / backend-API design, folder structure tree, key design decisions, and how it would extend to real data sources (BMS/VMS/ACS/IoT) in production.
5. ${ROOT}/docs/API.md — backend REST reference: a table of every endpoint (method, path, description), query params, and example request/response JSON snippets for the key ones (risk, assets, copilot POST, emergency). Note the in-memory vs DB modes.
6. ${ROOT}/docs/DATA_MODEL.md — the domain model: entity descriptions (Building, Floor, Zone, Asset, Alarm, EnergyReading, OccupancyReading, MaintenanceEvent, RiskAssessment, PredictiveInsight, EmergencyScenario), a Mermaid erDiagram, and a summary of the PostgreSQL schema (tables, keys, JSONB usage) — consistent with backend/db/schema.sql.
7. ${ROOT}/docs/SCREENSHOTS.md — detailed descriptions of each screen as if narrating screenshots (one section per module): what's visible, the layout, the standout visual elements, and the "wow" factor. Since real PNGs aren't included, these serve as the visual spec / captions.
8. ${ROOT}/docs/ROADMAP.md — future roadmap in phases/quarters: e.g. Phase 1 live integrations (BMS/VMS/ACS/IoT/SCADA), Phase 2 real ML models (anomaly detection, RUL prediction, true LLM copilot with RAG over facility data), Phase 3 multi-site/city-scale federation, mobile & field apps, digital-twin from BIM/IFC, role-based access & audit, compliance (data residency), edge analytics. Include a table and rationale.

Be thorough and polished — these docs are part of the deliverable shown to executives. Return the structured object (files = absolute paths).`,
  },
];

function verifyPrompt(it, built) {
  const files = (built && built.files) ? built.files : it && it.files || [];
  return `${CONTRACT}

# VERIFICATION PASS for "${it.label}"
Another agent just created these files:
${files.map((f) => '- ' + f).join('\n')}

Read EACH file and rigorously check it against the FOUNDATION API CONTRACT above. Fix problems IN PLACE with the Edit/Write tools. Check specifically:
1. Imports resolve to real exports (correct names/paths per the contract). Common mistakes: importing a named export that doesn't exist, wrong path, importing a value as a type.
2. 'use client' is present at the very top of any file using useState/useEffect/hooks, framer-motion, recharts, or DOM event handlers (onClick/onChange/onSubmit). A server file must NOT use those.
3. Every app/**/page.tsx has a DEFAULT export React component.
4. No Math.random(), Date.now(), or argless new Date() at module scope or during render (would break SSR). Use NOW/NOW_ISO from '@/lib/utils' or seededRandom.
5. TypeScript correctness for FRONTEND files (.tsx/.ts): props match component signatures in the contract; chart data uses the documented prop names (xKey, series:{key,label,color}, barKey/barLabel, DonutChart data:{name,value,color}); no obvious type errors. For BACKEND (.js) files: valid CommonJS, requires resolve, routes wired, no syntax errors. For DOCS (.md): internal links/paths and described features are accurate.
6. The component is actually rendered/wired (e.g. page imports and uses its client sub-component).
7. JSX is valid (closed tags, keys on lists).
Do NOT modify shared/foundation files. Only fix the files listed above. If everything is correct, report status 'clean'. If you fixed things, 'fixed'. Return ONLY the structured object.`;
}

phase('Build');
log(`Building ${items.length} deliverables in parallel on the verified foundation…`);

const results = await pipeline(
  items,
  (it) => agent(it.build, { label: it.label, phase: 'Build', schema: OUT_SCHEMA }),
  (built, it) =>
    agent(verifyPrompt(it, built), { label: `verify · ${it.id}`, phase: 'Verify', schema: VERIFY_SCHEMA })
      .then((v) => ({ id: it.id, label: it.label, built, verify: v })),
);

const clean = results.filter(Boolean);
log(`Completed ${clean.length}/${items.length} deliverables.`);
return {
  deliverables: clean.map((r) => ({
    id: r.id,
    files: r.built?.files ?? [],
    verifyStatus: r.verify?.status ?? 'unknown',
    issues: r.verify?.issuesFound ?? [],
    fixes: r.verify?.fixesApplied ?? [],
  })),
};
