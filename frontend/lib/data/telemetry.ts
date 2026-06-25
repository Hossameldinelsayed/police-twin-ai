import type {
  EnergyBreakdown,
  EnergyReading,
  MultiTrendPoint,
  OccupancyReading,
  OccupancyZonePoint,
  TrendPoint,
} from '../types';
import { floors } from './facility';
import { seededRandom, round, NOW } from '../utils';

// ============================================================================
// Energy, occupancy and 30-day trend telemetry. Deterministic generation.
// ============================================================================

const rng = seededRandom(777);

// ----------------------------- Energy (24h hourly) --------------------------
// Daily load curve: trough overnight, double-hump for morning/afternoon ops.
function loadCurve(hour: number): number {
  const base = 520;
  const morning = 380 * Math.exp(-Math.pow(hour - 10, 2) / 12);
  const afternoon = 300 * Math.exp(-Math.pow(hour - 15, 2) / 14);
  const night = 90 * Math.exp(-Math.pow(hour - 3, 2) / 30);
  return base + morning + afternoon + night;
}

export const energyReadings: EnergyReading[] = Array.from({ length: 24 }, (_, h) => {
  const baseline = loadCurve(h);
  // Inject an HVAC anomaly in the early afternoon (plant overdraw story).
  const anomaly = h >= 12 && h <= 15 ? 150 + rng() * 60 : 0;
  const noise = (rng() - 0.5) * 40;
  const kwh = round(baseline + anomaly + noise, 0);
  const hvacKwh = round(kwh * (0.42 + (anomaly > 0 ? 0.06 : 0)), 0);
  const itKwh = round(kwh * 0.26, 0);
  const lightingKwh = round(kwh * 0.14, 0);
  return {
    timestamp: `${String(h).padStart(2, '0')}:00`,
    kwh,
    hvacKwh,
    lightingKwh,
    itKwh,
    baseline: round(baseline, 0),
  };
});

const currentHour = NOW.getUTCHours();
export const currentPowerKw = energyReadings[currentHour]?.kwh ?? energyReadings[14].kwh;
export const energyTodayKwh = round(
  energyReadings.slice(0, currentHour + 1).reduce((s, r) => s + r.kwh, 0),
  0,
);
export const energyBaselineToday = round(
  energyReadings.slice(0, currentHour + 1).reduce((s, r) => s + r.baseline, 0),
  0,
);
export const energyDeltaPct = round(
  ((energyTodayKwh - energyBaselineToday) / energyBaselineToday) * 100,
  1,
);

export const energyBreakdown: EnergyBreakdown[] = (() => {
  const total = energyReadings.reduce((s, r) => s + r.kwh, 0);
  const hvac = energyReadings.reduce((s, r) => s + r.hvacKwh, 0);
  const it = energyReadings.reduce((s, r) => s + r.itKwh, 0);
  const lighting = energyReadings.reduce((s, r) => s + r.lightingKwh, 0);
  const other = total - hvac - it - lighting;
  const rows: [string, number][] = [
    ['HVAC & Cooling', hvac],
    ['IT & Data Center', it],
    ['Lighting', lighting],
    ['Security & Other', other],
  ];
  return rows.map(([category, kwh]) => ({
    category,
    kwh: round(kwh, 0),
    pctOfTotal: round((kwh / total) * 100, 0),
  }));
})();

// ----------------------------- Occupancy ------------------------------------
// Current occupancy per floor (scaled by time-of-day factor on capacity).
const todFactor = 0.42 + 0.5 * Math.exp(-Math.pow(currentHour - 13, 2) / 20);

export const occupancyByFloor: OccupancyReading[] = floors.map((f) => {
  const jitter = 0.8 + rng() * 0.4;
  const count = Math.min(
    f.capacity,
    Math.round(f.capacity * todFactor * jitter * (f.level <= 0 ? 0.9 : 0.7)),
  );
  return {
    floorId: f.id,
    timestamp: NOW.toISOString(),
    count,
    capacity: f.capacity,
  };
});

