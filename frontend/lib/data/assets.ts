import type { Asset, AssetCategory, AssetStatus, Vec3 } from '../types';
import { floors, FOOTPRINT, floorY } from './facility';
import { seededRandom, isoMinusDays, round } from '../utils';

// ============================================================================
// Asset inventory across the facility. Each asset is geolocated in the 3D twin
// and carries health + predictive-maintenance fields used by the AI engine.
// ============================================================================

interface AssetSeed {
  tag: string;
  name: string;
  category: AssetCategory;
  floorIdx: number; // index into floors[]
  zoneIdx: number; // 0-3 quadrant
  manufacturer: string;
  model: string;
  installYearsAgo: number;
  mtbfDays: number;
  // Optional story overrides:
  status?: AssetStatus;
  healthPct?: number;
  predictedFailureDays?: number | null;
  failureProbability?: number;
  recommendation?: string;
}

const seeds: AssetSeed[] = [
  // ---- B1 | Parking & Plant (flr-01) ----
  { tag: 'UPS-A1', name: 'UPS System A (Primary)', category: 'UPS', floorIdx: 0, zoneIdx: 3, manufacturer: 'Eaton', model: '93PM-160', installYearsAgo: 3, mtbfDays: 900,
    status: 'critical', healthPct: 41, predictedFailureDays: 4, failureProbability: 0.78,
    recommendation: 'Replace battery string 2 within 72h - cells exceeding thermal threshold under load.' },
  { tag: 'UPS-B1', name: 'UPS System B (Redundant)', category: 'UPS', floorIdx: 0, zoneIdx: 3, manufacturer: 'Eaton', model: '93PM-160', installYearsAgo: 3, mtbfDays: 900 },
  { tag: 'GEN-01', name: 'Standby Diesel Generator', category: 'Electrical', floorIdx: 0, zoneIdx: 3, manufacturer: 'Caterpillar', model: 'C32 1000kVA', installYearsAgo: 3, mtbfDays: 1400 },
  { tag: 'CHL-01', name: 'Chiller Unit 1', category: 'HVAC', floorIdx: 0, zoneIdx: 2, manufacturer: 'Carrier', model: '30XA-802', installYearsAgo: 4, mtbfDays: 700,
    status: 'warning', healthPct: 58, predictedFailureDays: 12, failureProbability: 0.46,
    recommendation: 'Compressor 2 vibration trending up; schedule bearing inspection within 10 days.' },
  { tag: 'CHL-02', name: 'Chiller Unit 2', category: 'HVAC', floorIdx: 0, zoneIdx: 2, manufacturer: 'Carrier', model: '30XA-802', installYearsAgo: 4, mtbfDays: 700 },
  { tag: 'LV-PNL-01', name: 'Main LV Distribution Panel', category: 'Electrical', floorIdx: 0, zoneIdx: 1, manufacturer: 'Schneider', model: 'Blokset', installYearsAgo: 3, mtbfDays: 1600,
    status: 'warning', healthPct: 64, predictedFailureDays: 21, failureProbability: 0.33,
    recommendation: 'Phase imbalance + elevated busbar temperature detected - thermographic survey advised.' },
  { tag: 'TX-01', name: 'Power Transformer T1', category: 'Electrical', floorIdx: 0, zoneIdx: 1, manufacturer: 'ABB', model: 'RESIBLOC 1250', installYearsAgo: 3, mtbfDays: 3000 },
  { tag: 'CAM-B1-01', name: 'Vehicle Bay Camera N', category: 'Camera', floorIdx: 0, zoneIdx: 0, manufacturer: 'Axis', model: 'Q1798-LE', installYearsAgo: 2, mtbfDays: 1800 },
  { tag: 'CAM-B1-02', name: 'Vehicle Bay Camera S', category: 'Camera', floorIdx: 0, zoneIdx: 0, manufacturer: 'Axis', model: 'Q1798-LE', installYearsAgo: 2, mtbfDays: 1800 },
  { tag: 'ACS-GATE-01', name: 'Vehicle Gate Barrier', category: 'AccessControl', floorIdx: 0, zoneIdx: 0, manufacturer: 'HID', model: 'EntryPoint', installYearsAgo: 2, mtbfDays: 1200 },
  { tag: 'SNS-LEAK-01', name: 'Plant Room Leak Sensor', category: 'Sensor', floorIdx: 0, zoneIdx: 2, manufacturer: 'Honeywell', model: 'FS90', installYearsAgo: 1, mtbfDays: 2400 },

  // ---- L1 | Public Services (flr-02) ----
  { tag: 'CAM-L1-01', name: 'Reception Camera', category: 'Camera', floorIdx: 1, zoneIdx: 0, manufacturer: 'Axis', model: 'P3268-LV', installYearsAgo: 2, mtbfDays: 1800 },
  { tag: 'CAM-L1-02', name: 'Lobby Atrium Camera', category: 'Camera', floorIdx: 1, zoneIdx: 3, manufacturer: 'Axis', model: 'P3268-LV', installYearsAgo: 2, mtbfDays: 1800 },
  { tag: 'CAM-L1-03', name: 'Screening Lane Camera', category: 'Camera', floorIdx: 1, zoneIdx: 2, manufacturer: 'Axis', model: 'Q3536-LVE', installYearsAgo: 1, mtbfDays: 1800 },
  { tag: 'ACS-ENT-01', name: 'Main Entrance Turnstiles', category: 'AccessControl', floorIdx: 1, zoneIdx: 2, manufacturer: 'Boon Edam', model: 'Speedlane Swing', installYearsAgo: 2, mtbfDays: 1100 },
  { tag: 'FIRE-L1', name: 'Fire Alarm Panel L1', category: 'FireSystem', floorIdx: 1, zoneIdx: 3, manufacturer: 'Siemens', model: 'Cerberus PRO', installYearsAgo: 3, mtbfDays: 2200 },
  { tag: 'AHU-L1', name: 'Air Handling Unit L1', category: 'HVAC', floorIdx: 1, zoneIdx: 1, manufacturer: 'Daikin', model: 'Modular L', installYearsAgo: 4, mtbfDays: 800 },
  { tag: 'SNS-AIR-L1', name: 'Lobby Air Quality Sensor', category: 'Sensor', floorIdx: 1, zoneIdx: 0, manufacturer: 'Honeywell', model: 'AQ-IAQ', installYearsAgo: 1, mtbfDays: 2400 },

  // ---- L2 | Operations & Dispatch (flr-03) ----
  { tag: 'CAM-L2-01', name: 'Command Room Camera', category: 'Camera', floorIdx: 2, zoneIdx: 0, manufacturer: 'Axis', model: 'P3268-LV', installYearsAgo: 2, mtbfDays: 1800 },
  { tag: 'CAM-L2-02', name: 'Dispatch Floor Camera', category: 'Camera', floorIdx: 2, zoneIdx: 1, manufacturer: 'Axis', model: 'P3268-LV', installYearsAgo: 2, mtbfDays: 1800,
    status: 'offline', healthPct: 0, predictedFailureDays: 0, failureProbability: 1,
    recommendation: 'No signal for 38m - PoE port fault suspected. Dispatch to network closet L2.' },
  { tag: 'ACS-C2-01', name: 'Command & Control Door', category: 'AccessControl', floorIdx: 2, zoneIdx: 0, manufacturer: 'HID', model: 'Signo 40', installYearsAgo: 2, mtbfDays: 1200 },
  { tag: 'FIRE-L2', name: 'Fire Alarm Panel L2', category: 'FireSystem', floorIdx: 2, zoneIdx: 2, manufacturer: 'Siemens', model: 'Cerberus PRO', installYearsAgo: 3, mtbfDays: 2200 },
  { tag: 'CRAC-L2', name: 'Precision Cooling L2', category: 'HVAC', floorIdx: 2, zoneIdx: 1, manufacturer: 'Vertiv', model: 'Liebert PCW', installYearsAgo: 3, mtbfDays: 750 },
  { tag: 'NET-SW-L2', name: 'Operations Core Switch', category: 'Network', floorIdx: 2, zoneIdx: 0, manufacturer: 'Cisco', model: 'Catalyst 9500', installYearsAgo: 2, mtbfDays: 2000 },

  // ---- L3 | Investigations (flr-04) ----
  { tag: 'CAM-L3-01', name: 'Forensics Lab Camera', category: 'Camera', floorIdx: 3, zoneIdx: 2, manufacturer: 'Axis', model: 'P3268-LV', installYearsAgo: 2, mtbfDays: 1800 },
  { tag: 'CAM-L3-02', name: 'Investigations Corridor Cam', category: 'Camera', floorIdx: 3, zoneIdx: 3, manufacturer: 'Axis', model: 'P3268-LV', installYearsAgo: 2, mtbfDays: 1800 },
  { tag: 'ACS-FOR-01', name: 'Forensics Lab Reader', category: 'AccessControl', floorIdx: 3, zoneIdx: 2, manufacturer: 'HID', model: 'Signo 40', installYearsAgo: 2, mtbfDays: 1200 },
  { tag: 'ACS-INT-01', name: 'Interview Suite Reader', category: 'AccessControl', floorIdx: 3, zoneIdx: 1, manufacturer: 'HID', model: 'Signo 20', installYearsAgo: 2, mtbfDays: 1200 },
  { tag: 'FIRE-L3', name: 'Fire Alarm Panel L3', category: 'FireSystem', floorIdx: 3, zoneIdx: 1, manufacturer: 'Siemens', model: 'Cerberus PRO', installYearsAgo: 3, mtbfDays: 2200 },
  { tag: 'AHU-L3', name: 'Air Handling Unit L3', category: 'HVAC', floorIdx: 3, zoneIdx: 0, manufacturer: 'Daikin', model: 'Modular L', installYearsAgo: 4, mtbfDays: 800 },

  // ---- L4 | Detention (flr-05) ----
  { tag: 'CAM-L4-01', name: 'Cellblock A Camera', category: 'Camera', floorIdx: 4, zoneIdx: 0, manufacturer: 'Axis', model: 'Q3536-LVE', installYearsAgo: 1, mtbfDays: 1800 },
  { tag: 'CAM-L4-02', name: 'Cellblock B Camera', category: 'Camera', floorIdx: 4, zoneIdx: 1, manufacturer: 'Axis', model: 'Q3536-LVE', installYearsAgo: 1, mtbfDays: 1800 },
  { tag: 'CAM-L4-03', name: 'Booking Area Camera', category: 'Camera', floorIdx: 4, zoneIdx: 2, manufacturer: 'Axis', model: 'Q3536-LVE', installYearsAgo: 1, mtbfDays: 1800 },
  { tag: 'ACS-CBA-01', name: 'Cellblock A Sallyport', category: 'AccessControl', floorIdx: 4, zoneIdx: 0, manufacturer: 'HID', model: 'Signo 40', installYearsAgo: 2, mtbfDays: 1100 },
  { tag: 'ACS-CBB-01', name: 'Cellblock B Sallyport', category: 'AccessControl', floorIdx: 4, zoneIdx: 1, manufacturer: 'HID', model: 'Signo 40', installYearsAgo: 2, mtbfDays: 1100 },
  { tag: 'FIRE-L4', name: 'Fire Alarm Panel L4', category: 'FireSystem', floorIdx: 4, zoneIdx: 3, manufacturer: 'Siemens', model: 'Cerberus PRO', installYearsAgo: 3, mtbfDays: 2200,
    status: 'warning', healthPct: 62, predictedFailureDays: 18, failureProbability: 0.4,
    recommendation: 'Loop 3 reporting intermittent device faults - inspect detector bases in Booking.' },
  { tag: 'AHU-L4', name: 'Air Handling Unit L4', category: 'HVAC', floorIdx: 4, zoneIdx: 3, manufacturer: 'Daikin', model: 'Modular L', installYearsAgo: 4, mtbfDays: 800 },
  { tag: 'SNS-DUR-L4', name: 'Booking Duress System', category: 'Sensor', floorIdx: 4, zoneIdx: 2, manufacturer: 'Honeywell', model: 'DR-100', installYearsAgo: 1, mtbfDays: 2400 },

  // ---- L5 | Secure Core (flr-06) ----
  { tag: 'CAM-L5-01', name: 'Data Center Camera', category: 'Camera', floorIdx: 5, zoneIdx: 0, manufacturer: 'Axis', model: 'P3268-LV', installYearsAgo: 1, mtbfDays: 1800 },
  { tag: 'CAM-L5-02', name: 'Evidence Vault Camera', category: 'Camera', floorIdx: 5, zoneIdx: 1, manufacturer: 'Axis', model: 'Q3536-LVE', installYearsAgo: 1, mtbfDays: 1800 },
  { tag: 'CAM-L5-03', name: 'Armory Camera', category: 'Camera', floorIdx: 5, zoneIdx: 2, manufacturer: 'Axis', model: 'Q3536-LVE', installYearsAgo: 1, mtbfDays: 1800 },
  { tag: 'ACS-VLT-01', name: 'Evidence Vault Reader', category: 'AccessControl', floorIdx: 5, zoneIdx: 1, manufacturer: 'HID', model: 'iCLASS SE', installYearsAgo: 2, mtbfDays: 1100,
    status: 'critical', healthPct: 47, predictedFailureDays: 6, failureProbability: 0.6,
    recommendation: 'Reader returning repeated read errors + 4 access denials in 1h - replace head, audit logs.' },
  { tag: 'ACS-ARM-01', name: 'Armory Reader', category: 'AccessControl', floorIdx: 5, zoneIdx: 2, manufacturer: 'HID', model: 'iCLASS SE', installYearsAgo: 2, mtbfDays: 1100 },
  { tag: 'ACS-DC-01', name: 'Data Center Door', category: 'AccessControl', floorIdx: 5, zoneIdx: 0, manufacturer: 'HID', model: 'iCLASS SE', installYearsAgo: 2, mtbfDays: 1100 },
  { tag: 'FIRE-L5', name: 'Clean-Agent Suppression', category: 'FireSystem', floorIdx: 5, zoneIdx: 0, manufacturer: 'Kidde', model: 'ECS Novec 1230', installYearsAgo: 2, mtbfDays: 2600 },
  { tag: 'CRAC-DC-01', name: 'Data Center CRAC Unit', category: 'HVAC', floorIdx: 5, zoneIdx: 0, manufacturer: 'Vertiv', model: 'Liebert PDX', installYearsAgo: 3, mtbfDays: 720,
    status: 'warning', healthPct: 69, predictedFailureDays: 27, failureProbability: 0.31,
    recommendation: 'Condensate pump cycling abnormally; supply-air temp drift +1.4°C over 14 days.' },
  { tag: 'UPS-CORE', name: 'Secure Core UPS', category: 'UPS', floorIdx: 5, zoneIdx: 0, manufacturer: 'Vertiv', model: 'Liebert APM', installYearsAgo: 3, mtbfDays: 900,
    status: 'warning', healthPct: 73, predictedFailureDays: 40, failureProbability: 0.22,
    recommendation: 'Battery capacity at 81% of rated; plan replacement in next maintenance window.' },
  { tag: 'NET-RTR-01', name: 'Secure Core Router', category: 'Network', floorIdx: 5, zoneIdx: 0, manufacturer: 'Cisco', model: 'Catalyst 8500', installYearsAgo: 2, mtbfDays: 2000 },
];

