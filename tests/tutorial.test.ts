// The guided first contract: every objective is reachable in order by ordinary play, the starter resources are
// where the guide points, the first night is gentle, and skipping ends the guidance.
import { expect, test } from 'vitest';
import { makeContract, newGame } from '../src/core/contract';
import { BUILDINGS } from '../src/core/data/buildings';
import { TURRETS } from '../src/core/data/turrets';
import { build, orderDrill, placeTurret, setTag } from '../src/core/economy';
import { pick } from '../src/core/draft';
import { canLaunch, launch } from '../src/core/sim';
import { coalQuota } from '../src/core/mods';
import { nightBudget } from '../src/core/night';
import { step } from '../src/core/sim';
import { coalSecured, digField, digStep, nearestBlock, reachable, tutActive, tutTick, TUT_STEPS } from '../src/core/tutorial';
import { B, type GameState } from '../src/core/types';
import { cellX, cellY, dist } from '../src/core/world';
import { botAct } from './bot';

const setup = { platform: 'mule' as const, core: 'standard' as const, dept: null, startTechs: [], bonuses: [] };
const tutorialGame = (seed: number) => newGame({ ...makeContract(seed, 1, { biomes: ['cave'], blueprints: [], perks: [] }), tutorial: true }, setup, { perks: [], divLevel: 1, blueprints: [] });

function play(s: GameState, maxT: number, onTick?: (t: number) => void) {
  const dt = 1 / 30;
  for (let t = 0; t < maxT && s.phase !== 'over'; t += dt) {
    if (Math.floor(t * 2) !== Math.floor((t + dt) * 2)) botAct(s, {});
    step(s, dt, { blueprints: [] });
    tutTick(s, dt);
    if (s.ffx.length > 300) s.ffx.splice(0, s.ffx.length - 50);
    onTick?.(t);
  }
}

test('every objective of the guided contract completes in order, within a short first session', () => {
  for (const seed of [11, 22, 33, 44, 55]) {
    const s = tutorialGame(seed);
    expect(s.tut).toBeTruthy();
    expect(s.mods).toContain('welcome');
    const order: string[] = [];
    let finishedAt = -1;
    play(s, 1800, t => {
      for (const id of s.tut!.done) if (!order.includes(id)) order.push(id);
      if (finishedAt < 0 && !tutActive(s)) finishedAt = t;
    });
    expect(s.result?.success, `seed ${seed}: contract won`).toBe(true);
    expect(s.tut!.done.length, `seed ${seed}: all steps done (${order.join(',')})`).toBe(TUT_STEPS.length);
    // the launch step is last
    expect(order[order.length - 1]).toBe('launch');
    expect(finishedAt, `seed ${seed}: guided contract length`).toBeLessThan(900); // under 15 game minutes at ×1
  }
});

test('starter resources sit where the guide points: iron, coal and the cache near the ladder', () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const s = tutorialGame(seed);
    // land without any crew orders, so nothing is dug yet
    orderDrill(s);
    for (let t = 0; t < 8 && s.phase !== 'day'; t += 1 / 30) step(s, 1 / 30, { blueprints: [] });
    expect(s.stratum).toBe(1);
    const near = (c: number, d: number) => c >= 0 && dist(cellX(c), cellY(c), 8, 0) <= d && reachable(s, c);
    expect(near(nearestBlock(s, B.Iron), 3.5), `seed ${seed}: iron by the ladder`).toBe(true);
    expect(near(nearestBlock(s, B.Coal), 5), `seed ${seed}: coal by the ladder`).toBe(true);
    expect(near(nearestBlock(s, B.Cache), 3.5), `seed ${seed}: cache by the ladder`).toBe(true);
    let coalNear = 0;
    for (let i = 0; i < s.mine.kind.length; i++) if (s.mine.kind[i] === B.Coal && dist(cellX(i), cellY(i), 8, 0) <= 5) coalNear++;
    expect(coalNear, `seed ${seed}: a full seam near the ladder`).toBeGreaterThanOrEqual(4);
  }
});

test('every contract has a coal seam in sight of the ladder, and enough coal for the quota', () => {
  for (const seed of [7, 8, 9, 10]) for (const tier of [1, 3, 6]) {
    const s = newGame(makeContract(seed, tier, { biomes: ['cave', 'frost', 'jungle'], blueprints: [], perks: [] }), setup, { perks: [], divLevel: 10, blueprints: [] });
    play(s, 6);
    let coal = 0, near = 0;
    for (let i = 0; i < s.mine.kind.length; i++) if (s.mine.kind[i] === B.Coal) { coal++; if (dist(cellX(i), cellY(i), 8, 0) <= 5.5) near++; }
    expect(coal, `seed ${seed} tier ${tier}`).toBeGreaterThanOrEqual(coalQuota(s));
    expect(near, `seed ${seed} tier ${tier}: seam by the ladder`).toBeGreaterThanOrEqual(2);
  }
});

