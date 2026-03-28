const path = require('path');

/**
 * Absolute path to timers JSON file.
 * TIMERS_DATA_PATH wins; else DATA_DIR + /timers.json; else ./data/timers.json under cwd.
 */
function getTimersDataPath() {
  if (process.env.TIMERS_DATA_PATH) {
    return path.resolve(process.env.TIMERS_DATA_PATH);
  }
  if (process.env.DATA_DIR) {
    return path.resolve(process.env.DATA_DIR, 'timers.json');
  }
  return path.resolve(process.cwd(), 'data', 'timers.json');
}

module.exports = { getTimersDataPath };
