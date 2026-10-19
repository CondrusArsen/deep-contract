// The guided first contract: one objective at a time, each pointing at one thing (a button or a spot in the world).
// Objectives are checked against the game state every frame; a step the player completes early (or out of order)
// is marked done when it is reached, so the chain never blocks play.
import { coalQuota } from './mods';
import { neighbours } from './path';
import { B, type GameState } from './types';
import { cellX, cellY, dist, ENTRY, MINE_TOP, W } from './world';

export type TutTarget =
  | { ui: 'drill' | 'dig' | 'launch' | 'speed' | 'build' }   // a HUD or sheet button
  | { cell: number }                                          // a mine block
  | { pad: number }                                           // a deck pad
  | { mount: number }                                         // a wall mount
  | null;

export interface TutStep {
  id: string;
  /** shown on the objective card */
  text: (s: GameState) => string;
  /** the step can be the current objective */
  available: (s: GameState) => boolean;
  done: (s: GameState) => boolean;
  target: (s: GameState, dig: boolean) => TutTarget;
  /** jumps the queue while true (a turret when the swarm is coming) */
  urgent?: (s: GameState) => boolean;
}

const blocksOf = (s: GameState, kind: B) => { const out: number[] = []; for (let i = 0; i < s.mine.kind.length; i++) if (s.mine.kind[i] === kind) out.push(i); return out; };
/** a solid block the crew can reach: it borders an open cell connected to the ladder */
export const reachable = (s: GameState, i: number) => neighbours(i).some(n => (s.entryDist[n] ?? -1) >= 0);

const FAR = 9999;
interface DigField { d: Int16Array; prev: Int16Array; entry: number[]; key: number }
let cache: DigField | null = null;
/**
 * How many untagged blocks stand between the crew and each cell: 0 for open cells the crew can reach and for tagged
 * blocks the miners will get to (a tagged block behind an untagged one waits forever), +1 per block still to tag.
 */
