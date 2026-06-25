import type { PredictiveInsight, AssetCategory } from '../types';
import { assets } from '../data/assets';
import { floorName } from '../data/facility';
import { round } from '../utils';

// ============================================================================
// PREDICTIVE MAINTENANCE ENGINE
// Surfaces assets with a non-trivial near-term failure probability, ranks them
// by urgency, and estimates downtime + avoided cost from acting early.
// ============================================================================

// Typical unplanned-failure impact per category (hours of downtime, $ exposure).
const impactModel: Record<AssetCategory, { downtime: number; exposure: number }> = {
  UPS: { downtime: 6, exposure: 48000 },
  HVAC: { downtime: 8, exposure: 26000 },
  Electrical: { downtime: 10, exposure: 65000 },
  FireSystem: { downtime: 5, exposure: 40000 },
  AccessControl: { downtime: 3, exposure: 18000 },
  Camera: { downtime: 2, exposure: 6000 },
  Network: { downtime: 4, exposure: 30000 },
  Sensor: { downtime: 1, exposure: 3000 },
};

function driverSignals(category: AssetCategory, health: number): string[] {
  const base = [`Health index at ${health}% and declining`];
  switch (category) {
    case 'UPS':
      return [...base, 'Battery cell temperature above threshold', 'Internal resistance rising'];
    case 'HVAC':
      return [...base, 'Compressor vibration trending up', 'Supply-air temperature drift'];
    case 'Electrical':
      return [...base, 'Phase imbalance detected', 'Busbar thermal rise'];
    case 'FireSystem':
      return [...base, 'Intermittent loop device faults', 'Standby battery capacity decline'];
    case 'AccessControl':
      return [...base, 'Read-error rate elevated', 'Repeated credential denials'];
    case 'Camera':
      return [...base, 'Signal loss / PoE fault', 'Frame-drop anomalies'];
    case 'Network':
      return [...base, 'Port error counters climbing', 'Latency variance'];
    default:
      return [...base, 'Sensor variance outside band'];
  }
}

export function computePredictiveInsights(): PredictiveInsight[] {
  return assets
    .filter(
      (a) =>
        a.predictedFailureDays !== null ||
        a.healthPct < 75 ||
        a.failureProbability >= 0.2,
    )
    .map((a) => {
      const model = impactModel[a.category];
      const costAvoided = round(model.exposure * a.failureProbability, 0);
      return {
        assetId: a.id,
        assetTag: a.tag,
        assetName: a.name,
        category: a.category,
        floorName: floorName(a.floorId),
        healthPct: a.healthPct,
        status: a.status,
        predictedFailureDays: a.predictedFailureDays,
        failureProbability: a.failureProbability,
        recommendation:
          a.recommendation ??
          'Schedule preventive service at next maintenance window.',
        driverSignals: driverSignals(a.category, a.healthPct),
        estimatedDowntimeHours: model.downtime,
        costAvoided,
      };
    })
    .sort((a, b) => {
      // Most urgent first: soonest predicted failure, then highest probability.
      const da = a.predictedFailureDays ?? 9999;
      const db = b.predictedFailureDays ?? 9999;
      if (da !== db) return da - db;
      return b.failureProbability - a.failureProbability;
    });
}

export const predictiveInsights: PredictiveInsight[] = computePredictiveInsights();

export const predictiveSummary = {
  atRisk: predictiveInsights.length,
  critical: predictiveInsights.filter((p) => p.status === 'critical').length,
  within7Days: predictiveInsights.filter(
    (p) => p.predictedFailureDays !== null && p.predictedFailureDays <= 7,
  ).length,
  avgHealth: round(
    assets.reduce((s, a) => s + a.healthPct, 0) / assets.length,
    0,
  ),
  totalCostAvoided: predictiveInsights.reduce((s, p) => s + p.costAvoided, 0),
};
