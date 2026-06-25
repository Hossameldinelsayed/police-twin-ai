import type { Building, Floor, Zone } from '../types';

// ============================================================================
// Facility model - "Central Command HQ", a smart police headquarters.
// 6 levels (1 basement + ground + 4 upper), each with operational zones.
// Coordinates are normalized layout units used by the 3D Digital Twin.
// ============================================================================

export const building: Building = {
  id: 'bld-hq-01',
  name: 'Central Command HQ',
  code: 'PTX-HQ-01',
  address: 'Smart City District, Sector 7',
  floors: 6,
  areaSqm: 42_800,
  type: 'Police Headquarters & Operations Center',
  commissioned: '2023-02-15',
  status: 'online',
};

interface ZoneSeed {
  name: string;
  type: Zone['type'];
  critical?: boolean;
}

interface FloorSeed {
  level: number;
  name: string;
  areaSqm: number;
  capacity: number;
  zones: ZoneSeed[];
}

const floorSeeds: FloorSeed[] = [
  {
    level: -1,
    name: 'B1 | Parking & Plant',
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
    name: 'L1 | Public Services',
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
    name: 'L2 | Operations & Dispatch',
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
    name: 'L3 | Investigations',
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
    name: 'L4 | Detention',
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
    name: 'L5 | Secure Core',
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

// Build floors with stable ids and zone ids.
export const floors: Floor[] = floorSeeds.map((seed, fi) => {
  const floorId = `flr-${String(fi + 1).padStart(2, '0')}`;
  const zones: Zone[] = seed.zones.map((z, zi) => ({
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

export const allZones: Zone[] = floors.flatMap((f) => f.zones);

export function floorById(id: string): Floor | undefined {
  return floors.find((f) => f.id === id);
}

export function floorName(id: string): string {
  return floorById(id)?.name ?? id;
}

export function zoneById(id: string | null): Zone | undefined {
  if (!id) return undefined;
  return allZones.find((z) => z.id === id);
}

export function zoneName(id: string | null): string {
  if (!id) return '-';
  return zoneById(id)?.name ?? id;
}

// 3D layout helpers - each floor occupies a slab in Y. Footprint is a grid.
export const FLOOR_GAP = 2.6;
export const FOOTPRINT = { w: 16, d: 10 }; // x by z

export function floorY(level: number): number {
  // level -1 sits below ground; normalize to start near 0
  return (level + 1) * FLOOR_GAP;
}
