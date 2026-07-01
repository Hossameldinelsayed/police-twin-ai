// ============================================================================
// Ministry of Interior — PostgreSQL connection helper
// ----------------------------------------------------------------------------
// Exposes:
//   - pool       : a lazily-created pg.Pool (or null when USE_DB=false)
//   - query()    : convenience wrapper around pool.query(text, params)
//   - dbEnabled  : boolean derived from process.env.USE_DB === 'true'
//
// The pool is created defensively: a missing/unreachable database never crashes
// the process at import time. When USE_DB=false the API serves the in-memory
// dataset and this module performs no connection at all.
// ============================================================================

'use strict';

const { Pool } = require('pg');

const dbEnabled = process.env.USE_DB === 'true';

let pool = null;

if (dbEnabled) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Surface a clear warning but do not crash — let routes fall back gracefully.
    // eslint-disable-next-line no-console
    console.warn(
      '[db] USE_DB=true but DATABASE_URL is not set. Database features will fail until configured.',
    );
  }

  pool = new Pool({
    connectionString,
    // Keep the pool small for a reference service; tune for production.
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // A pool-level error handler prevents an idle-client error from crashing Node.
  pool.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[db] Unexpected error on idle PostgreSQL client:', err.message);
  });
}

/**
 * Run a parameterized query. Throws if the database is not enabled so callers
 * know to fall back to the in-memory dataset.
 * @param {string} text - SQL with $1, $2 ... placeholders
 * @param {Array} [params] - bound parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  if (!pool) {
    throw new Error('Database is disabled (USE_DB !== "true").');
  }
  return pool.query(text, params);
}

/** Verify the database is reachable; returns true/false (never throws). */
async function ping() {
  if (!pool) return false;
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] Ping failed:', err.message);
    return false;
  }
}

module.exports = { pool, query, ping, dbEnabled };