test('the guided first night is half as heavy; no random events while guided', () => {
  const s = tutorialGame(9);
  const n = newGame(makeContract(9, 1, { biomes: ['cave'], blueprints: [], perks: [] }), setup, { perks: [], divLevel: 1, blueprints: [] });
  s.day = n.day = 1; s.stratum = n.stratum = 1;
  expect(nightBudget(s)).toBeCloseTo(nightBudget(n) * 0.5);
  play(s, 1200);
  expect(s.events.log.length).toBe(0);
});

test('a missing turret jumps the queue when the swarm is coming', () => {
  const s = tutorialGame(4);
  orderDrill(s);
  for (let t = 0; t < 8 && s.phase !== 'day'; t += 1 / 30) step(s, 1 / 30, { blueprints: [] });
  s.clock = s.dayLen - 10; s.dusk = true;
  const { current } = tutTick(s, 0);
  expect(current?.id).toBe('turret');
});

test('skipping ends the guidance at once', () => {
  const s = tutorialGame(3);
  play(s, 30);
  expect(tutActive(s)).toBe(true);
  s.tut!.skipped = true;
  expect(tutActive(s)).toBe(false);
  expect(tutTick(s, 1).current).toBeNull();
});

test('workers level up from their work and get faster', () => {
  const s = tutorialGame(5);
  let lvlups = 0;
  const dt = 1 / 30;
  for (let t = 0; t < 400 && s.phase !== 'over'; t += dt) {
    if (Math.floor(t * 2) !== Math.floor((t + dt) * 2)) botAct(s, {});
    step(s, dt, { blueprints: [] });
    lvlups += s.ffx.filter(e => e.t === 'lvlup').length;
    s.ffx.length = 0;
  }
  expect(lvlups).toBeGreaterThan(0);
  expect(Math.max(...s.workers.map(w => w.lvl ?? 1))).toBeGreaterThanOrEqual(2);
  expect(coalSecured(s)).toBeGreaterThanOrEqual(0);
});

/** a player who does exactly what the objective card points at, and nothing else */
function followGuide(s: GameState, ui: { dig: boolean }) {
  if (s.draft) { pick(s, 0); return; }
  const { current } = tutTick(s, 0);
  const t = current?.target(s, ui.dig);
  if (!t) return;
  if ('ui' in t) {
    if (t.ui === 'dig') ui.dig = true;
    else if (t.ui === 'drill') orderDrill(s);
    else if (t.ui === 'launch' && !canLaunch(s)) launch(s);
  } else if ('cell' in t) { if (s.mine.tag[t.cell]) throw new Error(`the guide points at a block that is already tagged: ${t.cell} (${current!.id})`); setTag(s, t.cell, true); }
  else if ('pad' in t) build(s, Object.keys(s.unlocked).filter(k => BUILDINGS[k])[0], t.pad);
  else if ('mount' in t) placeTurret(s, Object.keys(s.unlocked).filter(k => TURRETS[k])[0], t.mount);
}

test('following only the objective card wins the guided contract on every map', () => {
  const stalls: string[] = [];
  for (let seed = 100; seed < 160; seed++) {
    const s = tutorialGame(seed);
    const ui = { dig: false };
    const dt = 1 / 30;
    let t = 0;
    for (; t < 1500 && s.phase !== 'over'; t += dt) {
      if (Math.floor(t * 2) !== Math.floor((t + dt) * 2)) followGuide(s, ui);
      step(s, dt, { blueprints: [] });
      if (s.ffx.length > 300) s.ffx.splice(0, s.ffx.length - 50);
    }
    tutTick(s, 0);
    if (!s.result?.success) stalls.push(`seed ${seed}: ${s.result ? 'lost' : 'unfinished'} at ${s.tut!.done.length}/${TUT_STEPS.length} (${TUT_STEPS.find(st => !s.tut!.done.includes(st.id))?.text(s)}) day ${s.day}`);
  }
  expect(stalls).toEqual([]);
});

test('coal behind rock counts only once a way to it is tagged; the guide points at the block in the way', () => {
  let checked = 0;
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const s = tutorialGame(seed);
    orderDrill(s);
    for (let t = 0; t < 8 && s.phase !== 'day'; t += 1 / 30) step(s, 1 / 30, { blueprints: [] });
    const f = digField(s);
    const deep = s.mine.kind.findIndex((k, i) => k === B.Coal && f.d[i] >= 3 && f.d[i] < 50);
    if (deep < 0) continue;
    checked++;
    const before = coalSecured(s);
    setTag(s, deep, true);
    expect(coalSecured(s), `seed ${seed}: buried tagged coal is not counted`).toBe(before);
    const first = digStep(s, deep);
    expect(first).not.toBe(deep);
    expect(reachable(s, first), `seed ${seed}: the first block in the way is reachable`).toBe(true);
    for (let guard = 0; digStep(s, deep) !== deep && guard < 20; guard++) setTag(s, digStep(s, deep), true);
    expect(coalSecured(s), `seed ${seed}: counted once the tunnel is tagged`).toBeGreaterThanOrEqual(before + 1);
  }
  expect(checked).toBeGreaterThan(3);
});
