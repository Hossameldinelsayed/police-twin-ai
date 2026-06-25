import type {
  RiskAssessment,
  RiskFactor,
  RiskRecommendation,
  Severity,
} from '../types';
import { assets } from '../data/assets';
import { activeAlarms } from '../data/alarms';
import {
  energyDeltaPct,
  occupancyZonePoints,
  occupancyPct,
  occupancyByFloor,
  riskTrend,
} from '../data/telemetry';
import { clamp, round, riskCategoryFromScore, NOW_ISO } from '../utils';

// ============================================================================
// AI RISK ENGINE
// Composite, explainable facility risk score from four weighted domains:
//   equipment | security | energy | occupancy
// Each domain produces a 0-100 sub-score with traceable signals; the overall
// score is a weighted blend. Fully deterministic & auditable.
// ============================================================================

const WEIGHTS: Record<RiskFactor['domain'], number> = {
  equipment: 0.4,
  security: 0.3,
  energy: 0.16,
  occupancy: 0.14,
};

const sevWeight: Record<Severity, number> = {
  critical: 30,
  high: 22,
  medium: 12,
  low: 5,
};

function equipmentFactor(): RiskFactor {
  const crit = assets.filter((a) => a.status === 'critical');
  const off = assets.filter((a) => a.status === 'offline');
  const warn = assets.filter((a) => a.status === 'warning');
  const nearFail = assets.filter(
    (a) => a.predictedFailureDays !== null && a.predictedFailureDays <= 14,
  );
  const score = clamp(
    crit.length * 16 + off.length * 10 + warn.length * 5 + nearFail.length * 4,
    0,
    100,
  );
  const signals = [
    `${crit.length} asset(s) in critical state (${crit.map((a) => a.tag).join(', ') || 'none'})`,
    `${off.length} asset(s) offline (${off.map((a) => a.tag).join(', ') || 'none'})`,
    `${warn.length} asset(s) in warning`,
    `${nearFail.length} predicted failure(s) within 14 days`,
  ];
  return {
    domain: 'equipment',
    label: 'Equipment & Infrastructure',
    score,
    weight: WEIGHTS.equipment,
    contribution: round(score * WEIGHTS.equipment, 1),
    trend: 'up',
    detail:
      'Critical power and access assets are degraded, with several near-term predicted failures driving infrastructure risk.',
    signals,
  };
}

function securityFactor(): RiskFactor {
  const secAlarms = activeAlarms.filter((a) =>
    ['security', 'access', 'network'].includes(a.type),
  );
  const surveillanceGap = assets.some(
    (a) => a.category === 'Camera' && a.status === 'offline',
  );
  const raw =
    secAlarms.reduce((s, a) => s + sevWeight[a.severity], 0) +
    (surveillanceGap ? 8 : 0);
  const score = clamp(raw, 0, 100);
  const signals = [
    `${secAlarms.length} active security/access event(s)`,
    ...secAlarms.slice(0, 3).map((a) => `${a.severity.toUpperCase()}: ${a.title}`),
    surveillanceGap ? 'Surveillance coverage gap from offline camera' : 'Full surveillance coverage',
  ];
  return {
    domain: 'security',
    label: 'Security & Access',
    score,
    weight: WEIGHTS.security,
    contribution: round(score * WEIGHTS.security, 1),
    trend: 'up',
    detail:
      'Active access-control faults and an offline camera reduce assurance at secure zones (Evidence Vault, Dispatch).',
    signals,
  };
}

function energyFactor(): RiskFactor {
  const envAlarms = activeAlarms.filter((a) => a.type === 'environmental');
  const score = clamp(Math.abs(energyDeltaPct) * 2.5 + envAlarms.length * 12, 0, 100);
  const signals = [
    `Consumption ${energyDeltaPct >= 0 ? '+' : ''}${energyDeltaPct}% vs AI baseline`,
    `${envAlarms.length} active environmental/energy anomaly alarm(s)`,
    'Basement HVAC plant overdraw detected in afternoon window',
  ];
  return {
    domain: 'energy',
    label: 'Energy & Environment',
    score,
    weight: WEIGHTS.energy,
    contribution: round(score * WEIGHTS.energy, 1),
    trend: energyDeltaPct > 0 ? 'up' : 'flat',
    detail:
      'Energy draw exceeds the modeled baseline, consistent with degrading cooling efficiency in the plant room.',
    signals,
  };
}

