/**
 * dashboard.js
 * Generates a simple HTML dashboard for visualizing API route usage in real time.
 * Served at the configured dashboard route (default: /__routewatch).
 */

'use strict';

/**
 * Builds and returns the HTML string for the RouteWatch dashboard.
 * @param {Object} stats - Route statistics collected by the middleware.
 * @returns {string} Full HTML page as a string.
 */
function buildDashboardHTML(stats) {
  const rows = Object.entries(stats)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([route, data]) => {
      const avgDuration = data.totalDuration
        ? (data.totalDuration / data.count).toFixed(2)
        : 'N/A';
      const lastHit = data.lastHit
        ? new Date(data.lastHit).toLocaleString()
        : 'Never';
      const errorRate =
        data.count > 0
          ? ((data.errors / data.count) * 100).toFixed(1) + '%'
          : '0%';

      return `
        <tr>
          <td><span class="method method-${data.method.toLowerCase()}">${data.method}</span></td>
          <td class="route-path">${route}</td>
          <td>${data.count}</td>
          <td>${avgDuration} ms</td>
          <td>${errorRate}</td>
          <td>${lastHit}</td>
        </tr>`;
    })
    .join('');

  const totalRequests = Object.values(stats).reduce(
    (sum, d) => sum + d.count,
    0
  );
  const totalRoutes = Object.keys(stats).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="refresh" content="5" />
  <title>RouteWatch Dashboard</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f1117; color: #e2e8f0; padding: 2rem; }
    h1 { font-size: 1.8rem; margin-bottom: 0.25rem; color: #7dd3fc; }
    .subtitle { font-size: 0.85rem; color: #64748b; margin-bottom: 2rem; }
    .stats-bar { display: flex; gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: #1e2130; border: 1px solid #2d3148; border-radius: 8px; padding: 1rem 1.5rem; }
    .stat-card .label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-card .value { font-size: 1.6rem; font-weight: 700; color: #7dd3fc; }
    table { width: 100%; border-collapse: collapse; background: #1e2130; border-radius: 8px; overflow: hidden; }
    thead { background: #161824; }
    th { text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    td { padding: 0.7rem 1rem; border-top: 1px solid #2d3148; font-size: 0.9rem; }
    tr:hover td { background: #252840; }
    .method { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
    .method-get    { background: #1a3a2a; color: #4ade80; }
    .method-post   { background: #1a2e4a; color: #60a5fa; }
    .method-put    { background: #3a2e1a; color: #fbbf24; }
    .method-patch  { background: #2e1a3a; color: #c084fc; }
    .method-delete { background: #3a1a1a; color: #f87171; }
    .route-path    { font-family: monospace; color: #e2e8f0; }
    .footer { margin-top: 1.5rem; font-size: 0.75rem; color: #334155; text-align: center; }
  </style>
</head>
<body>
  <h1>⚡ RouteWatch</h1>
  <p class="subtitle">Auto-refreshes every 5 seconds &mdash; ${new Date().toLocaleString()}</p>
  <div class="stats-bar">
    <div class="stat-card"><div class="label">Total Requests</div><div class="value">${totalRequests}</div></div>
    <div class="stat-card"><div class="label">Unique Routes</div><div class="value">${totalRoutes}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Method</th>
        <th>Route</th>
        <th>Hits</th>
        <th>Avg Duration</th>
        <th>Error Rate</th>
        <th>Last Hit</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:2rem">No requests recorded yet.</td></tr>'}
    </tbody>
  </table>
  <p class="footer">RouteWatch &mdash; Lightweight API route monitor</p>
</body>
</html>`;
}

module.exports = { buildDashboardHTML };
