# Ministry of Interior — API

Reference backend for the **Ministry of Interior** smart-facility digital twin. It
mirrors the Next.js Command Center's data contracts and exposes a REST API plus
an explainable AI engine (composite risk scoring, predictive maintenance, and a
grounded facility copilot).

- **Stack:** Node.js 18+, Express 4, PostgreSQL (optional), CommonJS — no build step.
- **Runs standalone.** By default it serves a deterministic in-memory dataset, so
  `npm install && npm start` is all you need. Point it at PostgreSQL only when you
  want a database-backed deployment.

---

## Quick start

### Without a database (default — zero config)

```bash
cd backend
npm install
npm start
```

The API boots on `http://localhost:4000` serving the in-memory dataset. Verify:

```bash
curl http://localhost:4000/api/health
```

### With PostgreSQL

```bash
cd backend
npm install
cp .env.example .env          # then edit .env

# In .env set:
#   USE_DB=true
#   DATABASE_URL=postgres://USER:PASS@HOST:5432/police_twin

createdb police_twin          # or create the DB however you prefer
npm run seed                  # creates schema + inserts the dataset
npm start
```

`npm run seed` runs `db/schema.sql` (drops & recreates all tables/views) and then
inserts every row from the canonical dataset, all inside one transaction. It is
idempotent — re-run it any time to reset to a clean state. If the database is
unreachable it exits with a clear error message.

> The `seed` script reads `DATABASE_URL` directly and works regardless of the
> `USE_DB` flag. `USE_DB` only controls which source the **running API** uses.

### Development (auto-reload)

```bash
npm run dev      # nodemon
```

---

## Environment variables

| Variable       | Default                                               | Description                                                            |
| -------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| `PORT`         | `4000`                                                | HTTP port the API listens on.                                          |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/police_twin` | PostgreSQL connection string (used by the API when `USE_DB=true` and always by the seeder). |
| `USE_DB`       | `false`                                               | `true` = read from PostgreSQL; `false` = serve the in-memory dataset.  |
| `CORS_ORIGIN`  | `*`                                                   | Comma-separated allowed origins. `*` allows any (development).         |

A missing or unreachable database never crashes the API at startup — when
`USE_DB=false` PostgreSQL is never contacted.

---

## Project layout

```
backend/
├── package.json
├── .env.example
├── README.md
├── db/
│   ├── schema.sql        # PostgreSQL DDL (tables, indexes, comments, views)
│   └── seed.js           # creates schema + inserts the dataset (idempotent)
└── src/
    ├── server.js         # Express app, middleware, health, error handling
    ├── db.js             # pg Pool + query() helper + dbEnabled flag
    ├── data/
    │   └── dataset.js    # deterministic in-memory dataset (source of truth)
    ├── services/
    │   └── aiEngine.js   # risk / predictive / KPI / copilot logic
    └── routes/
        └── index.js      # all REST endpoints
```

---

## Endpoints

Base URL: `http://localhost:4000`

| Method | Path                                       | Description                                                |
| ------ | ------------------------------------------ | ---------------------------------------------------------- |
| GET    | `/api/health`                              | Service health + active data source.                       |
| GET    | `/api/facility`                            | Building metadata + floor/zone/asset counts.               |
| GET    | `/api/floors`                              | All floors (with nested zones).                            |
| GET    | `/api/floors/:id`                          | One floor + its assets.                                    |
| GET    | `/api/assets`                              | Assets, filterable by `?category=`, `?floorId=`, `?status=`. |
| GET    | `/api/assets/:id`                          | One asset by id (or tag).                                  |
| GET    | `/api/alarms`                              | Alarm stream, filterable by `?status=`, `?type=`.          |
| GET    | `/api/telemetry/energy`                    | 24h energy curve, today totals, breakdown, 30d trend.      |
| GET    | `/api/telemetry/occupancy`                 | Per-floor + zone occupancy + 24h trend.                    |
| GET    | `/api/maintenance`                         | Work orders, filterable by `?status=`, `?kind=`.           |
| GET    | `/api/risk`                                | Composite, explainable risk assessment.                    |
| GET    | `/api/predictive`                          | Predictive-maintenance insights + summary.                 |
| GET    | `/api/kpis`                                | Executive KPI snapshot.                                    |
| GET    | `/api/emergency`                           | All crisis scenarios (summarized).                         |
| GET    | `/api/emergency/:id`                       | One scenario with full response playbook.                  |
| POST   | `/api/copilot`                             | `{ "query": "..." }` → grounded NL answer.                 |
| GET    | `/api/copilot/suggestions`                 | Suggested starter questions.                               |

### Filters

```bash
curl "http://localhost:4000/api/assets?category=UPS"
curl "http://localhost:4000/api/assets?floorId=flr-01&status=critical"
curl "http://localhost:4000/api/alarms?status=active"
curl "http://localhost:4000/api/maintenance?status=overdue"
```

