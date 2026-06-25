import type { CopilotResponse } from '../types';
import { riskAssessment } from './risk';
import { predictiveInsights, predictiveSummary } from './predictive';
import { alarms, activeAlarms } from '../data/alarms';
import { floorName, building } from '../data/facility';
import {
  energyTodayKwh,
  energyDeltaPct,
  currentPowerKw,
  energyBreakdown,
  occupancyTotal,
  occupancyCapacity,
  occupancyPct,
  occupancyZonePoints,
} from '../data/telemetry';
import { assetCounts } from '../data/assets';
import { relativeTime, formatKwh, formatNumber, formatCurrency } from '../utils';

// ============================================================================
// AI FACILITY COPILOT
// Lightweight intent engine that reasons over live facility state to produce
// grounded, executive-ready answers with citations and follow-up prompts.
// ============================================================================

export const suggestedQuestions = [
  'Why is risk level high today?',
  'Show active alarms.',
  'Which assets require maintenance?',
  'What happened during the last 24 hours?',
  'How is energy consumption tracking?',
  'What are your recommended actions?',
];

interface Intent {
  name: string;
  keywords: string[];
  handler: () => CopilotResponse;
}

function riskIntent(): CopilotResponse {
  const top = riskAssessment.factors.slice(0, 3);
  return {
    intent: 'risk_explanation',
    answer:
      `Facility risk is **${riskAssessment.category}** at **${riskAssessment.score}/100**, ` +
      `up ${Math.abs(riskAssessment.trendDelta)} points over the past week. The score is driven primarily by ` +
      `${top[0].label.toLowerCase()} and ${top[1].label.toLowerCase()} risk. Here's the breakdown:`,
    bullets: top.map(
      (f) =>
        `**${f.label}** - ${f.score}/100 (${f.contribution} pts to overall). ${f.detail}`,
    ),
    citations: [
      { label: 'Risk score', value: `${riskAssessment.score} / 100 (${riskAssessment.category})` },
      { label: 'Top driver', value: `${top[0].label} (${top[0].contribution} pts)` },
      { label: 'Model confidence', value: `${Math.round(riskAssessment.confidence * 100)}%` },
    ],
    followUps: ['What are your recommended actions?', 'Show active alarms.', 'Which assets require maintenance?'],
  };
}

function alarmsIntent(): CopilotResponse {
  const crit = activeAlarms.filter((a) => a.severity === 'critical' || a.severity === 'high');
  return {
    intent: 'active_alarms',
    answer:
      `There are **${activeAlarms.length} active alarms**, including **${crit.length} critical/high** priority. ` +
      `The most urgent items are:`,
    bullets: activeAlarms
      .slice(0, 5)
      .map(
        (a) =>
          `**[${a.severity.toUpperCase()}] ${a.title}** - ${floorName(a.floorId)} | ${relativeTime(a.timestamp)} (${a.source})`,
      ),
    citations: [
      { label: 'Active alarms', value: `${activeAlarms.length}` },
      { label: 'Critical / high', value: `${crit.length}` },
      { label: 'Top source', value: crit[0]?.source ?? '-' },
    ],
    followUps: ['Why is risk level high today?', 'Which assets require maintenance?', 'What happened during the last 24 hours?'],
  };
}

function maintenanceIntent(): CopilotResponse {
  const top = predictiveInsights.slice(0, 4);
  return {
    intent: 'maintenance',
    answer:
      `**${predictiveSummary.atRisk} assets** need attention, with **${predictiveSummary.within7Days}** predicted to fail within 7 days. ` +
      `Acting now avoids an estimated **${formatCurrency(predictiveSummary.totalCostAvoided)}** in downtime exposure. Priorities:`,
    bullets: top.map((p) => {
      const when =
        p.predictedFailureDays === null
          ? 'monitor'
          : p.predictedFailureDays <= 0
            ? 'failed / offline'
            : `~${p.predictedFailureDays}d to predicted failure`;
      return `**${p.assetTag} - ${p.assetName}** (${p.floorName}) | health ${p.healthPct}% | ${when}. ${p.recommendation}`;
    }),
    citations: [
      { label: 'Assets at risk', value: `${predictiveSummary.atRisk}` },
      { label: 'Fail within 7d', value: `${predictiveSummary.within7Days}` },
      { label: 'Avg asset health', value: `${predictiveSummary.avgHealth}%` },
    ],
    followUps: ['Why is risk level high today?', 'Show active alarms.', 'What are your recommended actions?'],
  };
}

