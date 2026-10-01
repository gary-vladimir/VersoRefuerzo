// Deterministic shuffling.
//
// A shuffle that runs during render must give the same order on the server
// and in the browser, or React throws away the server HTML on hydration.
// Callers therefore pass a seed (the daily queue derives one from the user
// and the date; the mini-game pages pick one per round on the server).

// Mulberry32: a tiny PRNG that is good enough for shuffling and fully
// determined by its seed.
function rng(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates on a copy, driven by the seeded PRNG.
export function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
  const out = arr.slice();
  const r = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

// A fresh seed for one round, picked on the server and passed to the client
// component as a prop.
export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
