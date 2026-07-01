// ============================================================================
// Ministry of Interior — database seeder
// ----------------------------------------------------------------------------
// Creates the schema (runs db/schema.sql) and inserts the deterministic dataset
// from src/data/dataset.js. Idempotent: schema.sql drops & recreates tables, so
// re-running produces a clean, identical database.
//
// Usage:
//   1. Ensure PostgreSQL is running and DATABASE_URL points at an existing DB.
//   2. npm run seed
//
// This script reads DATABASE_URL directly so it works regardless of USE_DB.
// It exits with a clear error if the database is unreachable.
// ============================================================================

'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const { dataset } = require('../src/data/dataset');

const DATABASE_URL = process.env.DATABASE_URL;

function log(msg) {
  // eslint-disable-next-line no-console
  console.log(`[seed] ${msg}`);
}

async function main() {
  if (!DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and set a valid PostgreSQL connection string.',
    );
  }

  const client = new Client({ connectionString: DATABASE_URL, connectionTimeoutMillis: 5000 });

  try {
    await client.connect();
  } catch (err) {
    throw new Error(
      `Could not connect to PostgreSQL at the configured DATABASE_URL.\n` +
        `  Reason: ${err.message}\n` +
        `  Check that the server is running and the database exists.`,
    );
  }

  log(`Connected. Seeding facility "${dataset.building.name}" (${dataset.building.code}).`);

  try {
    // ----- 1. Schema -----
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    log('Applying schema (db/schema.sql)...');
    await client.query(schemaSql);
    log('Schema applied (tables, indexes, views created).');

    // Wrap all inserts in a single transaction for atomicity.
    await client.query('BEGIN');

    // ----- 2. buildings -----
    const b = dataset.building;
    await client.query(
      `INSERT INTO buildings (id, name, code, address, floors, area_sqm, type, commissioned, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [b.id, b.name, b.code, b.address, b.floors, b.areaSqm, b.type, b.commissioned, b.status],
    );
    log('Inserted building (1).');

    // ----- 3. floors + zones -----
    for (const f of dataset.floors) {
      await client.query(
        `INSERT INTO floors (id, building_id, level, name, area_sqm, capacity)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [f.id, f.buildingId, f.level, f.name, f.areaSqm, f.capacity],
      );
      for (const z of f.zones) {
        await client.query(
          `INSERT INTO zones (id, floor_id, name, type, critical) VALUES ($1,$2,$3,$4,$5)`,
          [z.id, z.floorId, z.name, z.type, z.critical],
        );
      }
    }
    log(`Inserted floors (${dataset.floors.length}) and zones (${dataset.allZones.length}).`);

    // ----- 4. assets -----
    for (const a of dataset.assets) {
      await client.query(
        `INSERT INTO assets
           (id, tag, name, category, floor_id, zone_id, position, status, health_pct,
            manufacturer, model, install_date, last_service_date, predicted_failure_days,
            failure_probability, mtbf_days, recommendation, telemetry)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          a.id,
          a.tag,
          a.name,
          a.category,
          a.floorId,
          a.zoneId,
          JSON.stringify(a.position),
          a.status,
          a.healthPct,
          a.manufacturer,
          a.model,
          a.installDate,
          a.lastServiceDate,
          a.predictedFailureDays,
          a.failureProbability,
          a.mtbfDays,
          a.recommendation,
          JSON.stringify(a.telemetry),
        ],
      );
    }
    log(`Inserted assets (${dataset.assets.length}).`);

    // ----- 5. alarms -----
    for (const a of dataset.alarms) {
      await client.query(
        `INSERT INTO alarms
           (id, type, severity, title, message, asset_id, floor_id, zone_id, status, ts, source, acknowledged_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          a.id,
          a.type,
          a.severity,
          a.title,
          a.message,
          a.assetId,
          a.floorId,
          a.zoneId,
          a.status,
          a.timestamp,
          a.source,
          a.acknowledgedBy,
        ],
      );
    }
    log(`Inserted alarms (${dataset.alarms.length}).`);

    // ----- 6. energy_readings -----
    for (const r of dataset.energyReadings) {
      await client.query(
        `INSERT INTO energy_readings
           (building_id, hour_label, kwh, hvac_kwh, lighting_kwh, it_kwh, baseline_kwh)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [b.id, r.timestamp, r.kwh, r.hvacKwh, r.lightingKwh, r.itKwh, r.baseline],
      );
    }
    log(`Inserted energy readings (${dataset.energyReadings.length}).`);

    // ----- 7. occupancy_readings -----
    for (const o of dataset.occupancyByFloor) {
      await client.query(
        `INSERT INTO occupancy_readings (floor_id, ts, count, capacity) VALUES ($1,$2,$3,$4)`,
        [o.floorId, o.timestamp, o.count, o.capacity],
      );
    }
    log(`Inserted occupancy readings (${dataset.occupancyByFloor.length}).`);

    // ----- 8. maintenance_events -----
    for (const m of dataset.maintenanceEvents) {
      await client.query(
        `INSERT INTO maintenance_events
           (id, asset_id, asset_name, kind, status, priority, title, description,
            scheduled_date, technician, estimated_hours, cost_estimate)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          m.id,
          m.assetId || null,
          m.assetName,
          m.kind,
          m.status,
          m.priority,
          m.title,
          m.description,
          m.scheduledDate,
          m.technician,
          m.estimatedHours,
          m.costEstimate,
        ],
      );
    }
    log(`Inserted maintenance events (${dataset.maintenanceEvents.length}).`);

    // ----- 9. emergency_scenarios -----
    for (const s of dataset.emergencyScenarios) {
      await client.query(
        `INSERT INTO emergency_scenarios
           (id, type, name, severity, description, trigger_narrative, impacted_zones,
            response_plan, estimated_recovery_min, affected_assets, affected_occupants, cascade_risks)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          s.id,
          s.type,
          s.name,
          s.severity,
          s.description,
          s.triggerNarrative,
          JSON.stringify(s.impactedZones),
          JSON.stringify(s.responsePlan),
          s.estimatedRecoveryMinutes,
          s.affectedAssets,
          s.affectedOccupants,
          JSON.stringify(s.cascadeRisks),
        ],
      );
    }
    log(`Inserted emergency scenarios (${dataset.emergencyScenarios.length}).`);

    await client.query('COMMIT');
    log('All data committed successfully. ✅');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main()
  .then(() => {
    log('Done.');
    process.exit(0);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(`\n[seed] FAILED: ${err.message}\n`);
    process.exit(1);
  });
