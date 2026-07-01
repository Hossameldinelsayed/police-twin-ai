-- ============================================================================
-- Ministry of Interior — PostgreSQL schema
-- ----------------------------------------------------------------------------
-- DDL for the facility digital-twin domain. Mirrors the JS data contracts
-- (see src/data/dataset.js / frontend/lib/types.ts). Nested arrays that are
-- read as a unit (asset telemetry snapshot, emergency response plans, etc.) are
-- stored as JSONB; first-class relational entities get their own tables with
-- primary keys, foreign keys and indexes.
--
-- This script is idempotent: it drops dependent views/tables and recreates them.
-- Run via `npm run seed` (db/seed.js executes this file then inserts rows).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Clean slate (views first, then tables in FK-safe order)
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS v_active_alarms CASCADE;
DROP VIEW IF EXISTS v_asset_health_summary CASCADE;
DROP VIEW IF EXISTS v_maintenance_open CASCADE;

DROP TABLE IF EXISTS emergency_scenarios CASCADE;
DROP TABLE IF EXISTS maintenance_events CASCADE;
DROP TABLE IF EXISTS occupancy_readings CASCADE;
DROP TABLE IF EXISTS energy_readings CASCADE;
DROP TABLE IF EXISTS alarms CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS floors CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;

-- ----------------------------------------------------------------------------
-- buildings
-- ----------------------------------------------------------------------------
CREATE TABLE buildings (
  id           TEXT        PRIMARY KEY,
  name         TEXT        NOT NULL,
  code         TEXT        NOT NULL UNIQUE,
  address      TEXT        NOT NULL,
  floors       INTEGER     NOT NULL CHECK (floors >= 0),
  area_sqm     INTEGER     NOT NULL CHECK (area_sqm >= 0),
  type         TEXT        NOT NULL,
  commissioned DATE        NOT NULL,
  status       TEXT        NOT NULL CHECK (status IN ('online', 'degraded', 'offline'))
);
COMMENT ON TABLE buildings IS 'Top-level facility record (one row for the HQ).';

-- ----------------------------------------------------------------------------
-- floors
-- ----------------------------------------------------------------------------
CREATE TABLE floors (
  id          TEXT     PRIMARY KEY,
  building_id TEXT     NOT NULL REFERENCES buildings (id) ON DELETE CASCADE,
  level       INTEGER  NOT NULL,
  name        TEXT     NOT NULL,
  area_sqm    INTEGER  NOT NULL CHECK (area_sqm >= 0),
  capacity    INTEGER  NOT NULL CHECK (capacity >= 0)
);
COMMENT ON TABLE floors IS 'Physical floors/levels of a building (B1..L5).';
CREATE INDEX idx_floors_building_id ON floors (building_id);

-- ----------------------------------------------------------------------------
-- zones
-- ----------------------------------------------------------------------------
CREATE TABLE zones (
  id        TEXT     PRIMARY KEY,
  floor_id  TEXT     NOT NULL REFERENCES floors (id) ON DELETE CASCADE,
  name      TEXT     NOT NULL,
  type      TEXT     NOT NULL CHECK (type IN
              ('operations','detention','evidence','server','public','admin','utility','parking','armory')),
  critical  BOOLEAN  NOT NULL DEFAULT FALSE
);
COMMENT ON TABLE zones IS 'Operational zones within a floor; "critical" flags secure/life-safety areas.';
CREATE INDEX idx_zones_floor_id ON zones (floor_id);

-- ----------------------------------------------------------------------------
-- assets
-- ----------------------------------------------------------------------------
CREATE TABLE assets (
  id                     TEXT          PRIMARY KEY,
  tag                    TEXT          NOT NULL UNIQUE,
  name                   TEXT          NOT NULL,
  category               TEXT          NOT NULL CHECK (category IN
                           ('HVAC','UPS','Electrical','FireSystem','Camera','AccessControl','Sensor','Network')),
  floor_id               TEXT          NOT NULL REFERENCES floors (id) ON DELETE CASCADE,
  zone_id                TEXT          NOT NULL REFERENCES zones (id) ON DELETE CASCADE,
  position               JSONB         NOT NULL,          -- { x, y, z } 3D twin coords
  status                 TEXT          NOT NULL CHECK (status IN ('operational','warning','critical','offline')),
  health_pct             NUMERIC(5,2)  NOT NULL CHECK (health_pct >= 0 AND health_pct <= 100),
  manufacturer           TEXT          NOT NULL,
  model                  TEXT          NOT NULL,
  install_date           DATE          NOT NULL,
  last_service_date      DATE          NOT NULL,
  predicted_failure_days INTEGER,                          -- NULL = no near-term failure predicted
  failure_probability    NUMERIC(4,3)  NOT NULL CHECK (failure_probability >= 0 AND failure_probability <= 1),
  mtbf_days              INTEGER       NOT NULL CHECK (mtbf_days >= 0),
  recommendation         TEXT,
  telemetry              JSONB         NOT NULL DEFAULT '{}'::jsonb  -- live snapshot, shape varies by category
);
COMMENT ON TABLE assets IS 'Geolocated facility assets with health + predictive-maintenance fields.';
COMMENT ON COLUMN assets.predicted_failure_days IS 'Days until AI-predicted failure; NULL when none predicted.';
CREATE INDEX idx_assets_floor_id ON assets (floor_id);
CREATE INDEX idx_assets_zone_id  ON assets (zone_id);
CREATE INDEX idx_assets_category ON assets (category);
CREATE INDEX idx_assets_status   ON assets (status);