export const occupancyTotal = occupancyByFloor.reduce((s, o) => s + o.count, 0);
export const occupancyCapacity = floors.reduce((s, f) => s + f.capacity, 0);
export const occupancyPct = round((occupancyTotal / occupancyCapacity) * 100, 0);

// Zone-level occupancy with one anomaly (after-hours presence in a critical zone).
export const occupancyZonePoints: OccupancyZonePoint[] = [
  { zoneId: 'flr-03-z1', zoneName: 'Command & Control Room', count: 14, capacity: 24, anomaly: false },
  { zoneId: 'flr-03-z2', zoneName: 'Dispatch Floor', count: 31, capacity: 40, anomaly: false },
  { zoneId: 'flr-02-z1', zoneName: 'Main Reception', count: 58, capacity: 120, anomaly: false },
  { zoneId: 'flr-05-z3', zoneName: 'Booking & Processing', count: 9, capacity: 16, anomaly: false },
  { zoneId: 'flr-06-z2', zoneName: 'Evidence Vault', count: 2, capacity: 4, anomaly: true },
  { zoneId: 'flr-04-z3', zoneName: 'Forensics Lab', count: 6, capacity: 12, anomaly: false },
];

// 24h occupancy trend (building-wide).
export const occupancyHourly: TrendPoint[] = Array.from({ length: 24 }, (_, h) => {
  const f = 0.4 + 0.55 * Math.exp(-Math.pow(h - 13, 2) / 22);
  const v = Math.round(occupancyCapacity * f * (0.9 + rng() * 0.15));
  return { date: `${String(h).padStart(2, '0')}:00`, value: v };
});

// ----------------------------- 30-day trends --------------------------------
function dayLabel(daysAgo: number): string {
  return new Date(NOW.getTime() - daysAgo * 86_400_000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const N_DAYS = 30;

// Risk trend climbs over the last week toward the current elevated state.
export const riskTrend: TrendPoint[] = Array.from({ length: N_DAYS }, (_, i) => {
  const daysAgo = N_DAYS - 1 - i;
  const baseRisk = 38 + 6 * Math.sin(i / 4);
  const ramp = daysAgo < 7 ? (7 - daysAgo) * 3.4 : 0;
  return { date: dayLabel(daysAgo), value: round(baseRisk + ramp + (rng() - 0.5) * 5, 0) };
});

export const alarmTrend: TrendPoint[] = Array.from({ length: N_DAYS }, (_, i) => {
  const daysAgo = N_DAYS - 1 - i;
  const base = 5 + 3 * Math.sin(i / 3);
  const ramp = daysAgo < 6 ? (6 - daysAgo) * 1.6 : 0;
  return { date: dayLabel(daysAgo), value: Math.max(1, Math.round(base + ramp + rng() * 3)) };
});

export const energyTrend: TrendPoint[] = Array.from({ length: N_DAYS }, (_, i) => {
  const daysAgo = N_DAYS - 1 - i;
  const base = 14.2 + 1.4 * Math.sin(i / 5);
  const ramp = daysAgo < 5 ? (5 - daysAgo) * 0.32 : 0;
  return { date: dayLabel(daysAgo), value: round(base + ramp + (rng() - 0.5) * 0.9, 1) };
});

export const assetHealthTrend: TrendPoint[] = Array.from({ length: N_DAYS }, (_, i) => {
  const daysAgo = N_DAYS - 1 - i;
  const base = 91 - i * 0.12;
  const dip = daysAgo < 8 ? (8 - daysAgo) * 0.7 : 0;
  return { date: dayLabel(daysAgo), value: round(base - dip + (rng() - 0.5) * 1.2, 1) };
});

// Combined multi-series for the dashboard overview chart.
export const trendOverview: MultiTrendPoint[] = Array.from({ length: N_DAYS }, (_, i) => ({
  label: riskTrend[i].date,
  risk: riskTrend[i].value,
  alarms: alarmTrend[i].value,
  energyMWh: energyTrend[i].value,
  health: assetHealthTrend[i].value,
}));
