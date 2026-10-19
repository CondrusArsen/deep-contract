// CHOOSE ONE TECHNOLOGY: cards found in the mine unlock a structure for this contract only.
import { BUILDINGS } from './data/buildings';
import { DEPTS } from './data/platforms';
import { BASE_POOL, BONUS_MODS } from './data/techs';
import { TURRETS } from './data/turrets';
import { perk } from './mods';
import { rnd, rpick, rshuffle } from './rng';
import type { DraftCard, GameState } from './types';

export function techPool(s: GameState, blueprints: string[]) {
  const pool = new Set<string>(BASE_POOL);
  for (const b of blueprints) pool.add(b);
  const dept = s.setup.dept ? DEPTS[s.setup.dept].unlock : undefined;
  if (dept) pool.add(dept);
  if (s.setup.platform === 'brood') { pool.add('tower'); pool.add('incub'); }
  const out: string[] = [];
  for (const t of pool) {
    if (s.unlocked[t] || s.banned.includes(t)) continue;
    if (TURRETS[t]?.brood && s.setup.platform !== 'brood') continue;
    if (BUILDINGS[t]?.platform && BUILDINGS[t].platform !== s.setup.platform) continue;
    out.push(t);
  }
  return out;
}

export function rollStars(s: GameState) {
  let p2 = 0.3, p3 = 0.1;
  if (perk(s, 'r4')) { p2 += 0.05; p3 += 0.05; }
  if (perk(s, 'r7')) { p2 += 0.05; p3 += 0.05; }
  if (s.setup.dept === 'rnd') p3 += 0.05 * s.deptLvl;
  const v = rnd(s.rng);
  return v < p3 ? 3 : v < p3 + p2 ? 2 : 1;
}

export function lineFor(s: GameState, tech: string): string {
  if (TURRETS[tech]) return rpick(s.rng, TURRETS[tech].lineSet);
  const cat = BUILDINGS[tech]?.cat;
  if (cat === 'day' || cat === 'night') return 'recharge';
  return 'effect';
}

export function makeCard(s: GameState, tech: string): DraftCard {
  const stars = rollStars(s);
  return { tech, stars, lines: [lineFor(s, tech)] };
}

export const draftSize = (s: GameState) => (perk(s, 'r2') ? 3 : 2);

export function openDraft(s: GameState, kind: 'tech' | 'bonus', blueprints: string[]) {
  if (kind === 'tech') {
    const pool = rshuffle(s.rng, techPool(s, blueprints));
    let cards = pool.slice(0, draftSize(s)).map(t => makeCard(s, t));
    // the guided contract's first cache holds one sure card: a second turret type for the first night
    if (s.contract.tutorial && s.stats.drafts === 0 && pool.includes('laser')) cards = [{ tech: 'laser', stars: 2, lines: ['dmg'] }];
    if (!cards.length) { s.res.iron += 3; s.ffx.push({ t: 'toast', s: 'Nothing new in this cache: +3 iron salvage' }); return; }
    s.draft = { kind, cards };
  } else {
    const pool = rshuffle(s.rng, Object.keys(BONUS_MODS).filter(m => !s.mods.includes(m)));
    const cards = pool.slice(0, 3).map(m => ({ tech: m, stars: 0, lines: [] }));
    if (!cards.length) { s.res.iron += 3; return; }
    s.draft = { kind, cards };
  }
  s.stats.drafts++;
  s.ffx.push({ t: 'draft', s: kind });
}

export function reroll(s: GameState, blueprints: string[]): string | null {
  if (!s.draft) return 'No draft';
  if (s.rerolls <= 0) return 'No rerolls left';
  s.rerolls--;
  const kind = s.draft.kind;
  const keep = s.draft.cards.map(c => c.tech);
  if (kind === 'tech') {
    const pool = rshuffle(s.rng, techPool(s, blueprints).filter(t => !keep.includes(t)));
    const extra = rshuffle(s.rng, techPool(s, blueprints).filter(t => keep.includes(t)));
    const cards = [...pool, ...extra].slice(0, draftSize(s)).map(t => makeCard(s, t));
    s.draft.cards = cards;
  } else {
    const pool = rshuffle(s.rng, Object.keys(BONUS_MODS).filter(m => !s.mods.includes(m) && !keep.includes(m)));
    const back = rshuffle(s.rng, keep);
    s.draft.cards = [...pool, ...back].slice(0, 3).map(m => ({ tech: m, stars: 0, lines: [] }));
  }
  s.ffx.push({ t: 'reroll' });
  return null;
}

export function ban(s: GameState, index: number, blueprints: string[]): string | null {
  if (!s.draft || s.draft.kind !== 'tech') return 'Only technologies can be banned';
  if (s.bans <= 0) return 'No bans left';
  const card = s.draft.cards[index];
  if (!card) return 'No card';
  s.bans--;
  s.banned.push(card.tech);
  const shown = s.draft.cards.map(c => c.tech);
  const pool = techPool(s, blueprints).filter(t => !shown.includes(t));
  if (pool.length) s.draft.cards[index] = makeCard(s, rpick(s.rng, pool));
  else s.draft.cards.splice(index, 1);
  s.ffx.push({ t: 'ban' });
  if (!s.draft.cards.length) s.draft = null;
  return null;
}

export function pick(s: GameState, index: number): string | null {
  if (!s.draft) return 'No draft';
  const c = s.draft.cards[index];
  if (!c) return 'No card';
  if (s.draft.kind === 'tech') {
    s.unlocked[c.tech] = { stars: c.stars, lines: c.lines };
  } else {
    s.mods.push(c.tech);
    if (c.tech === 'plating') { s.core.max += 15; s.core.hp += 15; }
  }
  s.draft = null;
  s.ffx.push({ t: 'pick', s: c.tech });
  return null;
}
