// ============================================================================
// Ministry of Interior — AI ENGINE
// ----------------------------------------------------------------------------
// Conceptually mirrors the frontend AI modules (frontend/lib/ai/*):
//   - computeRisk()       -> composite, explainable facility risk score
//   - computePredictive() -> ranked predictive-maintenance insights
//   - buildKpiSummary()   -> executive KPI snapshot
//   - copilotRespond()    -> grounded NL answers via keyword intent matching
//
// Every function takes the dataset as an argument so the engine is pure and can
// run against either the in-memory dataset or DB-hydrated rows of the same shape.
// Fully deterministic — no Math.random()/Date.now().
// ============================================================================

'use strict';

const { round } = require('../data/dataset');

// ----------------------------------------------------------------------------
// Shared formatting + classification helpers (mirror frontend/lib/utils.ts)
// ----------------------------------------------------------------------------

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function formatNumber(n) {
  return Number(n).toLocaleString('en-US');
}

function formatKwh(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)} MWh`;
  return `${formatNumber(n)} kWh`;
}

function formatCurrency(n) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${formatNumber(n)}`;
}

function riskCategoryFromScore(score) {
  if (score < 22) return 'Low';
  if (score < 40) return 'Guarded';
  if (score < 58) return 'Elevated';
  if (score < 78) return 'High';
  return 'Severe';
}

