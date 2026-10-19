// Persistent HQ profile: division XP, minerals, upgrade tree, platforms, blueprints, board, settings.
import { makeContract, type BoardCtx } from './contract';
import { TIERS } from './data/contracts';
import { levelForXp, META_BY_ID, platLevelForXp, PLAT_SLOTS } from './data/meta';
import { hashStr } from './rng';
import type { BiomeId, ContractDef, CoreId, DeptId, GameState, Minerals, PlatformId, ResultData, Setup } from './types';

export interface Settings { master: number; music: number; sfx: number; shake: boolean; crt: boolean; pauseMenus: boolean; flash: boolean; hints: boolean }

export interface Profile {
  v: 1; xp: number; minerals: Minerals; owned: string[]; tierMax: number;
  platXp: Record<PlatformId, number>; blueprints: string[]; mastered: string[]; bonusesFound: string[];
  boardSeed: number; wins: number; losses: number; deepest: number; kills: number; contracts: number;
  qualLog: { text: string; met: boolean; planet: string; blueprint: string }[];
  history: { planet: string; tier: number; success: boolean; depth: number; days: number; core: number; xp: number; stars: number; platform: PlatformId }[];
  settings: Settings; lastSetup: Setup; seen: Record<string, boolean>;
  /** guided first contract: 'contract' until it is finished or skipped, then 'upgrade' until the first purchase */
  tutorial?: 'contract' | 'upgrade' | 'done';
  achievements?: Record<string, number>; // name -> time earned
  /** progress generation: a profile from an older one is reset once (see PROGRESS_EPOCH) */
  epoch?: number;
}

/**
 * Raise this to give every player a fresh start once (the owner keeps theirs). 2 = the guided first contract
 * shipped (2026-10-01): everyone who played before gets it from the beginning.
 */
export const PROGRESS_EPOCH = 2;

export const defaultSettings = (): Settings => ({ master: 0.8, music: 0.6, sfx: 0.8, shake: true, crt: true, pauseMenus: true, flash: true, hints: true });

export function newProfile(): Profile {
  return {
    v: 1, xp: 0, minerals: { ochre: 0, jade: 0, void: 0 }, owned: [], tierMax: 1,
    platXp: { mule: 0, brood: 0, stone: 0 }, blueprints: [], mastered: [], bonusesFound: [],
    boardSeed: 1 + Math.floor(Math.random() * 100000), wins: 0, losses: 0, deepest: 0, kills: 0, contracts: 0,
    qualLog: [], history: [], settings: defaultSettings(),
    lastSetup: { platform: 'mule', core: 'standard', dept: null, startTechs: [], bonuses: [] }, seen: {},
    tutorial: 'contract', achievements: {}, epoch: PROGRESS_EPOCH,
  };
}

export const divLevel = (p: Profile) => levelForXp(p.xp);
export const owns = (p: Profile, id: string) => p.owned.includes(id);

export function biomesOf(p: Profile): BiomeId[] {
  const b: BiomeId[] = ['cave'];
  if (owns(p, 'e1')) b.push('frost');
  if (owns(p, 'e4')) b.push('jungle');
  return b;
}
export function platformsOf(p: Profile): PlatformId[] {
  const out: PlatformId[] = ['mule'];
  if (owns(p, 'e2')) out.push('brood');
  if (owns(p, 'e5')) out.push('stone');
  return out;
}
export function coresOf(p: Profile): CoreId[] {
  const out: CoreId[] = ['standard'];
  if (owns(p, 'e3')) out.push('titan');
  if (owns(p, 'e6')) out.push('plasma');
  if (owns(p, 'e7')) out.push('ion');
  if (owns(p, 'e8')) out.push('phoenix');
  return out;
}
export const deptsAvailable = (p: Profile) => owns(p, 'e9');
export const DEPT_IDS: DeptId[] = ['security', 'mining', 'logistics', 'hr', 'rnd', 'accounting'];

