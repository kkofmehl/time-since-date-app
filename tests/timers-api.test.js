const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');
const request = require('supertest');
const createTimersRouter = require('../routes/timers');

function makeApp(getFilePath) {
  const app = express();
  app.use(express.json());
  app.use('/api/timers', createTimersRouter(getFilePath));
  return app;
}

let tmpFile;

beforeEach(() => {
  tmpFile = path.join(os.tmpdir(), `timers-test-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
});

afterEach(() => {
  try {
    fs.unlinkSync(tmpFile);
  } catch (_) {}
});

test('POST /api/timers rejects invalid body', async () => {
  const app = makeApp(() => tmpFile);
  await request(app)
    .post('/api/timers')
    .send({ name: '', target: '2025-06-01T00:00:00.000Z' })
    .expect(400);
  await request(app).post('/api/timers').send({ name: 'X' }).expect(400);
});

test('POST /api/timers creates timer with createdAt and resets', async () => {
  const app = makeApp(() => tmpFile);
  const r = await request(app)
    .post('/api/timers')
    .send({ name: 'Test', target: '2025-06-01T00:00:00.000Z' })
    .expect(201);
  assert.ok(r.body.id);
  assert.equal(r.body.name, 'Test');
  assert.equal(r.body.target, '2025-06-01T00:00:00.000Z');
  assert.ok(r.body.createdAt);
  assert.deepEqual(r.body.resets, []);
});

test('GET /api/timers lists timers', async () => {
  const app = makeApp(() => tmpFile);
  await request(app)
    .post('/api/timers')
    .send({ name: 'A', target: '2025-06-01T00:00:00.000Z' })
    .expect(201);
  const r = await request(app).get('/api/timers').expect(200);
  assert.equal(r.body.length, 1);
  assert.equal(r.body[0].name, 'A');
});

test('GET /api/timers/:id returns 404', async () => {
  const app = makeApp(() => tmpFile);
  await request(app).get('/api/timers/00000000-0000-0000-0000-000000000000').expect(404);
});

test('PATCH and reset', async () => {
  const app = makeApp(() => tmpFile);
  const created = await request(app)
    .post('/api/timers')
    .send({ name: 'R', target: '2020-01-01T00:00:00.000Z' })
    .expect(201);
  const id = created.body.id;

  const patched = await request(app)
    .patch(`/api/timers/${id}`)
    .send({ name: 'Renamed' })
    .expect(200);
  assert.equal(patched.body.name, 'Renamed');

  const reset = await request(app).post(`/api/timers/${id}/reset`).expect(200);
  assert.ok(reset.body.resets.length >= 1);
  assert.equal(reset.body.resets[reset.body.resets.length - 1], reset.body.target);

  const one = await request(app).get(`/api/timers/${id}`).expect(200);
  assert.equal(one.body.id, id);
  assert.deepEqual(one.body.resets, reset.body.resets);
});

test('DELETE removes timer', async () => {
  const app = makeApp(() => tmpFile);
  const created = await request(app)
    .post('/api/timers')
    .send({ name: 'X', target: '2025-01-01T00:00:00.000Z' })
    .expect(201);
  await request(app).delete(`/api/timers/${created.body.id}`).expect(204);
  await request(app).get(`/api/timers/${created.body.id}`).expect(404);
});
