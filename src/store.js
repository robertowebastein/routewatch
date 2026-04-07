/**
 * store.js
 * In-memory store for tracking route usage statistics.
 * Provides methods to record hits, retrieve stats, and reset data.
 */

'use strict';

/**
 * Internal storage map: key is "METHOD /path", value is route stat object.
 * @type {Map<string, RouteStats>}
 */
const routeStats = new Map();

/** Timestamp when the store was initialized or last reset */
let startedAt = new Date();

/**
 * @typedef {Object} RouteStats
 * @property {string} method    - HTTP method (GET, POST, etc.)
 * @property {string} path      - Route path
 * @property {number} hits      - Total number of requests
 * @property {number} errors    - Number of 4xx/5xx responses
 * @property {number} totalMs   - Cumulative response time in milliseconds
 * @property {number} lastStatus - HTTP status code of the most recent request
 * @property {string} lastSeen  - ISO timestamp of the most recent request
 */

/**
 * Record a single request against a route.
 *
 * @param {string} method     - HTTP method
 * @param {string} path       - Matched route path (or raw URL if unmatched)
 * @param {number} statusCode - HTTP response status code
 * @param {number} durationMs - Response time in milliseconds
 */
function record(method, path, statusCode, durationMs) {
  const key = `${method.toUpperCase()} ${path}`;

  if (!routeStats.has(key)) {
    routeStats.set(key, {
      method: method.toUpperCase(),
      path,
      hits: 0,
      errors: 0,
      totalMs: 0,
      lastStatus: null,
      lastSeen: null,
    });
  }

  const stat = routeStats.get(key);
  stat.hits += 1;
  stat.totalMs += durationMs;
  stat.lastStatus = statusCode;
  stat.lastSeen = new Date().toISOString();

  if (statusCode >= 400) {
    stat.errors += 1;
  }
}

/**
 * Return all recorded route stats as a sorted array.
 * Routes are sorted by hit count descending.
 *
 * @returns {RouteStats[]}
 */
function getAll() {
  return Array.from(routeStats.values()).sort((a, b) => b.hits - a.hits);
}

/**
 * Return stats for a single route key, or null if not found.
 *
 * @param {string} method
 * @param {string} path
 * @returns {RouteStats|null}
 */
function get(method, path) {
  const key = `${method.toUpperCase()} ${path}`;
  return routeStats.get(key) || null;
}

/**
 * Compute a summary object across all routes.
 *
 * @returns {{ totalRequests: number, totalErrors: number, uniqueRoutes: number, uptimeSince: string }}
 */
function getSummary() {
  let totalRequests = 0;
  let totalErrors = 0;

  for (const stat of routeStats.values()) {
    totalRequests += stat.hits;
    totalErrors += stat.errors;
  }

  return {
    totalRequests,
    totalErrors,
    uniqueRoutes: routeStats.size,
    uptimeSince: startedAt.toISOString(),
  };
}

/**
 * Clear all recorded stats and reset the start timestamp.
 */
function reset() {
  routeStats.clear();
  startedAt = new Date();
}

module.exports = { record, getAll, get, getSummary, reset };
