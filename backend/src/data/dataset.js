// ============================================================================
// POLICE TWIN AI — In-memory dataset (source of truth)
// ----------------------------------------------------------------------------
// Mirrors the frontend's data contracts (see frontend/lib/types.ts and
// frontend/lib/data/*). Fully deterministic: a small seeded PRNG is used so the
// same dataset is produced on every boot — no Math.random()/Date.now() at
// module scope. This module is consumed directly when USE_DB=false and is the
// canonical seed source for PostgreSQL (db/seed.js).
// ============================================================================

'use strict';

// ----------------------------------------------------------------------------
// Deterministic helpers (mirror frontend/lib/utils.ts)
// ----------------------------------------------------------------------------

// Fixed reference clock so the dataset is reproducible across processes.
const NOW_ISO = '2026-06-24T14:30:00.000Z';
const NOW = new Date(NOW_ISO);

/** Deterministic seeded PRNG (mulberry32). Same seed -> same stream. */
function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round(n, dp = 0) {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

function isoMinusHours(hours) {
  return new Date(NOW.getTime() - hours * 3600000).toISOString();
}
function isoPlusDays(days) {
  return new Date(NOW.getTime() + days * 86400000).toISOString();
}
function isoMinusDays(days) {
  return new Date(NOW.getTime() - days * 86400000).toISOString();
}

// ----------------------------------------------------------------------------
// Facility — "Central Command HQ" (mirror frontend/lib/data/facility.ts)
// ----------------------------------------------------------------------------

const building = {
  id: 'bld-hq-01',
  name: 'Central Command HQ',
  code: 'PTX-HQ-01',
  address: 'Smart City District, Sector 7',
  floors: 6,
  areaSqm: 42800,
  type: 'Police Headquarters & Operations Center',
  commissioned: '2023-02-15',
  status: 'online',
};

const floorSeeds = [
  {
    level: -1,
    name: 'B1 · Parking & Plant',
    areaSqm: 9200,
    capacity: 60,
    zones: [
      { name: 'Vehicle Bay', type: 'parking' },
      { name: 'Main Electrical Room', type: 'utility', critical: true },
      { name: 'Chiller Plant', type: 'utility', critical: true },
      { name: 'UPS & Generator Room', type: 'utility', critical: true },
    ],
  },
  {
    level: 0,
    name: 'L1 · Public Services',
    areaSqm: 7600,
    capacity: 320,
    zones: [
      { name: 'Main Reception', type: 'public' },
      { name: 'Public Service Counters', type: 'public' },
      { name: 'Security Screening', type: 'public', critical: true },
      { name: 'Lobby Atrium', type: 'public' },
    ],
  },
  {
    level: 1,
    name: 'L2 · Operations & Dispatch',
    areaSqm: 7200,
    capacity: 180,
    zones: [
      { name: 'Command & Control Room', type: 'operations', critical: true },
      { name: 'Dispatch Floor', type: 'operations', critical: true },
      { name: 'Briefing Hall', type: 'operations' },
      { name: 'Watch Supervisor Suite', type: 'operations' },
    ],
  },
  {
    level: 2,
    name: 'L3 · Investigations',
    areaSqm: 6800,
    capacity: 150,
    zones: [
      { name: 'Investigations Bureau', type: 'admin' },
      { name: 'Interview Suites', type: 'admin', critical: true },
      { name: 'Forensics Lab', type: 'evidence', critical: true },
      { name: 'Records & Admin', type: 'admin' },
    ],
  },
  {
    level: 3,
    name: 'L4 · Detention',
    areaSqm: 6000,
    capacity: 96,
    zones: [
      { name: 'Holding Cells A', type: 'detention', critical: true },
      { name: 'Holding Cells B', type: 'detention', critical: true },
      { name: 'Booking & Processing', type: 'detention', critical: true },
      { name: 'Detainee Medical', type: 'detention' },
    ],
  },
  {
    level: 4,
    name: 'L5 · Secure Core',
    areaSqm: 6000,
    capacity: 60,
    zones: [
      { name: 'Primary Data Center', type: 'server', critical: true },
      { name: 'Evidence Vault', type: 'evidence', critical: true },
      { name: 'Armory', type: 'armory', critical: true },
      { name: 'Executive Operations', type: 'admin' },
    ],
  },
];

// 3D layout helpers — each floor occupies a slab in Y. Footprint is a grid.
const FLOOR_GAP = 2.6;
const FOOTPRINT = { w: 16, d: 10 };
function floorY(level) {
  return (level + 1) * FLOOR_GAP;
}

const floors = floorSeeds.map((seed, fi) => {
  const floorId = `flr-${String(fi + 1).padStart(2, '0')}`;
  const zones = seed.zones.map((z, zi) => ({
    id: `${floorId}-z${zi + 1}`,
    floorId,
    name: z.name,
    type: z.type,
    critical: !!z.critical,
  }));
  return {
    id: floorId,
    buildingId: building.id,
    level: seed.level,
    name: seed.name,
    areaSqm: seed.areaSqm,
    capacity: seed.capacity,
    zones,
  };
});

const allZones = floors.flatMap((f) => f.zones);

function floorById(id) {
  return floors.find((f) => f.id === id);
}
function floorName(id) {
  const f = floorById(id);
  return f ? f.name : id;
}

// ----------------------------------------------------------------------------
// Assets (mirror frontend/lib/data/assets.ts)
// ----------------------------------------------------------------------------

const assetSeeds = [
  // ---- B1 · Parking & Plant (flr-01) ----
  { tag: 'UPS-A1', name: 'UPS System A (Primary)', category: 'UPS', floorIdx: 0, zoneIdx: 3, manufacturer: 'Eaton', model: '93PM-160', installYearsAgo: 3, mtbfDays: 900, status: 'critical', healthPct: 41, predictedFailureDays: 4, failureProbability: 0.78, recommendation: 'Replace battery string 2 within 72h — cells exceeding thermal threshold under load.' },
  { tag: 'UPS-B1', name: 'UPS System B (Redundant)', category: 'UPS', floorIdx: 0, zoneIdx: 3, manufacturer: 'Eaton', model: '93PM-160', installYearsAgo: 3, mtbfDays: 900 },
  { tag: 'GEN-01', name: 'Standby Diesel Generator', category: 'Electrical', floorIdx: 0, zoneIdx: 3, manufacturer: 'Caterpillar', model: 'C32 1000kVA', installYearsAgo: 3, mtbfDays: 1400 },
  { tag: 'CHL-01', name: 'Chiller Unit 1', category: 'HVAC', floorIdx: 0, zoneIdx: 2, manufacturer: 'Carrier', model: '30XA-802', installYearsAgo: 4, mtbfDays: 700, status: 'warning', healthPct: 58, predictedFailureDays: 12, failureProbability: 0.46, recommendation: 'Compressor 2 vibration trending up; schedule bearing inspection within 10 days.' },
  { tag: 'CHL-02', name: 'Chiller Unit 2', category: 'HVAC', floorIdx: 0, zoneIdx: 2, manufacturer: 'Carrier', model: '30XA-802', installYearsAgo: 4, mtbfDays: 700 },
  { tag: 'LV-PNL-01', name: 'Main LV Distribution Panel', category: 'Electrical', floorIdx: 0, zoneIdx: 1, manufacturer: 'Schneider', model: 'Blokset', installYearsAgo: 3, mtbfDays: 1600, status: 'warning', healthPct: 64, predictedFailureDays: 21, failureProbability: 0.33, recommendation: 'Phase imbalance + elevated busbar temperature detected — thermographic survey advised.' },
  { tag: 'TX-01', name: 'Power Transformer T1', category: 'Electrical', floorIdx: 0, zoneIdx: 1, manufacturer: 'ABB', model: 'RESIBLOC 1250', installYearsAgo: 3, mtbfDays: 3000 },
  { tag: 'CAM-B1-01', name: 'Vehicle Bay Camera N', category: 'Camera', floorIdx: 0, zoneIdx: 0, manufacturer: 'Axis', model: 'Q1798-LE', installYearsAgo: 2, mtbfDays: 1800 },
  { tag: 'CAM-B1-02', name: 'Vehicle Bay Camera S', category: 'Camera', floorIdx: 0, zoneIdx: 0, manufacturer: 'Axis', model: 'Q1798-LE', installYearsAgo: 2, mtbfDays: 1800 },
  { tag: 'ACS-GATE-01', name: 'Vehicle Gate Barrier', category: 'AccessControl', floorIdx: 0, zoneIdx: 0, manufacturer: 'HID', model: 'EntryPoint', installYearsAgo: 2, mtbfDays: 1200 },
  { tag: 'SNS-LEAK-01', name: 'Plant Room Leak Sensor', category: 'Sensor', floorIdx: 0, zoneIdx: 2, manufacturer: 'Honeywell', model: 'FS90', installYearsAgo: 1, mtbfDays: 2400 },

  // ---- L1 · Public Services (flr-02) ----
  { tag: 'CAM-L1-01', name: 'Reception Camera', category: 'Camera', floorIdx: 1, zoneIdx: 0, manufacturer: 'Axis', model: 'P3268-LV', installYearsAgo: 2, mtbfDays: 1800 },
  { tag: 'CAM-L1-02', name: 'Lobby Atrium Camera', category: 'Camera', floorIdx: 1, zoneIdx: 3, manufacturer: 'Axis', model: 'P3268-LV', installYearsAgo: 2, mtbfDays: 1800 },
  { tag: 'CAM-L1-03', name: 'Screening Lane Camera', category: 'Camera', floorIdx: 1, zoneIdx: 2, manufacturer: 'Axis', model: 'Q3536-LVE', installYearsAgo: 1, mtbfDays: 1800 },
  { tag: 'ACS-ENT-01', name: 'Main Entrance Turnstiles', category: 'AccessControl', floorIdx: 1, zoneIdx: 2, manufacturer: 'Boon Edam', model: 'Speedlane Swing', installYearsAgo: 2, mtbfDays: 1100 },
  { tag: 'FIRE-L1', name: 'Fire Alarm Panel L1', category: 'FireSystem', floorIdx: 1, zoneIdx: 3, manufacturer: 'Siemens', model: 'Cerberus PRO', installYearsAgo: 3, mtbfDays: 2200 },
  { tag: 'AHU-L1', name: 'Air Handling Unit L1', category: 'HVAC', floorIdx: 1, zoneIdx: 1, manufacturer: 'Daikin', model: 'Modular L', installYearsAgo: 4, mtbfDays: 800 },
  { tag: 'SNS-AIR-L1', name: 'Lobby Air Quality Sensor', category: 'Sensor', floorIdx: 1, zoneIdx: 0, manufacturer: 'Honeywell', model: 'AQ-IAQ', installYearsAgo: 1, mtbfDays: 2400 },

  // ---- L2 · Operations & Dispatch (flr-03) ----
  { tag: 'CAM-L2-01', name: 'Command Room Camera', category: 'Camera', floorIdx: 2, zoneIdx: 0, manufacturer: 'Axis', model: 'P3268-LV', installYearsAgo: 2, mtbfDays: 1800 },
  { tag: 'CAM-L2-02', name: 'Dispatch Floor Camera', category: 'Camera', floorIdx: 2, zoneIdx: 1, manufacturer: 'Axis', model: 'P3268-LV', installYearsAgo: 2, mtbfDays: 1800, status: 'offline', healthPct: 0, predictedFailureDays: 0, failureProbability: 1, recommendation: 'No signal for 38m — PoE port fault suspected. Dispatch to network closet L2.' },
  { tag: 'ACS-C2-01', name: 'Command & Control Door', category: 'AccessControl', floorIdx: 2, zoneIdx: 0, manufacturer: 'HID', model: 'Signo 40', installYearsAgo: 2, mtbfDays: 1200 },
  { tag: 'FIRE-L2', name: 'Fire Alarm Panel L2', category: 'FireSystem', floorIdx: 2, zoneIdx: 2, manufacturer: 'Siemens', model: 'Cerberus PRO', installYearsAgo: 3, mtbfDays: 2200 },
  { tag: 'CRAC-L2', name: 'Precision Cooling L2', category: 'HVAC', floorIdx: 2, zoneIdx: 1, manufacturer: 'Vertiv', model: 'Liebert PCW', installYearsAgo: 3, mtbfDays: 750 },
  { tag: 'NET-SW-L2', name: 'Operations Core Switch', category: 'Network', floorIdx: 2, zoneIdx: 0, manufacturer: 'Cisco', model: 'Catalyst 9500', installYearsAgo: 2, mtbfDays: 2000 },

  // ---- L3 · Investigations (flr-04) ----
  { tag: 'CAM-L3-01', name: 'Forensics Lab Camera', category: 'Camera', floorIdx: 3, zoneIdx: 2, manufacturer: 'Axis', model: 'P3268-LV', installYearsAgo: 2, mtbfDays: 1800 },
  { tag: 'CAM-L3-02', name: 'Investigations Corridor Cam', category: 'Camera', floorIdx: 3, zoneIdx: 3, manufacturer: 'Axis', model: 'P3268-LV', installYearsAgo: 2, mtbfDays: 1800 },
  { tag: 'ACS-FOR-01', name: 'Forensics Lab Reader', category: 'AccessControl', floorIdx: 3, zoneIdx: 2, manufacturer: 'HID', model: 'Signo 40', installYearsAgo: 2, mtbfDays: 1200 },
  { tag: 'ACS-INT-01', name: 'Interview Suite Reader', category: 'AccessControl', floorIdx: 3, zoneIdx: 1, manufacturer: 'HID', model: 'Signo 20', installYearsAgo: 2, mtbfDays: 1200 },
  { tag: 'FIRE-L3', name: 'Fire Alarm Panel L3', category: 'FireSystem', floorIdx: 3, zoneIdx: 1, manufacturer: 'Siemens', model: 'Cerberus PRO', installYearsAgo: 3, mtbfDays: 2200 },
  { tag: 'AHU-L3', name: 'Air Handling Unit L3', category: 'HVAC', floorIdx: 3, zoneIdx: 0, manufacturer: 'Daikin', model: 'Modular L', installYearsAgo: 4, mtbfDays: 800 },

  // ---- L4 · Detention (flr-05) ----
  { tag: 'CAM-L4-01', name: 'Cellblock A Camera', category: 'Camera', floorIdx: 4, zoneIdx: 0, manufacturer: 'Axis', model: 'Q3536-LVE', installYearsAgo: 1, mtbfDays: 1800 },
  { tag: 'CAM-L4-02', name: 'Cellblock B Camera', category: 'Camera', floorIdx: 4, zoneIdx: 1, manufacturer: 'Axis', model: 'Q3536-LVE', installYearsAgo: 1, mtbfDays: 1800 },
  { tag: 'CAM-L4-03', name: 'Booking Area Camera', category: 'Camera', floorIdx: 4, zoneIdx: 2, manufacturer: 'Axis', model: 'Q3536-LVE', installYearsAgo: 1, mtbfDays: 1800 },
  { tag: 'ACS-CBA-01', name: 'Cellblock A Sallyport', category: 'AccessControl', floorIdx: 4, zoneIdx: 0, manufacturer: 'HID', model: 'Signo 40', installYearsAgo: 2, mtbfDays: 1100 },
  { tag: 'ACS-CBB-01', name: 'Cellblock B Sallyport', category: 'AccessControl', floorIdx: 4, zoneIdx: 1, manufacturer: 'HID', model: 'Signo 40', installYearsAgo: 2, mtbfDays: 1100 },
  { tag: 'FIRE-L4', name: 'Fire Alarm Panel L4', category: 'FireSystem', floorIdx: 4, zoneIdx: 3, manufacturer: 'Siemens', model: 'Cerberus PRO', installYearsAgo: 3, mtbfDays: 2200, status: 'warning', healthPct: 62, predictedFailureDays: 18, failureProbability: 0.4, recommendation: 'Loop 3 reporting intermittent device faults — inspect detector bases in Booking.' },
  { tag: 'AHU-L4', name: 'Air Handling Unit L4', category: 'HVAC', floorIdx: 4, zoneIdx: 3, manufacturer: 'Daikin', model: 'Modular L', installYearsAgo: 4, mtbfDays: 800 },
  { tag: 'SNS-DUR-L4', name: 'Booking Duress System', category: 'Sensor', floorIdx: 4, zoneIdx: 2, manufacturer: 'Honeywell', model: 'DR-100', installYearsAgo: 1, mtbfDays: 2400 },

  // ---- L5 · Secure Core (flr-06) ----
  { tag: 'CAM-L5-01', name: 'Data Center Camera', category: 'Camera', floorIdx: 5, zoneIdx: 0, manufacturer: 'Axis', model: 'P3268-LV', installYearsAgo: 1, mtbfDays: 1800 },
  { tag: 'CAM-L5-02', name: 'Evidence Vault Camera', category: 'Camera', floorIdx: 5, zoneIdx: 1, manufacturer: 'Axis', model: 'Q3536-LVE', installYearsAgo: 1, mtbfDays: 1800 },
  { tag: 'CAM-L5-03', name: 'Armory Camera', category: 'Camera', floorIdx: 5, zoneIdx: 2, manufacturer: 'Axis', model: 'Q3536-LVE', installYearsAgo: 1, mtbfDays: 1800 },
  { tag: 'ACS-VLT-01', name: 'Evidence Vault Reader', category: 'AccessControl', floorIdx: 5, zoneIdx: 1, manufacturer: 'HID', model: 'iCLASS SE', installYearsAgo: 2, mtbfDays: 1100, status: 'critical', healthPct: 47, predictedFailureDays: 6, failureProbability: 0.6, recommendation: 'Reader returning repeated read errors + 4 access denials in 1h — replace head, audit logs.' },
  { tag: 'ACS-ARM-01', name: 'Armory Reader', category: 'AccessControl', floorIdx: 5, zoneIdx: 2, manufacturer: 'HID', model: 'iCLASS SE', installYearsAgo: 2, mtbfDays: 1100 },
  { tag: 'ACS-DC-01', name: 'Data Center Door', category: 'AccessControl', floorIdx: 5, zoneIdx: 0, manufacturer: 'HID', model: 'iCLASS SE', installYearsAgo: 2, mtbfDays: 1100 },
  { tag: 'FIRE-L5', name: 'Clean-Agent Suppression', category: 'FireSystem', floorIdx: 5, zoneIdx: 0, manufacturer: 'Kidde', model: 'ECS Novec 1230', installYearsAgo: 2, mtbfDays: 2600 },
  { tag: 'CRAC-DC-01', name: 'Data Center CRAC Unit', category: 'HVAC', floorIdx: 5, zoneIdx: 0, manufacturer: 'Vertiv', model: 'Liebert PDX', installYearsAgo: 3, mtbfDays: 720, status: 'warning', healthPct: 69, predictedFailureDays: 27, failureProbability: 0.31, recommendation: 'Condensate pump cycling abnormally; supply-air temp drift +1.4°C over 14 days.' },
  { tag: 'UPS-CORE', name: 'Secure Core UPS', category: 'UPS', floorIdx: 5, zoneIdx: 0, manufacturer: 'Vertiv', model: 'Liebert APM', installYearsAgo: 3, mtbfDays: 900, status: 'warning', healthPct: 73, predictedFailureDays: 40, failureProbability: 0.22, recommendation: 'Battery capacity at 81% of rated; plan replacement in next maintenance window.' },
  { tag: 'NET-RTR-01', name: 'Secure Core Router', category: 'Network', floorIdx: 5, zoneIdx: 0, manufacturer: 'Cisco', model: 'Catalyst 8500', installYearsAgo: 2, mtbfDays: 2000 },
];

// Quadrant centers within the floor footprint (x, z).
const quadrant = [
  { x: -FOOTPRINT.w / 4, y: 0, z: -FOOTPRINT.d / 4 },
  { x: FOOTPRINT.w / 4, y: 0, z: -FOOTPRINT.d / 4 },
  { x: -FOOTPRINT.w / 4, y: 0, z: FOOTPRINT.d / 4 },
  { x: FOOTPRINT.w / 4, y: 0, z: FOOTPRINT.d / 4 },
];

const localOffsets = [
  { x: -1.4, z: -1 },
  { x: 1.4, z: -1 },
  { x: -1.4, z: 1 },
  { x: 1.4, z: 1 },
  { x: 0, z: 0 },
];

function telemetryFor(category, health, rng) {
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

const perFloorZoneCount = {};

const assets = assetSeeds.map((s, i) => {
  const floor = floors[s.floorIdx];
  const zone = floor.zones[s.zoneIdx];
  const rng = seededRandom(1000 + i * 17);

  const key = `${floor.id}-${s.zoneIdx}`;
  const local = perFloorZoneCount[key] || 0;
  perFloorZoneCount[key] = local + 1;
  const off = localOffsets[local % localOffsets.length];
  const qc = quadrant[s.zoneIdx];
  const position = {
    x: round(qc.x + off.x, 2),
    y: round(floorY(floor.level) + 0.6, 2),
    z: round(qc.z + off.z, 2),
  };

  const status = s.status || 'operational';
  const healthPct = s.healthPct !== undefined ? s.healthPct : round(84 + rng() * 15, 0);
  const predictedFailureDays =
    s.predictedFailureDays !== undefined
      ? s.predictedFailureDays
      : healthPct < 75
        ? round(30 + rng() * 60, 0)
        : null;
  const failureProbability =
    s.failureProbability !== undefined ? s.failureProbability : round((100 - healthPct) / 220, 2);

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
    recommendation: s.recommendation || null,
    telemetry: telemetryFor(s.category, healthPct, rng),
  };
});

const assetCategoryLabels = {
  HVAC: 'HVAC Equipment',
  UPS: 'UPS / Power Backup',
  Electrical: 'Electrical',
  FireSystem: 'Fire & Life Safety',
  Camera: 'Surveillance Cameras',
  AccessControl: 'Access Control',
  Sensor: 'IoT Sensors',
  Network: 'Network',
};

function assetByTag(tag) {
  return assets.find((a) => a.tag === tag);
}

// ----------------------------------------------------------------------------
// Alarms (mirror frontend/lib/data/alarms.ts)
// ----------------------------------------------------------------------------

const alarmSeeds = [
  { type: 'power', severity: 'critical', title: 'UPS battery string over-temperature', message: 'UPS System A reporting battery string 2 over thermal threshold under load. Redundancy reduced.', assetTag: 'UPS-A1', status: 'active', hoursAgo: 0.6, source: 'Power Management System' },
  { type: 'access', severity: 'high', title: 'Repeated access denials — Evidence Vault', message: '4 denied credential reads in 60 minutes at Evidence Vault reader. Reader head returning errors.', assetTag: 'ACS-VLT-01', status: 'active', hoursAgo: 0.9, source: 'Access Control' },
  { type: 'network', severity: 'high', title: 'Camera signal lost — Dispatch Floor', message: 'Dispatch Floor Camera offline for 38 minutes. Suspected PoE port fault on L2.', assetTag: 'CAM-L2-02', status: 'active', hoursAgo: 0.65, source: 'VMS Health Monitor' },
  { type: 'environmental', severity: 'medium', title: 'Data center supply-air temperature drift', message: 'CRAC unit supply temperature +1.4°C over 14-day baseline. Cooling efficiency degrading.', assetTag: 'CRAC-DC-01', status: 'active', hoursAgo: 2.4, source: 'BMS' },
  { type: 'fire', severity: 'medium', title: 'Fire loop intermittent device fault', message: 'Fire Panel L4 loop 3 reporting intermittent detector faults in Booking area.', assetTag: 'FIRE-L4', status: 'active', hoursAgo: 3.1, source: 'Fire Alarm System' },
  { type: 'security', severity: 'medium', title: 'Tailgating detected — Main Entrance', message: 'Analytics flagged a tailgating event at main turnstiles. Clip forwarded to watch desk.', assetTag: 'ACS-ENT-01', status: 'active', hoursAgo: 1.8, source: 'Video Analytics' },
  { type: 'maintenance', severity: 'medium', title: 'Chiller compressor vibration anomaly', message: 'Chiller Unit 1 compressor 2 vibration trending above advisory band.', assetTag: 'CHL-01', status: 'active', hoursAgo: 5.5, source: 'Predictive Maintenance AI' },
  { type: 'environmental', severity: 'medium', title: 'HVAC energy consumption anomaly', message: 'Basement plant drawing 22% above modeled load for current occupancy/weather.', floorId: 'flr-01', status: 'active', hoursAgo: 4.2, source: 'Energy Analytics AI' },
  { type: 'access', severity: 'low', title: 'Door held open — Forensics Lab', message: 'Forensics Lab door held open beyond 45s threshold. Auto-resolved on closure.', assetTag: 'ACS-FOR-01', status: 'acknowledged', hoursAgo: 6.7, source: 'Access Control', acknowledgedBy: 'Sgt. A. Rahman' },
  { type: 'environmental', severity: 'low', title: 'Elevated CO₂ — Lobby Atrium', message: 'Lobby CO₂ reached 1,180 ppm during peak public hours. Ventilation boosted automatically.', assetTag: 'SNS-AIR-L1', status: 'acknowledged', hoursAgo: 8.0, source: 'IAQ Sensor', acknowledgedBy: 'Facilities Desk' },
  { type: 'security', severity: 'high', title: 'Perimeter motion after hours', message: 'Vehicle bay motion detected at 02:14. Verified as cleared patrol unit. No action required.', assetTag: 'CAM-B1-01', status: 'resolved', hoursAgo: 12.3, source: 'Video Analytics', acknowledgedBy: 'Watch Cdr. L. Haddad' },
  { type: 'power', severity: 'medium', title: 'Utility mains voltage dip', message: 'Brief mains voltage sag; load transferred to UPS for 2.1s. Systems nominal.', floorId: 'flr-01', status: 'resolved', hoursAgo: 18.5, source: 'Power Management System', acknowledgedBy: 'Auto' },
  { type: 'fire', severity: 'low', title: 'Scheduled detector test', message: 'Monthly detector test executed on L3 loop. All devices passed.', assetTag: 'FIRE-L3', status: 'resolved', hoursAgo: 21.0, source: 'Fire Alarm System', acknowledgedBy: 'Maint. Team' },
];

const alarms = alarmSeeds.map((s, i) => {
  const asset = s.assetTag ? assetByTag(s.assetTag) : null;
  return {
    id: `alm-${String(i + 1).padStart(3, '0')}`,
    type: s.type,
    severity: s.severity,
    title: s.title,
    message: s.message,
    assetId: asset ? asset.id : null,
    floorId: s.floorId || (asset ? asset.floorId : 'flr-01'),
    zoneId: asset ? asset.zoneId : null,
    status: s.status,
    timestamp: isoMinusHours(s.hoursAgo),
    source: s.source,
    acknowledgedBy: s.acknowledgedBy || null,
  };
});

// ----------------------------------------------------------------------------
// Energy telemetry — 24h hourly (mirror frontend/lib/data/telemetry.ts)
// ----------------------------------------------------------------------------

const energyRng = seededRandom(777);

function loadCurve(hour) {
  const base = 520;
  const morning = 380 * Math.exp(-Math.pow(hour - 10, 2) / 12);
  const afternoon = 300 * Math.exp(-Math.pow(hour - 15, 2) / 14);
  const night = 90 * Math.exp(-Math.pow(hour - 3, 2) / 30);
  return base + morning + afternoon + night;
}

const energyReadings = Array.from({ length: 24 }, (_, h) => {
  const baseline = loadCurve(h);
  const anomaly = h >= 12 && h <= 15 ? 150 + energyRng() * 60 : 0;
  const noise = (energyRng() - 0.5) * 40;
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
const currentPowerKw = energyReadings[currentHour] ? energyReadings[currentHour].kwh : energyReadings[14].kwh;
const energyTodayKwh = round(
  energyReadings.slice(0, currentHour + 1).reduce((s, r) => s + r.kwh, 0),
  0,
);
const energyBaselineToday = round(
  energyReadings.slice(0, currentHour + 1).reduce((s, r) => s + r.baseline, 0),
  0,
);
const energyDeltaPct = round(((energyTodayKwh - energyBaselineToday) / energyBaselineToday) * 100, 1);

const energyBreakdown = (() => {
  const total = energyReadings.reduce((s, r) => s + r.kwh, 0);
  const hvac = energyReadings.reduce((s, r) => s + r.hvacKwh, 0);
  const it = energyReadings.reduce((s, r) => s + r.itKwh, 0);
  const lighting = energyReadings.reduce((s, r) => s + r.lightingKwh, 0);
  const other = total - hvac - it - lighting;
  const rows = [
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

// ----------------------------------------------------------------------------
// Occupancy (mirror frontend/lib/data/telemetry.ts)
// ----------------------------------------------------------------------------

const todFactor = 0.42 + 0.5 * Math.exp(-Math.pow(currentHour - 13, 2) / 20);

const occupancyByFloor = floors.map((f) => {
  const jitter = 0.8 + energyRng() * 0.4;
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

const occupancyTotal = occupancyByFloor.reduce((s, o) => s + o.count, 0);
const occupancyCapacity = floors.reduce((s, f) => s + f.capacity, 0);
const occupancyPct = round((occupancyTotal / occupancyCapacity) * 100, 0);

const occupancyZonePoints = [
  { zoneId: 'flr-03-z1', zoneName: 'Command & Control Room', count: 14, capacity: 24, anomaly: false },
  { zoneId: 'flr-03-z2', zoneName: 'Dispatch Floor', count: 31, capacity: 40, anomaly: false },
  { zoneId: 'flr-02-z1', zoneName: 'Main Reception', count: 58, capacity: 120, anomaly: false },
  { zoneId: 'flr-05-z3', zoneName: 'Booking & Processing', count: 9, capacity: 16, anomaly: false },
  { zoneId: 'flr-06-z2', zoneName: 'Evidence Vault', count: 2, capacity: 4, anomaly: true },
  { zoneId: 'flr-04-z3', zoneName: 'Forensics Lab', count: 6, capacity: 12, anomaly: false },
];

const occupancyHourly = Array.from({ length: 24 }, (_, h) => {
  const f = 0.4 + 0.55 * Math.exp(-Math.pow(h - 13, 2) / 22);
  const v = Math.round(occupancyCapacity * f * (0.9 + energyRng() * 0.15));
  return { date: `${String(h).padStart(2, '0')}:00`, value: v };
});

// ----------------------------------------------------------------------------
// 30-day trends (mirror frontend/lib/data/telemetry.ts)
// ----------------------------------------------------------------------------

function dayLabel(daysAgo) {
  return new Date(NOW.getTime() - daysAgo * 86400000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const N_DAYS = 30;

const riskTrend = Array.from({ length: N_DAYS }, (_, i) => {
  const daysAgo = N_DAYS - 1 - i;
  const baseRisk = 38 + 6 * Math.sin(i / 4);
  const ramp = daysAgo < 7 ? (7 - daysAgo) * 3.4 : 0;
  return { date: dayLabel(daysAgo), value: round(baseRisk + ramp + (energyRng() - 0.5) * 5, 0) };
});

const alarmTrend = Array.from({ length: N_DAYS }, (_, i) => {
  const daysAgo = N_DAYS - 1 - i;
  const base = 5 + 3 * Math.sin(i / 3);
  const ramp = daysAgo < 6 ? (6 - daysAgo) * 1.6 : 0;
  return { date: dayLabel(daysAgo), value: Math.max(1, Math.round(base + ramp + energyRng() * 3)) };
});

const energyTrend = Array.from({ length: N_DAYS }, (_, i) => {
  const daysAgo = N_DAYS - 1 - i;
  const base = 14.2 + 1.4 * Math.sin(i / 5);
  const ramp = daysAgo < 5 ? (5 - daysAgo) * 0.32 : 0;
  return { date: dayLabel(daysAgo), value: round(base + ramp + (energyRng() - 0.5) * 0.9, 1) };
});

const assetHealthTrend = Array.from({ length: N_DAYS }, (_, i) => {
  const daysAgo = N_DAYS - 1 - i;
  const base = 91 - i * 0.12;
  const dip = daysAgo < 8 ? (8 - daysAgo) * 0.7 : 0;
  return { date: dayLabel(daysAgo), value: round(base - dip + (energyRng() - 0.5) * 1.2, 1) };
});

const trendOverview = Array.from({ length: N_DAYS }, (_, i) => ({
  label: riskTrend[i].date,
  risk: riskTrend[i].value,
  alarms: alarmTrend[i].value,
  energyMWh: energyTrend[i].value,
  health: assetHealthTrend[i].value,
}));

// ----------------------------------------------------------------------------
// Maintenance work orders (mirror frontend/lib/data/maintenance.ts)
// ----------------------------------------------------------------------------

const maintenanceSeeds = [
  { assetTag: 'UPS-A1', kind: 'predictive', status: 'overdue', priority: 'critical', title: 'Replace UPS battery string 2', description: 'AI predicts failure within 4 days. Over-temperature under load; redundancy at risk.', dueInDays: -1, estimatedHours: 4, costEstimate: 6800 },
  { assetTag: 'ACS-VLT-01', kind: 'corrective', status: 'in_progress', priority: 'high', title: 'Replace Evidence Vault reader head', description: 'Repeated read errors and access denials. Reader hardware fault confirmed.', dueInDays: 0, technician: 'M. Okafor', estimatedHours: 2, costEstimate: 1200 },
  { assetTag: 'CAM-L2-02', kind: 'corrective', status: 'in_progress', priority: 'high', title: 'Restore Dispatch Floor camera', description: 'Camera offline — suspected PoE switch port fault. Swap port / patch lead.', dueInDays: 0, technician: 'IT NetOps', estimatedHours: 1.5, costEstimate: 300 },
  { assetTag: 'CHL-01', kind: 'predictive', status: 'scheduled', priority: 'high', title: 'Chiller 1 compressor bearing inspection', description: 'Vibration trend indicates bearing wear on compressor 2. Inspect & lubricate.', dueInDays: 6, technician: 'HVAC Contractor', estimatedHours: 6, costEstimate: 3200 },
  { assetTag: 'FIRE-L4', kind: 'corrective', status: 'scheduled', priority: 'medium', title: 'Inspect L4 fire loop 3 detectors', description: 'Intermittent device faults in Booking. Clean/replace detector bases on loop 3.', dueInDays: 3, technician: 'Fire Systems Co.', estimatedHours: 3, costEstimate: 900 },
  { assetTag: 'CRAC-DC-01', kind: 'predictive', status: 'scheduled', priority: 'medium', title: 'Data Center CRAC condensate service', description: 'Condensate pump cycling abnormally; supply temp drift. Service pump and coils.', dueInDays: 9, technician: 'HVAC Contractor', estimatedHours: 4, costEstimate: 1500 },
  { assetTag: 'LV-PNL-01', kind: 'predictive', status: 'scheduled', priority: 'high', title: 'Thermographic survey — Main LV panel', description: 'Phase imbalance + busbar heating. Infrared survey and torque check on connections.', dueInDays: 12, technician: 'Electrical Contractor', estimatedHours: 3, costEstimate: 2100 },
  { assetTag: 'UPS-CORE', kind: 'preventive', status: 'scheduled', priority: 'low', title: 'Secure Core UPS battery replacement', description: 'Battery capacity at 81% of rating. Plan replacement in next maintenance window.', dueInDays: 34, technician: 'Vertiv Service', estimatedHours: 5, costEstimate: 9400 },
  { assetTag: 'GEN-01', kind: 'preventive', status: 'scheduled', priority: 'low', title: 'Generator quarterly load test', description: 'Scheduled 30-min load-bank test and fuel polishing.', dueInDays: 18, technician: 'Power Service', estimatedHours: 3, costEstimate: 1800 },
  { assetTag: 'AHU-L3', kind: 'preventive', status: 'completed', priority: 'low', title: 'AHU L3 filter replacement', description: 'Routine filter swap and belt tension check. Completed and verified.', dueInDays: -5, technician: 'Facilities Team', estimatedHours: 2, costEstimate: 400 },
  { assetTag: 'FIRE-L3', kind: 'preventive', status: 'completed', priority: 'low', title: 'Monthly fire detector test — L3', description: 'All loop 1–2 devices passed scheduled functional test.', dueInDays: -1, technician: 'Fire Systems Co.', estimatedHours: 2, costEstimate: 350 },
];

const maintenanceEvents = maintenanceSeeds.map((s, i) => {
  const asset = assetByTag(s.assetTag);
  return {
    id: `mx-${String(i + 1).padStart(3, '0')}`,
    assetId: asset ? asset.id : '',
    assetName: asset ? asset.name : s.assetTag,
    kind: s.kind,
    status: s.status,
    priority: s.priority,
    title: s.title,
    description: s.description,
    scheduledDate: s.dueInDays >= 0 ? isoPlusDays(s.dueInDays) : isoMinusDays(-s.dueInDays),
    technician: s.technician || null,
    estimatedHours: s.estimatedHours,
    costEstimate: s.costEstimate,
  };
});

// ----------------------------------------------------------------------------
// Emergency scenarios (mirror frontend/lib/data/emergency.ts)
// ----------------------------------------------------------------------------

const emergencyScenarios = [
  {
    id: 'scn-fire',
    type: 'fire',
    name: 'Fire — Primary Data Center (L5)',
    severity: 'critical',
    description:
      'Smoke detected in the L5 Primary Data Center. Clean-agent suppression armed. Risk to evidence systems and core operations.',
    triggerNarrative:
      'VESDA aspirating detector + thermal camera correlate a smoke signature at rack row C. Fire panel L5 escalates to alarm.',
    impactedZones: [
      { zoneId: 'flr-06-z1', zoneName: 'Primary Data Center', floorName: 'L5 · Secure Core', impact: 'severe' },
      { zoneId: 'flr-06-z2', zoneName: 'Evidence Vault', floorName: 'L5 · Secure Core', impact: 'major' },
      { zoneId: 'flr-06-z3', zoneName: 'Armory', floorName: 'L5 · Secure Core', impact: 'moderate' },
      { zoneId: 'flr-05-z2', zoneName: 'Cellblock B', floorName: 'L4 · Detention', impact: 'minor' },
    ],
    responsePlan: [
      { order: 1, actor: 'Fire Detection AI', action: 'Confirm smoke signature, suppress false-positive checks, raise Stage-2 alarm', etaMinutes: 0, automated: true },
      { order: 2, actor: 'BMS', action: 'Shut down CRAC recirculation, close fire dampers, switch HVAC to smoke-control mode', etaMinutes: 1, automated: true },
      { order: 3, actor: 'Access Control', action: 'Release fail-safe egress doors on L5; lock down Evidence Vault & Armory', etaMinutes: 1, automated: true },
      { order: 4, actor: 'Suppression System', action: 'Arm clean-agent (Novec 1230) with 30s pre-discharge countdown', etaMinutes: 1, automated: true },
      { order: 5, actor: 'Watch Commander', action: 'Verify zone evacuation via cameras, authorize discharge if confirmed', etaMinutes: 2, automated: false },
      { order: 6, actor: 'On-site Security', action: 'Evacuate L5 occupants to muster point, sweep Secure Core', etaMinutes: 4, automated: false },
      { order: 7, actor: 'Fire Brigade', action: 'Dispatch and stage; civil defence ETA based on traffic feed', etaMinutes: 9, automated: false },
      { order: 8, actor: 'IT Operations', action: 'Initiate graceful failover of core services to DR site', etaMinutes: 6, automated: false },
    ],
    estimatedRecoveryMinutes: 240,
    affectedAssets: 11,
    affectedOccupants: 14,
    cascadeRisks: [
      'Core service outage if failover is delayed',
      'Evidence integrity exposure during suppression discharge',
      'Loss of L5 surveillance if power is isolated',
    ],
  },
  {
    id: 'scn-power',
    type: 'power_outage',
    name: 'Power Outage — Utility Mains Failure',
    severity: 'high',
    description:
      'Utility mains lost. Facility on UPS bridging to standby generator. UPS System A redundancy is currently degraded.',
    triggerNarrative:
      'Incoming 11kV feeder trips. ATS signals mains loss; critical loads transfer to UPS while generator spins up.',
    impactedZones: [
      { zoneId: 'flr-01-z3', zoneName: 'UPS & Generator Room', floorName: 'B1 · Parking & Plant', impact: 'severe' },
      { zoneId: 'flr-06-z1', zoneName: 'Primary Data Center', floorName: 'L5 · Secure Core', impact: 'major' },
      { zoneId: 'flr-03-z1', zoneName: 'Command & Control Room', floorName: 'L2 · Operations', impact: 'major' },
      { zoneId: 'flr-04-z3', zoneName: 'Holding Cells', floorName: 'L4 · Detention', impact: 'moderate' },
    ],
    responsePlan: [
      { order: 1, actor: 'Power Management AI', action: 'Detect mains loss, confirm UPS pickup, watch degraded UPS-A load', etaMinutes: 0, automated: true },
      { order: 2, actor: 'ATS', action: 'Signal standby generator start sequence', etaMinutes: 0, automated: true },
      { order: 3, actor: 'BMS', action: 'Shed non-essential loads (public lighting, comfort HVAC)', etaMinutes: 1, automated: true },
      { order: 4, actor: 'Generator', action: 'Reach rated voltage and accept building load', etaMinutes: 1, automated: true },
      { order: 5, actor: 'Watch Commander', action: 'Confirm critical systems on generator; brief command floor', etaMinutes: 3, automated: false },
      { order: 6, actor: 'Facilities', action: 'Manually monitor degraded UPS-A; stage replacement battery', etaMinutes: 8, automated: false },
      { order: 7, actor: 'Utility Liaison', action: 'Open ticket with utility provider for ETA on mains restoration', etaMinutes: 10, automated: false },
    ],
    estimatedRecoveryMinutes: 90,
    affectedAssets: 18,
    affectedOccupants: 320,
    cascadeRisks: [
      'UPS-A degraded — reduced ride-through if generator start fails',
      'Detention door controllers must remain powered (life-safety)',
      'Fuel autonomy ~36h; refuel logistics required for extended outage',
    ],
  },
  {
    id: 'scn-access',
    type: 'unauthorized_access',
    name: 'Unauthorized Access — Evidence Vault (L5)',
    severity: 'high',
    description:
      'Repeated forced-credential attempts at the Evidence Vault reader, coinciding with an after-hours occupancy anomaly.',
    triggerNarrative:
      'Access controller logs 4 denied reads in 60 min; occupancy sensor reports presence in a zone with no scheduled activity.',
    impactedZones: [
      { zoneId: 'flr-06-z2', zoneName: 'Evidence Vault', floorName: 'L5 · Secure Core', impact: 'severe' },
      { zoneId: 'flr-06-z3', zoneName: 'Armory', floorName: 'L5 · Secure Core', impact: 'major' },
      { zoneId: 'flr-06-z1', zoneName: 'Primary Data Center', floorName: 'L5 · Secure Core', impact: 'moderate' },
    ],
    responsePlan: [
      { order: 1, actor: 'Security Analytics AI', action: 'Correlate denied reads with occupancy anomaly, raise security alert', etaMinutes: 0, automated: true },
      { order: 2, actor: 'Access Control', action: 'Lock down Secure Core, suspend the involved credential', etaMinutes: 0, automated: true },
      { order: 3, actor: 'VMS', action: 'Pull and pin live + recorded feeds for L5 cameras to video wall', etaMinutes: 1, automated: true },
      { order: 4, actor: 'Watch Commander', action: 'Assess feeds, classify threat, authorize response posture', etaMinutes: 2, automated: false },
      { order: 5, actor: 'Response Team', action: 'Dispatch officers to L5; secure stairwells and lift lobby', etaMinutes: 4, automated: false },
      { order: 6, actor: 'Records Officer', action: 'Initiate evidence chain-of-custody audit for the vault', etaMinutes: 10, automated: false },
    ],
    estimatedRecoveryMinutes: 60,
    affectedAssets: 6,
    affectedOccupants: 2,
    cascadeRisks: [
      'Evidence chain-of-custody dispute if breach confirmed',
      'Vault reader hardware fault may mask legitimate access',
      'Potential coordinated diversion elsewhere in the facility',
    ],
  },
  {
    id: 'scn-equipment',
    type: 'equipment_failure',
    name: 'Equipment Failure — Cooling Loss, Data Center',
    severity: 'high',
    description:
      'Cascading cooling failure: Chiller 1 trips while the Data Center CRAC is already degraded, threatening thermal shutdown.',
    triggerNarrative:
      'Chiller 1 compressor fault removes plant capacity; CRAC supply-air temperature climbs past the safe envelope.',
    impactedZones: [
      { zoneId: 'flr-06-z1', zoneName: 'Primary Data Center', floorName: 'L5 · Secure Core', impact: 'severe' },
      { zoneId: 'flr-01-z2', zoneName: 'Chiller Plant', floorName: 'B1 · Parking & Plant', impact: 'major' },
      { zoneId: 'flr-03-z1', zoneName: 'Command & Control Room', floorName: 'L2 · Operations', impact: 'moderate' },
    ],
    responsePlan: [
      { order: 1, actor: 'Predictive Maintenance AI', action: 'Detect chiller trip, project data-center thermal runaway curve', etaMinutes: 0, automated: true },
      { order: 2, actor: 'BMS', action: 'Bring Chiller 2 online, maximize CRAC, open free-cooling dampers', etaMinutes: 1, automated: true },
      { order: 3, actor: 'IT Operations', action: 'Throttle non-critical compute to cut thermal load', etaMinutes: 3, automated: false },
      { order: 4, actor: 'Facilities', action: 'Deploy portable cooling to Data Center, inspect Chiller 1', etaMinutes: 12, automated: false },
      { order: 5, actor: 'Watch Commander', action: 'Decide on partial workload migration to DR if temps persist', etaMinutes: 8, automated: false },
      { order: 6, actor: 'HVAC Contractor', action: 'Mobilize for emergency chiller repair', etaMinutes: 45, automated: false },
    ],
    estimatedRecoveryMinutes: 180,
    affectedAssets: 9,
    affectedOccupants: 6,
    cascadeRisks: [
      'Thermal shutdown of core compute if temps exceed 32°C',
      'Single chiller operation removes cooling redundancy',
      'Knock-on risk to L2 operations cooling',
    ],
  },
];

// ----------------------------------------------------------------------------
// Public dataset bundle
// ----------------------------------------------------------------------------

const dataset = {
  // Clock / helpers (exported so other modules stay deterministic)
  NOW_ISO,
  NOW,
  // Facility
  building,
  floors,
  allZones,
  // Assets
  assets,
  assetCategoryLabels,
  // Alarms
  alarms,
  // Telemetry — energy
  energyReadings,
  currentPowerKw,
  energyTodayKwh,
  energyBaselineToday,
  energyDeltaPct,
  energyBreakdown,
  // Telemetry — occupancy
  occupancyByFloor,
  occupancyTotal,
  occupancyCapacity,
  occupancyPct,
  occupancyZonePoints,
  occupancyHourly,
  // Trends
  riskTrend,
  alarmTrend,
  energyTrend,
  assetHealthTrend,
  trendOverview,
  // Maintenance
  maintenanceEvents,
  // Emergency
  emergencyScenarios,
};

module.exports = {
  dataset,
  // helpers re-exported for the AI engine + seed script
  NOW,
  NOW_ISO,
  round,
  seededRandom,
  floorName,
  floorById,
};
