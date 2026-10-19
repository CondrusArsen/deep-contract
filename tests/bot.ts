// Heuristic auto-player used by tests and balance simulations. It only uses the public actions the UI uses.
import { BUILDINGS } from '../src/core/data/buildings';
import { TURRETS } from '../src/core/data/turrets';
import { build, canPlaceTurret, openPad, orderDrill, placeTurret, recruit, research, setTag, tagCount, upgradeTurret, workforceCap } from '../src/core/economy';
import { newGame } from '../src/core/contract';
import { pick, reroll } from '../src/core/draft';
import { coalQuota, orderCap } from '../src/core/mods';
import { canLaunch, launch, step } from '../src/core/sim';
import { B, type ContractDef, type GameState, type Setup } from '../src/core/types';
import { workforceUsed } from '../src/core/workers';
import { W, MINE_H, ENTRY } from '../src/core/world';
import { neighbours } from '../src/core/path';
import { useAbility, abilityReady } from '../src/core/abilities';
import { turretStats } from '../src/core/night';

const VALUE: Record<number, number> = { [B.Coal]: 10, [B.Cache]: 9, [B.Charge]: 12, [B.Bonus]: 7, [B.Iron]: 6, [B.Crim]: 7, [B.Ochre]: 5, [B.Jade]: 5, [B.Void]: 6 };

/** 0-1 BFS: cost = number of solid blocks to dig from the open network. Returns the dig list toward the best target. */
export function planDig(s: GameState): number[] {
  const m = s.mine;
  const N = W * MINE_H;
  const cost = new Array(N).fill(1e9), prev = new Array(N).fill(-1);
  const dq: number[] = [];
  for (let i = 0; i < N; i++) if (s.entryDist[i] >= 0) { cost[i] = 0; dq.push(i); }
  while (dq.length) {
    const c = dq.shift()!;
    for (const n of neighbours(c)) {
      const k = m.kind[n];
      if (k === B.Bedrock) continue;
      const w = k === B.Empty ? 0 : 1 + (k === B.Hard ? 0.6 : 0) + (k === B.Hole || k === B.Hatch || k === B.Volatile || k === B.Pod ? 3 : 0);
      if (cost[c] + w < cost[n]) { cost[n] = cost[c] + w; prev[n] = c; if (w === 0) dq.unshift(n); else dq.push(n); }
    }
  }
  const coalNeed = !s.drillQueued && s.res.coal < coalQuota(s);
  let best = -1, bv = -1e9;
  for (let i = 0; i < N; i++) {
    const k = m.kind[i];
    let v = VALUE[k] ?? 0;
    if (!v || m.tag[i] || cost[i] >= 1e9) continue;
    if (k === B.Coal && !coalNeed) v = 3;
    if (k === B.Charge && s.depth < s.contract.targetStrata * 50) v = 0;
    if (k === B.Crim && s.res.crim < 2) v += 5;
    if (k === B.Iron && s.res.iron < 6) v += 3;
    const score = v - cost[i] * 1.4;
    if (score > bv) { bv = score; best = i; }
  }
  if (best < 0) return [];
  const out: number[] = [];
  let c = best;
  while (c >= 0 && cost[c] > 0) { if (m.kind[c] !== B.Empty) out.push(c); c = prev[c]; }
  return out.reverse();
}

export interface BotOpts { turretMix?: string[]; noBuild?: boolean; greedyDepth?: number; daysPerStratum?: number; noUpgrade?: boolean }
const arrivedDay = new WeakMap<object, { st: number; day: number }>();

