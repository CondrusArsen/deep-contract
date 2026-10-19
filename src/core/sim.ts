// The phase machine: landing → (descent) → day → dusk → night → last kill → dawn (descent) … → launch / failure.
import { tickAbilities } from './abilities';
import { enterStratum } from './contract';
import { openDraft } from './draft';
import { tickEconomy } from './economy';
import { rollDay } from './events';
import { tickHazards } from './mine';
import { hasMod, today } from './mods';
import { checkCore, planWaves, scheduleBoss, spawnDrones, spawnEnemy, tickEnemies, tickProjectiles, tickTurrets } from './night';
import { computeResult } from './result';
import type { GameState } from './types';
import { spawnBorer, tickTnt, tickUnder, tickWorkers, winchAboard } from './workers';

export const DESCENT_TIME = 4.2;
export const LAUNCH_TIME = 12;
export const DUSK_TIME = 20;
export const ENRAGE_AFTER = 150;

export interface StepCtx { blueprints: string[] }

export function isPausedByDraft(s: GameState) { return !!s.draft; }

/** Advance the simulation by dt seconds of game time. */
export function step(s: GameState, dt: number, ctx: StepCtx) {
  if (s.phase === 'over') return;
  if (s.draft) return;
  if (s.draftQ.length && (s.phase === 'day' || s.phase === 'night')) {
    openDraft(s, s.draftQ.shift()!, ctx.blueprints);
    if (s.draft) return;
  }
  switch (s.phase) {
    case 'landing':
      tickWorkers(s, dt);
      break;
    case 'descent':
      s.descentT += dt;
      tickWorkers(s, dt);
      if (s.descentT >= DESCENT_TIME) finishDescent(s);
      break;
    case 'day': {
      s.clock += dt;
      if (!s.dusk && s.clock >= s.dayLen - DUSK_TIME) { s.dusk = true; s.ffx.push({ t: 'dusk' }); }
      tickEconomy(s, dt);
      tickWorkers(s, dt);
      tickUnder(s, dt);
      tickHazards(s, dt);
      tickTnt(s, dt);
      tickAbilities(s, dt);
      tickTurrets(s, dt);
      if (today(s, 'borers')) borerSpawns(s, dt, 40, 2);
      if (s.clock >= s.dayLen) startNight(s);
      break;
    }
    case 'night': {
      s.nightT += dt;
      while (s.waves.length && s.waves[0].t <= s.nightT) {
        const w = s.waves.shift()!;
        spawnEnemy(s, w.kind, w.x);
      }
      if (!s.enrage && s.nightT >= ENRAGE_AFTER) { s.enrage = true; s.ffx.push({ t: 'enrage' }); }
      tickEconomy(s, dt);
      tickWorkers(s, dt);
      tickUnder(s, dt);
      tickHazards(s, dt);
      tickTnt(s, dt);
      tickAbilities(s, dt);
      tickTurrets(s, dt);
      tickProjectiles(s, dt);
      tickEnemies(s, dt);
      borerSpawns(s, dt, 22, 3);
      checkCore(s);
      if (s.core.hp <= 0) { fail(s); return; }
      if (!s.waves.length && !s.enemies.length) endNight(s);
      break;
    }
    case 'launch':
      s.descentT += dt;
      if (s.descentT >= LAUNCH_TIME) finish(s, true);
      break;
  }
  if (s.core.hp <= 0 && (s.phase as string) !== 'over') fail(s);
}

function borerSpawns(s: GameState, dt: number, interval: number, max: number) {
  const below = s.workers.some(w => w.below && w.hp > 0 && w.incubate <= 0);
  if (!below) { s.wormT = Math.max(s.wormT, 6); return; }
  s.wormT -= dt;
  if (s.wormT > 0) return;
  const dampers = s.buildings.filter(b => b.type === 'damper');
  const dq = dampers.reduce((a, b) => a + 1 + 0.1 * b.stars, 0);
  const rate = (dampers.length ? 0.5 * Math.pow(0.75, dq - 1) : 1) * (hasMod(s, 'borers') ? 2 : 1);
  s.wormT = interval / rate;
  if (s.uenemies.filter(u => u.kind === 'borer').length < max) spawnBorer(s);
}

function startNight(s: GameState) {
  s.phase = 'night'; s.nightT = 0; s.dusk = false; s.enrage = false; s.wormT = 8;
  planWaves(s);
  spawnDrones(s);
  s.ffx.push({ t: 'nightfall' });
}

function endNight(s: GameState) {
  s.day++;
  s.clock = 0; s.nightT = 0; s.enrage = false;
  s.projectiles = [];
  s.zones = s.zones.filter(z => z.kind === 'horn');
  s.ffx.push({ t: 'dawn', a: s.day });
  if (s.drillQueued) startDescent(s);
  else { s.phase = 'day'; dawn(s); }
}

export function startDescent(s: GameState) {
  s.phase = 'descent'; s.descentT = 0;
  winchAboard(s);
  s.ffx.push({ t: 'descent' });
}

function finishDescent(s: GameState) {
  const first = !s.firstDrillDone;
  s.firstDrillDone = true;
  s.drillQueued = false;
  enterStratum(s);
  scheduleBoss(s);
  s.phase = 'day';
  s.ffx.push({ t: 'arrive', a: s.depth });
  if (first) { s.clock = 0; s.ffx.push({ t: 'save' }); }
  else dawn(s);
}

function dawn(s: GameState) {
  const welders = s.buildings.filter(b => b.type === 'welder');
  if (welders.length) { s.core.hp = Math.min(s.core.max, s.core.hp + welders.reduce((a, b) => a + 3 * (1 + 0.1 * b.stars), 0)); s.ffx.push({ t: 'weld' }); }
  if (!s.contract.tutorial) rollDay(s); // no random events while the player is being guided
  if (s.boss && !s.boss.done && s.boss.night === s.day && !s.boss.warned) { s.boss.warned = true; s.ffx.push({ t: 'bosswarn', s: s.boss.kind }); }
  else if (s.boss && !s.boss.done && s.boss.night === s.day + 1) s.ffx.push({ t: 'bossforecast', s: s.boss.kind });
  s.ffx.push({ t: 'save' });
}

export function canLaunch(s: GameState): string | null {
  if (s.phase !== 'day') return 'Launch is only possible by day';
  if (s.depth < s.contract.targetStrata * 50) return `Reach ${s.contract.targetStrata * 50} m first`;
  if (s.charges < s.contract.charges) return `Core charges ${s.charges}/${s.contract.charges}: dig out a charge vein and haul it home`;
  if (s.draft) return 'Finish the draft first';
  return null;
}

export function launch(s: GameState): string | null {
  const why = canLaunch(s);
  if (why) return why;
  s.phase = 'launch'; s.descentT = 0;
  winchAboard(s);
  s.enemies = []; s.projectiles = [];
  s.ffx.push({ t: 'launch' });
  return null;
}

export function fail(s: GameState) {
  s.core.hp = Math.max(0, s.core.hp);
  finish(s, false);
}

export function abort(s: GameState) { finish(s, false); }

function finish(s: GameState, success: boolean) {
  s.phase = 'over';
  s.result = computeResult(s, success);
  s.ffx.push({ t: success ? 'victory' : 'defeat' });
}

export { spawnEnemy };
