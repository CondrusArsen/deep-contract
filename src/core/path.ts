// Breadth-first search over open mine cells (4-neighbour). Workers walk and climb through any open cell.
import { ENTRY, MINE_H, W } from './world';
import { B, type Mine } from './types';

const N = W * MINE_H;
const prev = new Int32Array(N);
const distA = new Int32Array(N);
const queue = new Int32Array(N);

export const open = (m: Mine, i: number) => m.kind[i] === B.Empty;

export function neighbours(i: number): number[] {
  const x = i % W, y = (i / W) | 0;
  const out: number[] = [];
  if (x > 0) out.push(i - 1);
  if (x < W - 1) out.push(i + 1);
  if (y > 0) out.push(i - W);
  if (y < MINE_H - 1) out.push(i + W);
  return out;
}

/** Distance field from the ladder landing through open cells; −1 = unreachable. */
export function entryField(m: Mine): number[] {
  const d = new Array<number>(N).fill(-1);
  if (!open(m, ENTRY)) return d;
  let h = 0, t = 0;
  queue[t++] = ENTRY; d[ENTRY] = 0;
  while (h < t) {
    const c = queue[h++];
    for (const n of neighbours(c)) if (d[n] < 0 && open(m, n)) { d[n] = d[c] + 1; queue[t++] = n; }
  }
  return d;
}

/**
 * BFS from `start` through open cells. Returns the first visited cell for which `goal` is true,
 * along with the path (excluding start). `maxD` bounds the search.
 */
export function bfs(m: Mine, start: number, goal: (c: number, d: number) => boolean, maxD = 999): { cell: number; path: number[] } | null {
  if (start < 0) return null;
  distA.fill(-1);
  let h = 0, t = 0;
  queue[t++] = start; distA[start] = 0; prev[start] = -1;
  while (h < t) {
    const c = queue[h++];
    if (goal(c, distA[c])) {
      const path: number[] = [];
      let k = c;
      while (k !== start && k >= 0) { path.push(k); k = prev[k]; }
      path.reverse();
      return { cell: c, path };
    }
    if (distA[c] >= maxD) continue;
    for (const n of neighbours(c)) {
      if (distA[n] < 0 && open(m, n)) { distA[n] = distA[c] + 1; prev[n] = c; queue[t++] = n; }
    }
  }
  return null;
}

/** Path from start to target cell through open cells, or null. */
export function pathTo(m: Mine, start: number, target: number): number[] | null {
  if (start === target) return [];
  const r = bfs(m, start, c => c === target);
  return r ? r.path : null;
}

/** Follow the entry field downhill to the ladder. */
export function pathHome(field: number[], start: number): number[] | null {
  if (start < 0 || field[start] < 0) return null;
  const path: number[] = [];
  let c = start;
  let guard = 0;
  while (field[c] > 0 && guard++ < 400) {
    let best = -1;
    for (const n of neighbours(c)) if (field[n] >= 0 && field[n] < field[c] && (best < 0 || field[n] < field[best])) best = n;
    if (best < 0) return null;
    path.push(best); c = best;
  }
  return path;
}

/** Straight-line visibility through open cells (grid DDA). */
export function lineOfSight(m: Mine, x0: number, y0: number, x1: number, y1: number, cellOf: (x: number, y: number) => number, ignore = -1): boolean {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const c = cellOf(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
    if (c >= 0 && c !== ignore && m.kind[c] !== B.Empty) return false;
  }
  return true;
}