function relativeTime(iso, now) {
  const then = new Date(iso).getTime();
  const diffMs = now.getTime() - then;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

function floorNameFromDataset(dataset, id) {
  const f = dataset.floors.find((x) => x.id === id);
  return f ? f.name : id;
}

// ----------------------------------------------------------------------------
// RISK ENGINE — weighted blend of four explainable domains.
// Weights: equipment 0.40 · security 0.30 · energy 0.16 · occupancy 0.14
// ----------------------------------------------------------------------------

const WEIGHTS = {
  equipment: 0.4,
  security: 0.3,
  energy: 0.16,
  occupancy: 0.14,
};

const SEVERITY_WEIGHT = { critical: 30, high: 22, medium: 12, low: 5 };

function activeAlarmsOf(dataset) {
  return dataset.alarms.filter((a) => a.status === 'active');
}

function equipmentFactor(dataset) {
  const assets = dataset.assets;
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

function securityFactor(dataset) {
  const active = activeAlarmsOf(dataset);
  const secAlarms = active.filter((a) => ['security', 'access', 'network'].includes(a.type));
  const surveillanceGap = dataset.assets.some(
    (a) => a.category === 'Camera' && a.status === 'offline',
  );
  const raw =
    secAlarms.reduce((s, a) => s + SEVERITY_WEIGHT[a.severity], 0) + (surveillanceGap ? 8 : 0);
  const score = clamp(raw, 0, 100);
  const signals = [
    `${secAlarms.length} active security/access event(s)`,
    ...secAlarms.slice(0, 3).map((a) => `${a.severity.toUpperCase()}: ${a.title}`),
    surveillanceGap
      ? 'Surveillance coverage gap from offline camera'
      : 'Full surveillance coverage',
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

function energyFactor(dataset) {
  const envAlarms = activeAlarmsOf(dataset).filter((a) => a.type === 'environmental');
  const delta = dataset.energyDeltaPct;
  const score = clamp(Math.abs(delta) * 2.5 + envAlarms.length * 12, 0, 100);
  const signals = [
    `Consumption ${delta >= 0 ? '+' : ''}${delta}% vs AI baseline`,
    `${envAlarms.length} active environmental/energy anomaly alarm(s)`,
    'Basement HVAC plant overdraw detected in afternoon window',
  ];
  return {
    domain: 'energy',
    label: 'Energy & Environment',
    score,
    weight: WEIGHTS.energy,
    contribution: round(score * WEIGHTS.energy, 1),
    trend: delta > 0 ? 'up' : 'flat',
    detail:
      'Energy draw exceeds the modeled baseline, consistent with degrading cooling efficiency in the plant room.',
    signals,
  };
}

function occupancyFactor(dataset) {
  const anomalyZones = dataset.occupancyZonePoints.filter((z) => z.anomaly);
  const overCap = dataset.occupancyByFloor.filter((o) => o.count / o.capacity > 0.9).length;
  const score = clamp(
    anomalyZones.length * 26 + overCap * 12 + (dataset.occupancyPct > 80 ? 12 : 0),
    0,
    100,
  );
  const signals = [
    `${anomalyZones.length} occupancy anomaly zone(s): ${anomalyZones.map((z) => z.zoneName).join(', ') || 'none'}`,
    `Building occupancy at ${dataset.occupancyPct}% of capacity`,
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

function buildRecommendations(factors) {
  const byDomain = Object.fromEntries(factors.map((f) => [f.domain, f]));
  const recs = [];

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

/** Compute the composite, explainable facility risk assessment. */
function computeRisk(dataset) {
  const factors = [
    equipmentFactor(dataset),
    securityFactor(dataset),
    energyFactor(dataset),
    occupancyFactor(dataset),
  ].sort((a, b) => b.contribution - a.contribution);

  const score = round(
    factors.reduce((s, f) => s + f.contribution, 0),
    0,
  );
  const category = riskCategoryFromScore(score);
  const trend = dataset.riskTrend;
  const prev = trend[trend.length - 8] ? trend[trend.length - 8].value : score;
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
    generatedAt: dataset.NOW_ISO,
    summary,
    factors,
    recommendations: buildRecommendations(factors),
    confidence: 0.88,
  };
}

// ----------------------------------------------------------------------------
// PREDICTIVE MAINTENANCE ENGINE
// ----------------------------------------------------------------------------

// Typical unplanned-failure impact per category (hours downtime, $ exposure).
const IMPACT_MODEL = {
  UPS: { downtime: 6, exposure: 48000 },
  HVAC: { downtime: 8, exposure: 26000 },
  Electrical: { downtime: 10, exposure: 65000 },
  FireSystem: { downtime: 5, exposure: 40000 },
  AccessControl: { downtime: 3, exposure: 18000 },
  Camera: { downtime: 2, exposure: 6000 },
  Network: { downtime: 4, exposure: 30000 },
  Sensor: { downtime: 1, exposure: 3000 },
};

function driverSignals(category, health) {
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

/** Rank assets with a non-trivial near-term failure probability. */
function computePredictive(dataset) {
  return dataset.assets
    .filter(
      (a) => a.predictedFailureDays !== null || a.healthPct < 75 || a.failureProbability >= 0.2,
    )
    .map((a) => {
      const model = IMPACT_MODEL[a.category];
      const costAvoided = round(model.exposure * a.failureProbability, 0);
      return {
        assetId: a.id,
        assetTag: a.tag,
        assetName: a.name,
        category: a.category,
        floorName: floorNameFromDataset(dataset, a.floorId),
        healthPct: a.healthPct,
        status: a.status,
        predictedFailureDays: a.predictedFailureDays,
        failureProbability: a.failureProbability,
        recommendation:
          a.recommendation || 'Schedule preventive service at next maintenance window.',
        driverSignals: driverSignals(a.category, a.healthPct),
        estimatedDowntimeHours: model.downtime,
        costAvoided,
      };
    })
    .sort((a, b) => {
      const da = a.predictedFailureDays === null ? 9999 : a.predictedFailureDays;
      const db = b.predictedFailureDays === null ? 9999 : b.predictedFailureDays;
      if (da !== db) return da - db;
      return b.failureProbability - a.failureProbability;
    });
}

function predictiveSummary(dataset, insights) {
  const list = insights || computePredictive(dataset);
  return {
    atRisk: list.length,
    critical: list.filter((p) => p.status === 'critical').length,
    within7Days: list.filter(
      (p) => p.predictedFailureDays !== null && p.predictedFailureDays <= 7,
    ).length,
    avgHealth: round(
      dataset.assets.reduce((s, a) => s + a.healthPct, 0) / dataset.assets.length,
      0,
    ),
    totalCostAvoided: list.reduce((s, p) => s + p.costAvoided, 0),
  };
}

// ----------------------------------------------------------------------------
// KPI SUMMARY (mirror frontend/lib/ai/index.ts)
// ----------------------------------------------------------------------------

function assetCountsOf(dataset) {
  const a = dataset.assets;
  return {
    total: a.length,
    online: a.filter((x) => x.status !== 'offline').length,
    warning: a.filter((x) => x.status === 'warning').length,
    critical: a.filter((x) => x.status === 'critical').length,
    offline: a.filter((x) => x.status === 'offline').length,
  };
}

function buildKpiSummary(dataset) {
  const risk = computeRisk(dataset);
  const insights = computePredictive(dataset);
  const psum = predictiveSummary(dataset, insights);
  const counts = assetCountsOf(dataset);
  const active = activeAlarmsOf(dataset);
  const criticalAlarms = active.filter((a) => a.severity === 'critical' || a.severity === 'high');
  const openMaintenance = dataset.maintenanceEvents.filter((m) => m.status !== 'completed');
  const overdueMaintenance = dataset.maintenanceEvents.filter((m) => m.status === 'overdue');

  const securityActive = active.filter((a) => ['security', 'access'].includes(a.type));
  const breach = securityActive.some((a) => a.severity === 'critical');
  const securityStatus = breach ? 'breach' : securityActive.length > 0 ? 'elevated' : 'secure';

  return {
    riskScore: risk.score,
    riskCategory: risk.category,
    riskDelta: risk.trendDelta,
    activeAlarms: active.length,
    criticalAlarms: criticalAlarms.length,
    energyKwh: dataset.energyTodayKwh,
    energyDeltaPct: dataset.energyDeltaPct,
    occupancyCount: dataset.occupancyTotal,
    occupancyCapacity: dataset.occupancyCapacity,
    occupancyPct: dataset.occupancyPct,
    securityStatus,
    securityDetail:
      securityStatus === 'secure'
        ? 'All secure zones nominal'
        : `${securityActive.length} access/security event(s) active`,
    maintenanceAlerts: openMaintenance.length,
    maintenanceOverdue: overdueMaintenance.length,
    assetsOnline: counts.online,
    assetsTotal: counts.total,
  };
}

// ----------------------------------------------------------------------------
// AI FACILITY COPILOT — keyword intent matching over live facility state.
// (mirror frontend/lib/ai/copilot.ts)
// ----------------------------------------------------------------------------

const SUGGESTED_QUESTIONS = [
  'Why is risk level high today?',
  'Show active alarms.',
  'Which assets require maintenance?',
  'What happened during the last 24 hours?',
  'How is energy consumption tracking?',
  'What are your recommended actions?',
];

function riskIntent(dataset) {
  const risk = computeRisk(dataset);
  const top = risk.factors.slice(0, 3);
  return {
    intent: 'risk_explanation',
    answer:
      `Facility risk is **${risk.category}** at **${risk.score}/100**, ` +
      `up ${Math.abs(risk.trendDelta)} points over the past week. The score is driven primarily by ` +
      `${top[0].label.toLowerCase()} and ${top[1].label.toLowerCase()} risk. Here's the breakdown:`,
    bullets: top.map(
      (f) => `**${f.label}** — ${f.score}/100 (${f.contribution} pts to overall). ${f.detail}`,
    ),
    citations: [
      { label: 'Risk score', value: `${risk.score} / 100 (${risk.category})` },
      { label: 'Top driver', value: `${top[0].label} (${top[0].contribution} pts)` },
      { label: 'Model confidence', value: `${Math.round(risk.confidence * 100)}%` },
    ],
    followUps: [
      'What are your recommended actions?',
      'Show active alarms.',
      'Which assets require maintenance?',
    ],
  };
}

function alarmsIntent(dataset) {
  const active = activeAlarmsOf(dataset);
  const crit = active.filter((a) => a.severity === 'critical' || a.severity === 'high');
  return {
    intent: 'active_alarms',
    answer:
      `There are **${active.length} active alarms**, including **${crit.length} critical/high** priority. ` +
      `The most urgent items are:`,
    bullets: active
      .slice(0, 5)
      .map(
        (a) =>
          `**[${a.severity.toUpperCase()}] ${a.title}** — ${floorNameFromDataset(dataset, a.floorId)} · ${relativeTime(a.timestamp, dataset.NOW)} (${a.source})`,
      ),
    citations: [
      { label: 'Active alarms', value: `${active.length}` },
      { label: 'Critical / high', value: `${crit.length}` },
      { label: 'Top source', value: crit[0] ? crit[0].source : '—' },
    ],
    followUps: [
      'Why is risk level high today?',
      'Which assets require maintenance?',
      'What happened during the last 24 hours?',
    ],
  };
}

function maintenanceIntent(dataset) {
  const insights = computePredictive(dataset);
  const psum = predictiveSummary(dataset, insights);
  const top = insights.slice(0, 4);
  return {
    intent: 'maintenance',
    answer:
      `**${psum.atRisk} assets** need attention, with **${psum.within7Days}** predicted to fail within 7 days. ` +
      `Acting now avoids an estimated **${formatCurrency(psum.totalCostAvoided)}** in downtime exposure. Priorities:`,
    bullets: top.map((p) => {
      const when =
        p.predictedFailureDays === null
          ? 'monitor'
          : p.predictedFailureDays <= 0
            ? 'failed / offline'
            : `~${p.predictedFailureDays}d to predicted failure`;
      return `**${p.assetTag} — ${p.assetName}** (${p.floorName}) · health ${p.healthPct}% · ${when}. ${p.recommendation}`;
    }),
    citations: [
      { label: 'Assets at risk', value: `${psum.atRisk}` },
      { label: 'Fail within 7d', value: `${psum.within7Days}` },
      { label: 'Avg asset health', value: `${psum.avgHealth}%` },
    ],
    followUps: [
      'Why is risk level high today?',
      'Show active alarms.',
      'What are your recommended actions?',
    ],
  };
}

function last24hIntent(dataset) {
  const alarms = dataset.alarms;
  const active = activeAlarmsOf(dataset);
  const recent = [...alarms].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const resolved = alarms.filter((a) => a.status === 'resolved').length;
  const acknowledged = alarms.filter((a) => a.status === 'acknowledged').length;
  return {
    intent: 'last_24h',
    answer:
      `In the last 24 hours, **${alarms.length} events** were logged across the facility — ` +
      `**${active.length} still active**, ${acknowledged} acknowledged, ${resolved} auto-resolved. ` +
      `Timeline of notable events:`,
    bullets: recent
      .slice(0, 6)
      .map(
        (a) =>
          `**${relativeTime(a.timestamp, dataset.NOW)}** — [${a.status}] ${a.title} (${floorNameFromDataset(dataset, a.floorId)})`,
      ),
    citations: [
      { label: 'Total events', value: `${alarms.length}` },
      { label: 'Still active', value: `${active.length}` },
      { label: 'Resolved', value: `${resolved}` },
    ],
    followUps: [
      'Show active alarms.',
      'Why is risk level high today?',
      'How is energy consumption tracking?',
    ],
  };
}

function energyIntent(dataset) {
  const delta = dataset.energyDeltaPct;
  return {
    intent: 'energy',
    answer:
      `Current facility draw is **${formatNumber(dataset.currentPowerKw)} kW**. Consumption today is **${formatKwh(dataset.energyTodayKwh)}**, ` +
      `running **${delta >= 0 ? '+' : ''}${delta}%** vs the AI baseline — the gap is attributed to HVAC plant overdraw. Breakdown:`,
    bullets: dataset.energyBreakdown.map(
      (b) => `**${b.category}** — ${formatKwh(b.kwh)} (${b.pctOfTotal}% of total)`,
    ),
    citations: [
      { label: 'Live power', value: `${formatNumber(dataset.currentPowerKw)} kW` },
      { label: 'Today', value: formatKwh(dataset.energyTodayKwh) },
      { label: 'vs baseline', value: `${delta >= 0 ? '+' : ''}${delta}%` },
    ],
    followUps: [
      'Why is risk level high today?',
      'Which assets require maintenance?',
      'What are your recommended actions?',
    ],
  };
}

function occupancyIntent(dataset) {
  const anomalies = dataset.occupancyZonePoints.filter((z) => z.anomaly);
  return {
    intent: 'occupancy',
    answer:
      `Current occupancy is **${formatNumber(dataset.occupancyTotal)} people** (${dataset.occupancyPct}% of ${formatNumber(dataset.occupancyCapacity)} capacity). ` +
      (anomalies.length
        ? `⚠️ **${anomalies.length} occupancy anomaly** detected — after-hours presence in a critical zone.`
        : `No occupancy anomalies detected.`),
    bullets: dataset.occupancyZonePoints
      .slice(0, 6)
      .map(
        (z) =>
          `**${z.zoneName}** — ${z.count}/${z.capacity}${z.anomaly ? '  ⚠️ anomaly (verify against roster)' : ''}`,
      ),
    citations: [
      { label: 'Occupancy', value: `${formatNumber(dataset.occupancyTotal)} (${dataset.occupancyPct}%)` },
      { label: 'Anomalies', value: `${anomalies.length}` },
      { label: 'Capacity', value: formatNumber(dataset.occupancyCapacity) },
    ],
    followUps: [
      'Why is risk level high today?',
      'Show active alarms.',
      'What are your recommended actions?',
    ],
  };
}

function recommendationsIntent(dataset) {
  const risk = computeRisk(dataset);
  const totalImpact = risk.recommendations.reduce(
    (s, r) => s + Math.abs(parseInt(r.impact, 10) || 0),
    0,
  );
  return {
    intent: 'recommendations',
    answer:
      `Based on the current risk profile, I recommend the following prioritized actions to reduce facility risk from ` +
      `**${risk.score}** toward target. Estimated combined reduction: **${totalImpact} pts**.`,
    bullets: risk.recommendations.map(
      (r) => `**[${r.priority.toUpperCase()}] ${r.action}** — ${r.rationale} _(impact ${r.impact})_`,
    ),
    citations: [
      { label: 'Actions', value: `${risk.recommendations.length}` },
      { label: 'Current risk', value: `${risk.score} (${risk.category})` },
    ],
    followUps: [
      'Which assets require maintenance?',
      'Show active alarms.',
      'Why is risk level high today?',
    ],
  };
}

function statusIntent(dataset) {
  const risk = computeRisk(dataset);
  const psum = predictiveSummary(dataset);
  const counts = assetCountsOf(dataset);
  const active = activeAlarmsOf(dataset);
  const delta = dataset.energyDeltaPct;
  return {
    intent: 'facility_status',
    answer:
      `**${dataset.building.name}** is **${dataset.building.status.toUpperCase()}**. Risk **${risk.category} (${risk.score})**, ` +
      `**${active.length} active alarms**, **${counts.online}/${counts.total} assets online**, ` +
      `occupancy **${dataset.occupancyPct}%**, energy **${delta >= 0 ? '+' : ''}${delta}%** vs baseline. Snapshot:`,
    bullets: [
      `Risk: ${risk.score}/100 (${risk.category}), trend +${risk.trendDelta} this week`,
      `Assets: ${counts.critical} critical · ${counts.warning} warning · ${counts.offline} offline`,
      `Maintenance: ${psum.within7Days} predicted failures within 7 days`,
      `Energy: ${formatKwh(dataset.energyTodayKwh)} today (${delta >= 0 ? '+' : ''}${delta}% vs baseline)`,
    ],
    citations: [
      { label: 'Facility', value: dataset.building.code },
      { label: 'Risk', value: `${risk.score} (${risk.category})` },
      { label: 'Assets online', value: `${counts.online}/${counts.total}` },
    ],
    followUps: SUGGESTED_QUESTIONS.slice(0, 3),
  };
}

const INTENTS = [
  { name: 'risk', keywords: ['risk', 'why', 'high today', 'risk level', 'score', 'driver'], handler: riskIntent },
  { name: 'alarms', keywords: ['alarm', 'alert', 'active', 'incident', 'warning'], handler: alarmsIntent },
  { name: 'maintenance', keywords: ['maintenance', 'maintain', 'repair', 'fail', 'failure', 'asset', 'health', 'predict', 'broken', 'service'], handler: maintenanceIntent },
  { name: 'last24h', keywords: ['24 hour', 'last day', 'happened', 'timeline', 'history', 'overnight', 'today', 'recent'], handler: last24hIntent },
  { name: 'energy', keywords: ['energy', 'power consumption', 'consumption', 'electric', 'kwh', 'kw', 'usage'], handler: energyIntent },
  { name: 'occupancy', keywords: ['occupancy', 'people', 'how many', 'crowd', 'present', 'staff'], handler: occupancyIntent },
  { name: 'recommendations', keywords: ['recommend', 'should i', 'should we', 'action', 'next step', 'what do', 'advise', 'mitigat'], handler: recommendationsIntent },
  { name: 'status', keywords: ['status', 'overview', 'summary', 'situation', 'how is the facility', 'snapshot'], handler: statusIntent },
];

function scoreIntent(query, intent) {
  const q = query.toLowerCase();
  return intent.keywords.reduce((s, kw) => (q.includes(kw) ? s + kw.length : s), 0);
}

/** Produce a grounded, executive-ready answer for a free-text query. */
function copilotRespond(query, dataset) {
  const trimmed = (query || '').trim();
  if (!trimmed) return statusIntent(dataset);

  let best = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    const score = scoreIntent(trimmed, intent);
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  if (best && bestScore > 0) return best.handler(dataset);

  // Graceful, capability-revealing fallback.
  const risk = computeRisk(dataset);
  const active = activeAlarmsOf(dataset);
  return {
    intent: 'fallback',
    answer:
      `I can reason over live facility intelligence for **${dataset.building.name}**. I didn't catch a specific request, ` +
      `but here's the current picture — risk is **${risk.category} (${risk.score})** with ` +
      `**${active.length} active alarms**. Try one of the questions below.`,
    bullets: SUGGESTED_QUESTIONS.map((q) => `"${q}"`),
    citations: [
      { label: 'Risk', value: `${risk.score} (${risk.category})` },
      { label: 'Active alarms', value: `${active.length}` },
    ],
    followUps: SUGGESTED_QUESTIONS.slice(0, 3),
  };
}

module.exports = {
  computeRisk,
  computePredictive,
  predictiveSummary,
  buildKpiSummary,
  copilotRespond,
  suggestedQuestions: SUGGESTED_QUESTIONS,
  // helpers exported for potential reuse / testing
  riskCategoryFromScore,
};
