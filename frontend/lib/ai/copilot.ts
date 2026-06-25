import type { CopilotResponse, Asset, AssetCategory, Floor } from '../types';
import { riskAssessment } from './risk';
import { predictiveInsights, predictiveSummary } from './predictive';
import { alarms, activeAlarms } from '../data/alarms';
import { floors, floorName, zoneName, building } from '../data/facility';
import {
  assets,
  assetsByFloor,
  assetsByCategory,
  assetCounts,
  assetCategoryLabels,
} from '../data/assets';
import {
  energyTodayKwh,
  energyDeltaPct,
  currentPowerKw,
  energyBreakdown,
  occupancyTotal,
  occupancyCapacity,
  occupancyPct,
  occupancyZonePoints,
  occupancyByFloor,
  floorClimate,
  buildingClimate,
} from '../data/telemetry';
import {
  relativeTime,
  formatKwh,
  formatNumber,
  formatCurrency,
  formatDate,
  assetStatusMeta,
} from '../utils';

// ============================================================================
// AI FACILITY COPILOT
// Reasons over live facility state to answer questions about risk, alarms,
// energy, climate/temperature, occupancy, maintenance, AND any specific asset,
// floor, system or telemetry reading. Grounded, cited, with follow-ups.
// ============================================================================

export const suggestedQuestions = [
  'What is the building temperature?',
  'Show telemetry for UPS-A1.',
  'Why is risk level high today?',
  "What's happening on L5 Secure Core?",
  'Which assets require maintenance?',
  'How many cameras are there?',
];

// ------------------------------- helpers ------------------------------------
function humanizeKey(k: string): string {
  return k
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/\bPct\b/, '%')
    .trim();
}

function telemetryLines(a: Asset): string[] {
  return Object.entries(a.telemetry).map(([k, v]) => `${humanizeKey(k)}: **${v}**`);
}

function statusLabel(a: Asset) {
  return assetStatusMeta[a.status].label;
}

function assetByTag(tag: string): Asset | undefined {
  return assets.find((a) => a.tag.toLowerCase() === tag.toLowerCase());
}

const ALIASES: Record<string, string> = {
  'chiller 1': 'CHL-01',
  'chiller 2': 'CHL-02',
  'ups system a': 'UPS-A1',
  'ups a': 'UPS-A1',
  'ups system b': 'UPS-B1',
  generator: 'GEN-01',
  'vault reader': 'ACS-VLT-01',
  'dispatch camera': 'CAM-L2-02',
  'crac unit': 'CRAC-DC-01',
  'data center cooling': 'CRAC-DC-01',
  'main panel': 'LV-PNL-01',
  'core router': 'NET-RTR-01',
};