// Quadrant centers within the floor footprint (x, z).
const quadrant: Vec3[] = [
  { x: -FOOTPRINT.w / 4, y: 0, z: -FOOTPRINT.d / 4 },
  { x: FOOTPRINT.w / 4, y: 0, z: -FOOTPRINT.d / 4 },
  { x: -FOOTPRINT.w / 4, y: 0, z: FOOTPRINT.d / 4 },
  { x: FOOTPRINT.w / 4, y: 0, z: FOOTPRINT.d / 4 },
];

const localOffsets: { x: number; z: number }[] = [
  { x: -1.4, z: -1 },
  { x: 1.4, z: -1 },
  { x: -1.4, z: 1 },
  { x: 1.4, z: 1 },
  { x: 0, z: 0 },
];

function telemetryFor(
  category: AssetCategory,
  health: number,
  rng: () => number,
): Record<string, number | string> {
  switch (category) {
    case 'HVAC':
      return {
        supplyTempC: round(14 + (100 - health) * 0.06 + rng() * 1.5, 1),
        returnTempC: round(22 + rng() * 2, 1),
        airflowPct: round(60 + health * 0.35, 0),
        runHours: round(8000 + rng() * 20000, 0),
      };
    case 'UPS':
      return {
        loadPct: round(38 + rng() * 28, 0),
        batteryPct: round(Math.max(40, health), 0),
        runtimeMin: round(8 + (health / 100) * 22, 0),
        inputVoltage: round(228 + rng() * 6, 0),
      };
    case 'Electrical':
      return {
        loadKw: round(180 + rng() * 120, 0),
        voltageV: round(398 + rng() * 6, 0),
        harmonicsPct: round(2 + (100 - health) * 0.06, 1),
        tempC: round(34 + (100 - health) * 0.25, 0),
      };
    case 'FireSystem':
      return {
        devices: round(120 + rng() * 80, 0),
        faults: health < 70 ? round(1 + rng() * 3, 0) : 0,
        batteryPct: round(Math.max(70, health), 0),
        lastTestDays: round(rng() * 80, 0),
      };
    case 'Camera':
      return {
        fps: health > 0 ? 25 : 0,
        resolution: '4K',
        uptimePct: round(health > 0 ? 96 + rng() * 3.8 : 0, 1),
        retentionDays: 30,
      };
    case 'AccessControl':
      return {
        mode: health < 60 ? 'degraded' : 'secured',
        deniedToday: health < 60 ? round(3 + rng() * 4, 0) : round(rng() * 2, 0),
        grantedToday: round(40 + rng() * 220, 0),
        doorState: 'closed',
      };
    case 'Network':
      return {
        throughputMbps: round(400 + rng() * 4000, 0),
        latencyMs: round(0.4 + rng() * 1.6, 1),
        uptimePct: round(99.4 + rng() * 0.5, 2),
        portsUp: round(36 + rng() * 12, 0),
      };
    case 'Sensor':
    default:
      return {
        reading: round(rng() * 100, 1),
        status: health > 70 ? 'normal' : 'alert',
        batteryPct: round(Math.max(60, health), 0),
      };
  }
}

