const express = require('express');
const request = require('supertest');
const { routewatch, middleware } = require('../src/index');
const store = require('../src/store');

/**
 * Tests for the routewatch middleware and main entry point.
 * Verifies that requests are properly intercepted, recorded,
 * and that the dashboard endpoint is served correctly.
 */

describe('routewatch middleware', () => {
  let app;

  beforeEach(() => {
    store.reset();
    app = express();
    app.use(express.json());
  });

  describe('basic request logging', () => {
    it('should record a GET request to a registered route', async () => {
      app.use(middleware());
      app.get('/api/users', (req, res) => res.json({ users: [] }));

      await request(app).get('/api/users').expect(200);

      const records = store.getAll();
      expect(records.length).toBe(1);
      expect(records[0].method).toBe('GET');
      expect(records[0].path).toBe('/api/users');
      expect(records[0].status).toBe(200);
    });

    it('should record a POST request with correct status', async () => {
      app.use(middleware());
      app.post('/api/items', (req, res) => res.status(201).json({ id: 1 }));

      await request(app).post('/api/items').send({ name: 'test' }).expect(201);

      const records = store.getAll();
      expect(records.length).toBe(1);
      expect(records[0].method).toBe('POST');
      expect(records[0].status).toBe(201);
    });

    it('should record response time as a positive number', async () => {
      app.use(middleware());
      app.get('/api/ping', (req, res) => res.json({ pong: true }));

      await request(app).get('/api/ping').expect(200);

      const records = store.getAll();
      expect(records[0].responseTime).toBeGreaterThanOrEqual(0);
      expect(typeof records[0].responseTime).toBe('number');
    });

    it('should record a 404 response for unknown routes', async () => {
      app.use(middleware());

      await request(app).get('/not-found').expect(404);

      const records = store.getAll();
      expect(records.length).toBe(1);
      expect(records[0].status).toBe(404);
    });

    it('should record multiple requests independently', async () => {
      app.use(middleware());
      app.get('/a', (req, res) => res.send('a'));
      app.get('/b', (req, res) => res.send('b'));

      await request(app).get('/a');
      await request(app).get('/b');
      await request(app).get('/a');

      const records = store.getAll();
      expect(records.length).toBe(3);
    });
  });

  describe('dashboard route', () => {
    it('should serve the dashboard HTML at the default path', async () => {
      app.use(routewatch());
      app.get('/api/test', (req, res) => res.json({ ok: true }));

      const res = await request(app).get('/__routewatch__').expect(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('RouteWatch');
    });

    it('should serve the dashboard at a custom path', async () => {
      app.use(routewatch({ dashboardPath: '/debug/routes' }));
      app.get('/api/test', (req, res) => res.json({ ok: true }));

      await request(app).get('/debug/routes').expect(200);
    });

    it('should not record the dashboard path itself as a route hit', async () => {
      app.use(routewatch());

      await request(app).get('/__routewatch__');

      const records = store.getAll();
      expect(records.length).toBe(0);
    });

    it('should expose a JSON stats endpoint', async () => {
      app.use(routewatch());
      app.get('/api/hello', (req, res) => res.json({ hello: 'world' }));

      await request(app).get('/api/hello');

      const res = await request(app)
        .get('/__routewatch__/stats')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('routes');
    });
  });

  describe('options', () => {
    it('should exclude paths matching the ignore list', async () => {
      app.use(middleware({ ignore: ['/health'] }));
      app.get('/health', (req, res) => res.json({ status: 'ok' }));
      app.get('/api/data', (req, res) => res.json({ data: [] }));

      await request(app).get('/health');
      await request(app).get('/api/data');

      const records = store.getAll();
      expect(records.length).toBe(1);
      expect(records[0].path).toBe('/api/data');
    });
  });
});