function findAsset(q: string): Asset | null {
  // 1) explicit tag
  const byTag = assets.find((a) => q.includes(a.tag.toLowerCase()));
  if (byTag) return byTag;
  // 2) friendly aliases
  for (const [phrase, tag] of Object.entries(ALIASES)) {
    if (q.includes(phrase)) return assetByTag(tag) ?? null;
  }
  // 3) distinctive name-word overlap
  let best: Asset | null = null;
  let bestScore = 0;
  for (const a of assets) {
    const words = a.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
    const score = words.filter((w) => q.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return bestScore >= 2 ? best : null;
}

function findFloor(q: string): Floor | null {
  const lvl = q.match(/\bl\s?([1-5])\b/);
  if (lvl) return floors.find((f) => f.level === Number(lvl[1]) - 1) ?? null;
  if (/\bb1\b|basement/.test(q)) return floors.find((f) => f.level === -1) ?? null;
  const kw: [string, number][] = [
    ['secure core', 4],
    ['data center', 4],
    ['data centre', 4],
    ['investigation', 2],
    ['forensics', 2],
    ['detention', 3],
    ['holding', 3],
    ['booking', 3],
    ['operations', 1],
    ['dispatch', 1],
    ['reception', 0],
    ['public', 0],
    ['lobby', 0],
    ['plant', -1],
    ['parking', -1],
  ];
  for (const [k, level] of kw) if (q.includes(k)) return floors.find((f) => f.level === level) ?? null;
  return null;
}

function findCategory(q: string): AssetCategory | null {
  const m: [string, AssetCategory][] = [
    ['camera', 'Camera'],
    ['cctv', 'Camera'],
    ['surveillance', 'Camera'],
    ['access', 'AccessControl'],
    ['door', 'AccessControl'],
    ['turnstile', 'AccessControl'],
    ['fire', 'FireSystem'],
    ['smoke', 'FireSystem'],
    ['suppression', 'FireSystem'],
    ['hvac', 'HVAC'],
    ['chiller', 'HVAC'],
    ['crac', 'HVAC'],
    ['air handling', 'HVAC'],
    ['ahu', 'HVAC'],
    ['ups', 'UPS'],
    ['battery', 'UPS'],
    ['electrical', 'Electrical'],
    ['transformer', 'Electrical'],
    ['network', 'Network'],
    ['switch', 'Network'],
    ['router', 'Network'],
    ['sensor', 'Sensor'],
    ['iot', 'Sensor'],
  ];
  for (const [k, c] of m) if (q.includes(k)) return c;
  return null;
}

// ----------------------------- topic handlers -------------------------------
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
      `up ${Math.abs(riskAssessment.trendDelta)} points over the past week, driven mainly by ` +
      `${top[0].label.toLowerCase()} and ${top[1].label.toLowerCase()} risk:`,
    bullets: top.map((f) => `**${f.label}** - ${f.score}/100 (${f.contribution} pts). ${f.detail}`),
    citations: [
      { label: 'Risk score', value: `${riskAssessment.score} / 100 (${riskAssessment.category})` },
      { label: 'Top driver', value: `${top[0].label} (${top[0].contribution} pts)` },
      { label: 'Confidence', value: `${Math.round(riskAssessment.confidence * 100)}%` },
    ],
    followUps: ['What are your recommended actions?', 'Show active alarms.', 'What is the building temperature?'],
  };
}

function alarmsIntent(): CopilotResponse {
  const crit = activeAlarms.filter((a) => a.severity === 'critical' || a.severity === 'high');
  return {
    intent: 'active_alarms',
    answer: `There are **${activeAlarms.length} active alarms**, including **${crit.length} critical/high** priority:`,
    bullets: activeAlarms
      .slice(0, 6)
      .map((a) => `**[${a.severity.toUpperCase()}] ${a.title}** - ${floorName(a.floorId)} | ${relativeTime(a.timestamp)} (${a.source})`),
    citations: [
      { label: 'Active alarms', value: `${activeAlarms.length}` },
      { label: 'Critical / high', value: `${crit.length}` },
      { label: 'Top source', value: crit[0]?.source ?? '-' },
    ],
    followUps: ['Why is risk level high today?', 'Which assets require maintenance?', "What's happening on L5 Secure Core?"],
  };
}

function maintenanceIntent(): CopilotResponse {
  const top = predictiveInsights.slice(0, 5);
  return {
    intent: 'maintenance',
    answer:
      `**${predictiveSummary.atRisk} assets** need attention, **${predictiveSummary.within7Days}** predicted to fail within 7 days. ` +
      `Acting now avoids ~**${formatCurrency(predictiveSummary.totalCostAvoided)}** in downtime exposure:`,
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
      { label: 'Avg health', value: `${predictiveSummary.avgHealth}%` },
    ],
    followUps: ['Show telemetry for UPS-A1.', 'Show active alarms.', 'What are your recommended actions?'],
  };
}

