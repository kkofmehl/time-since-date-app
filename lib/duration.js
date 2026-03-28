/**
 * @param {string|Date} target
 * @param {Date} [now]
 * @returns {{ kind: 'since' | 'until'; totalMs: number; parts: { days: number; hours: number; minutes: number; seconds: number } }}
 */
function getDurationState(target, now = new Date()) {
  const targetTime = target instanceof Date ? target.getTime() : new Date(target).getTime();
  if (Number.isNaN(targetTime)) {
    throw new TypeError('Invalid target date');
  }
  const nowMs = now.getTime();
  const delta = targetTime - nowMs;
  const totalMs = Math.abs(delta);
  const kind = delta > 0 ? 'until' : 'since';
  return { kind, totalMs, parts: breakdownMs(totalMs) };
}

function breakdownMs(totalMs) {
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  let rem = totalSeconds % 86400;
  const hours = Math.floor(rem / 3600);
  rem %= 3600;
  const minutes = Math.floor(rem / 60);
  const seconds = rem % 60;
  return { days, hours, minutes, seconds };
}

/**
 * Human-readable duration line (fixed units: days, h, m, s).
 * @param {{ days: number; hours: number; minutes: number; seconds: number }} parts
 */
function formatParts(parts) {
  const { days, hours, minutes, seconds } = parts;
  const bits = [];
  if (days > 0) bits.push(`${days}d`);
  if (hours > 0 || days > 0) bits.push(`${hours}h`);
  bits.push(`${minutes}m`);
  bits.push(`${seconds}s`);
  return bits.join(' ');
}

module.exports = { getDurationState, breakdownMs, formatParts };
