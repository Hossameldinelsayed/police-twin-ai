# Backend REST API Reference

The optional **Express** backend in `backend/` exposes the Ministry of Interior data over a REST API at `/api/*`. It mirrors the exact data contracts the frontend uses (see [DATA_MODEL.md](DATA_MODEL.md)), so a client can run on the built-in mock data **or** against this API with no change to the data shapes.

- **Base URL:** `http://localhost:4000/api`
- **Content type:** `application/json`
- **CORS:** controlled by `CORS_ORIGIN` (default `http://localhost:3000`).

> The backend is **optional** — the executive demo never requires it. See [INSTALLATION.md](INSTALLATION.md) to run it.

---

## In-memory vs database modes

The API runs in one of two modes, selected by the `USE_DB` environment variable:

| Mode | `USE_DB` | Behavior |
|------|----------|----------|
| **In-memory** | `false` (default) | Serves the seeded Central Command HQ dataset from memory. No PostgreSQL needed. `GET` returns seed data; `POST /api/copilot` is computed live. State resets on restart. |
| **Database** | `true` | Reads/writes PostgreSQL using `db/schema.sql`. Run `db:migrate` + `db:seed` first. Writes (e.g. alarm acknowledgements) persist. |

Both modes return **identical response shapes** — the storage layer is an implementation detail behind the controllers.

---