-- ----------------------------------------------------------------------------
-- alarms
-- ----------------------------------------------------------------------------
CREATE TABLE alarms (
  id              TEXT         PRIMARY KEY,
  type            TEXT         NOT NULL CHECK (type IN
                    ('fire','security','maintenance','power','access','environmental','network')),
  severity        TEXT         NOT NULL CHECK (severity IN ('critical','high','medium','low')),
  title           TEXT         NOT NULL,
  message         TEXT         NOT NULL,
  asset_id        TEXT         REFERENCES assets (id) ON DELETE SET NULL,
  floor_id        TEXT         NOT NULL REFERENCES floors (id) ON DELETE CASCADE,
  zone_id         TEXT         REFERENCES zones (id) ON DELETE SET NULL,
  status          TEXT         NOT NULL CHECK (status IN ('active','acknowledged','resolved')),
  ts              TIMESTAMPTZ  NOT NULL,                   -- event timestamp
  source          TEXT         NOT NULL,
  acknowledged_by TEXT
);
COMMENT ON TABLE alarms IS 'Alarm/event stream (~24h window): active, acknowledged or resolved.';
CREATE INDEX idx_alarms_status   ON alarms (status);
CREATE INDEX idx_alarms_ts       ON alarms (ts DESC);
CREATE INDEX idx_alarms_asset_id ON alarms (asset_id);
CREATE INDEX idx_alarms_type     ON alarms (type);

-- ----------------------------------------------------------------------------
-- energy_readings (24h hourly)
-- ----------------------------------------------------------------------------
CREATE TABLE energy_readings (
  id            BIGSERIAL    PRIMARY KEY,
  building_id   TEXT         NOT NULL REFERENCES buildings (id) ON DELETE CASCADE,
  hour_label    TEXT         NOT NULL,                     -- 'HH:00'
  kwh           NUMERIC(10,2) NOT NULL,
  hvac_kwh      NUMERIC(10,2) NOT NULL,
  lighting_kwh  NUMERIC(10,2) NOT NULL,
  it_kwh        NUMERIC(10,2) NOT NULL,
  baseline_kwh  NUMERIC(10,2) NOT NULL,                    -- expected kwh for anomaly detection
  UNIQUE (building_id, hour_label)
);
COMMENT ON TABLE energy_readings IS '24-hour hourly energy curve with AI baseline for anomaly detection.';
CREATE INDEX idx_energy_building ON energy_readings (building_id);

-- ----------------------------------------------------------------------------
-- occupancy_readings (per floor, point-in-time)
-- ----------------------------------------------------------------------------
CREATE TABLE occupancy_readings (
  id        BIGSERIAL    PRIMARY KEY,
  floor_id  TEXT         NOT NULL REFERENCES floors (id) ON DELETE CASCADE,
  ts        TIMESTAMPTZ  NOT NULL,
  count     INTEGER      NOT NULL CHECK (count >= 0),
  capacity  INTEGER      NOT NULL CHECK (capacity >= 0)
);
COMMENT ON TABLE occupancy_readings IS 'Per-floor occupancy snapshot vs capacity.';
CREATE INDEX idx_occupancy_floor_id ON occupancy_readings (floor_id);

