/**
 * Tests for the reporter module
 * Validates text, JSON, and markdown report generation
 */

const {
  formatDuration,
  formatTimestamp,
  generateTextReport,
  generateJsonReport,
  generateMarkdownReport,
} = require('../src/reporter');

// Sample route data for testing
const mockRoutes = [
  {
    method: 'GET',
    path: '/api/users',
    count: 42,
    totalDuration: 2100,
    avgDuration: 50,
    minDuration: 12,
    maxDuration: 210,
    lastCalledAt: 1700000000000,
    statusCodes: { 200: 40, 404: 2 },
  },
  {
    method: 'POST',
    path: '/api/users',
    count: 10,
    totalDuration: 800,
    avgDuration: 80,
    minDuration: 45,
    maxDuration: 180,
    lastCalledAt: 1700000100000,
    statusCodes: { 201: 9, 400: 1 },
  },
  {
    method: 'DELETE',
    path: '/api/users/:id',
    count: 3,
    totalDuration: 150,
    avgDuration: 50,
    minDuration: 30,
    maxDuration: 80,
    lastCalledAt: 1700000200000,
    statusCodes: { 204: 3 },
  },
];

describe('formatDuration', () => {
  test('formats milliseconds under 1000 as ms', () => {
    expect(formatDuration(250)).toBe('250ms');
  });

  test('formats milliseconds over 1000 as seconds with 2 decimal places', () => {
    expect(formatDuration(1500)).toBe('1.50s');
  });

  test('formats exactly 1000ms as 1.00s', () => {
    expect(formatDuration(1000)).toBe('1.00s');
  });

  test('formats 0ms correctly', () => {
    expect(formatDuration(0)).toBe('0ms');
  });
});

describe('formatTimestamp', () => {
  test('returns a non-empty string for a valid timestamp', () => {
    const result = formatTimestamp(1700000000000);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns "Never" for null or undefined', () => {
    expect(formatTimestamp(null)).toBe('Never');
    expect(formatTimestamp(undefined)).toBe('Never');
  });

  test('returns "Never" for 0', () => {
    expect(formatTimestamp(0)).toBe('Never');
  });
});

describe('generateJsonReport', () => {
  test('returns a valid JSON string', () => {
    const result = generateJsonReport(mockRoutes);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  test('includes all routes in output', () => {
    const result = JSON.parse(generateJsonReport(mockRoutes));
    expect(result.routes).toHaveLength(3);
  });

  test('includes summary fields', () => {
    const result = JSON.parse(generateJsonReport(mockRoutes));
    expect(result.summary).toBeDefined();
    expect(result.summary.totalRequests).toBe(55);
    expect(result.summary.totalRoutes).toBe(3);
  });

  test('includes a generatedAt timestamp', () => {
    const result = JSON.parse(generateJsonReport(mockRoutes));
    expect(result.generatedAt).toBeDefined();
  });

  test('handles empty routes array', () => {
    const result = JSON.parse(generateJsonReport([]));
    expect(result.routes).toHaveLength(0);
    expect(result.summary.totalRequests).toBe(0);
  });
});

describe('generateTextReport', () => {
  test('returns a non-empty string', () => {
    const result = generateTextReport(mockRoutes);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('contains route method and path', () => {
    const result = generateTextReport(mockRoutes);
    expect(result).toContain('GET');
    expect(result).toContain('/api/users');
  });

  test('contains request counts', () => {
    const result = generateTextReport(mockRoutes);
    expect(result).toContain('42');
  });

  test('handles empty routes gracefully', () => {
    const result = generateTextReport([]);
    expect(typeof result).toBe('string');
  });
});

describe('generateMarkdownReport', () => {
  test('returns a string with markdown table syntax', () => {
    const result = generateMarkdownReport(mockRoutes);
    expect(result).toContain('|');
    expect(result).toContain('---');
  });

  test('contains a top-level heading', () => {
    const result = generateMarkdownReport(mockRoutes);
    expect(result).toMatch(/^#\s/m);
  });

  test('contains route data', () => {
    const result = generateMarkdownReport(mockRoutes);
    expect(result).toContain('POST');
    expect(result).toContain('/api/users');
  });

  test('handles empty routes gracefully', () => {
    const result = generateMarkdownReport([]);
    expect(typeof result).toBe('string');
  });
});
