/**
 * Local-only personal best for each circuit. Records are data, not commands.
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
export function recordKeyForCircuit(circuitId = 'northern-loop') {
  if (typeof circuitId !== 'string' || !/^[a-z0-9-]{1,48}$/.test(circuitId)) {
    throw new TypeError('Invalid circuit identifier');
  }
  return circuitId === 'northern-loop'
    ? RECORD_KEY : 'snowshift:' + circuitId + ':personal-best:v1';
}

export function createRecordStore(storage, circuitId = 'northern-loop') {
  const recordKey = recordKeyForCircuit(circuitId);
  let session = null;
  function load() {
    if (session && validRecord(session)) return session;
    try {
      const raw = storage?.getItem(recordKey);
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
      storage?.setItem(recordKey, JSON.stringify(record));
      persisted = !!storage;
    } catch { persisted = false; }
    return { best: record, improved: true, persisted };
  }
  return { load, saveIfBetter };
}
