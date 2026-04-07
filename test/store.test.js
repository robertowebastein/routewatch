/**
 * Tests for the route data store module.
 * Verifies recording, retrieval, summarization, and reset behavior.
 */

const assert = require('assert');
const { record, getAll, get, getSummary, reset } = require('../src/store');

describe('store', () => {
  beforeEach(() => {
    reset();
  });

  describe('record()', () => {
    it('should record a route hit with method and path', () => {
      record('GET', '/api/users', 200, 45);
      const all = getAll();
      assert.strictEqual(Object.keys(all).length, 1);
    });

    it('should accumulate multiple hits for the same route', () => {
      record('GET', '/api/users', 200, 30);
      record('GET', '/api/users', 200, 50);
      record('GET', '/api/users', 404, 10);
      const entry = get('GET', '/api/users');
      assert.strictEqual(entry.hits, 3);
    });

    it('should track different methods separately', () => {
      record('GET', '/api/users', 200, 20);
      record('POST', '/api/users', 201, 35);
      const all = getAll();
      assert.strictEqual(Object.keys(all).length, 2);
    });

    it('should store status code counts', () => {
      record('GET', '/api/users', 200, 20);
      record('GET', '/api/users', 200, 25);
      record('GET', '/api/users', 500, 100);
      const entry = get('GET', '/api/users');
      assert.strictEqual(entry.statusCodes[200], 2);
      assert.strictEqual(entry.statusCodes[500], 1);
    });

    it('should calculate average response time', () => {
      record('GET', '/api/items', 200, 100);
      record('GET', '/api/items', 200, 200);
      const entry = get('GET', '/api/items');
      assert.strictEqual(entry.avgResponseTime, 150);
    });

    it('should track min and max response times', () => {
      record('DELETE', '/api/items/1', 204, 10);
      record('DELETE', '/api/items/1', 204, 90);
      record('DELETE', '/api/items/1', 204, 50);
      const entry = get('DELETE', '/api/items/1');
      assert.strictEqual(entry.minResponseTime, 10);
      assert.strictEqual(entry.maxResponseTime, 90);
    });
  });

  describe('get()', () => {
    it('should return null for an unrecorded route', () => {
      const entry = get('GET', '/nonexistent');
      assert.strictEqual(entry, null);
    });

    it('should return the correct entry for a recorded route', () => {
      record('PATCH', '/api/profile', 200, 60);
      const entry = get('PATCH', '/api/profile');
      assert.ok(entry);
      assert.strictEqual(entry.method, 'PATCH');
      assert.strictEqual(entry.path, '/api/profile');
    });
  });

  describe('getAll()', () => {
    it('should return an empty object when no routes recorded', () => {
      const all = getAll();
      assert.deepStrictEqual(all, {});
    });

    it('should return all recorded routes', () => {
      record('GET', '/a', 200, 10);
      record('POST', '/b', 201, 20);
      record('PUT', '/c', 200, 30);
      const all = getAll();
      assert.strictEqual(Object.keys(all).length, 3);
    });
  });

  describe('getSummary()', () => {
    it('should return total hit count across all routes', () => {
      record('GET', '/x', 200, 10);
      record('GET', '/x', 200, 20);
      record('POST', '/y', 201, 15);
      const summary = getSummary();
      assert.strictEqual(summary.totalHits, 3);
    });

    it('should identify the most hit route', () => {
      record('GET', '/popular', 200, 10);
      record('GET', '/popular', 200, 10);
      record('GET', '/popular', 200, 10);
      record('POST', '/rare', 201, 10);
      const summary = getSummary();
      assert.strictEqual(summary.topRoute.path, '/popular');
      assert.strictEqual(summary.topRoute.method, 'GET');
    });

    it('should return zero totalHits when store is empty', () => {
      const summary = getSummary();
      assert.strictEqual(summary.totalHits, 0);
      assert.strictEqual(summary.topRoute, null);
    });
  });

  describe('reset()', () => {
    it('should clear all recorded data', () => {
      record('GET', '/api/users', 200, 50);
      record('POST', '/api/users', 201, 70);
      reset();
      const all = getAll();
      assert.deepStrictEqual(all, {});
    });
  });
});
