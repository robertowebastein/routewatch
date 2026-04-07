/**
 * routewatch - Lightweight Express.js middleware for logging and visualizing API route usage
 *
 * Main entry point. Exports the middleware factory and any utility helpers.
 */

'use strict';

const { createStore } = require('./store');
const { formatLogEntry } = require('./logger');

/**
 * Default configuration options for routewatch middleware.
 */
const DEFAULT_OPTIONS = {
  /** Log to console on each request */
  logToConsole: true,
  /** Track response time in milliseconds */
  trackResponseTime: true,
  /** Maximum number of recent requests to keep in memory */
  maxHistory: 500,
  /** List of paths to ignore (e.g. health checks) */
  ignorePaths: [],
  /** Whether to include request body size in logs */
  trackBodySize: false,
};

/**
 * Creates and returns the routewatch Express middleware.
 *
 * @param {object} [options] - Configuration options
 * @param {boolean} [options.logToConsole=true] - Print log entries to stdout
 * @param {boolean} [options.trackResponseTime=true] - Measure and record response time
 * @param {number} [options.maxHistory=500] - Max requests stored in memory
 * @param {string[]} [options.ignorePaths=[]] - Paths to skip tracking entirely
 * @param {boolean} [options.trackBodySize=false] - Record request body size in bytes
 * @returns {function} Express middleware function
 */
function routewatch(options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const store = createStore(config.maxHistory);

  /**
   * The actual Express middleware.
   */
  function middleware(req, res, next) {
    // Skip ignored paths immediately
    if (config.ignorePaths.some((p) => req.path.startsWith(p))) {
      return next();
    }

    const startTime = process.hrtime.bigint();

    // Capture the original end method to intercept response finish
    const originalEnd = res.end.bind(res);

    res.end = function (...args) {
      const durationNs = process.hrtime.bigint() - startTime;
      const durationMs = Number(durationNs) / 1e6;

      const entry = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime: config.trackResponseTime ? parseFloat(durationMs.toFixed(2)) : null,
        timestamp: new Date().toISOString(),
        bodySize: config.trackBodySize ? (req.headers['content-length'] || 0) : null,
      };

      store.record(entry);

      if (config.logToConsole) {
        console.log(formatLogEntry(entry));
      }

      return originalEnd(...args);
    };

    next();
  }

  /**
   * Returns a snapshot of all recorded route entries.
   *
   * @returns {object[]} Array of request log entries
   */
  middleware.getHistory = () => store.getAll();

  /**
   * Returns aggregated statistics grouped by route and method.
   *
   * @returns {object} Stats map keyed by "METHOD /path"
   */
  middleware.getStats = () => store.getStats();

  /**
   * Clears all stored request history.
   */
  middleware.clearHistory = () => store.clear();

  return middleware;
}

module.exports = routewatch;
