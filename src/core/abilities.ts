// Day and night ability buildings: slots, cooldowns, aiming and effects.
import { BUILDINGS } from './data/buildings';
import { damageBlock, explode, cellIdxOfWorker } from './mine';
import { dayRechargeMult, nightRechargeMult, today } from './mods';
import { damageEnemy } from './night';
import type { AbilityState, GameState } from './types';
import { cellCX, cellCY, dist, W, worldCell } from './world';
import { ENEMIES } from './data/enemies';

export const abilityCount = (s: GameState, type: string) => s.buildings.filter(b => b.type === type).length;

function starsOf(s: GameState, type: string) { return s.unlocked[type]?.stars ?? 0; }

export function abilityCooldown(s: GameState, type: string) {
  const d = BUILDINGS[type];
  const n = Math.max(1, abilityCount(s, type));
  let cd = d.cd ?? 30;
  if (type === 'lance') cd -= 10 * (n - 1);
  if (type === 'drone') cd -= 8 * (n - 1);
  cd = Math.max(8, cd);
  const rech = 1 + 0.1 * starsOf(s, type) + (d.cat === 'night' ? nightRechargeMult(s) - 1 : dayRechargeMult(s) - 1);
  return cd / rech;
}

export function dayAbilitiesBlocked(s: GameState) { return today(s, 'eclipse') || today(s, 'polar'); }

export function abilityReady(s: GameState, a: AbilityState): string | null {
  const d = BUILDINGS[a.type];
  if (a.cd > 0) return `Recharging ${Math.ceil(a.cd)} s`;
  if (d.cat === 'day') {
    if (s.phase !== 'day') return 'Daytime only';
    if (dayAbilitiesBlocked(s)) return today(s, 'polar') ? 'Polar night: daytime abilities unavailable' : 'Eclipse: daytime abilities unavailable';
  } else if (s.phase !== 'night') return 'Nighttime only';
  return null;
}

export function tickAbilities(s: GameState, dt: number) {
  for (const a of [...s.abilities.day, ...s.abilities.night]) if (a.cd > 0) a.cd = Math.max(0, a.cd - dt);
  for (let i = s.zones.length - 1; i >= 0; i--) {
    const z = s.zones[i];
    z.t += dt;
    if (z.kind === 'drone' && !z.fired && z.t >= 1.5) {
      z.fired = true;
      explode(s, z.x, z.y, 1.6, 12, 4, 20);
    } else if (z.kind === 'flak' && !z.fired && z.t >= 0.6) {
      z.fired = true;
      for (const e of s.enemies) if (e.hp > 0 && dist(e.x, e.y, z.x, z.y) <= z.r + ENEMIES[e.kind].radius * 0.5) damageEnemy(s, e, z.power, 'exp');
      s.ffx.push({ t: 'blast', x: z.x, y: z.y, a: z.r });
    } else if (z.kind === 'sun') {
      for (const e of s.enemies) if (e.hp > 0 && Math.abs(e.x - z.x) <= 1.2) damageEnemy(s, e, z.power * dt, 'nrg');
    }
    if (z.t >= z.dur) s.zones.splice(i, 1);
  }
}

/** Use an ability at world position (x, y). `turretId` for the Overclocker. */
export function useAbility(s: GameState, type: string, x: number, y: number, turretId = -1): string | null {
  const a = [...s.abilities.day, ...s.abilities.night].find(q => q.type === type);
  if (!a) return 'Not built';
  const why = abilityReady(s, a);
  if (why) return why;
  const n = abilityCount(s, type);
  const eff = 1 + 0.1 * starsOf(s, type);
  switch (type) {
    case 'lance': {
      const c = worldCell(x, y);
      if (c < 0) return 'Aim inside the mine';
      const cx = Math.floor(x);
      for (let dy = -1; dy <= 1; dy++) {
        const cc = worldCell(cx + 0.5, y + dy);
        if (cc >= 0) damageBlock(s, cc, 999, 'lance');
      }
      for (const u of s.uenemies) if (Math.abs(u.x - (cx + 0.5)) < 0.8 && Math.abs(u.y - y) < 2) { u.hp -= 60; u.hurtT = 0.3; }
      s.ffx.push({ t: 'lance', x: cx + 0.5, y });
      break;
    }
    case 'drone':
      if (worldCell(x, y) < 0) return 'Aim inside the mine';
      s.zones.push({ kind: 'drone', x: Math.floor(x) + 0.5, y: Math.floor(y - 2) + 2.5, r: 1.6, t: 0, dur: 1.8, power: 12, target: -1, fired: false });
      s.ffx.push({ t: 'dronedrop', x, y });
      break;
    case 'medic': {
      const heal = (12 + 4 * (n - 1)) * eff;
      for (const w of s.workers) if (w.below && dist(w.x, w.y, x, y) <= 4) { w.hp = Math.min(w.maxHp, w.hp + heal); w.slowT = 5; }
      s.ffx.push({ t: 'heal', x, y, a: 4 });
      break;
    }
    case 'horn':
      s.zones.push({ kind: 'horn', x: 8.5, y: 0, r: 0, t: 0, dur: (20 + 5 * (n - 1)) * eff, power: 0, target: -1, fired: false });
      s.ffx.push({ t: 'horn' });
      break;
    case 'overclock': {
      const t = s.turrets.find(q => q.id === turretId);
      if (!t) return 'Choose a turret';
      t.overclock = 6 * (1 + 0.2 * (n - 1)) * eff;
      s.ffx.push({ t: 'overclock', id: t.id });
      break;
    }
    case 'flakburst':
      s.zones.push({ kind: 'flak', x, y, r: 2.5, t: 0, dur: 0.8, power: (45 + 10 * (n - 1)) * eff, target: -1, fired: false });
      s.ffx.push({ t: 'flakcall', x, y });
      break;
    case 'stasis':
      s.zones.push({ kind: 'stasis', x, y, r: 3.5, t: 0, dur: (6 + (n - 1)) * eff, power: 0, target: -1, fired: false });
      s.ffx.push({ t: 'stasis', x, y });
      break;
    case 'sunlens':
      s.zones.push({ kind: 'sun', x: Math.max(1.5, Math.min(W - 1.5, x)), y, r: 1.2, t: 0, dur: 3 + (n - 1), power: 30 * eff, target: -1, fired: false });
      s.ffx.push({ t: 'sun', x });
      break;
    default: return 'Unknown';
  }
  a.cd = abilityCooldown(s, type);
  return null;
}

export const _a = { cellCX, cellCY, cellIdxOfWorker };
