/**
 * alerting.js
 * Threshold-based alerting for RouteWatch.
 * Allows users to define rules that trigger callbacks when route metrics
 * exceed specified thresholds (e.g. high error rate, slow response time).
 */

'use strict';

const { getSummary } = require('./store');

/** @type {Array<{id: string, rule: AlertRule, callback: Function}>} */
const registeredAlerts = [];

/**
 * @typedef {Object} AlertRule
 * @property {string}  [route]        - Specific route path to watch (omit for all routes)
 * @property {string}  [method]       - HTTP method filter (e.g. 'GET')
 * @property {number}  [maxAvgMs]     - Trigger if average response time exceeds this value (ms)
 * @property {number}  [minErrorRate] - Trigger if error rate (4xx+5xx / total) exceeds this ratio (0–1)
 * @property {number}  [minCount]     - Minimum number of requests before alert is evaluated
 */

/**
 * Register an alert rule.
 *
 * @param {string}    id       - Unique identifier for this alert
 * @param {AlertRule} rule     - Conditions that trigger the alert
 * @param {Function}  callback - Called with (id, rule, matchedEntry) when triggered
 * @returns {void}
 */
function registerAlert(id, rule, callback) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('Alert id must be a non-empty string');
  }
  if (typeof callback !== 'function') {
    throw new Error('Alert callback must be a function');
  }

  // Replace existing alert with the same id
  const existingIndex = registeredAlerts.findIndex((a) => a.id === id);
  if (existingIndex !== -1) {
    registeredAlerts.splice(existingIndex, 1);
  }

  registeredAlerts.push({ id, rule, callback });
}

/**
 * Remove a previously registered alert by id.
 *
 * @param {string} id
 * @returns {boolean} True if an alert was removed
 */
function removeAlert(id) {
  const index = registeredAlerts.findIndex((a) => a.id === id);
  if (index === -1) return false;
  registeredAlerts.splice(index, 1);
  return true;
}

/**
 * Evaluate all registered alert rules against current store data.
 * Fires callbacks for any rules whose conditions are met.
 * Intended to be called periodically or after each request.
 *
 * @returns {void}
 */
function evaluateAlerts() {
  if (registeredAlerts.length === 0) return;

  const summary = getSummary();

  for (const { id, rule, callback } of registeredAlerts) {
    const entries = summary.filter((entry) => {
      if (rule.route && entry.route !== rule.route) return false;
      if (rule.method && entry.method.toUpperCase() !== rule.method.toUpperCase()) return false;
      return true;
    });

    for (const entry of entries) {
      const count = entry.count || 0;
      const minCount = rule.minCount || 1;

      if (count < minCount) continue;

      let triggered = false;

      if (rule.maxAvgMs !== undefined && entry.avgMs > rule.maxAvgMs) {
        triggered = true;
      }

      if (rule.minErrorRate !== undefined) {
        const errorCount = (entry.statusCodes || {})
          ? Object.entries(entry.statusCodes || {}).reduce((sum, [code, n]) => {
              return parseInt(code, 10) >= 400 ? sum + n : sum;
            }, 0)
          : 0;
        const errorRate = count > 0 ? errorCount / count : 0;
        if (errorRate >= rule.minErrorRate) {
          triggered = true;
        }
      }

      if (triggered) {
        try {
          callback(id, rule, entry);
        } catch (err) {
          // Prevent alert callback errors from crashing the middleware
          console.error(`[routewatch] Alert callback error for "${id}":`, err.message);
        }
      }
    }
  }
}

/**
 * Return a copy of all currently registered alerts (for inspection/testing).
 *
 * @returns {Array<{id: string, rule: AlertRule}>}
 */
function listAlerts() {
  return registeredAlerts.map(({ id, rule }) => ({ id, rule }));
}

module.exports = { registerAlert, removeAlert, evaluateAlerts, listAlerts };
