// World geometry, in blocks. y grows downward; y = 0 is the floor of the first deck storey.
import type { GameState, Mount, Pad } from './types';

export const W = 17;            // world width in blocks (walls at x = 0 and x = 16 above the platform)
export const MINE_H = 14;       // rows per 50 m stratum
export const MINE_TOP = 2;      // world y of mine row 0 (below the chassis)
export const CORE_X = 8.5;
export const CORE_Y = -1.6;
export const LADDER_X = 8.5;
export const ENTRY = 8;         // mine cell index of the ladder landing (x 8, row 0)
export const DECK_WALK_Y = -0.5;
export const STOREY_FLOOR = [0, -3.5, -7];
export const PAD_X = [2, 4, 6, 11, 13, 15];
export const MOUNT_STEP = 5;
export const TILE = 16;         // art pixels per block

export const cellX = (i: number) => i % W;
export const cellY = (i: number) => Math.floor(i / W);
export const cellIdx = (cx: number, cy: number) => cy * W + cx;
export const cellCX = (i: number) => (i % W) + 0.5;
export const cellCY = (i: number) => MINE_TOP + Math.floor(i / W) + 0.5;
export function worldCell(x: number, y: number): number {
  const cx = Math.floor(x), cy = Math.floor(y - MINE_TOP);
  if (cx < 0 || cx >= W || cy < 0 || cy >= MINE_H) return -1;
  return cy * W + cx;
}
export const shaftTop = (s: GameState) => -(10 + s.shaftH);
export const mountX = (side: -1 | 1) => (side < 0 ? 1.8 : W - 1.8); // turret pivot, 0.8 blocks off the wall face
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

export function buildMounts(s: GameState): Mount[] {
  const top = shaftTop(s);
  const out: Mount[] = [];
  let id = 0;
  for (let y = -2; y > top + 2.5; y -= MOUNT_STEP) {
    for (const side of [-1, 1] as const) {
      const prev = s.mounts.find(m => m.y === y && m.side === side);
      out.push({ id: id++, side, y, turret: prev ? prev.turret : -1 });
    }
  }
  return out;
}

export function buildPads(prev: Pad[]): Pad[] {
  const out: Pad[] = [];
  let id = 0;
  for (let st = 0; st < 3; st++) {
    for (const x of PAD_X) {
      const old = prev.find(p => p.storey === st && p.x === x);
      out.push({ id: id++, storey: st, x, y: STOREY_FLOOR[st], open: st === 0 || !!old?.open, building: old ? old.building : -1 });
    }
  }
  return out;
}

export const storeysAvailable = (s: GameState) => Math.min(3, s.stratum >= 3 ? 3 : s.stratum >= 2 ? 2 : 1);
export const platformTop = (s: GameState) => {
  let top = 0;
  for (const p of s.pads) if (p.open && p.storey > 0) top = Math.min(top, STOREY_FLOOR[p.storey]);
  return top - 3;
};