-- ----------------------------------------------------------------------------
-- maintenance_events
-- ----------------------------------------------------------------------------
CREATE TABLE maintenance_events (
  id              TEXT          PRIMARY KEY,
  asset_id        TEXT          REFERENCES assets (id) ON DELETE SET NULL,
  asset_name      TEXT          NOT NULL,
  kind            TEXT          NOT NULL CHECK (kind IN ('predictive','preventive','corrective')),
  status          TEXT          NOT NULL CHECK (status IN ('scheduled','in_progress','completed','overdue')),
  priority        TEXT          NOT NULL CHECK (priority IN ('critical','high','medium','low')),
  title           TEXT          NOT NULL,
  description     TEXT          NOT NULL,
  scheduled_date  TIMESTAMPTZ   NOT NULL,
  technician      TEXT,
  estimated_hours NUMERIC(5,1)  NOT NULL CHECK (estimated_hours >= 0),
  cost_estimate   NUMERIC(12,2) NOT NULL CHECK (cost_estimate >= 0)
);
COMMENT ON TABLE maintenance_events IS 'Work orders: predictive (AI), preventive and corrective.';
CREATE INDEX idx_maintenance_status   ON maintenance_events (status);
CREATE INDEX idx_maintenance_asset_id ON maintenance_events (asset_id);
CREATE INDEX idx_maintenance_priority ON maintenance_events (priority);

-- ----------------------------------------------------------------------------
-- emergency_scenarios
--   Nested impacted-zones / response-plan / cascade-risks are stored as JSONB
--   since they are always read together with the parent scenario.
-- ----------------------------------------------------------------------------
CREATE TABLE emergency_scenarios (
  id                        TEXT     PRIMARY KEY,
  type                      TEXT     NOT NULL CHECK (type IN
                              ('fire','power_outage','unauthorized_access','equipment_failure')),
  name                      TEXT     NOT NULL,
  severity                  TEXT     NOT NULL CHECK (severity IN ('critical','high','medium','low')),
  description               TEXT     NOT NULL,
  trigger_narrative         TEXT     NOT NULL,
  impacted_zones            JSONB    NOT NULL DEFAULT '[]'::jsonb,
  response_plan             JSONB    NOT NULL DEFAULT '[]'::jsonb,
  estimated_recovery_min    INTEGER  NOT NULL CHECK (estimated_recovery_min >= 0),
  affected_assets           INTEGER  NOT NULL CHECK (affected_assets >= 0),
  affected_occupants        INTEGER  NOT NULL CHECK (affected_occupants >= 0),
  cascade_risks             JSONB    NOT NULL DEFAULT '[]'::jsonb
);
COMMENT ON TABLE emergency_scenarios IS 'Pre-modeled crisis scenarios with orchestrated response playbooks.';
CREATE INDEX idx_emergency_type ON emergency_scenarios (type);

-- ============================================================================
-- Helpful views
-- ============================================================================

-- Active alarms, newest first, enriched with floor name.
CREATE VIEW v_active_alarms AS
SELECT a.id,
       a.type,
       a.severity,
       a.title,
       a.message,
       a.asset_id,
       a.floor_id,
       f.name AS floor_name,
       a.zone_id,
       a.status,
       a.ts,
       a.source
FROM alarms a
JOIN floors f ON f.id = a.floor_id
WHERE a.status = 'active'
ORDER BY a.ts DESC;
COMMENT ON VIEW v_active_alarms IS 'All currently-active alarms with floor name, newest first.';

-- Asset health rollup by category.
CREATE VIEW v_asset_health_summary AS
SELECT category,
       COUNT(*)                                                  AS total,
       COUNT(*) FILTER (WHERE status = 'operational')            AS operational,
       COUNT(*) FILTER (WHERE status = 'warning')                AS warning,
       COUNT(*) FILTER (WHERE status = 'critical')               AS critical,
       COUNT(*) FILTER (WHERE status = 'offline')                AS offline,
       ROUND(AVG(health_pct), 1)                                 AS avg_health_pct,
       COUNT(*) FILTER (WHERE predicted_failure_days IS NOT NULL
                          AND predicted_failure_days <= 14)      AS failing_within_14d
FROM assets
GROUP BY category
ORDER BY critical DESC, avg_health_pct ASC;
COMMENT ON VIEW v_asset_health_summary IS 'Per-category asset health rollup for dashboards.';

-- Open (non-completed) maintenance work orders.
CREATE VIEW v_maintenance_open AS
SELECT id, asset_id, asset_name, kind, status, priority, title, scheduled_date, cost_estimate
FROM maintenance_events
WHERE status <> 'completed'
ORDER BY
  CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
  scheduled_date ASC;
COMMENT ON VIEW v_maintenance_open IS 'Open maintenance work orders ordered by priority then due date.';