function last24hIntent(): CopilotResponse {
  const recent = [...alarms].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const resolved = alarms.filter((a) => a.status === 'resolved').length;
  return {
    intent: 'last_24h',
    answer:
      `In the last 24 hours, **${alarms.length} events** were logged - **${activeAlarms.length} still active**, ` +
      `${alarms.filter((a) => a.status === 'acknowledged').length} acknowledged, ${resolved} auto-resolved:`,
    bullets: recent.slice(0, 6).map((a) => `**${relativeTime(a.timestamp)}** - [${a.status}] ${a.title} (${floorName(a.floorId)})`),
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
      `Current facility draw is **${formatNumber(currentPowerKw)} kW**, consumption today **${formatKwh(energyTodayKwh)}**, ` +
      `running **${energyDeltaPct >= 0 ? '+' : ''}${energyDeltaPct}%** vs the AI baseline (HVAC plant overdraw). Breakdown:`,
    bullets: energyBreakdown.map((b) => `**${b.category}** - ${formatKwh(b.kwh)} (${b.pctOfTotal}% of total)`),
    citations: [
      { label: 'Live power', value: `${formatNumber(currentPowerKw)} kW` },
      { label: 'Today', value: formatKwh(energyTodayKwh) },
      { label: 'vs baseline', value: `${energyDeltaPct >= 0 ? '+' : ''}${energyDeltaPct}%` },
    ],
    followUps: ['What is the building temperature?', 'Which assets require maintenance?', 'What are your recommended actions?'],
  };
}

function occupancyIntent(): CopilotResponse {
  const anomalies = occupancyZonePoints.filter((z) => z.anomaly);
  return {
    intent: 'occupancy',
    answer:
      `Current occupancy is **${formatNumber(occupancyTotal)} people** (${occupancyPct}% of ${formatNumber(occupancyCapacity)} capacity). ` +
      (anomalies.length
        ? `⚠️ **${anomalies.length} occupancy anomaly** - after-hours presence in a critical zone.`
        : `No occupancy anomalies detected.`),
    bullets: occupancyZonePoints
      .slice(0, 6)
      .map((z) => `**${z.zoneName}** - ${z.count}/${z.capacity}${z.anomaly ? '  ⚠️ anomaly (verify vs roster)' : ''}`),
    citations: [
      { label: 'Occupancy', value: `${formatNumber(occupancyTotal)} (${occupancyPct}%)` },
      { label: 'Anomalies', value: `${anomalies.length}` },
      { label: 'Capacity', value: formatNumber(occupancyCapacity) },
    ],
    followUps: ['What is the building temperature?', 'Show active alarms.', 'Why is risk level high today?'],
  };
}

