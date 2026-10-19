// Seeded, serialisable RNG (mulberry32). The state is a plain number so it survives JSON saves.
export interface RngState { s: number }

export function makeRng(seed: number): RngState {
  return { s: (seed >>> 0) || 0x9e3779b9 };
}

export function rnd(r: RngState): number {
  r.s = (r.s + 0x6d2b79f5) >>> 0;
  let t = r.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const rint = (r: RngState, lo: number, hi: number) => lo + Math.floor(rnd(r) * (hi - lo + 1));
export const rpick = <T>(r: RngState, a: readonly T[]): T => a[Math.floor(rnd(r) * a.length)];
export const rchance = (r: RngState, p: number) => rnd(r) < p;

export function rweighted<T>(r: RngState, items: readonly T[], w: (t: T) => number): T | undefined {
  let sum = 0;
  for (const it of items) sum += Math.max(0, w(it));
  if (sum <= 0) return undefined;
  let x = rnd(r) * sum;
  for (const it of items) {
    x -= Math.max(0, w(it));
    if (x <= 0) return it;
  }
  return items[items.length - 1];
}

export function rshuffle<T>(r: RngState, a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd(r) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