export function platformSlots(p: Profile, pl: PlatformId) {
  const lvl = platLevelForXp(p.platXp[pl]);
  return { lvl, start: (lvl >= PLAT_SLOTS.start1 ? 1 : 0) + (lvl >= PLAT_SLOTS.start2 ? 1 : 0), bonus: (lvl >= PLAT_SLOTS.bonus1 ? 1 : 0) + (lvl >= PLAT_SLOTS.bonus2 ? 1 : 0) };
}

export function tierUnlocked(p: Profile, tier: number) {
  return tier <= p.tierMax && divLevel(p) >= TIERS[tier - 1].divLvl;
}

export function board(p: Profile, tier: number): ContractDef[] {
  const n = owns(p, 'e10') ? 4 : 3;
  const ctx: BoardCtx = { biomes: biomesOf(p), blueprints: p.blueprints, perks: p.owned };
  const out: ContractDef[] = [];
  for (let i = 0; i < n; i++) out.push(makeContract(hashStr(`${p.boardSeed}:${tier}:${i}`), tier, ctx));
  return out;
}

export function canBuy(p: Profile, id: string): string | null {
  const n = META_BY_ID[id];
  if (!n) return 'Unknown';
  if (owns(p, id)) return 'Owned';
  if (n.req && !owns(p, n.req)) return `Requires ${META_BY_ID[n.req].name}`;
  if (divLevel(p) < n.lvl) return `Division level ${n.lvl} required`;
  const [o, g, v] = n.cost;
  if (p.minerals.ochre < o || p.minerals.jade < g || p.minerals.void < v) return 'Not enough minerals';
  return null;
}

export function buy(p: Profile, id: string): string | null {
  const why = canBuy(p, id);
  if (why) return why;
  const [o, g, v] = META_BY_ID[id].cost;
  p.minerals.ochre -= o; p.minerals.jade -= g; p.minerals.void -= v;
  p.owned.push(id);
  return null;
}

export interface ApplyOut { levelBefore: number; levelAfter: number; blueprints: string[]; tierUnlocked: number | null; platLvlBefore: number; platLvlAfter: number }

export function applyResult(p: Profile, s: GameState, r: ResultData): ApplyOut {
  const levelBefore = divLevel(p);
  const pl = s.setup.platform;
  const platLvlBefore = platLevelForXp(p.platXp[pl]);
  p.xp += r.xp;
  p.platXp[pl] += r.xp;
  for (const k of ['ochre', 'jade', 'void'] as const) p.minerals[k] += r.retrieved[k] + r.reward[k];
  const newBp: string[] = [];
  for (const q of r.quals) {
    p.qualLog.unshift({ text: q.text, met: q.met, planet: s.contract.planet, blueprint: q.blueprint });
    if (q.met && q.blueprint && !p.blueprints.includes(q.blueprint)) { p.blueprints.push(q.blueprint); newBp.push(q.blueprint); }
  }
  p.qualLog = p.qualLog.slice(0, 40);
  let tierUnl: number | null = null;
  if (r.success) {
    p.wins++;
    if (s.contract.tier === p.tierMax && p.tierMax < TIERS.length) { p.tierMax++; tierUnl = p.tierMax; }
  } else p.losses++;
  p.contracts++;
  p.deepest = Math.max(p.deepest, s.depth);
  p.kills += s.stats.kills;
  for (const t in s.unlocked) if (s.unlocked[t].stars > 0 && !p.mastered.includes(t)) p.mastered.push(t);
  for (const m of s.mods) if (!p.bonusesFound.includes(m) && ['radius', 'tprice', 'nightdmg', 'blast', 'brecharge', 'jaw', 'feet', 'skin', 'lucky', 'coalnose', 'overtime', 'scrap', 'shift', 'plating', 'tracer', 'caps', 'shaped', 'nrecharge'].includes(m)) p.bonusesFound.push(m);
  p.history.unshift({ planet: s.contract.planet, tier: s.contract.tier, success: r.success, depth: r.depth, days: r.days, core: r.corePct, xp: r.xp, stars: r.stars, platform: pl });
  p.history = p.history.slice(0, 30);
  p.boardSeed++;
  return { levelBefore, levelAfter: divLevel(p), blueprints: newBp, tierUnlocked: tierUnl, platLvlBefore, platLvlAfter: platLevelForXp(p.platXp[pl]) };
}