function recommendationsIntent(): CopilotResponse {
  return {
    intent: 'recommendations',
    answer:
      `Prioritized actions to reduce facility risk from **${riskAssessment.score}**. Estimated combined reduction: ` +
      `**${riskAssessment.recommendations.reduce((s, r) => s + Math.abs(parseInt(r.impact)), 0)} pts**.`,
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
      `occupancy **${occupancyPct}%**, avg temp **${buildingClimate.avgTempC}°C**:`,
    bullets: [
      `Risk: ${riskAssessment.score}/100 (${riskAssessment.category}), trend +${riskAssessment.trendDelta} this week`,
      `Assets: ${assetCounts.critical} critical | ${assetCounts.warning} warning | ${assetCounts.offline} offline`,
      `Maintenance: ${predictiveSummary.within7Days} predicted failures within 7 days`,
      `Climate: ${buildingClimate.avgTempC}°C avg, ${buildingClimate.alerts} zone(s) outside comfort band`,
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

// ----------------------------- entity handlers ------------------------------
function assetDetail(a: Asset): CopilotResponse {
  const when =
    a.predictedFailureDays === null
      ? 'no near-term failure forecast'
      : a.predictedFailureDays <= 0
        ? 'failed / offline now'
        : `~${a.predictedFailureDays} days to predicted failure`;
  return {
    intent: 'asset_detail',
    answer:
      `**${a.tag} - ${a.name}** is **${statusLabel(a)}** at **${a.healthPct}% health**, on ${floorName(a.floorId)} ` +
      `(${zoneName(a.zoneId)}). ${a.manufacturer} ${a.model}. ${a.recommendation ? '⚠️ ' + a.recommendation : ''} Live telemetry:`,
    bullets: [
      ...telemetryLines(a),
      `Prediction: ${when} (failure probability ${Math.round(a.failureProbability * 100)}%)`,
      `Last serviced ${formatDate(a.lastServiceDate)} | installed ${formatDate(a.installDate)}`,
    ],
    citations: [
      { label: 'Status', value: statusLabel(a) },
      { label: 'Health', value: `${a.healthPct}%` },
      { label: 'Type', value: assetCategoryLabels[a.category] },
    ],
    followUps: ['Which assets require maintenance?', 'What is the building temperature?', 'Show active alarms.'],
  };
}

function climateResponse(floor: Floor | null, focus: 'temp' | 'humidity' | 'co2'): CopilotResponse {
  if (floor) {
    const c = floorClimate.find((x) => x.floorId === floor.id)!;
    const hvac = assetsByFloor(floor.id).filter((a) => a.category === 'HVAC');
    const lead =
      focus === 'humidity'
        ? `**${floor.name}** humidity is **${c.humidityPct}% RH**. Temperature **${c.tempC}°C** (target ${c.targetTempC}°C), CO₂ **${c.co2ppm} ppm**`
        : focus === 'co2'
          ? `**${floor.name}** CO₂ is **${c.co2ppm} ppm**. Temperature **${c.tempC}°C**, humidity **${c.humidityPct}% RH**`
          : `**${floor.name}** temperature is **${c.tempC}°C** (target ${c.targetTempC}°C). Humidity **${c.humidityPct}% RH**, CO₂ **${c.co2ppm} ppm**`;
    return {
      intent: 'climate_floor',
      answer: `${lead} - status **${c.status.toUpperCase()}**.`,
      bullets: [
        `Temperature ${c.tempC}°C vs target ${c.targetTempC}°C (${(c.tempC - c.targetTempC >= 0 ? '+' : '') + (c.tempC - c.targetTempC).toFixed(1)}°C)`,
        `Relative humidity ${c.humidityPct}% RH`,
        `CO₂ ${c.co2ppm} ppm`,
        ...hvac.map((h) => `${h.tag} ${h.name}: supply ${h.telemetry.supplyTempC ?? '-'}°C, airflow ${h.telemetry.airflowPct ?? '-'}%`),
      ],
      citations: [
        { label: 'Temperature', value: `${c.tempC}°C` },
        { label: 'Humidity', value: `${c.humidityPct}% RH` },
        { label: 'CO₂', value: `${c.co2ppm} ppm` },
      ],
      followUps: ['What is the building humidity?', 'What is the building temperature?', 'Which assets require maintenance?'],
    };
  }
  const b = buildingClimate;
  const lead =
    focus === 'humidity'
      ? `Building-wide humidity averages **${b.avgHumidity}% RH**. Average temperature **${b.avgTempC}°C**, CO₂ **${b.avgCo2} ppm**.`
      : focus === 'co2'
        ? `Building-wide CO₂ averages **${b.avgCo2} ppm**. Average temperature **${b.avgTempC}°C**, humidity **${b.avgHumidity}% RH**.`
        : `Building-wide climate: average temperature **${b.avgTempC}°C**, humidity **${b.avgHumidity}% RH**, CO₂ **${b.avgCo2} ppm**.`;
  return {
    intent: 'climate_building',
    answer:
      `${lead} **${b.alerts} zone(s)** outside the comfort band. ` +
      `The Secure Core (data center) is running warm at **${b.hottest.tempC}°C** due to a CRAC cooling drift.`,
    bullets: floorClimate.map(
      (c) =>
        `**${c.floorName}** - ${c.tempC}°C (target ${c.targetTempC}°C) | ${c.humidityPct}% RH | ${c.co2ppm} ppm${c.status !== 'normal' ? '  ⚠️' : ''}`,
    ),
    citations: [
      focus === 'humidity'
        ? { label: 'Avg humidity', value: `${b.avgHumidity}% RH` }
        : focus === 'co2'
          ? { label: 'Avg CO₂', value: `${b.avgCo2} ppm` }
          : { label: 'Avg temp', value: `${b.avgTempC}°C` },
      { label: 'Warmest', value: `${b.hottest.floorName} (${b.hottest.tempC}°C)` },
      { label: 'Comfort alerts', value: `${b.alerts}` },
    ],
    followUps: ['Which assets require maintenance?', 'How is energy consumption tracking?', 'Show active alarms.'],
  };
}

function floorSummary(floor: Floor): CopilotResponse {
  const fa = assetsByFloor(floor.id);
  const crit = fa.filter((a) => a.status === 'critical' || a.status === 'offline');
  const warn = fa.filter((a) => a.status === 'warning');
  const occ = occupancyByFloor.find((o) => o.floorId === floor.id);
  const clim = floorClimate.find((c) => c.floorId === floor.id)!;
  const fAlarms = activeAlarms.filter((a) => a.floorId === floor.id);
  return {
    intent: 'floor_summary',
    answer:
      `**${floor.name}** - **${fa.length} assets** (${crit.length} critical/offline, ${warn.length} warning), ` +
      `occupancy **${occ ? `${occ.count}/${occ.capacity}` : '-'}**, temperature **${clim.tempC}°C**, ` +
      `**${fAlarms.length} active alarm(s)** here. Zones:`,
    bullets: [
      ...floor.zones.map((z) => `${z.critical ? '🔴 ' : '• '}${z.name}${z.critical ? '  (critical zone)' : ''}`),
      ...(crit.length ? crit.map((a) => `⚠️ ${a.tag} ${a.name} - ${statusLabel(a)} (${a.healthPct}%)`) : []),
    ],
    citations: [
      { label: 'Assets', value: `${fa.length}` },
      { label: 'Temperature', value: `${clim.tempC}°C` },
      { label: 'Active alarms', value: `${fAlarms.length}` },
    ],
    followUps: ['What is the building temperature?', 'Show active alarms.', 'Which assets require maintenance?'],
  };
}

function categoryTelemetry(cat: AssetCategory): CopilotResponse {
  const list = assetsByCategory(cat);
  const crit = list.filter((a) => a.status === 'critical' || a.status === 'offline').length;
  const warn = list.filter((a) => a.status === 'warning').length;
  return {
    intent: 'category_telemetry',
    answer:
      `**${assetCategoryLabels[cat]}**: **${list.length} devices** (${list.length - crit - warn} healthy, ${warn} warning, ${crit} critical/offline). Live readings:`,
    bullets: list.slice(0, 8).map((a) => {
      const t = Object.entries(a.telemetry)
        .slice(0, 3)
        .map(([k, v]) => `${humanizeKey(k)} ${v}`)
        .join(', ');
      return `**${a.tag}** (${floorName(a.floorId)}) | ${statusLabel(a)} ${a.healthPct}% | ${t}`;
    }),
    citations: [
      { label: 'Devices', value: `${list.length}` },
      { label: 'Healthy', value: `${list.length - crit - warn}` },
      { label: 'Needs attention', value: `${crit + warn}` },
    ],
    followUps: ['What is the building temperature?', 'Which assets require maintenance?', 'Show active alarms.'],
  };
}

function countsResponse(cat: AssetCategory | null): CopilotResponse {
  if (cat) {
    const list = assetsByCategory(cat);
    const byFloor = floors
      .map((f) => ({ f, n: list.filter((a) => a.floorId === f.id).length }))
      .filter((x) => x.n > 0);
    return {
      intent: 'count',
      answer: `There are **${list.length} ${assetCategoryLabels[cat].toLowerCase()}** across the facility:`,
      bullets: byFloor.map((x) => `**${x.f.name}** - ${x.n}`),
      citations: [
        { label: assetCategoryLabels[cat], value: `${list.length}` },
        { label: 'Total assets', value: `${assetCounts.total}` },
      ],
      followUps: ['Show active alarms.', 'What is the building temperature?', 'Which assets require maintenance?'],
    };
  }
  return {
    intent: 'count',
    answer: `The facility has **${assetCounts.total} connected assets** - ${assetCounts.online} online, ${assetCounts.warning} warning, ${assetCounts.critical} critical, ${assetCounts.offline} offline. By category:`,
    bullets: (Object.keys(assetCategoryLabels) as AssetCategory[]).map(
      (c) => `**${assetCategoryLabels[c]}** - ${assetCounts.byCategory[c]}`,
    ),
    citations: [
      { label: 'Total', value: `${assetCounts.total}` },
      { label: 'Online', value: `${assetCounts.online}` },
      { label: 'Critical/offline', value: `${assetCounts.critical + assetCounts.offline}` },
    ],
    followUps: ['How many cameras are there?', 'What is the building temperature?', 'Show active alarms.'],
  };
}

// ----------------------------- intent registry ------------------------------
const intents: Intent[] = [
  { name: 'risk', keywords: ['risk', 'why is risk', 'risk level', 'score', 'driver', 'why high'], handler: riskIntent },
  { name: 'alarms', keywords: ['alarm', 'alert', 'incident', 'active alarm'], handler: alarmsIntent },
  { name: 'maintenance', keywords: ['maintenance', 'maintain', 'repair', 'failure', 'predict', 'broken', 'service', 'work order'], handler: maintenanceIntent },
  { name: 'last24h', keywords: ['24 hour', 'last day', 'happened', 'timeline', 'history', 'overnight', 'recent events'], handler: last24hIntent },
  { name: 'energy', keywords: ['energy', 'power consumption', 'consumption', 'electricity', 'kwh', 'kw ', 'usage', 'power draw'], handler: energyIntent },
  { name: 'occupancy', keywords: ['occupancy', 'people', 'crowd', 'present', 'staff', 'how busy'], handler: occupancyIntent },
  { name: 'recommendations', keywords: ['recommend', 'should i', 'should we', 'action', 'next step', 'advise', 'mitigat'], handler: recommendationsIntent },
  { name: 'status', keywords: ['status', 'overview', 'summary', 'situation', 'snapshot', 'how is the facility'], handler: statusIntent },
];

function bestIntent(q: string): { handler: (() => CopilotResponse) | null; score: number } {
  let handler: (() => CopilotResponse) | null = null;
  let score = 0;
  for (const intent of intents) {
    const s = intent.keywords.reduce((acc, kw) => (q.includes(kw) ? acc + kw.length : acc), 0);
    if (s > score) {
      score = s;
      handler = intent.handler;
    }
  }
  return { handler, score };
}

// ----------------------------- query understanding --------------------------
// Expand facility shorthand & synonyms so the engine understands abbreviations
// (RH, temp, AC, CCTV, UPS, gen, kWh, PM, pax, CO2, ...). The matched canonical
// words are appended to the query before intent/entity detection.
const SYNONYMS: [RegExp, string][] = [
  [/\brh\b|r\.h\.|relative humidity|humidit|moisture|damp/, ' humidity climate '],
  [/\btemp\b|temperatur|how (hot|cold|warm)|degrees|thermal|°c|hot in here/, ' temperature climate '],
  [/\bco2\b|co₂|carbon dioxide|air quality|\biaq\b|stuffy|fresh air/, ' co2 climate '],
  [/\ba\/?c\b|air ?con|cooling|chiller|\bcrac\b|\bahu\b|hvac|ventilat/, ' hvac cooling '],
  [/\bcctv\b|\bcams?\b|cameras?|surveillance|video feed/, ' camera '],
  [/\bacs\b|access control|\bdoors?\b|\breaders?\b|badge|turnstile|card reader/, ' access door '],
  [/\bups\b|batter|backup power|standby power/, ' ups battery '],
  [/\bgen(set)?\b|generator|diesel/, ' generator electrical '],
  [/\bpax\b|people|head ?count|foot ?fall|occupanc|how busy|crowd|staff present/, ' occupancy people '],
  [/\bk?wh?\b|\bmwh\b|power (draw|usage|consumption)|energy|electric|consumption|\bload\b/, ' energy power consumption '],
  [/\bpm\b|preventive|maint|work ?order|ticket|servic|repair|broken|\bfix\b|fault/, ' maintenance '],
  [/alarm|alert|trouble|warning|incident/, ' alarm '],
  [/\brisk\b|danger|threat|posture/, ' risk '],
  [/net(work)?|switch|router|bandwidth|latency/, ' network '],
  [/sensor|\biot\b|probe/, ' sensor '],
  [/\bfire\b|smoke|suppress/, ' fire '],
];

function expandQuery(q: string): string {
  let extra = '';
  for (const [re, words] of SYNONYMS) if (re.test(q)) extra += words;
  return q + extra;
}

const CLIMATE_RE = /temperatur|humid|co2|co₂|climate/;
const COUNT_RE = /how many|number of|count of|how much/;

export function copilotRespond(query: string): CopilotResponse {
  const trimmed = query.trim();
  if (!trimmed) return statusIntent();
  const raw = trimmed.toLowerCase();
  const q = expandQuery(raw); // shorthand-expanded text for matching

  const asset = findAsset(raw); // tags / names come from the raw text
  const floor = findFloor(q);
  const cat = findCategory(q);
  const isClimate = CLIMATE_RE.test(q);
  const isCount = COUNT_RE.test(q);
  const climateFocus: 'temp' | 'humidity' | 'co2' =
    /\brh\b|humid|moisture|damp/.test(raw)
      ? 'humidity'
      : /co2|co₂|carbon|air quality|iaq|stuffy/.test(raw)
        ? 'co2'
        : 'temp';
  const { handler, score } = bestIntent(q);

  // 1) Specific asset lookup (unless it's really a climate question)
  if (asset && !isClimate) return assetDetail(asset);
  // 2) Temperature / humidity / CO2 (optionally scoped to a floor)
  if (isClimate) return climateResponse(floor, climateFocus);
  // 3) Counts
  if (isCount) return countsResponse(cat);
  // 4) Strong topic match
  if (handler && score >= 5) return handler();
  // 5) A specific floor was named with no stronger topic
  if (floor && (score === 0 || /\bfloor\b|\blevel\b|what.*on|happening|going on|zone|room|inside/.test(q)))
    return floorSummary(floor);
  // 6) A system/category telemetry request
  if (cat && (score === 0 || /telemetry|data|reading|show|status|all|detail/.test(q)))
    return categoryTelemetry(cat);
  // 7) Weaker topic match
  if (handler && score > 0) return handler();
  // 8) Fall back to any detected entity
  if (floor) return floorSummary(floor);
  if (cat) return categoryTelemetry(cat);

  // 9) Graceful, capability-revealing fallback
  return {
    intent: 'fallback',
    answer:
      `I'm grounded on live data for **${building.name}** and understand shorthand too (RH, temp, AC, CCTV, UPS, kWh, PM…). ` +
      `Ask about temperature, humidity, CO₂, energy, occupancy, risk, alarms, maintenance, or the live telemetry of any of the ` +
      `${assetCounts.total} assets, any floor, or any system. Right now: risk **${riskAssessment.category} (${riskAssessment.score})**, ` +
      `avg temp **${buildingClimate.avgTempC}°C**, humidity **${buildingClimate.avgHumidity}% RH**, **${activeAlarms.length} active alarms**. Try:`,
    bullets: suggestedQuestions.map((s) => `“${s}”`),
    citations: [
      { label: 'Risk', value: `${riskAssessment.score} (${riskAssessment.category})` },
      { label: 'Avg temp', value: `${buildingClimate.avgTempC}°C` },
      { label: 'Humidity', value: `${buildingClimate.avgHumidity}% RH` },
    ],
    followUps: suggestedQuestions.slice(0, 3),
  };
}