export function digField(s: GameState): DigField {
  const m = s.mine, n = m.kind.length;
  let key = 0;
  for (let i = 0; i < n; i++) if (m.tag[i] && m.kind[i] !== B.Empty) key = (key * 31 + i + 1) | 0;
  if (cache && cache.entry === s.entryDist && cache.key === key && cache.d.length === n) return cache;
  const d = new Int16Array(n).fill(FAR), prev = new Int16Array(n).fill(-1);
  let cur: number[] = [];
  for (let i = 0; i < n; i++) if ((s.entryDist[i] ?? -1) >= 0) { d[i] = 0; cur.push(i); }
  // 0-1 breadth-first search, one cost level at a time
  for (let level = 0; cur.length; level++) {
    const next: number[] = [];
    for (let h = 0; h < cur.length; h++) {
      const c = cur[h];
      if (d[c] !== level) continue;
      for (const k of neighbours(c)) {
        if (m.kind[k] === B.Bedrock) continue;
        const w = m.kind[k] === B.Empty || m.tag[k] ? 0 : 1;
        if (level + w < d[k]) { d[k] = level + w; prev[k] = c; (w ? next : cur).push(k); }
      }
    }
    cur = next;
  }
  return (cache = { d, prev, entry: s.entryDist, key });
}
/** the crew will dig this tagged block (nothing untagged stands in the way) */
const workable = (s: GameState, i: number) => digField(s).d[i] === 0;
/** extra blocks to tag before the crew gets to this one */
const detour = (s: GameState, i: number) => { const d = digField(s).d[i]; return d >= FAR ? FAR : Math.max(0, d - (s.mine.tag[i] ? 0 : 1)); };
/** the block of this kind the crew gets to soonest (fewest blocks in the way, then nearest the ladder), preferring untagged ones */
export function nearestBlock(s: GameState, kind: B, untaggedOnly = true): number {
  let best = -1, bd = 1e9;
  for (const i of blocksOf(s, kind)) {
    if (untaggedOnly && s.mine.tag[i]) continue;
    const x = detour(s, i);
    if (x >= FAR) continue;
    const d = dist(cellX(i), cellY(i), ENTRY % W, 0) + x * 4;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
/** the next block to tag on the way to `cell`: the cell itself when nothing untagged is in the way */
export function digStep(s: GameState, cell: number): number {
  if (cell < 0) return cell;
  const f = digField(s);
  if (f.d[cell] >= FAR) return cell;
  let step = cell;
  for (let c = cell, guard = 0; c >= 0 && f.d[c] > 0 && guard < 400; c = f.prev[c], guard++) if (!s.mine.tag[c] && s.mine.kind[c] !== B.Empty) step = c;
  return step;
}
/** a world target for a block: the block itself, or the block to tag first on the way to it */
const blockTarget = (s: GameState, cell: number): TutTarget => (cell >= 0 ? { cell: digStep(s, cell) } : null);
export const needsTunnel = (s: GameState, cell: number) => cell >= 0 && digStep(s, cell) !== cell;
const taggedCount = (s: GameState, kind: B) => { let n = 0; for (let i = 0; i < s.mine.kind.length; i++) if (s.mine.kind[i] === kind && s.mine.tag[i] && workable(s, i)) n++; return n; };
const carried = (s: GameState, kind: string) => s.workers.reduce((n, w) => n + w.carry.filter(k => k === kind).length, 0) + s.items.filter(it => it.kind === kind).length;
/** coal the drill can count on: in stock, on its way home, or tagged where the miners can get to it */
export const coalSecured = (s: GameState) => s.res.coal + carried(s, 'coal') + taggedCount(s, B.Coal);
const onStratum = (s: GameState) => s.phase !== 'landing' && s.stratum >= 1;
const beforeTarget = (s: GameState) => s.stratum < s.contract.targetStrata && !s.drillQueued;
const freePad = (s: GameState) => s.pads.find(p => p.storey === 0 && p.building < 0)?.id ?? -1;
/** the free wall mount nearest to the platform */
const freeMount = (s: GameState) => { let best = -1, by = -1e9; for (const m of s.mounts) if (m.turret < 0 && m.y > by) { by = m.y; best = m.id; } return best; };

export const TUT_STEPS: TutStep[] = [
  {
    id: 'drill0', text: () => 'Hold DRILL to lower the platform into the mine',
    available: () => true, done: s => s.phase !== 'landing',
    target: () => ({ ui: 'drill' }),
  },
  {
    id: 'iron', text: s => (s.stats.blocks > 0 ? 'Your crew digs it out and hauls it home' : 'Tap DIG, then tap the glowing iron'),
    available: onStratum, done: s => onStratum(s) && (s.stats.delivered > 0 || s.stratum >= 2),
    target: (s, dig) => { if (s.stats.blocks > 0 || s.mine.tag.some((t, i) => t && s.mine.kind[i] !== B.Empty && workable(s, i))) return null; if (!dig) return { ui: 'dig' }; return blockTarget(s, nearestBlock(s, B.Iron)); },
  },
  {
    id: 'build', text: s => (s.freeBuildings > 0 ? 'Build a Barracks on the deck — it is free' : 'Build a Barracks on the deck'),
    available: onStratum, done: s => s.buildings.length > 0,
    target: s => { const p = freePad(s); return p >= 0 ? { pad: p } : null; },
  },
  {
    id: 'turret', text: s => (s.dusk || s.phase === 'night' ? 'The swarm is coming! Place a turret on the shaft wall now' : s.freeTurrets > 0 ? 'Nights are dangerous: place a free turret on the shaft wall' : 'Place a turret on the shaft wall'),
    available: s => onStratum(s) && s.buildings.length > 0, done: s => s.turrets.length > 0,
    urgent: s => onStratum(s) && (s.dusk || s.phase === 'night') && s.turrets.length === 0,
    target: s => { const m = freeMount(s); return m >= 0 ? { mount: m } : null; },
  },
  {
    id: 'coal', text: s => (needsTunnel(s, nearestBlock(s, B.Coal)) ? `Dig a way to the black coal: tag the block in the way (${Math.min(3, coalSecured(s))}/3)` : `Tag black coal — the drill burns ${coalQuota(s)} to go 50 m deeper (${Math.min(3, coalSecured(s))}/3)`),
    available: s => onStratum(s) && beforeTarget(s), done: s => onStratum(s) && (coalSecured(s) >= 3 || !beforeTarget(s)),
    target: (s, dig) => { if (!dig) return { ui: 'dig' }; return blockTarget(s, nearestBlock(s, B.Coal)); },
  },
  {
    id: 'cache', text: () => 'Tag the glowing crate — it holds a new technology',
    available: s => onStratum(s) && s.stratum === 1, done: s => onStratum(s) && (s.stats.drafts > 0 || s.stratum >= 2 || (blocksOf(s, B.Cache).length === 0 && !s.items.some(i => i.kind === 'tech') && !s.workers.some(w => w.carry.includes('tech')))),
    target: (s, dig) => {
      const c = nearestBlock(s, B.Cache, false); if (c < 0) return null;
      if (s.mine.tag[c] && workable(s, c)) return null;
      return dig ? { cell: digStep(s, c) } : { ui: 'dig' };
    },
  },
  {
    id: 'quota', text: s => {
      const q = coalQuota(s), have = s.res.coal;
      if (have >= q) return 'Coal ready — hold DRILL to order the descent';
      if (coalSecured(s) >= q) return `Haulers are bringing coal home (${have}/${q})`;
      return needsTunnel(s, nearestBlock(s, B.Coal)) ? `Dig a way to more coal: tag the block in the way (${coalSecured(s)}/${q})` : `Tag more coal for the drill (${coalSecured(s)}/${q})`;
    },
    available: s => onStratum(s) && beforeTarget(s), done: s => onStratum(s) && (s.drillQueued || s.stratum >= s.contract.targetStrata),
    target: (s, dig) => {
      const q = coalQuota(s);
      if (s.res.coal >= q) return { ui: 'drill' };
      if (coalSecured(s) >= q) return { ui: 'speed' };
      if (!dig) return { ui: 'dig' };
      return blockTarget(s, nearestBlock(s, B.Coal));
    },
  },
  {
    id: 'night', text: s => (s.phase === 'night' ? (s.speed === 1 ? 'Hold out! Turrets fire on their own. Speed up with the ×1 button' : 'Hold out! Turrets fire on their own') : 'The swarm comes at dusk. Your crew climbs home'),
    available: s => onStratum(s) && s.turrets.length > 0 && (s.dusk || s.phase === 'night'), done: s => s.day >= 2,
    target: s => (s.phase === 'night' ? { ui: 'speed' } : null),
  },
  {
    id: 'charge', text: s => (s.charges >= s.contract.charges ? 'Core charged!' : s.items.some(i => i.kind === 'charge') || s.workers.some(w => w.carry.includes('charge')) ? 'Haulers are bringing the charge home' : 'Target depth! Tag the cyan charge crystal'),
    available: s => s.stratum >= s.contract.targetStrata && s.phase === 'day', done: s => s.charges >= s.contract.charges,
    target: (s, dig) => { if (s.items.some(i => i.kind === 'charge') || s.workers.some(w => w.carry.includes('charge'))) return null; if (!dig) return { ui: 'dig' }; return blockTarget(s, nearestBlock(s, B.Charge)); },
  },
  {
    id: 'launch', text: () => 'Hold LAUNCH to detonate the planet\'s core',
    available: s => s.charges >= s.contract.charges && s.phase === 'day', done: s => s.phase === 'launch' || s.phase === 'over',
    target: () => ({ ui: 'launch' }),
  },
];

export const tutActive = (s: GameState) => !!s.tut && !s.tut.skipped && s.tut.done.length < TUT_STEPS.length;

/** Mark completed steps (returns the ids that just finished) and pick the current objective. */
export function tutTick(s: GameState, dt: number): { finished: string[]; current: TutStep | null } {
  if (!s.tut || s.tut.skipped) return { finished: [], current: null };
  s.tut.t += dt;
  const finished: string[] = [];
  // a step counts as soon as its goal is met, even if the player got there before the guide asked
  for (const st of TUT_STEPS) if (!s.tut.done.includes(st.id) && st.done(s)) { s.tut.done.push(st.id); finished.push(st.id); }
  const open = TUT_STEPS.filter(st => !s.tut!.done.includes(st.id));
  const current = open.find(st => st.urgent?.(s)) ?? open.find(st => st.available(s)) ?? null;
  return { finished, current };
}

/** where a world target is, in world coordinates */
export function tutTargetPos(s: GameState, t: TutTarget): { x: number; y: number; w: number; h: number } | null {
  if (!t || 'ui' in t) return null;
  if ('cell' in t) return { x: cellX(t.cell), y: MINE_TOP + cellY(t.cell), w: 1, h: 1 };
  if ('pad' in t) { const p = s.pads.find(q => q.id === t.pad); return p ? { x: p.x - 1, y: p.y - 2, w: 2, h: 2 } : null; }
  const m = s.mounts.find(q => q.id === t.mount);
  return m ? { x: (m.side < 0 ? 1.8 : W - 1.8) - 0.8, y: m.y - 0.8, w: 1.6, h: 1.6 } : null;
}