function last24hIntent(): CopilotResponse {
  const recent = [...alarms].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const resolved = alarms.filter((a) => a.status === 'resolved').length;
  return {
    intent: 'last_24h',
    answer:
      `In the last 24 hours, **${alarms.length} events** were logged across the facility - ` +
      `**${activeAlarms.length} still active**, ${alarms.filter((a) => a.status === 'acknowledged').length} acknowledged, ${resolved} auto-resolved. ` +
      `Timeline of notable events:`,
    bullets: recent
      .slice(0, 6)
      .map(
        (a) =>
          `**${relativeTime(a.timestamp)}** - [${a.status}] ${a.title} (${floorName(a.floorId)})`,
      ),
    citations: [
      { label: 'Total events', value: `${alarms.length}` },
      { label: 'Still active', value: `${activeAlarms.length}` },
      { label: 'Resolved', value: `${resolved}` },
    ],
    followUps: ['Show active alarms.', 'Why is risk level high today?', 'How is energy consumption tracking?'],
  };
}

function energyIntent(): CopilotResponse {
  return {
    intent: 'energy',
    answer:
      `Current facility draw is **${formatNumber(currentPowerKw)} kW**. Consumption today is **${formatKwh(energyTodayKwh)}**, ` +
      `running **${energyDeltaPct >= 0 ? '+' : ''}${energyDeltaPct}%** vs the AI baseline - the gap is attributed to HVAC plant overdraw. Breakdown:`,
    bullets: energyBreakdown.map(
      (b) => `**${b.category}** - ${formatKwh(b.kwh)} (${b.pctOfTotal}% of total)`,
    ),
    citations: [
      { label: 'Live power', value: `${formatNumber(currentPowerKw)} kW` },
      { label: 'Today', value: formatKwh(energyTodayKwh) },
      { label: 'vs baseline', value: `${energyDeltaPct >= 0 ? '+' : ''}${energyDeltaPct}%` },
    ],
    followUps: ['Why is risk level high today?', 'Which assets require maintenance?', 'What are your recommended actions?'],
  };
}

function occupancyIntent(): CopilotResponse {
  const anomalies = occupancyZonePoints.filter((z) => z.anomaly);
  return {
    intent: 'occupancy',
    answer:
      `Current occupancy is **${formatNumber(occupancyTotal)} people** (${occupancyPct}% of ${formatNumber(occupancyCapacity)} capacity). ` +
      (anomalies.length
        ? `⚠️ **${anomalies.length} occupancy anomaly** detected - after-hours presence in a critical zone.`
        : `No occupancy anomalies detected.`),
    bullets: occupancyZonePoints
      .slice(0, 6)
      .map(
        (z) =>
          `**${z.zoneName}** - ${z.count}/${z.capacity}${z.anomaly ? '  ⚠️ anomaly (verify against roster)' : ''}`,
      ),
    citations: [
      { label: 'Occupancy', value: `${formatNumber(occupancyTotal)} (${occupancyPct}%)` },
      { label: 'Anomalies', value: `${anomalies.length}` },
      { label: 'Capacity', value: formatNumber(occupancyCapacity) },
    ],
    followUps: ['Why is risk level high today?', 'Show active alarms.', 'What are your recommended actions?'],
  };
}

function recommendationsIntent(): CopilotResponse {
  return {
    intent: 'recommendations',
    answer:
      `Based on the current risk profile, I recommend the following prioritized actions to reduce facility risk from ` +
      `**${riskAssessment.score}** toward target. Estimated combined reduction: **${riskAssessment.recommendations
        .reduce((s, r) => s + Math.abs(parseInt(r.impact)), 0)} pts**.`,
    bullets: riskAssessment.recommendations.map(
      (r) => `**[${r.priority.toUpperCase()}] ${r.action}** - ${r.rationale} _(impact ${r.impact})_`,
    ),
    citations: [
      { label: 'Actions', value: `${riskAssessment.recommendations.length}` },
      { label: 'Current risk', value: `${riskAssessment.score} (${riskAssessment.category})` },
    ],
    followUps: ['Which assets require maintenance?', 'Show active alarms.', 'Why is risk level high today?'],
  };
}

