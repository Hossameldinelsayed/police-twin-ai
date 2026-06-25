// ============================================================================
// POLICE TWIN AI — API server
// ----------------------------------------------------------------------------
// Express application wiring: CORS, request logging (morgan), JSON body parsing,
// the API router, a health endpoint, a 404 handler and a central error handler.
//
// Runs standalone with `npm start`. Serves the deterministic in-memory dataset
// by default (USE_DB=false); set USE_DB=true (and run `npm run seed`) to back it
// with PostgreSQL.
// ============================================================================

'use strict';

// Load environment variables from .env if present (no-op if the file is absent).
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const routes = require('./routes');
const { dbEnabled } = require('./db');
const { dataset } = require('./data/dataset');

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// ----------------------------------------------------------------------------
// Global middleware
// ----------------------------------------------------------------------------

// CORS — allow the configured origin(s). "*" by default for local development.
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
  }),
);

// Concise colored request logging in dev; combined-style otherwise.
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Parse JSON request bodies (e.g. POST /api/copilot).
app.use(express.json());

// ----------------------------------------------------------------------------
// Health & meta
// ----------------------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'police-twin-ai-api',
    version: '1.0.0',
    dataSource: dbEnabled ? 'postgres' : 'in-memory',
    facility: dataset.building.code,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Friendly root with an endpoint index.
app.get('/', (_req, res) => {
  res.json({
    service: 'Police Twin AI — REST API',
    docs: 'See README.md for the full endpoint list and examples.',
    health: '/api/health',
    endpoints: [
      'GET  /api/facility',
      'GET  /api/floors',
      'GET  /api/floors/:id',
      'GET  /api/assets?category=&floorId=&status=',
      'GET  /api/assets/:id',
      'GET  /api/alarms?status=&type=',
      'GET  /api/telemetry/energy',
      'GET  /api/telemetry/occupancy',
      'GET  /api/maintenance?status=&kind=',
      'GET  /api/risk',
      'GET  /api/predictive',
      'GET  /api/kpis',
      'GET  /api/emergency',
      'GET  /api/emergency/:id',
      'POST /api/copilot  { query }',
      'GET  /api/copilot/suggestions',
    ],
  });
});

// ----------------------------------------------------------------------------
// API routes
// ----------------------------------------------------------------------------

app.use('/api', routes);

// ----------------------------------------------------------------------------
// 404 + central error handler
// ----------------------------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: `No route for ${req.method} ${req.originalUrl}.`,
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('[error]', err.stack || err.message || err);
  res.status(err.status || 500).json({
    error: 'internal_error',
    message: err.message || 'An unexpected error occurred.',
  });
});

// ----------------------------------------------------------------------------
// Start
// ----------------------------------------------------------------------------

const server = app.listen(PORT, () => {
  /* eslint-disable no-console */
  console.log('');
  console.log('  ┌────────────────────────────────────────────────┐');
  console.log('  │   POLICE TWIN AI — API                           │');
  console.log('  ├────────────────────────────────────────────────┤');
  console.log(`  │   Listening   : http://localhost:${PORT}`.padEnd(51) + '│');
  console.log(`  │   Data source : ${dbEnabled ? 'PostgreSQL' : 'in-memory (deterministic)'}`.padEnd(51) + '│');
  console.log(`  │   Facility    : ${dataset.building.name} (${dataset.building.code})`.padEnd(51) + '│');
  console.log(`  │   Health      : http://localhost:${PORT}/api/health`.padEnd(51) + '│');
  console.log('  └────────────────────────────────────────────────┘');
  console.log('');
  /* eslint-enable no-console */
});

// Graceful shutdown.
function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n[server] ${signal} received — shutting down.`);
  server.close(() => process.exit(0));
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
