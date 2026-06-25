// ============================================================================
// POLICE TWIN AI — REST API routes
// ----------------------------------------------------------------------------
// All endpoints read from the in-memory dataset (the source of truth) and run
// the AI engine on demand. Controllers are kept inline for readability; each is
// a thin, pure function over the dataset + AI engine.
//
// When USE_DB=true the same shapes are available in PostgreSQL (see db/schema.sql
// and db/seed.js); hydrating from the DB instead of memory is a drop-in swap
// (load rows of the same shape into a `dataset`-like object).
// ============================================================================

'use strict';

const express = require('express');

const { dataset } = require('../data/dataset');
const ai = require('../services/aiEngine');

const router = express.Router();

// ----------------------------------------------------------------------------
// Small helpers
// ----------------------------------------------------------------------------

/** Wrap an async controller so thrown errors reach the central error handler. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function notFound(res, message) {
  return res.status(404).json({ error: 'not_found', message });
}

// ============================================================================
// FACILITY
// ============================================================================

// GET /api/facility — building metadata + floor/zone/asset counts.
router.get(
  '/facility',
  asyncHandler(async (_req, res) => {
    res.json({
      building: dataset.building,
      floorCount: dataset.floors.length,
      zoneCount: dataset.allZones.length,
      assetCount: dataset.assets.length,
    });
  }),
);

// GET /api/floors — all floors (with nested zones).
router.get(
  '/floors',
  asyncHandler(async (_req, res) => {
    res.json({ count: dataset.floors.length, floors: dataset.floors });
  }),
);

// GET /api/floors/:id — a single floor, including its assets.
router.get(
  '/floors/:id',
  asyncHandler(async (req, res) => {
    const floor = dataset.floors.find((f) => f.id === req.params.id);
    if (!floor) return notFound(res, `No floor with id "${req.params.id}".`);
    const assets = dataset.assets.filter((a) => a.floorId === floor.id);
    res.json({ floor, assets });
  }),
);

// ============================================================================
// ASSETS
// ============================================================================

// GET /api/assets?category=&floorId=&status= — filterable asset inventory.
router.get(
  '/assets',
  asyncHandler(async (req, res) => {
    const { category, floorId, status } = req.query;
    let assets = dataset.assets;
    if (category) assets = assets.filter((a) => a.category === category);
    if (floorId) assets = assets.filter((a) => a.floorId === floorId);
    if (status) assets = assets.filter((a) => a.status === status);

    res.json({
      count: assets.length,
      filters: { category: category || null, floorId: floorId || null, status: status || null },
      assets,
    });
  }),
);

// GET /api/assets/:id — a single asset by id (or tag, for convenience).
router.get(
  '/assets/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const asset = dataset.assets.find((a) => a.id === id || a.tag === id);
    if (!asset) return notFound(res, `No asset with id/tag "${id}".`);
    res.json({ asset });
  }),
);

// ============================================================================
// ALARMS
// ============================================================================

// GET /api/alarms?status= — alarm/event stream (active|acknowledged|resolved).
router.get(
  '/alarms',
  asyncHandler(async (req, res) => {
    const { status, type } = req.query;
    let alarms = dataset.alarms;
    if (status) alarms = alarms.filter((a) => a.status === status);
    if (type) alarms = alarms.filter((a) => a.type === type);

    // newest first
    alarms = [...alarms].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const active = dataset.alarms.filter((a) => a.status === 'active');
    res.json({
      count: alarms.length,
      activeCount: active.length,
      criticalCount: active.filter((a) => a.severity === 'critical' || a.severity === 'high').length,
      filters: { status: status || null, type: type || null },
      alarms,
    });
  }),
);

// ============================================================================
// TELEMETRY
// ============================================================================

// GET /api/telemetry/energy — 24h readings + today totals + breakdown.
router.get(
  '/telemetry/energy',
  asyncHandler(async (_req, res) => {
    res.json({
      currentPowerKw: dataset.currentPowerKw,
      energyTodayKwh: dataset.energyTodayKwh,
      energyBaselineToday: dataset.energyBaselineToday,
      energyDeltaPct: dataset.energyDeltaPct,
      breakdown: dataset.energyBreakdown,
      readings: dataset.energyReadings,
      trend30d: dataset.energyTrend,
    });
  }),
);

// GET /api/telemetry/occupancy — per-floor + zone-level occupancy + 24h trend.
router.get(
  '/telemetry/occupancy',
  asyncHandler(async (_req, res) => {
    res.json({
      total: dataset.occupancyTotal,
      capacity: dataset.occupancyCapacity,
      pct: dataset.occupancyPct,
      byFloor: dataset.occupancyByFloor,
      zonePoints: dataset.occupancyZonePoints,
      hourly: dataset.occupancyHourly,
    });
  }),
);

// ============================================================================
// MAINTENANCE
// ============================================================================

// GET /api/maintenance?status=&kind= — work orders with summary counts.
router.get(
  '/maintenance',
  asyncHandler(async (req, res) => {
    const { status, kind } = req.query;
    let events = dataset.maintenanceEvents;
    if (status) events = events.filter((m) => m.status === status);
    if (kind) events = events.filter((m) => m.kind === kind);

    res.json({
      count: events.length,
      openCount: dataset.maintenanceEvents.filter((m) => m.status !== 'completed').length,
      overdueCount: dataset.maintenanceEvents.filter((m) => m.status === 'overdue').length,
      filters: { status: status || null, kind: kind || null },
      events,
    });
  }),
);

// ============================================================================
// AI ENGINE
// ============================================================================

// GET /api/risk — composite, explainable risk assessment.
router.get(
  '/risk',
  asyncHandler(async (_req, res) => {
    res.json(ai.computeRisk(dataset));
  }),
);

// GET /api/predictive — ranked predictive-maintenance insights + summary.
router.get(
  '/predictive',
  asyncHandler(async (_req, res) => {
    const insights = ai.computePredictive(dataset);
    res.json({
      summary: ai.predictiveSummary(dataset, insights),
      insights,
    });
  }),
);

// GET /api/kpis — executive KPI snapshot.
router.get(
  '/kpis',
  asyncHandler(async (_req, res) => {
    res.json(ai.buildKpiSummary(dataset));
  }),
);

// ============================================================================
// EMERGENCY
// ============================================================================

// GET /api/emergency — all pre-modeled crisis scenarios (summarized).
router.get(
  '/emergency',
  asyncHandler(async (_req, res) => {
    const scenarios = dataset.emergencyScenarios.map((s) => ({
      id: s.id,
      type: s.type,
      name: s.name,
      severity: s.severity,
      description: s.description,
      estimatedRecoveryMinutes: s.estimatedRecoveryMinutes,
      affectedAssets: s.affectedAssets,
      affectedOccupants: s.affectedOccupants,
      impactedZoneCount: s.impactedZones.length,
      responseStepCount: s.responsePlan.length,
    }));
    res.json({ count: scenarios.length, scenarios });
  }),
);

// GET /api/emergency/:id — a full scenario with response playbook.
router.get(
  '/emergency/:id',
  asyncHandler(async (req, res) => {
    const scenario = dataset.emergencyScenarios.find((s) => s.id === req.params.id);
    if (!scenario) return notFound(res, `No emergency scenario with id "${req.params.id}".`);
    res.json({ scenario });
  }),
);

// ============================================================================
// COPILOT
// ============================================================================

// POST /api/copilot { query } — grounded NL answer from the AI copilot.
router.post(
  '/copilot',
  asyncHandler(async (req, res) => {
    const query = req.body && typeof req.body.query === 'string' ? req.body.query : '';
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'bad_request',
        message: 'Request body must be JSON with a "query" string field.',
      });
    }
    const response = ai.copilotRespond(query, dataset);
    res.json({ query, ...response });
  }),
);

// GET /api/copilot/suggestions — suggested starter questions.
router.get(
  '/copilot/suggestions',
  asyncHandler(async (_req, res) => {
    res.json({ suggestions: ai.suggestedQuestions });
  }),
);

module.exports = router;
