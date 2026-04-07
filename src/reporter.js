/**
 * reporter.js
 * Generates formatted summaries and reports from collected route metrics.
 * Supports plain text, JSON, and markdown output formats.
 */

const { getAll, getSummary } = require('./store');

/**
 * Formats a duration in milliseconds to a human-readable string.
 * @param {number} ms - Duration in milliseconds
 * @returns {string}
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Formats a timestamp to a locale string.
 * @param {number|null} ts - Unix timestamp in ms
 * @returns {string}
 */
function formatTimestamp(ts) {
  if (!ts) return 'N/A';
  return new Date(ts).toLocaleString();
}

/**
 * Generates a plain-text report of all route activity.
 * @returns {string}
 */
function generateTextReport() {
  const summary = getSummary();
  const routes = getAll();
  const lines = [];

  lines.push('=== RouteWatch Report ===');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');
  lines.push(`Total Requests : ${summary.totalRequests}`);
  lines.push(`Unique Routes  : ${summary.uniqueRoutes}`);
  lines.push(`Avg Latency    : ${formatDuration(summary.avgLatency)}`);
  lines.push(`Error Rate     : ${(summary.errorRate * 100).toFixed(1)}%`);
  lines.push('');
  lines.push('--- Route Breakdown ---');

  if (routes.length === 0) {
    lines.push('No routes recorded.');
  } else {
    routes
      .sort((a, b) => b.count - a.count)
      .forEach((route) => {
        lines.push(
          `[${route.method}] ${route.path}` +
          ` | hits: ${route.count}` +
          ` | avg: ${formatDuration(route.avgLatency)}` +
          ` | errors: ${route.errorCount}` +
          ` | last: ${formatTimestamp(route.lastCalledAt)}`
        );
      });
  }

  lines.push('');
  lines.push('=========================');
  return lines.join('\n');
}

/**
 * Generates a JSON report of all route activity.
 * @returns {object}
 */
function generateJsonReport() {
  return {
    generatedAt: new Date().toISOString(),
    summary: getSummary(),
    routes: getAll().sort((a, b) => b.count - a.count),
  };
}

/**
 * Generates a Markdown-formatted report of all route activity.
 * @returns {string}
 */
function generateMarkdownReport() {
  const summary = getSummary();
  const routes = getAll();
  const lines = [];

  lines.push('# RouteWatch Report');
  lines.push(`_Generated: ${new Date().toLocaleString()}_`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- **Total Requests:** ${summary.totalRequests}`);
  lines.push(`- **Unique Routes:** ${summary.uniqueRoutes}`);
  lines.push(`- **Avg Latency:** ${formatDuration(summary.avgLatency)}`);
  lines.push(`- **Error Rate:** ${(summary.errorRate * 100).toFixed(1)}%`);
  lines.push('');
  lines.push('## Route Breakdown');

  if (routes.length === 0) {
    lines.push('_No routes recorded._');
  } else {
    lines.push('| Method | Path | Hits | Avg Latency | Errors | Last Called |');
    lines.push('|--------|------|------|-------------|--------|-------------|');
    routes
      .sort((a, b) => b.count - a.count)
      .forEach((route) => {
        lines.push(
          `| ${route.method} | \`${route.path}\` | ${route.count}` +
          ` | ${formatDuration(route.avgLatency)} | ${route.errorCount}` +
          ` | ${formatTimestamp(route.lastCalledAt)} |`
        );
      });
  }

  return lines.join('\n');
}

module.exports = {
  generateTextReport,
  generateJsonReport,
  generateMarkdownReport,
};