const perFloorZoneCount: Record<string, number> = {};

export const assets: Asset[] = seeds.map((s, i) => {
  const floor = floors[s.floorIdx];
  const zone = floor.zones[s.zoneIdx];
  const rng = seededRandom(1000 + i * 17);

  // Position: quadrant center + a local offset cycled per (floor, zone).
  const key = `${floor.id}-${s.zoneIdx}`;
  const local = perFloorZoneCount[key] ?? 0;
  perFloorZoneCount[key] = local + 1;
  const off = localOffsets[local % localOffsets.length];
  const qc = quadrant[s.zoneIdx];
  const position: Vec3 = {
    x: round(qc.x + off.x, 2),
    y: round(floorY(floor.level) + 0.6, 2),
    z: round(qc.z + off.z, 2),
  };

  const status: AssetStatus = s.status ?? 'operational';
  const healthPct =
    s.healthPct ?? round(84 + rng() * 15, 0); // 84-99 healthy default
  const predictedFailureDays =
    s.predictedFailureDays !== undefined
      ? s.predictedFailureDays
      : healthPct < 75
        ? round(30 + rng() * 60, 0)
        : null;
  const failureProbability =
    s.failureProbability ?? round((100 - healthPct) / 220, 2);

  return {
    id: `ast-${String(i + 1).padStart(3, '0')}`,
    tag: s.tag,
    name: s.name,
    category: s.category,
    floorId: floor.id,
    zoneId: zone.id,
    position,
    status,
    healthPct,
    manufacturer: s.manufacturer,
    model: s.model,
    installDate: isoMinusDays(s.installYearsAgo * 365 + Math.round(rng() * 120)),
    lastServiceDate: isoMinusDays(Math.round(20 + rng() * 160)),
    predictedFailureDays,
    failureProbability,
    mtbfDays: s.mtbfDays,
    recommendation: s.recommendation ?? null,
    telemetry: telemetryFor(s.category, healthPct, rng),
  };
});

