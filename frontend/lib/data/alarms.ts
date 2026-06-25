import type { Alarm, AlarmStatus, AlarmType, Severity } from '../types';
import { assets } from './assets';
import { isoMinusHours } from '../utils';

// ============================================================================
// Alarm / event stream for the last ~24h. Mix of active, acknowledged, resolved.
// ============================================================================

function tagToAssetId(tag: string): { assetId: string; floorId: string; zoneId: string } {
  const a = assets.find((x) => x.tag === tag);
  if (!a) return { assetId: '', floorId: 'flr-01', zoneId: '' };
  return { assetId: a.id, floorId: a.floorId, zoneId: a.zoneId };
}

interface AlarmSeed {
  type: AlarmType;
  severity: Severity;
  title: string;
  message: string;
  assetTag?: string;
  floorId?: string;
  status: AlarmStatus;
  hoursAgo: number;
  source: string;
  acknowledgedBy?: string;
}

const seeds: AlarmSeed[] = [
  {
    type: 'power',
    severity: 'critical',
    title: 'UPS battery string over-temperature',
    message:
      'UPS System A reporting battery string 2 over thermal threshold under load. Redundancy reduced.',
    assetTag: 'UPS-A1',
    status: 'active',
    hoursAgo: 0.6,
    source: 'Power Management System',
  },
  {
    type: 'access',
    severity: 'high',
    title: 'Repeated access denials — Evidence Vault',
    message:
      '4 denied credential reads in 60 minutes at Evidence Vault reader. Reader head returning errors.',
    assetTag: 'ACS-VLT-01',
    status: 'active',
    hoursAgo: 0.9,
    source: 'Access Control',
  },
  {
    type: 'network',
    severity: 'high',
    title: 'Camera signal lost — Dispatch Floor',
    message: 'Dispatch Floor Camera offline for 38 minutes. Suspected PoE port fault on L2.',
    assetTag: 'CAM-L2-02',
    status: 'active',
    hoursAgo: 0.65,
    source: 'VMS Health Monitor',
  },
  {
    type: 'environmental',
    severity: 'medium',
    title: 'Data center supply-air temperature drift',
    message: 'CRAC unit supply temperature +1.4°C over 14-day baseline. Cooling efficiency degrading.',
    assetTag: 'CRAC-DC-01',
    status: 'active',
    hoursAgo: 2.4,
    source: 'BMS',
  },
  {
    type: 'fire',
    severity: 'medium',
    title: 'Fire loop intermittent device fault',
    message: 'Fire Panel L4 loop 3 reporting intermittent detector faults in Booking area.',
    assetTag: 'FIRE-L4',
    status: 'active',
    hoursAgo: 3.1,
    source: 'Fire Alarm System',
  },
  {
    type: 'security',
    severity: 'medium',
    title: 'Tailgating detected — Main Entrance',
    message: 'Analytics flagged a tailgating event at main turnstiles. Clip forwarded to watch desk.',
    assetTag: 'ACS-ENT-01',
    status: 'active',
    hoursAgo: 1.8,
    source: 'Video Analytics',
  },
  {
    type: 'maintenance',
    severity: 'medium',
    title: 'Chiller compressor vibration anomaly',
    message: 'Chiller Unit 1 compressor 2 vibration trending above advisory band.',
    assetTag: 'CHL-01',
    status: 'active',
    hoursAgo: 5.5,
    source: 'Predictive Maintenance AI',
  },
  {
    type: 'environmental',
    severity: 'medium',
    title: 'HVAC energy consumption anomaly',
    message: 'Basement plant drawing 22% above modeled load for current occupancy/weather.',
    floorId: 'flr-01',
    status: 'active',
    hoursAgo: 4.2,
    source: 'Energy Analytics AI',
  },
  {
    type: 'access',
    severity: 'low',
    title: 'Door held open — Forensics Lab',
    message: 'Forensics Lab door held open beyond 45s threshold. Auto-resolved on closure.',
    assetTag: 'ACS-FOR-01',
    status: 'acknowledged',
    hoursAgo: 6.7,
    source: 'Access Control',
    acknowledgedBy: 'Sgt. A. Rahman',
  },
  {
    type: 'environmental',
    severity: 'low',
    title: 'Elevated CO₂ — Lobby Atrium',
    message: 'Lobby CO₂ reached 1,180 ppm during peak public hours. Ventilation boosted automatically.',
    assetTag: 'SNS-AIR-L1',
    status: 'acknowledged',
    hoursAgo: 8.0,
    source: 'IAQ Sensor',
    acknowledgedBy: 'Facilities Desk',
  },
  {
    type: 'security',
    severity: 'high',
    title: 'Perimeter motion after hours',
    message: 'Vehicle bay motion detected at 02:14. Verified as cleared patrol unit. No action required.',
    assetTag: 'CAM-B1-01',
    status: 'resolved',
    hoursAgo: 12.3,
    source: 'Video Analytics',
    acknowledgedBy: 'Watch Cdr. L. Haddad',
  },
  {
    type: 'power',
    severity: 'medium',
    title: 'Utility mains voltage dip',
    message: 'Brief mains voltage sag; load transferred to UPS for 2.1s. Systems nominal.',
    floorId: 'flr-01',
    status: 'resolved',
    hoursAgo: 18.5,
    source: 'Power Management System',
    acknowledgedBy: 'Auto',
  },
  {
    type: 'fire',
    severity: 'low',
    title: 'Scheduled detector test',
    message: 'Monthly detector test executed on L3 loop. All devices passed.',
    assetTag: 'FIRE-L3',
    status: 'resolved',
    hoursAgo: 21.0,
    source: 'Fire Alarm System',
    acknowledgedBy: 'Maint. Team',
  },
];

export const alarms: Alarm[] = seeds.map((s, i) => {
  const link = s.assetTag
    ? tagToAssetId(s.assetTag)
    : { assetId: '', floorId: s.floorId ?? 'flr-01', zoneId: '' };
  return {
    id: `alm-${String(i + 1).padStart(3, '0')}`,
    type: s.type,
    severity: s.severity,
    title: s.title,
    message: s.message,
    assetId: link.assetId || null,
    floorId: s.floorId ?? link.floorId,
    zoneId: link.zoneId || null,
    status: s.status,
    timestamp: isoMinusHours(s.hoursAgo),
    source: s.source,
    acknowledgedBy: s.acknowledgedBy ?? null,
  };
});

export const activeAlarms = alarms.filter((a) => a.status === 'active');
export const criticalAlarms = alarms.filter(
  (a) => a.status === 'active' && (a.severity === 'critical' || a.severity === 'high'),
);

export function alarmsByType() {
  const types: AlarmType[] = [
    'fire',
    'security',
    'maintenance',
    'power',
    'access',
    'environmental',
    'network',
  ];
  return types
    .map((t) => ({
      type: t,
      count: alarms.filter((a) => a.type === t).length,
      active: activeAlarms.filter((a) => a.type === t).length,
    }))
    .filter((x) => x.count > 0);
}
