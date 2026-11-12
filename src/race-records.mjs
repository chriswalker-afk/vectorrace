/**
 * Local-only personal best for Northern Loop. Records are data, not commands.
 * Store position by attempted turn, including stationary turns/crashes.
 */
export const RECORD_KEY = 'snowshift:northern-loop:personal-best:v1';
const MAX_FRAMES = 2048;
function validPoint(p) {
  return !!p && typeof p === 'object' &&
    Number.isInteger(p.x) && Number.isInteger(p.y) &&
    Math.abs(p.x) <= 100 && Math.abs(p.y) <= 100;
}
export function validRecord(record) {
  return !!record && record.version === 1 &&
    Number.isInteger(record.score) && record.score >= 1 &&
    Number.isInteger(record.moves) && record.moves >= 1 &&
    Number.isInteger(record.crashes) && record.crashes >= 0 &&
    record.score === record.moves + record.crashes * 3 &&
    Array.isArray(record.frames) &&
    record.frames.length === record.moves + 1 &&
    record.frames.length <= MAX_FRAMES &&
    record.frames.every(validPoint);
}
export function createRecordStore(storage) {
  let session = null;
  function load() {
    if (session && validRecord(session)) return session;
    try {
      const raw = storage?.getItem(RECORD_KEY);
      if (!raw || raw.length > 80000) return null;
      const record = JSON.parse(raw);
      if (!validRecord(record)) return null;
      session = record;
      return record;
    } catch { return null; }
  }
  function saveIfBetter(score, moves, crashes, frames) {
    const previous = load();
    if (previous && score >= previous.score) return {
      best: previous, improved: false, persisted: true
    };
    const record = {
      version: 1, score, moves, crashes,
      frames: frames.map(p => ({ x: p.x, y: p.y }))
    };
    if (!validRecord(record)) return { best: previous, improved: false, persisted: false };
    session = record;
    let persisted = false;
    try {
      storage?.setItem(RECORD_KEY, JSON.stringify(record));
      persisted = !!storage;
    } catch { persisted = false; }
    return { best: record, improved: true, persisted };
  }
  return { load, saveIfBetter };
}
