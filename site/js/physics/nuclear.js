// Radioactive decay and half-life (Physics 30 Unit D).

export function remaining(N0, t, halfLife) {
  return N0 * Math.pow(0.5, t / halfLife);
}

export function halfLivesElapsed(t, halfLife) {
  return t / halfLife;
}

// Chance that one nucleus decays during dt.
export function decayProbability(dt, halfLife) {
  return 1 - Math.pow(0.5, dt / halfLife);
}

// Advances a population of nuclei by dt. `alive` is a Uint8Array (1 = undecayed);
// returns how many decayed. `rand` is injectable so tests can be deterministic.
export function stepDecay(alive, dt, halfLife, rand = Math.random) {
  const p = decayProbability(dt, halfLife);
  let decayed = 0;
  for (let i = 0; i < alive.length; i++) {
    if (alive[i] && rand() < p) {
      alive[i] = 0;
      decayed++;
    }
  }
  return decayed;
}

// Small seeded PRNG (mulberry32) so a run can be replayed exactly.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
