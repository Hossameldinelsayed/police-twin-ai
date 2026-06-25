import type { KpiSummary } from '../types';
import { riskAssessment } from './risk';
import { predictiveSummary } from './predictive';
import { activeAlarms, criticalAlarms } from '../data/alarms';
import {
  energyTodayKwh,
  energyDeltaPct,
  occupancyTotal,
  occupancyCapacity,
  occupancyPct,
} from '../data/telemetry';
import { assetCounts } from '../data/assets';
import { openMaintenance, overdueMaintenance } from '../data/maintenance';

export * from './risk';
export * from './predictive';
export * from './copilot';

export function buildKpiSummary(): KpiSummary {
  const securityActive = activeAlarms.filter((a) =>
    ['security', 'access'].includes(a.type),
  );
  const breach = securityActive.some((a) => a.severity === 'critical');
  const securityStatus: KpiSummary['securityStatus'] = breach
    ? 'breach'
    : securityActive.length > 0
      ? 'elevated'
      : 'secure';

  return {
    riskScore: riskAssessment.score,
    riskCategory: riskAssessment.category,
    riskDelta: riskAssessment.trendDelta,
    activeAlarms: activeAlarms.length,
    criticalAlarms: criticalAlarms.length,
    energyKwh: energyTodayKwh,
    energyDeltaPct,
    occupancyCount: occupancyTotal,
    occupancyCapacity,
    occupancyPct,
    securityStatus,
    securityDetail:
      securityStatus === 'secure'
        ? 'All secure zones nominal'
        : `${securityActive.length} access/security event(s) active`,
    maintenanceAlerts: openMaintenance.length,
    maintenanceOverdue: overdueMaintenance.length,
    assetsOnline: assetCounts.online,
    assetsTotal: assetCounts.total,
  };
}

export const kpiSummary: KpiSummary = buildKpiSummary();
