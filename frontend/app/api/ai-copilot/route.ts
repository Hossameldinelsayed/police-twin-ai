import { NextResponse } from 'next/server';
import type { CopilotResponse } from '@/lib/types';
import { copilotRespond } from '@/lib/ai/copilot';
import { riskAssessment } from '@/lib/ai/risk';
import { predictiveInsights } from '@/lib/ai/predictive';
import { kpiSummary } from '@/lib/ai';
import { activeAlarms } from '@/lib/data/alarms';
import { assets } from '@/lib/data/assets';
import { building, floorName } from '@/lib/data/facility';
import {
  floorClimate,
  buildingClimate,
  energyTodayKwh,
  energyDeltaPct,
  currentPowerKw,
  occupancyTotal,
  occupancyCapacity,
  occupancyPct,
} from '@/lib/data/telemetry';
import { maintenanceEvents } from '@/lib/data/maintenance';
import { relativeTime } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// AI COPILOT API  (POST /api/ai-copilot)
// If OPENAI_API_KEY is set, answers with real GPT grounded on the live facility
// data. Otherwise (or on any error) falls back to the deterministic rule engine
// so the Copilot always works - offline, no key, zero cost.
// ============================================================================

function buildContext() {
  return {
    building: { name: building.name, code: building.code, status: building.status, floors: building.floors },
    risk: {
      score: riskAssessment.score,
      category: riskAssessment.category,
      trendDelta: riskAssessment.trendDelta,
      summary: riskAssessment.summary,
      factors: riskAssessment.factors.map((f) => ({
        domain: f.domain,
        label: f.label,
        score: f.score,
        contribution: f.contribution,
        detail: f.detail,
      })),
      recommendations: riskAssessment.recommendations.map((r) => ({
        priority: r.priority,
        action: r.action,
        impact: r.impact,
      })),
    },
    kpis: {
      activeAlarms: kpiSummary.activeAlarms,
      criticalAlarms: kpiSummary.criticalAlarms,
      occupancyTotal,
      occupancyCapacity,
      occupancyPct,
      energyTodayKwh,
      energyDeltaPct,
      currentPowerKw,
      assetsOnline: kpiSummary.assetsOnline,
      assetsTotal: kpiSummary.assetsTotal,
    },
    climate: {
      avgTempC: buildingClimate.avgTempC,
      avgHumidityPct: buildingClimate.avgHumidity,
      avgCo2ppm: buildingClimate.avgCo2,
      perFloor: floorClimate.map((c) => ({
        floor: c.floorName,
        tempC: c.tempC,
        targetTempC: c.targetTempC,
        humidityPct: c.humidityPct,
        co2ppm: c.co2ppm,
        status: c.status,
      })),
    },
    activeAlarms: activeAlarms.map((a) => ({
      severity: a.severity,
      type: a.type,
      title: a.title,
      message: a.message,
      floor: floorName(a.floorId),
      source: a.source,
      raised: relativeTime(a.timestamp),
    })),
    predictiveMaintenance: predictiveInsights.slice(0, 8).map((p) => ({
      tag: p.assetTag,
      name: p.assetName,
      floor: p.floorName,
      healthPct: p.healthPct,
      predictedFailureDays: p.predictedFailureDays,
      recommendation: p.recommendation,
    })),
    assets: assets.map((a) => ({
      tag: a.tag,
      name: a.name,
      category: a.category,
      floor: floorName(a.floorId),
      status: a.status,
      healthPct: a.healthPct,
      predictedFailureDays: a.predictedFailureDays,
      telemetry: a.telemetry,
    })),
    maintenance: maintenanceEvents.map((m) => ({
      title: m.title,
      asset: m.assetName,
      kind: m.kind,
      status: m.status,
      priority: m.priority,
      scheduled: m.scheduledDate,
    })),
  };
}

const SYSTEM_PROMPT = `You are the AI Facility Copilot for ${building.name}, a smart police facility command center.
Answer the user's question using ONLY the JSON facility data provided in the next message. Never invent values.
Be concise and executive. Always use the real numbers with units (°C, %, ppm, kW, kWh). Understand facility shorthand
(RH = relative humidity, AC/HVAC/CRAC/AHU = cooling, CCTV = camera, ACS = access control, UPS = power backup,
gen = generator, kWh = energy, PM = maintenance, pax = occupancy). If the data does not contain the answer, say so briefly.
Respond ONLY as a JSON object with this exact shape:
{"answer": string, "bullets": string[], "citations": [{"label": string, "value": string}], "followUps": string[]}
- answer: 1-3 sentences, may use **bold** for key figures.
- bullets: 0-6 short supporting points (may use **bold**); [] if not needed.
- citations: 1-4 key figures (e.g. {"label":"Avg temp","value":"23°C"}).
- followUps: 2-3 short follow-up questions the user might ask next.`;

export async function POST(req: Request) {
  let query = '';
  let debug = false;
  try {
    const body = await req.json();
    query = typeof body?.query === 'string' ? body.query : '';
    debug = body?.debug === true;
  } catch {
    query = '';
  }
  if (!query.trim()) {
    return NextResponse.json({ ...emptyResponse(), engine: 'rule' });
  }

  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // No key -> deterministic rule engine (still fully functional).
  if (!key) {
    return NextResponse.json({ ...copilotRespond(query), engine: 'rule' });
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 700,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `FACILITY DATA (JSON):\n${JSON.stringify(buildContext())}\n\nQUESTION: ${query}` },
        ],
      }),
    });

    if (!res.ok) {
      // Quota/auth/rate error -> graceful fallback.
      const errText = await res.text().catch(() => '');
      return NextResponse.json({
        ...copilotRespond(query),
        engine: 'rule-fallback',
        ...(debug ? { debug: { status: res.status, error: errText.slice(0, 500) } } : {}),
      });
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content) as Partial<CopilotResponse>;

    const response: CopilotResponse & { engine: string } = {
      intent: 'gpt',
      answer: parsed.answer || 'I could not find that in the facility data.',
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 8) : [],
      citations: [
        ...(Array.isArray(parsed.citations) ? parsed.citations.slice(0, 4) : []),
        { label: 'Engine', value: model },
      ],
      followUps: Array.isArray(parsed.followUps) ? parsed.followUps.slice(0, 3) : [],
      engine: 'gpt',
    };
    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json({
      ...copilotRespond(query),
      engine: 'rule-fallback',
      ...(debug ? { debug: { error: String(e).slice(0, 300) } } : {}),
    });
  }
}

function emptyResponse(): CopilotResponse {
  return copilotRespond('');
}
