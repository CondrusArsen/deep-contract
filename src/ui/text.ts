// Names, descriptions and numeric stat lines for cards, sheets and the in-game wiki.
import { BUILDINGS } from '../core/data/buildings';
import { ENEMIES, UENEMIES } from '../core/data/enemies';
import { BONUS_MODS, MALUS_MODS, EVENTS, LAB_ROWS } from '../core/data/techs';
import { FOCUS_LABEL, LINE_TEXT, TURRETS } from '../core/data/turrets';
import { BLOCKS } from '../core/data/blocks';
import { abilityCooldown } from '../core/abilities';
import type { GameState } from '../core/types';

export const FAMILY_NAME: Record<string, string> = { kin: 'Machine-gun', exp: 'Explosive', nrg: 'Energy' };
export const DT_NAME: Record<string, string> = { kin: 'kinetic', exp: 'explosive', nrg: 'energy' };

export function techName(id: string) { return TURRETS[id]?.name ?? BUILDINGS[id]?.name ?? BONUS_MODS[id]?.name ?? MALUS_MODS[id]?.name ?? id; }
export function techKind(id: string) {
  if (TURRETS[id]) return `${FAMILY_NAME[TURRETS[id].family]} turret`;
  const b = BUILDINGS[id];
  if (!b) return BONUS_MODS[id] ? 'Bonus technology' : '';
  return b.cat === 'day' ? 'Day ability building' : b.cat === 'night' ? 'Night ability building' : b.cat === 'util' ? 'Utility building' : 'General building';
}
export function techDesc(id: string) { return TURRETS[id]?.desc ?? BUILDINGS[id]?.desc ?? BONUS_MODS[id]?.text ?? MALUS_MODS[id]?.text ?? ''; }

const LINE_PER: Record<string, number> = { dmg: 10, rate: 8, range: 20, splash: 12, dur: 15, recharge: 10, effect: 10 };
const EFFECT_TEXT: Record<string, string> = { factory: 'Production speed', lab: 'Research iron cost −', kinamp: 'Amplifier bonus', expamp: 'Amplifier bonus', nrgcap: 'Amplifier bonus', welder: 'Repair', damper: 'Damping' };
export function qualityLine(line: string, stars: number, tech?: string) {
  if (!line || !stars) return '';
  if (line === 'effect' && tech && EFFECT_TEXT[tech]) return tech === 'lab' ? `Research iron cost −${10 * stars}%` : `${EFFECT_TEXT[tech]} +${10 * stars}%`;
  const base = LINE_TEXT[line] ?? line;
  const name = base.replace(/\s*[+−-]\d+%$/, '');
  return `${name} +${LINE_PER[line] * stars}%`;
}

/** Numeric stat rows for a technology card (before purchase). */
export function techStats(id: string, s?: GameState): [string, string][] {
  const t = TURRETS[id];
  if (t) {
    const rows: [string, string][] = [];
    if (t.proj === 'wall') rows.push(['Beam damage', `${Math.round(t.dmg * t.rate)}/s across the shaft`]);
    else if (t.proj === 'flame' || (t.proj === 'beam' && id === 'cryo')) rows.push(['Damage', `${Math.round(t.dmg * t.rate * 10) / 10}/s (continuous)`]);
    else if (t.proj === 'drone') rows.push(['Drones', `2 per nightfall, ${t.dmg} per bite`]);
    else { rows.push(['Shooting speed (shots/s)', String(t.rate)]); rows.push(['Damage', t.pellets ? `${t.pellets} × ${t.dmg}` : String(t.dmg)]); }
    if (t.splash) rows.push(['Blast radius (blocks)', String(t.splash)]);
    if (id === 'laser') rows.push(['Damage multiplier below 50% HP', '×3']);
    if (id === 'auto') rows.push(['Damage multiplier above 60% HP', '×2.5']);
    if (t.pierce) rows.push(['Pierces', 'every enemy in the path']);
    rows.push(['Attack radius (blocks)', String(t.range)]);
    rows.push(['Damage type', DT_NAME[t.dt]]);
    return rows;
  }
  const b = BUILDINGS[id];
  if (b) {
    const rows: [string, string][] = [];
    if (b.cd) rows.push(['Cooldown', `${s ? Math.round(abilityCooldown(s, id)) : b.cd} s`]);
    if (b.stack) rows.push(['Stacking', b.stack]);
    return rows;
  }
  return [];
}

/** Short stat rows for draft cards: the same facts as techStats with labels that fit a narrow card. */
export function techStatsShort(id: string, s?: GameState): [string, string][] {
  const t = TURRETS[id];
  if (t) {
    const rows: [string, string][] = [];
    if (t.proj === 'wall') rows.push(['Beam', `${Math.round(t.dmg * t.rate)}/s`]);
    else if (t.proj === 'flame' || (t.proj === 'beam' && id === 'cryo')) rows.push(['Damage', `${Math.round(t.dmg * t.rate * 10) / 10}/s`]);
    else if (t.proj === 'drone') rows.push(['Drones', `2 × ${t.dmg}`]);
    else { rows.push(['Rate', `${t.rate}/s`]); rows.push(['Damage', t.pellets ? `${t.pellets} × ${t.dmg}` : String(t.dmg)]); }
    if (t.splash) rows.push(['Blast', `${t.splash} bl`]);
    if (id === 'laser') rows.push(['Below 50% HP', '×3']);
    if (id === 'auto') rows.push(['Above 60% HP', '×2.5']);
    if (t.pierce) rows.push(['Pierce', 'all']);
    rows.push(['Range', `${t.range} bl`]);
    rows.push(['Type', DT_NAME[t.dt]]);
    return rows;
  }
  const b = BUILDINGS[id];
  if (b?.cd) return [['Cooldown', `${s ? Math.round(abilityCooldown(s, id)) : b.cd} s`]];
  return [];
}
/** Card description without the category prefix the card header already shows. */
export const techDescShort = (id: string) => techDesc(id).replace(/^Active (day|night)time ability\.\s*/, '');

export const FOCUS = FOCUS_LABEL;

export function blockWiki(kind: number) { const d = BLOCKS[kind]; return d ? { name: d.name, text: d.wiki, hp: d.hp } : null; }
export function enemyWiki(kind: string) { const d = ENEMIES[kind]; return d ? { name: d.name, text: d.wiki, hp: d.hp, speed: d.speed, core: d.core } : null; }
export function uenemyWiki(kind: string) { const d = UENEMIES[kind]; return d ? { name: d.name, text: d.wiki, hp: d.hp, bite: d.bite } : null; }
export const eventDef = (id: string) => EVENTS[id];
export const labRows = LAB_ROWS;