---

## Example requests & responses

### Health

```bash
curl http://localhost:4000/api/health
```

```json
{
  "status": "ok",
  "service": "police-twin-ai-api",
  "version": "1.0.0",
  "dataSource": "in-memory",
  "facility": "PTX-HQ-01",
  "uptimeSeconds": 3,
  "timestamp": "2026-06-25T09:00:00.000Z"
}
```

### Risk assessment

```bash
curl http://localhost:4000/api/risk
```

```json
{
  "score": 64,
  "category": "High",
  "trendDelta": 18,
  "generatedAt": "2026-06-24T14:30:00.000Z",
  "summary": "Facility risk is HIGH at 64/100, up 18 pts over the past week. ...",
  "factors": [
    {
      "domain": "equipment",
      "label": "Equipment & Infrastructure",
      "score": 65,
      "weight": 0.4,
      "contribution": 26,
      "trend": "up",
      "detail": "Critical power and access assets are degraded ...",
      "signals": ["2 asset(s) in critical state (UPS-A1, ACS-VLT-01)", "..."]
    }
  ],
  "recommendations": [
    {
      "id": "rec-eq-1",
      "priority": "critical",
      "domain": "equipment",
      "action": "Dispatch crew to replace UPS System A battery string within 72h",
      "rationale": "Predicted failure in 4 days; power redundancy currently degraded.",
      "impact": "-11 pts"
    }
  ],
  "confidence": 0.88
}
```

### KPI snapshot

```bash
curl http://localhost:4000/api/kpis
```

```json
{
  "riskScore": 64,
  "riskCategory": "High",
  "riskDelta": 18,
  "activeAlarms": 8,
  "criticalAlarms": 3,
  "energyKwh": 9876,
  "energyDeltaPct": 9.2,
  "occupancyCount": 463,
  "occupancyCapacity": 906,
  "occupancyPct": 51,
  "securityStatus": "elevated",
  "securityDetail": "2 access/security event(s) active",
  "maintenanceAlerts": 9,
  "maintenanceOverdue": 1,
  "assetsOnline": 47,
  "assetsTotal": 48
}
```

### Copilot (AI)

```bash
curl -X POST http://localhost:4000/api/copilot \
  -H "Content-Type: application/json" \
  -d '{"query":"Why is risk level high today?"}'
```

```json
{
  "query": "Why is risk level high today?",
  "intent": "risk_explanation",
  "answer": "Facility risk is **High** at **64/100**, up 18 points over the past week. ...",
  "bullets": [
    "**Equipment & Infrastructure** — 65/100 (26 pts to overall). ...",
    "**Security & Access** — 60/100 (18 pts to overall). ..."
  ],
  "citations": [
    { "label": "Risk score", "value": "64 / 100 (High)" },
    { "label": "Top driver", "value": "Equipment & Infrastructure (26 pts)" },
    { "label": "Model confidence", "value": "88%" }
  ],
  "followUps": [
    "What are your recommended actions?",
    "Show active alarms.",
    "Which assets require maintenance?"
  ]
}
```

The copilot uses keyword intent matching. Try queries like:
`"show active alarms"`, `"which assets require maintenance"`,
`"what happened during the last 24 hours"`, `"how is energy consumption tracking"`,
`"what are your recommended actions"`, `"occupancy"`.

---

## The AI engine

`src/services/aiEngine.js` is pure (takes the dataset as an argument) and
deterministic:

- **`computeRisk(dataset)`** — weighted blend of four explainable domains:
  `equipment 0.40 · security 0.30 · energy 0.16 · occupancy 0.14`. Each domain
  produces a 0–100 sub-score with traceable `signals`; the overall score maps to
  a category (`Low → Severe`) and carries actionable recommendations.
- **`computePredictive(dataset)`** — ranks assets by near-term failure risk and
  estimates downtime hours and avoided cost.
- **`buildKpiSummary(dataset)`** — the executive KPI snapshot.
- **`copilotRespond(query, dataset)`** — keyword intent matching over live state.

---

## Database schema

`db/schema.sql` defines: `buildings`, `floors`, `zones`, `assets`, `alarms`,
`energy_readings`, `occupancy_readings`, `maintenance_events` and
`emergency_scenarios`. Nested arrays that are always read with their parent
(asset `position`/`telemetry`, scenario `impacted_zones`/`response_plan`/
`cascade_risks`) are stored as `JSONB`. Foreign keys, check constraints and
indexes (`assets.floor_id`, `alarms.status`, `alarms.ts`, …) are included, along
with convenience views:

- `v_active_alarms` — active alarms with floor names, newest first.
- `v_asset_health_summary` — per-category health rollup.
- `v_maintenance_open` — open work orders by priority then due date.

---

## License

MIT
