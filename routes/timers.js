const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { getTimersDataPath } = require('../lib/timersPath');

function normalize(t) {
  const resets = Array.isArray(t.resets) ? t.resets : [];
  return {
    id: t.id,
    name: t.name,
    target: t.target,
    createdAt: t.createdAt != null ? t.createdAt : t.target,
    resets,
  };
}

function createTimersRouter(getFilePath = getTimersDataPath) {
  const router = express.Router();
  let lock = Promise.resolve();

  function withLock(fn) {
    const run = lock.then(() => fn());
    lock = run.catch(() => {});
    return run;
  }

  function readAll() {
    const filePath = getFilePath();
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.map(normalize);
    } catch (e) {
      if (e.code === 'ENOENT') return [];
      throw e;
    }
  }

  function writeAll(timers) {
    const filePath = getFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(timers, null, 2), 'utf8');
    fs.renameSync(tmp, filePath);
  }

  function readWrite(updateFn) {
    return withLock(() => {
      const timers = readAll();
      const next = updateFn(timers);
      writeAll(next);
      return next;
    });
  }

  router.get('/', (req, res, next) => {
    try {
      res.json(readAll());
    } catch (e) {
      next(e);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { name, target } = req.body || {};
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'name is required' });
      }
      if (target == null || typeof target !== 'string') {
        return res.status(400).json({ error: 'target is required' });
      }
      const d = new Date(target);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ error: 'invalid target date' });
      }
      const now = new Date().toISOString();
      const timer = {
        id: randomUUID(),
        name: name.trim(),
        target: d.toISOString(),
        createdAt: now,
        resets: [],
      };
      await readWrite((timers) => [...timers, timer]);
      res.status(201).json(timer);
    } catch (e) {
      next(e);
    }
  });

  router.post('/:id/reset', async (req, res, next) => {
    try {
      const now = new Date().toISOString();
      let updated = null;
      await readWrite((timers) => {
        const idx = timers.findIndex((x) => x.id === req.params.id);
        if (idx === -1) return timers;
        const cur = {
          ...timers[idx],
          resets: [...(timers[idx].resets || [])],
        };
        cur.target = now;
        cur.resets.push(now);
        updated = cur;
        const nextTimers = [...timers];
        nextTimers[idx] = cur;
        return nextTimers;
      });
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  router.get('/:id', (req, res, next) => {
    try {
      const t = readAll().find((x) => x.id === req.params.id);
      if (!t) return res.status(404).json({ error: 'Not found' });
      res.json(t);
    } catch (e) {
      next(e);
    }
  });

  router.patch('/:id', async (req, res, next) => {
    try {
      const { name, target } = req.body || {};
      if (name !== undefined && typeof name !== 'string') {
        return res.status(400).json({ error: 'invalid name' });
      }
      if (name !== undefined && name.trim() === '') {
        return res.status(400).json({ error: 'name cannot be empty' });
      }
      if (target !== undefined && typeof target !== 'string') {
        return res.status(400).json({ error: 'invalid target' });
      }
      if (target !== undefined) {
        const d = new Date(target);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ error: 'invalid target date' });
        }
      }
      if (name === undefined && target === undefined) {
        return res.status(400).json({ error: 'no updates' });
      }
      let updated = null;
      await readWrite((timers) => {
        const idx = timers.findIndex((x) => x.id === req.params.id);
        if (idx === -1) return timers;
        const cur = { ...timers[idx] };
        if (name !== undefined) cur.name = name.trim();
        if (target !== undefined) cur.target = new Date(target).toISOString();
        updated = cur;
        const nextTimers = [...timers];
        nextTimers[idx] = cur;
        return nextTimers;
      });
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      let removed = false;
      await readWrite((timers) => {
        const nextTimers = timers.filter((x) => x.id !== req.params.id);
        removed = nextTimers.length < timers.length;
        return nextTimers;
      });
      if (!removed) return res.status(404).json({ error: 'Not found' });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = createTimersRouter;