function statusIntent(): CopilotResponse {
  return {
    intent: 'facility_status',
    answer:
      `**${building.name}** is **${building.status.toUpperCase()}**. Risk **${riskAssessment.category} (${riskAssessment.score})**, ` +
      `**${activeAlarms.length} active alarms**, **${assetCounts.online}/${assetCounts.total} assets online**, ` +
      `occupancy **${occupancyPct}%**, energy **${energyDeltaPct >= 0 ? '+' : ''}${energyDeltaPct}%** vs baseline. Snapshot:`,
    bullets: [
      `Risk: ${riskAssessment.score}/100 (${riskAssessment.category}), trend +${riskAssessment.trendDelta} this week`,
      `Assets: ${assetCounts.critical} critical | ${assetCounts.warning} warning | ${assetCounts.offline} offline`,
      `Maintenance: ${predictiveSummary.within7Days} predicted failures within 7 days`,
      `Energy: ${formatKwh(energyTodayKwh)} today (${energyDeltaPct >= 0 ? '+' : ''}${energyDeltaPct}% vs baseline)`,
    ],
    citations: [
      { label: 'Facility', value: building.code },
      { label: 'Risk', value: `${riskAssessment.score} (${riskAssessment.category})` },
      { label: 'Assets online', value: `${assetCounts.online}/${assetCounts.total}` },
    ],
    followUps: suggestedQuestions.slice(0, 3),
  };
}

const intents: Intent[] = [
  { name: 'risk', keywords: ['risk', 'why', 'high today', 'risk level', 'score', 'driver'], handler: riskIntent },
  { name: 'alarms', keywords: ['alarm', 'alert', 'active', 'incident', 'warning'], handler: alarmsIntent },
  { name: 'maintenance', keywords: ['maintenance', 'maintain', 'repair', 'fail', 'failure', 'asset', 'health', 'predict', 'broken', 'service'], handler: maintenanceIntent },
  { name: 'last24h', keywords: ['24 hour', 'last day', 'happened', 'timeline', 'history', 'overnight', 'today', 'recent'], handler: last24hIntent },
  { name: 'energy', keywords: ['energy', 'power consumption', 'consumption', 'electric', 'kwh', 'kw', 'usage'], handler: energyIntent },
  { name: 'occupancy', keywords: ['occupancy', 'people', 'how many', 'crowd', 'present', 'staff'], handler: occupancyIntent },
  { name: 'recommendations', keywords: ['recommend', 'should i', 'should we', 'action', 'next step', 'what do', 'advise', 'mitigat'], handler: recommendationsIntent },
  { name: 'status', keywords: ['status', 'overview', 'summary', 'situation', 'how is the facility', 'snapshot'], handler: statusIntent },
];

function scoreIntent(query: string, intent: Intent): number {
  const q = query.toLowerCase();
  return intent.keywords.reduce((s, kw) => (q.includes(kw) ? s + kw.length : s), 0);
}

export function copilotRespond(query: string): CopilotResponse {
  const trimmed = query.trim();
  if (!trimmed) return statusIntent();

  let best: Intent | null = null;
  let bestScore = 0;
  for (const intent of intents) {
    const score = scoreIntent(trimmed, intent);
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  if (best && bestScore > 0) return best.handler();

  // Fallback - graceful, capability-revealing answer.
  return {
    intent: 'fallback',
    answer:
      `I can reason over live facility intelligence for **${building.name}**. I didn't catch a specific request, ` +
      `but here's the current picture - risk is **${riskAssessment.category} (${riskAssessment.score})** with ` +
      `**${activeAlarms.length} active alarms**. Try one of the questions below.`,
    bullets: suggestedQuestions.map((q) => `“${q}”`),
    citations: [
      { label: 'Risk', value: `${riskAssessment.score} (${riskAssessment.category})` },
      { label: 'Active alarms', value: `${activeAlarms.length}` },
    ],
    followUps: suggestedQuestions.slice(0, 3),
  };
}