export function botAct(s: GameState, o: BotOpts = {}) {
  if (s.phase === 'landing') { orderDrill(s); return; }
  if (s.draft) {
    const cards = s.draft.cards;
    let idx = cards.findIndex(c => TURRETS[c.tech] && TURRETS[c.tech].family !== 'kin');
    if (idx < 0) idx = cards.findIndex(c => TURRETS[c.tech]);
    if (idx < 0) idx = 0;
    if (s.draft.kind === 'tech' && idx === 0 && !TURRETS[cards[0].tech] && s.rerolls > 0 && Math.random() < 0.3) reroll(s, []);
    pick(s, Math.min(idx, s.draft ? s.draft.cards.length - 1 : 0));
    return;
  }
  if (s.phase !== 'day' && s.phase !== 'night') return;
  // tags
  let guard = 0;
  while (tagCount(s) < Math.min(orderCap(s), 12) && guard++ < 6) {
    const plan = planDig(s);
    if (!plan.length) break;
    for (const c of plan) setTag(s, c, true);
  }
  if (!o.noBuild) {
    const pads = s.pads.filter(p => p.open && p.building < 0);
    const has = (t: string) => s.buildings.some(b => b.type === t);
    const count = (t: string) => s.buildings.filter(b => b.type === t).length;
    const rec = s.setup.platform === 'brood' ? 'hatchery' : s.setup.platform === 'stone' ? 'meadhall' : 'barracks';
    const want: string[] = [];
    if (!has(rec)) want.push(rec);
    if (!has('lab')) want.push('lab');
    if (s.unlocked.factory && count('factory') < 1) want.push('factory');
    for (const t of Object.keys(s.unlocked)) if (BUILDINGS[t] && (BUILDINGS[t].cat === 'night' || BUILDINGS[t].cat === 'day') && !has(t)) want.push(t);
    if (count(rec) < 2 && s.stratum >= 2) want.push(rec);
    if (count('lab') < 2 && s.stratum >= 2) want.push('lab');
    for (const t of want) {
      const pad = pads.find(p => p.building < 0);
      if (!pad) break;
      if (!build(s, t, pad.id)) pads.splice(pads.indexOf(pad), 1);
    }
    if (!pads.length && s.stratum >= 2) { const up = s.pads.find(p => !p.open); if (up) openPad(s, up.id); }
    // research
    for (const row of ['jaw', 'haul', 'legs', 'plate']) research(s, row);
    // recruit
    for (let n = 0; n < 3; n++) {
      if (workforceUsed(s) >= workforceCap(s) || s.res.iron < 4) break;
      const cnt = (c: string) => s.workers.filter(w => w.cls === c).length + s.recruitQ.filter(q => q.cls === c).length;
      const k = cnt('hauler') < cnt('miner') ? 'hauler' : cnt('guard') * 3 < cnt('miner') + cnt('hauler') ? 'guard' : 'miner';
      if (recruit(s, k as 'miner') && recruit(s, 'miner') && recruit(s, 'hauler')) break;
    }
    // turrets: fill mounts from the bottom
    const types = o.turretMix ?? Object.keys(s.unlocked).filter(t => TURRETS[t] && t !== 'incub');
    const midY = (s.mounts.reduce((a, m) => Math.min(a, m.y), 0)) * 0.45;
    const mounts = [...s.mounts].filter(m => m.turret < 0).sort((a, b) => Math.abs(a.y - midY) - Math.abs(b.y - midY) || a.side - b.side);
    let ti = s.turrets.length;
    for (const m of mounts) {
      if (s.turrets.length >= 6 + s.stratum * 3) break;
      const order = [...types].sort((a, b) => s.turrets.filter(t => t.type === a).length - s.turrets.filter(t => t.type === b).length);
      let placed = false;
      for (const t of order) { if (!canPlaceTurret(s, t, m.id)) { placeTurret(s, t, m.id); placed = true; break; } }
      if (!placed) break;
      ti++;
    }
    if (!o.noUpgrade && s.phase === 'day' && s.res.iron > 12) for (const t of s.turrets) { if (s.res.iron < 8) break; upgradeTurret(s, t.id, 0); upgradeTurret(s, t.id, 1); }
  }
  // abilities at night: target the densest enemy
  if (s.phase === 'night' && s.enemies.length) {
    for (const a of s.abilities.night) {
      if (abilityReady(s, a)) continue;
      const e = s.enemies[0];
      if (a.type === 'overclock') { const t = s.turrets[0]; if (t) useAbility(s, a.type, 0, 0, t.id); }
      else useAbility(s, a.type, e.x, e.y);
    }
  }
  const ar = arrivedDay.get(s);
  if (!ar || ar.st !== s.stratum) arrivedDay.set(s, { st: s.stratum, day: s.day });
  const waited = s.day - (arrivedDay.get(s)!.day) + 1 >= (o.daysPerStratum ?? 1);
  if (s.res.coal >= coalQuota(s) && !s.drillQueued && s.phase === 'day' && waited) {
    if (s.depth < s.contract.targetStrata * 50 + (o.greedyDepth ?? 0) * 50) orderDrill(s);
  }
  if (!canLaunch(s) && s.depth >= s.contract.targetStrata * 50 + (o.greedyDepth ?? 0) * 50) launch(s);
  void turretStats; void ENTRY;
}

export function runContract(contract: ContractDef, setup: Setup, opts: BotOpts & { perks?: string[]; maxDays?: number; log?: boolean } = {}) {
  const s = newGame(contract, setup, { perks: opts.perks ?? [], divLevel: 1, blueprints: [] });
  const dt = 1 / 30;
  let t = 0, lastDay = 0;
  while (s.phase !== 'over' && s.day <= (opts.maxDays ?? 60) && t < 60 * 60 * 3) {
    if (Math.floor(t * 2) !== Math.floor((t + dt) * 2)) botAct(s, opts);
    step(s, dt, { blueprints: [] });
    s.ffx.length = 0;
    t += dt;
    if (opts.log && s.day !== lastDay) { lastDay = s.day; console.log(`day ${s.day} depth ${s.depth} core ${s.core.hp.toFixed(0)} iron ${s.res.iron} crim ${s.res.crim} coal ${s.res.coal} workers ${s.workers.length} turrets ${s.turrets.length} kills ${s.stats.kills} blocks ${s.stats.blocks}`); }
  }
  return { s, t };
}
