// Modifier queries: contract conditions, bonus technologies, platform traits, HQ perks and departments.
import { PLATFORMS } from './data/platforms';
import type { GameState, WorkerClass } from './types';

export const modCount = (s: GameState, id: string) => { let n = 0; for (const m of s.mods) if (m === id) n++; return n; };
export const hasMod = (s: GameState, id: string) => s.mods.includes(id);
export const perk = (s: GameState, id: string) => s.perks.includes(id);
export const dept = (s: GameState, id: string) => (s.setup.dept === id ? s.deptLvl : 0);
export const today = (s: GameState, id: string) => s.events.today === id;

export const labTier = (s: GameState, row: string) => s.lab[row] ?? 0;

export function coalQuota(s: GameState) {
  let q = 6 + (hasMod(s, 'deepcoal') ? 1 : 0) - (hasMod(s, 'coalnose') ? 1 : 0);
  return Math.max(4, q);
}

export function dayLength(s: GameState) {
  let d = 180;
  if (hasMod(s, 'shortday')) d *= 0.85;
  if (hasMod(s, 'overtime')) d *= 1.12;
  return Math.round(d);
}

export function workerSpeedMult(s: GameState, cls: WorkerClass) {
  let m = 1 + 0.12 * labTier(s, 'legs') + 0.1 * modCount(s, 'feet') + (perk(s, 'w5') ? 0.08 : 0);
  if (today(s, 'dayoff')) m *= 1.4;
  if (today(s, 'blizzard')) m *= 0.7;
  if (cls === 'hauler') m *= 1 + 0.08 * dept(s, 'logistics') + 0.1 * (labTier(s, 'haul') >= 1 ? 1 : 0) + 0.1 * (labTier(s, 'haul') >= 3 ? 1 : 0);
  const horn = s.zones.find(z => z.kind === 'horn');
  if (horn) m *= 1.4;
  return m;
}

export function mineMult(s: GameState) {
  let m = 1 + 0.25 * labTier(s, 'jaw') + 0.15 * modCount(s, 'jaw') + 0.08 * dept(s, 'mining') + (perk(s, 'w9') ? 0.15 : 0) + (hasMod(s, 'welcome') ? 0.5 : 0);
  if (s.zones.find(z => z.kind === 'horn')) m *= 1.4;
  return m;
}

export function workerHpMult(s: GameState) {
  return 1 + 0.25 * labTier(s, 'plate') + 0.25 * modCount(s, 'skin') + (perk(s, 'w2') ? 0.15 : 0);
}

export function carryCap(s: GameState) {
  const base = PLATFORMS[s.setup.platform].workers.hauler.power;
  return base + (labTier(s, 'haul') >= 2 ? 1 : 0) + (labTier(s, 'haul') >= 4 ? 1 : 0) + (dept(s, 'logistics') >= 3 ? 1 : 0);
}

export function guardMult(s: GameState) { return 1 + 0.3 * labTier(s, 'aim'); }

export function hireMult(s: GameState) {
  // > 1 means faster
  return (1 + 0.4 * modCount(s, 'shift') + 0.15 * dept(s, 'hr') + (perk(s, 'w4') ? 0.25 : 0)) / Math.pow(0.85, labTier(s, 'hire'));
}

export function sellFee(s: GameState) {
  if (hasMod(s, 'fees')) return 2;
  if (hasMod(s, 'scrap') || perk(s, 'o9') || dept(s, 'accounting') >= 2) return 0;
  return 1;
}

export function swarmDamageMult(s: GameState) {
  return 1 + 0.1 * modCount(s, 'nightdmg') + 0.05 * dept(s, 'security') + (perk(s, 'd9') ? 0.1 : 0);
}

export function turretRadiusMult(s: GameState) {
  return 1 + 0.12 * modCount(s, 'radius') + (perk(s, 'd2') ? 0.08 : 0);
}

export function blastMult(s: GameState) { return 1 + 0.25 * modCount(s, 'blast'); }

export function identicalCap(s: GameState) { return perk(s, 'd7') ? 6 : 5; }

export function orderCap(s: GameState) { return PLATFORMS[s.setup.platform].orderCap + (perk(s, 'w7') ? 10 : 0); }

export function doubleDropChance(s: GameState) {
  let p = 0.08 + 0.25 * modCount(s, 'lucky');
  if (today(s, 'rich')) p *= 2;
  if (today(s, 'monsoon')) p += 0.2;
  return Math.min(0.9, p);
}

export function nightRechargeMult(s: GameState) {
  return 1 + 0.2 * modCount(s, 'nrecharge') + (perk(s, 'd5') ? 0.15 : 0) + 0.1 * modCount(s, 'brecharge');
}
export function dayRechargeMult(s: GameState) { return 1 + 0.1 * modCount(s, 'brecharge'); }

export function swarmHpMult(s: GameState) { return hasMod(s, 'vigor') ? 1.15 : 1; }
