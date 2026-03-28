const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getDurationState, breakdownMs, formatParts } = require('../lib/duration');

test('getDurationState: until when target is in the future', () => {
  const now = new Date('2025-01-01T12:00:00.000Z');
  const target = new Date('2025-01-02T12:00:00.000Z');
  const s = getDurationState(target, now);
  assert.equal(s.kind, 'until');
  assert.equal(s.totalMs, 86400 * 1000);
  assert.deepEqual(s.parts, { days: 1, hours: 0, minutes: 0, seconds: 0 });
});

test('getDurationState: since when target is in the past', () => {
  const now = new Date('2025-01-03T12:00:00.000Z');
  const target = new Date('2025-01-01T12:00:00.000Z');
  const s = getDurationState(target, now);
  assert.equal(s.kind, 'since');
  assert.equal(s.totalMs, 2 * 86400 * 1000);
});

test('getDurationState: throws on invalid target', () => {
  assert.throws(() => getDurationState('not-a-date'), TypeError);
});

test('breakdownMs: sub-day remainder', () => {
  const ms = 90061000;
  assert.deepEqual(breakdownMs(ms), {
    days: 1,
    hours: 1,
    minutes: 1,
    seconds: 1,
  });
});

test('formatParts', () => {
  assert.equal(formatParts({ days: 0, hours: 2, minutes: 3, seconds: 4 }), '2h 3m 4s');
  assert.equal(formatParts({ days: 1, hours: 0, minutes: 0, seconds: 0 }), '1d 0h 0m 0s');
});
