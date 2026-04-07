/**
 * Tests for the alerting module
 */

const {
  registerAlert,
  removeAlert,
  evaluateAlerts,
  listAlerts,
} = require('../src/alerting');
const { record, reset } = require('../src/store');

// Helper to simulate a recorded request
function makeEntry(route, method, statusCode, duration) {
  return { route, method, statusCode, duration, timestamp: Date.now() };
}

describe('alerting module', () => {
  beforeEach(() => {
    reset();
    // Clear all alerts between tests by removing each listed alert
    listAlerts().forEach((a) => removeAlert(a.id));
  });

  // ── registerAlert ────────────────────────────────────────────────────────────

  describe('registerAlert', () => {
    it('registers an alert and returns an id', () => {
      const id = registerAlert({
        name: 'slow-response',
        condition: (entry) => entry.duration > 500,
        message: 'Response time exceeded 500ms',
      });

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('throws when required fields are missing', () => {
      expect(() => registerAlert({ condition: () => true })).toThrow();
      expect(() => registerAlert({ name: 'no-condition' })).toThrow();
    });

    it('stores the alert so listAlerts returns it', () => {
      registerAlert({
        name: 'error-rate',
        condition: (entry) => entry.statusCode >= 500,
        message: '5xx error detected',
      });

      const alerts = listAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].name).toBe('error-rate');
    });
  });

  // ── removeAlert ──────────────────────────────────────────────────────────────

  describe('removeAlert', () => {
    it('removes an alert by id', () => {
      const id = registerAlert({
        name: 'temp-alert',
        condition: () => false,
        message: 'never fires',
      });

      expect(listAlerts()).toHaveLength(1);
      const removed = removeAlert(id);
      expect(removed).toBe(true);
      expect(listAlerts()).toHaveLength(0);
    });

    it('returns false when the id does not exist', () => {
      const result = removeAlert('nonexistent-id');
      expect(result).toBe(false);
    });
  });

  // ── listAlerts ───────────────────────────────────────────────────────────────

  describe('listAlerts', () => {
    it('returns an empty array when no alerts are registered', () => {
      expect(listAlerts()).toEqual([]);
    });

    it('returns all registered alerts', () => {
      registerAlert({ name: 'a1', condition: () => false, message: 'm1' });
      registerAlert({ name: 'a2', condition: () => false, message: 'm2' });

      const alerts = listAlerts();
      expect(alerts).toHaveLength(2);
      expect(alerts.map((a) => a.name)).toEqual(expect.arrayContaining(['a1', 'a2']));
    });
  });

  // ── evaluateAlerts ───────────────────────────────────────────────────────────

  describe('evaluateAlerts', () => {
    it('returns an empty array when no alerts are registered', () => {
      const entry = makeEntry('/api/test', 'GET', 200, 100);
      expect(evaluateAlerts(entry)).toEqual([]);
    });

    it('returns triggered alerts whose condition matches the entry', () => {
      registerAlert({
        name: 'slow',
        condition: (e) => e.duration > 300,
        message: 'Slow request detected',
      });

      const fastEntry = makeEntry('/api/fast', 'GET', 200, 50);
      const slowEntry = makeEntry('/api/slow', 'GET', 200, 800);

      expect(evaluateAlerts(fastEntry)).toHaveLength(0);

      const triggered = evaluateAlerts(slowEntry);
      expect(triggered).toHaveLength(1);
      expect(triggered[0].name).toBe('slow');
      expect(triggered[0].message).toBe('Slow request detected');
    });

    it('can trigger multiple alerts for a single entry', () => {
      registerAlert({ name: 'server-error', condition: (e) => e.statusCode >= 500, message: '5xx' });
      registerAlert({ name: 'slow', condition: (e) => e.duration > 200, message: 'slow' });

      const entry = makeEntry('/api/bad', 'POST', 503, 400);
      const triggered = evaluateAlerts(entry);
      expect(triggered).toHaveLength(2);
    });

    it('includes the original entry in each triggered result', () => {
      registerAlert({ name: 'any-error', condition: (e) => e.statusCode >= 400, message: 'error' });

      const entry = makeEntry('/api/missing', 'GET', 404, 20);
      const triggered = evaluateAlerts(entry);

      expect(triggered[0]).toHaveProperty('entry');
      expect(triggered[0].entry).toMatchObject({ route: '/api/missing', statusCode: 404 });
    });
  });
});