## Endpoint catalog

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/health` | Liveness probe + active mode (`db` / `memory`). |
| `GET`  | `/api/facility` | The building record (Central Command HQ). |
| `GET`  | `/api/floors` | All 6 floors with their zones. |
| `GET`  | `/api/floors/:id` | A single floor (e.g. `flr-03`) with zones. |
| `GET`  | `/api/assets` | All assets (~48). Supports filters (see below). |
| `GET`  | `/api/assets/:id` | A single asset by id (e.g. `ast-001`). |
| `GET`  | `/api/alarms` | Alarm / event stream. Supports `status`, `severity`, `type`. |
| `GET`  | `/api/telemetry/energy` | 24h hourly energy readings + breakdown + current draw. |
| `GET`  | `/api/telemetry/occupancy` | Occupancy by floor, by zone, and 24h hourly trend. |
| `GET`  | `/api/maintenance` | Maintenance work orders. Supports `status`, `kind`, `priority`. |
| `GET`  | `/api/risk` | The current explainable risk assessment. |
| `GET`  | `/api/predictive` | Ranked predictive-maintenance insights + summary. |
| `GET`  | `/api/kpis` | The Command Center KPI summary. |
| `GET`  | `/api/emergency` | All emergency scenarios. |
| `GET`  | `/api/emergency/:id` | A single scenario (e.g. `scn-fire`). |
| `POST` | `/api/copilot` | Ask the copilot a natural-language question; returns a grounded answer. |

### Common query parameters

| Endpoint | Param | Values | Effect |
|----------|-------|--------|--------|
| `/api/assets` | `category` | `HVAC` `UPS` `Electrical` `FireSystem` `Camera` `AccessControl` `Sensor` `Network` | Filter by asset category. |
| `/api/assets` | `status` | `operational` `warning` `critical` `offline` | Filter by status. |
| `/api/assets` | `floorId` | `flr-01` … `flr-06` | Filter by floor. |
| `/api/alarms` | `status` | `active` `acknowledged` `resolved` | Filter by alarm status. |
| `/api/alarms` | `severity` | `critical` `high` `medium` `low` | Filter by severity. |
| `/api/alarms` | `type` | `fire` `security` `maintenance` `power` `access` `environmental` `network` | Filter by alarm type. |
| `/api/maintenance` | `status` | `scheduled` `in_progress` `completed` `overdue` | Filter work orders. |
| `/api/maintenance` | `kind` | `predictive` `preventive` `corrective` | Filter by kind. |

---

## Example requests & responses

### `GET /api/health`

```bash
curl http://localhost:4000/api/health
```

```json
{
  "status": "ok",
  "service": "police-twin-ai-api",
  "mode": "memory",
  "time": "2024-01-01T13:00:00.000Z"
}
```

---

### `GET /api/risk`

The flagship endpoint: the explainable, weighted composite risk assessment.

```bash
curl http://localhost:4000/api/risk
```

```json
{
  "score": 64,
  "category": "High",
  "trendDelta": 18,
  "generatedAt": "2024-01-01T13:00:00.000Z",
  "summary": "Facility risk is HIGH at 64/100, up 18 pts over the past week. The dominant driver is equipment & infrastructure (24.4 pts), led by critical power and access faults. 3 of 4 domains are elevated.",
  "confidence": 0.88,
  "factors": [
    {
      "domain": "equipment",
      "label": "Equipment & Infrastructure",
      "score": 61,
      "weight": 0.4,
      "contribution": 24.4,
      "trend": "up",
      "detail": "Critical power and access assets are degraded, with several near-term predicted failures driving infrastructure risk.",
      "signals": [
        "1 asset(s) in critical state (UPS-A1)",
        "1 asset(s) offline (CAM-L2-02)",
        "2 asset(s) in warning",
        "3 predicted failure(s) within 14 days"
      ]
    },
    {
      "domain": "security",
      "label": "Security & Access",
      "score": 52,
      "weight": 0.3,
      "contribution": 15.6,
      "trend": "up",
      "detail": "Active access-control faults and an offline camera reduce assurance at secure zones (Evidence Vault, Dispatch).",
      "signals": [
        "3 active security/access event(s)",
        "HIGH: Repeated access denials — Evidence Vault",
        "Surveillance coverage gap from offline camera"
      ]
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
  ]
}
```

> Values are illustrative of the deterministic output; weights are fixed at equipment **0.40**, security **0.30**, energy **0.16**, occupancy **0.14**.

---

### `GET /api/assets` (with filter)

```bash
curl "http://localhost:4000/api/assets?category=UPS&status=critical"
```

```json
[
  {
    "id": "ast-001",
    "tag": "UPS-A1",
    "name": "UPS System A (Primary)",
    "category": "UPS",
    "floorId": "flr-01",
    "zoneId": "flr-01-z4",
    "position": { "x": 4.2, "y": 2.2, "z": -2.1 },
    "status": "critical",
    "healthPct": 41,
    "manufacturer": "Eaton",
    "model": "93PM-160",
    "installDate": "2021-02-20",
    "lastServiceDate": "2023-09-12",
    "predictedFailureDays": 4,
    "failureProbability": 0.78,
    "mtbfDays": 900,
    "recommendation": "Replace battery string 2 within 72h — cells exceeding thermal threshold under load.",
    "telemetry": {
      "loadPct": 52,
      "batteryPct": 41,
      "runtimeMin": 17,
      "inputVoltage": 231
    }
  }
]
```

---

### `GET /api/emergency/:id`

```bash
curl http://localhost:4000/api/emergency/scn-fire
```

```json
{
  "id": "scn-fire",
  "type": "fire",
  "name": "Fire — Primary Data Center (L5)",
  "severity": "critical",
  "description": "Smoke detected in the L5 Primary Data Center. Clean-agent suppression armed.",
  "triggerNarrative": "VESDA aspirating detector + thermal camera correlate a smoke signature at rack row C. Fire panel L5 escalates to alarm.",
  "impactedZones": [
    { "zoneId": "flr-06-z1", "zoneName": "Primary Data Center", "floorName": "L5 · Secure Core", "impact": "severe" },
    { "zoneId": "flr-06-z2", "zoneName": "Evidence Vault", "floorName": "L5 · Secure Core", "impact": "major" }
  ],
  "responsePlan": [
    { "order": 1, "actor": "Fire Detection AI", "action": "Confirm smoke signature, raise Stage-2 alarm", "etaMinutes": 0, "automated": true },
    { "order": 2, "actor": "BMS", "action": "Shut down CRAC recirculation, close fire dampers", "etaMinutes": 1, "automated": true },
    { "order": 5, "actor": "Watch Commander", "action": "Verify zone evacuation via cameras, authorize discharge", "etaMinutes": 2, "automated": false }
  ],
  "estimatedRecoveryMinutes": 240,
  "affectedAssets": 11,
  "affectedOccupants": 14,
  "cascadeRisks": [
    "Core service outage if failover is delayed",
    "Evidence integrity exposure during suppression discharge",
    "Loss of L5 surveillance if power is isolated"
  ]
}
```

---

### `POST /api/copilot`

Ask the grounded facility copilot a question. The engine matches intent against live state and returns an answer with bullet evidence, citations and follow-ups.

**Request:**

```bash
curl -X POST http://localhost:4000/api/copilot \
  -H "Content-Type: application/json" \
  -d '{ "query": "Why is risk level high today?" }'
```

```json
{ "query": "Why is risk level high today?" }
```

**Response:**

```json
{
  "intent": "risk_explanation",
  "answer": "Facility risk is **High** at **64/100**, up 18 points over the past week. The score is driven primarily by equipment & infrastructure and security & access risk. Here's the breakdown:",
  "bullets": [
    "**Equipment & Infrastructure** — 61/100 (24.4 pts to overall). Critical power and access assets are degraded, with several near-term predicted failures driving infrastructure risk.",
    "**Security & Access** — 52/100 (15.6 pts to overall). Active access-control faults and an offline camera reduce assurance at secure zones.",
    "**Energy & Environment** — 41/100 (6.6 pts to overall). Energy draw exceeds the modeled baseline, consistent with degrading cooling efficiency."
  ],
  "citations": [
    { "label": "Risk score", "value": "64 / 100 (High)" },
    { "label": "Top driver", "value": "Equipment & Infrastructure (24.4 pts)" },
    { "label": "Model confidence", "value": "88%" }
  ],
  "followUps": [
    "What are your recommended actions?",
    "Show active alarms.",
    "Which assets require maintenance?"
  ]
}
```

**Supported intents** (matched by keyword scoring): `risk_explanation`, `active_alarms`, `maintenance`, `last_24h`, `energy`, `occupancy`, `recommendations`, `facility_status`. An unmatched query returns a graceful, capability-revealing `fallback` response listing suggested questions.

---

## Status codes

| Code | Meaning |
|------|---------|
| `200 OK` | Successful `GET` / `POST`. |
| `400 Bad Request` | Invalid query param value, or missing `query` on `POST /api/copilot`. |
| `404 Not Found` | Unknown id (e.g. `/api/assets/ast-999`, `/api/emergency/scn-x`). |
| `500 Internal Server Error` | Unexpected server error. |

---

## Notes

- **Read-mostly.** In the reference build the API is primarily read-oriented; the one computed write-style endpoint is `POST /api/copilot` (it computes, it doesn't mutate). In `USE_DB=true` mode the schema supports persisting mutations such as alarm acknowledgement — a natural extension point.
- **Contract parity.** Every response conforms to the TypeScript interfaces in the frontend's `lib/types.ts`, which is the single shared contract documented in [DATA_MODEL.md](DATA_MODEL.md).