// ----------------------------- Selectors ------------------------------------

export function assetById(id: string): Asset | undefined {
  return assets.find((a) => a.id === id);
}

export function assetsByFloor(floorId: string): Asset[] {
  return assets.filter((a) => a.floorId === floorId);
}

export function assetsByCategory(category: AssetCategory): Asset[] {
  return assets.filter((a) => a.category === category);
}

export const assetCategoryLabels: Record<AssetCategory, string> = {
  HVAC: 'HVAC Equipment',
  UPS: 'UPS / Power Backup',
  Electrical: 'Electrical',
  FireSystem: 'Fire & Life Safety',
  Camera: 'Surveillance Cameras',
  AccessControl: 'Access Control',
  Sensor: 'IoT Sensors',
  Network: 'Network',
};

export const assetCounts = {
  total: assets.length,
  online: assets.filter((a) => a.status !== 'offline').length,
  warning: assets.filter((a) => a.status === 'warning').length,
  critical: assets.filter((a) => a.status === 'critical').length,
  offline: assets.filter((a) => a.status === 'offline').length,
  byCategory: (Object.keys(assetCategoryLabels) as AssetCategory[]).reduce(
    (acc, c) => {
      acc[c] = assets.filter((a) => a.category === c).length;
      return acc;
    },
    {} as Record<AssetCategory, number>,
  ),
};
