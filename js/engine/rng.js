// Small seeded random number generator (mulberry32).
// The game state stores the generator's position as `state.rng`, so a game can be
// saved, reloaded and replayed exactly. Online, only the host ever sees it.

/** Turn any string/number into a 32-bit seed. */
export function hashSeed(value) {
  const str = String(value);
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** A fresh unpredictable seed (uses the browser's crypto when available). */
export function randomSeed() {
  if (globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 2 ** 32);
}

/** Next number in [0, 1). Advances `holder.rng`. */
export function rand(holder) {
  let t = (holder.rng = (holder.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Whole number from 1 to n (a die face). */
export function rollDie(holder, n = 3) {
  return 1 + Math.floor(rand(holder) * n);
}

export function pick(holder, list) {
  return list[Math.floor(rand(holder) * list.length)];
}

export function shuffle(holder, list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand(holder) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
