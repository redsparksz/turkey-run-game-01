// Seeded randomness for Gobbles: the same seed always deals the same farmyard,
// so a screenshot scene can be replayed exactly, and two players on the same
// seed face the same ovens, knives and corn.

export function makeRandom(seed) {
  let state = (seed >>> 0) || 1;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element of `list` using the seeded stream. */
export function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

/** Integer in [min, max] inclusive, from the seeded stream. */
export function intBetween(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

/** A value in [min, max) for sizes, speeds and gaps. */
export function floatBetween(random, min, max) {
  return min + random() * (max - min);
}

/** True with probability `p` (0..1), from the seeded stream. */
export function chance(random, p) {
  return random() < p;
}
