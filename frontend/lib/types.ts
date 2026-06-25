// ============================================================================
// POLICE TWIN AI - Core domain types
// Shared data contracts for the entire platform (frontend + backend mirror).
// ============================================================================

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type AssetStatus = 'operational' | 'warning' | 'critical' | 'offline';

export type AssetCategory =
  | 'HVAC'
  | 'UPS'
  | 'Electrical'
  | 'FireSystem'
  | 'Camera'
  | 'AccessControl'
  | 'Sensor'
  | 'Network';

export type AlarmType =
  | 'fire'
  | 'security'
  | 'maintenance'
  | 'power'
  | 'access'
  | 'environmental'
  | 'network';

export type AlarmStatus = 'active' | 'acknowledged' | 'resolved';

export type RiskCategory =
  | 'Low'
  | 'Guarded'
  | 'Elevated'
  | 'High'
  | 'Severe';

export type RiskDomain = 'security' | 'energy' | 'equipment' | 'occupancy';

export type MaintenanceKind = 'predictive' | 'preventive' | 'corrective';

export type MaintenanceStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'overdue';

export type EmergencyType =
  | 'fire'
  | 'power_outage'
  | 'unauthorized_access'
  | 'equipment_failure';

// ----------------------------------------------------------------------------

export interface Building {
  id: string;
  name: string;
  code: string;
  address: string;
  floors: number;
  areaSqm: number;
  type: string;
  commissioned: string; // ISO date
  status: 'online' | 'degraded' | 'offline';
}

export interface Zone {
  id: string;
  floorId: string;
  name: string;
  type:
    | 'operations'
    | 'detention'
    | 'evidence'
    | 'server'
    | 'public'
    | 'admin'
    | 'utility'
    | 'parking'
    | 'armory';
  critical: boolean;
}

export interface Floor {
  id: string;
  buildingId: string;
  level: number;
  name: string;
  areaSqm: number;
  capacity: number;
  zones: Zone[];
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Asset {
  id: string;
  tag: string;
  name: string;
  category: AssetCategory;
  floorId: string;
  zoneId: string;
  position: Vec3; // normalized layout coordinates for the digital twin
  status: AssetStatus;
  healthPct: number; // 0-100
  manufacturer: string;
  model: string;
  installDate: string; // ISO date
  lastServiceDate: string; // ISO date
  // Predictive maintenance fields
  predictedFailureDays: number | null; // null = no near-term failure predicted
  failureProbability: number; // 0-1 within prediction horizon
  mtbfDays: number; // mean time between failures
  recommendation: string | null;
  // Live telemetry snapshot
  telemetry: Record<string, number | string>;
}

export interface Alarm {
  id: string;
  type: AlarmType;
  severity: Severity;
  title: string;
  message: string;
  assetId: string | null;
  floorId: string;
  zoneId: string | null;
  status: AlarmStatus;
  timestamp: string; // ISO datetime
  source: string;
  acknowledgedBy?: string | null;
}

export interface OccupancyReading {
  floorId: string;
  timestamp: string;
  count: number;
  capacity: number;
}

export interface OccupancyZonePoint {
  zoneId: string;
  zoneName: string;
  count: number;
  capacity: number;
  anomaly: boolean;
}

export interface EnergyReading {
  timestamp: string; // ISO datetime (hourly)
  kwh: number;
  hvacKwh: number;
  lightingKwh: number;
  itKwh: number;
  baseline: number; // expected kwh for anomaly detection
}

export interface EnergyBreakdown {
  category: string;
  kwh: number;
  pctOfTotal: number;
}

export interface MaintenanceEvent {
  id: string;
  assetId: string;
  assetName: string;
  kind: MaintenanceKind;
  status: MaintenanceStatus;
  priority: Severity;
  title: string;
  description: string;
  scheduledDate: string; // ISO date
  technician: string | null;
  estimatedHours: number;
  costEstimate: number;
}

// ----------------------------- AI engine outputs ----------------------------

export interface RiskFactor {
  domain: RiskDomain;
  label: string;
  score: number; // 0-100 sub-score
  weight: number; // contribution weight (0-1)
  contribution: number; // weighted points contributed to overall
  trend: 'up' | 'down' | 'flat';
  detail: string;
  signals: string[];
}

export interface RiskRecommendation {
  id: string;
  priority: Severity;
  domain: RiskDomain;
  action: string;
  rationale: string;
  impact: string; // expected risk reduction, e.g. "-8 pts"
}

export interface RiskAssessment {
  score: number; // 0-100 overall
  category: RiskCategory;
  trendDelta: number; // change vs previous period
  generatedAt: string;
  summary: string;
  factors: RiskFactor[];
  recommendations: RiskRecommendation[];
  confidence: number; // 0-1
}

export interface PredictiveInsight {
  assetId: string;
  assetTag: string;
  assetName: string;
  category: AssetCategory;
  floorName: string;
  healthPct: number;
  status: AssetStatus;
  predictedFailureDays: number | null;
  failureProbability: number;
  recommendation: string;
  driverSignals: string[];
  estimatedDowntimeHours: number;
  costAvoided: number;
}

export interface CopilotCitation {
  label: string;
  value: string;
}

export interface CopilotResponse {
  intent: string;
  answer: string;
  bullets: string[];
  citations: CopilotCitation[];
  followUps: string[];
}

export interface EmergencyImpactZone {
  zoneId: string;
  zoneName: string;
  floorName: string;
  impact: 'severe' | 'major' | 'moderate' | 'minor';
}

export interface EmergencyResponseStep {
  order: number;
  actor: string;
  action: string;
  etaMinutes: number;
  automated: boolean;
}

export interface EmergencyScenario {
  id: string;
  type: EmergencyType;
  name: string;
  severity: Severity;
  description: string;
  triggerNarrative: string;
  impactedZones: EmergencyImpactZone[];
  responsePlan: EmergencyResponseStep[];
  estimatedRecoveryMinutes: number;
  affectedAssets: number;
  affectedOccupants: number;
  cascadeRisks: string[];
}

// ------------------------------ Trends / charts -----------------------------

export interface TrendPoint {
  date: string; // ISO date or label
  value: number;
}

export interface MultiTrendPoint {
  label: string;
  [series: string]: number | string;
}

// ------------------------------- KPI summary --------------------------------

export interface KpiSummary {
  riskScore: number;
  riskCategory: RiskCategory;
  riskDelta: number;
  activeAlarms: number;
  criticalAlarms: number;
  energyKwh: number;
  energyDeltaPct: number;
  occupancyCount: number;
  occupancyCapacity: number;
  occupancyPct: number;
  securityStatus: 'secure' | 'elevated' | 'breach';
  securityDetail: string;
  maintenanceAlerts: number;
  maintenanceOverdue: number;
  assetsOnline: number;
  assetsTotal: number;
}
