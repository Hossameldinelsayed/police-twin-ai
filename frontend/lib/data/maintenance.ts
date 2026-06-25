import type { MaintenanceEvent, MaintenanceKind, MaintenanceStatus, Severity } from '../types';
import { assets } from './assets';
import { isoPlusDays, isoMinusDays } from '../utils';

// ============================================================================
// Maintenance work orders - predictive (AI-generated), preventive, corrective.
// ============================================================================

interface MxSeed {
  assetTag: string;
  kind: MaintenanceKind;
  status: MaintenanceStatus;
  priority: Severity;
  title: string;
  description: string;
  dueInDays: number; // negative = overdue / past
  technician?: string;
  estimatedHours: number;
  costEstimate: number;
}

const seeds: MxSeed[] = [
  {
    assetTag: 'UPS-A1',
    kind: 'predictive',
    status: 'overdue',
    priority: 'critical',
    title: 'Replace UPS battery string 2',
    description: 'AI predicts failure within 4 days. Over-temperature under load; redundancy at risk.',
    dueInDays: -1,
    estimatedHours: 4,
    costEstimate: 6800,
  },
  {
    assetTag: 'ACS-VLT-01',
    kind: 'corrective',
    status: 'in_progress',
    priority: 'high',
    title: 'Replace Evidence Vault reader head',
    description: 'Repeated read errors and access denials. Reader hardware fault confirmed.',
    dueInDays: 0,
    technician: 'M. Okafor',
    estimatedHours: 2,
    costEstimate: 1200,
  },
  {
    assetTag: 'CAM-L2-02',
    kind: 'corrective',
    status: 'in_progress',
    priority: 'high',
    title: 'Restore Dispatch Floor camera',
    description: 'Camera offline - suspected PoE switch port fault. Swap port / patch lead.',
    dueInDays: 0,
    technician: 'IT NetOps',
    estimatedHours: 1.5,
    costEstimate: 300,
  },
  {
    assetTag: 'CHL-01',
    kind: 'predictive',
    status: 'scheduled',
    priority: 'high',
    title: 'Chiller 1 compressor bearing inspection',
    description: 'Vibration trend indicates bearing wear on compressor 2. Inspect & lubricate.',
    dueInDays: 6,
    technician: 'HVAC Contractor',
    estimatedHours: 6,
    costEstimate: 3200,
  },
  {
    assetTag: 'FIRE-L4',
    kind: 'corrective',
    status: 'scheduled',
    priority: 'medium',
    title: 'Inspect L4 fire loop 3 detectors',
    description: 'Intermittent device faults in Booking. Clean/replace detector bases on loop 3.',
    dueInDays: 3,
    technician: 'Fire Systems Co.',
    estimatedHours: 3,
    costEstimate: 900,
  },
  {
    assetTag: 'CRAC-DC-01',
    kind: 'predictive',
    status: 'scheduled',
    priority: 'medium',
    title: 'Data Center CRAC condensate service',
    description: 'Condensate pump cycling abnormally; supply temp drift. Service pump and coils.',
    dueInDays: 9,
    technician: 'HVAC Contractor',
    estimatedHours: 4,
    costEstimate: 1500,
  },
  {
    assetTag: 'LV-PNL-01',
    kind: 'predictive',
    status: 'scheduled',
    priority: 'high',
    title: 'Thermographic survey - Main LV panel',
    description: 'Phase imbalance + busbar heating. Infrared survey and torque check on connections.',
    dueInDays: 12,
    technician: 'Electrical Contractor',
    estimatedHours: 3,
    costEstimate: 2100,
  },
  {
    assetTag: 'UPS-CORE',
    kind: 'preventive',
    status: 'scheduled',
    priority: 'low',
    title: 'Secure Core UPS battery replacement',
    description: 'Battery capacity at 81% of rating. Plan replacement in next maintenance window.',
    dueInDays: 34,
    technician: 'Vertiv Service',
    estimatedHours: 5,
    costEstimate: 9400,
  },
  {
    assetTag: 'GEN-01',
    kind: 'preventive',
    status: 'scheduled',
    priority: 'low',
    title: 'Generator quarterly load test',
    description: 'Scheduled 30-min load-bank test and fuel polishing.',
    dueInDays: 18,
    technician: 'Power Service',
    estimatedHours: 3,
    costEstimate: 1800,
  },
  {
    assetTag: 'AHU-L3',
    kind: 'preventive',
    status: 'completed',
    priority: 'low',
    title: 'AHU L3 filter replacement',
    description: 'Routine filter swap and belt tension check. Completed and verified.',
    dueInDays: -5,
    technician: 'Facilities Team',
    estimatedHours: 2,
    costEstimate: 400,
  },
  {
    assetTag: 'FIRE-L3',
    kind: 'preventive',
    status: 'completed',
    priority: 'low',
    title: 'Monthly fire detector test - L3',
    description: 'All loop 1-2 devices passed scheduled functional test.',
    dueInDays: -1,
    technician: 'Fire Systems Co.',
    estimatedHours: 2,
    costEstimate: 350,
  },
];

export const maintenanceEvents: MaintenanceEvent[] = seeds.map((s, i) => {
  const asset = assets.find((a) => a.tag === s.assetTag);
  return {
    id: `mx-${String(i + 1).padStart(3, '0')}`,
    assetId: asset?.id ?? '',
    assetName: asset?.name ?? s.assetTag,
    kind: s.kind,
    status: s.status,
    priority: s.priority,
    title: s.title,
    description: s.description,
    scheduledDate: s.dueInDays >= 0 ? isoPlusDays(s.dueInDays) : isoMinusDays(-s.dueInDays),
    technician: s.technician ?? null,
    estimatedHours: s.estimatedHours,
    costEstimate: s.costEstimate,
  };
});

export const openMaintenance = maintenanceEvents.filter(
  (m) => m.status !== 'completed',
);
export const overdueMaintenance = maintenanceEvents.filter(
  (m) => m.status === 'overdue',
);