function occupancyFactor(): RiskFactor {
  const anomalyZones = occupancyZonePoints.filter((z) => z.anomaly);
  const overCap = occupancyByFloor.filter((o) => o.count / o.capacity > 0.9).length;
  const score = clamp(
    anomalyZones.length * 26 + overCap * 12 + (occupancyPct > 80 ? 12 : 0),
    0,
    100,
  );
  const signals = [
    `${anomalyZones.length} occupancy anomaly zone(s): ${anomalyZones.map((z) => z.zoneName).join(', ') || 'none'}`,
    `Building occupancy at ${occupancyPct}% of capacity`,
    `${overCap} floor(s) above 90% capacity`,
  ];
  return {
    domain: 'occupancy',
    label: 'Occupancy & Movement',
    score,
    weight: WEIGHTS.occupancy,
    contribution: round(score * WEIGHTS.occupancy, 1),
    trend: anomalyZones.length > 0 ? 'up' : 'flat',
    detail:
      'An after-hours presence anomaly was detected in a critical zone (Evidence Vault), warranting verification.',
    signals,
  };
}

function buildRecommendations(factors: RiskFactor[]): RiskRecommendation[] {
  const byDomain = Object.fromEntries(factors.map((f) => [f.domain, f]));
  const recs: RiskRecommendation[] = [];

  if (byDomain.equipment.score > 40) {
    recs.push({
      id: 'rec-eq-1',
      priority: 'critical',
      domain: 'equipment',
      action: 'Dispatch crew to replace UPS System A battery string within 72h',
      rationale: 'Predicted failure in 4 days; power redundancy currently degraded.',
      impact: '-11 pts',
    });
    recs.push({
      id: 'rec-eq-2',
      priority: 'high',
      domain: 'equipment',
      action: 'Schedule Chiller 1 bearing inspection and LV panel thermography',
      rationale: 'Two predictive alerts trending toward failure within the maintenance horizon.',
      impact: '-6 pts',
    });
  }
  if (byDomain.security.score > 30) {
    recs.push({
      id: 'rec-sec-1',
      priority: 'high',
      domain: 'security',
      action: 'Restore Dispatch camera and audit Evidence Vault access logs',
      rationale: 'Surveillance gap plus repeated denied reads at a critical secure zone.',
      impact: '-7 pts',
    });
  }
  if (byDomain.energy.score > 25) {
    recs.push({
      id: 'rec-en-1',
      priority: 'medium',
      domain: 'energy',
      action: 'Investigate basement HVAC overdraw and CRAC cooling efficiency',
      rationale: 'Consumption above baseline correlated with data-center temperature drift.',
      impact: '-4 pts',
    });
  }
  if (byDomain.occupancy.score > 20) {
    recs.push({
      id: 'rec-oc-1',
      priority: 'high',
      domain: 'occupancy',
      action: 'Verify after-hours presence in Evidence Vault against duty roster',
      rationale: 'Occupancy anomaly in a critical zone requires human confirmation.',
      impact: '-5 pts',
    });
  }
  return recs;
}

export function computeRiskAssessment(): RiskAssessment {
  const factors = [
    equipmentFactor(),
    securityFactor(),
    energyFactor(),
    occupancyFactor(),
  ].sort((a, b) => b.contribution - a.contribution);

  const score = round(
    factors.reduce((s, f) => s + f.contribution, 0),
    0,
  );
  const category = riskCategoryFromScore(score);
  const prev = riskTrend[riskTrend.length - 8]?.value ?? score;
  const trendDelta = round(score - prev, 0);

  const top = factors[0];
  const summary =
    `Facility risk is ${category.toUpperCase()} at ${score}/100, up ${Math.abs(trendDelta)} pts over the past week. ` +
    `The dominant driver is ${top.label.toLowerCase()} (${top.contribution} pts), led by ` +
    `critical power and access faults. ${factors.filter((f) => f.score > 40).length} of 4 domains are elevated.`;

  return {
    score,
    category,
    trendDelta,
    generatedAt: NOW_ISO,
    summary,
    factors,
    recommendations: buildRecommendations(factors),
    confidence: 0.88,
  };
}

// Computed once - single source of truth across the app.
export const riskAssessment: RiskAssessment = computeRiskAssessment();
