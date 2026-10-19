// Acceptance cases AC-01 … AC-23 from the teardown's Build layer, exercised through the same actions as the UI.
import { describe, expect, test } from 'vitest';
import { makeContract, newGame } from '../src/core/contract';
import { build, buildingCost, canResearch, orderDrill, placeTurret, recruit, research, sellTurret, setTag, turretCost, workforceCap, deliver } from '../src/core/economy';
import { ban, openDraft, pick, reroll } from '../src/core/draft';
import { rollDay } from '../src/core/events';
import { tickHazards, generateMine, refreshField } from '../src/core/mine';
import { turretStats, spawnEnemy } from '../src/core/night';
import { buy, canBuy, newProfile, applyResult } from '../src/core/profile';
import { canLaunch, launch, step, fail } from '../src/core/sim';
import { B, type GameState, type Setup } from '../src/core/types';
import { workforceUsed, makeWorker } from '../src/core/workers';
import { ENTRY, W, cellIdx } from '../src/core/world';
import { abilityReady } from '../src/core/abilities';
import { TIERS } from '../src/core/data/contracts';
import { blockWiki, enemyWiki, techStats } from '../src/ui/text';
import { BLOCKS } from '../src/core/data/blocks';
import { ENEMIES } from '../src/core/data/enemies';
import { TURRETS } from '../src/core/data/turrets';

const MULE: Setup = { platform: 'mule', core: 'standard', dept: null, startTechs: [], bonuses: [] };
const ctx = { biomes: ['cave' as const], blueprints: [], perks: [] };
function fresh(tier = 2, setup: Setup = MULE, seed = 777): GameState {
  return newGame(makeContract(seed, tier, ctx), setup, { perks: [], divLevel: 1, blueprints: [] });
}
function run(s: GameState, seconds: number, until?: (s: GameState) => boolean) {
  const dt = 1 / 30;
  for (let t = 0; t < seconds; t += dt) {
    step(s, dt, { blueprints: [] });
    s.ffx.length = 0;
    if (s.draft) pick(s, 0);
    if (until && until(s)) return true;
  }
  return false;
}
function land(s: GameState) { expect(orderDrill(s)).toBeNull(); run(s, 6, q => q.phase === 'day'); }
const freePad = (s: GameState) => s.pads.find(p => p.open && p.building < 0)!.id;

describe('Deep Contract acceptance cases', () => {
  test('AC-01 opening: hold drill at 0 m descends to 50 m on day 1, coal spent, pads visible', () => {
    const s = fresh();
    expect(s.depth).toBe(0); expect(s.day).toBe(1); expect(s.res.coal).toBe(6);
    expect(orderDrill(s)).toBeNull();
    expect(s.res.coal).toBe(0);
    run(s, 6, q => q.phase === 'day');
    expect(s.depth).toBe(50); expect(s.day).toBe(1);
    expect(s.pads.filter(p => p.storey === 0 && p.open).length).toBe(6);
  });

  test('AC-02 first two buildings free, third at list price', () => {
    const s = fresh(); land(s);
    s.res.iron = 20;
    expect(build(s, 'barracks', freePad(s))).toBeNull();
    expect(build(s, 'lab', freePad(s))).toBeNull();
    expect(s.buildings.map(b => b.spent.iron)).toEqual([0, 0]);
    const before = s.res.iron;
    expect(buildingCost(s, 'factory').iron).toBe(4);
    expect(build(s, 'factory', freePad(s))).toBeNull();
    expect(before - s.res.iron).toBe(4);
  });

  test('AC-03 barracks raises the cap 4 → 7 and speeds hiring', () => {
    const s = fresh(); land(s);
    expect(workforceCap(s)).toBe(4);
    build(s, 'barracks', freePad(s));
    expect(workforceCap(s)).toBe(7);
    s.res.iron = 30; s.res.crim = 5;
    recruit(s, 'hauler');
    const t0 = s.recruitQ[0].t;
    run(s, 2);
    const slow = t0 - s.recruitQ[0]?.t;
    build(s, 'barracks', freePad(s));
    const t1 = s.recruitQ[0]?.t ?? 0;
    run(s, 2);
    const fast = t1 - (s.recruitQ[0]?.t ?? 0);
    expect(workforceCap(s)).toBe(10);
    expect(fast).toBeGreaterThan(slow * 1.3);
  });

  test('AC-04 tag and haul: iron counter rises only on delivery', () => {
    const s = fresh(); land(s);
    // make a known iron block next to the landing
    const target = cellIdx(8, 1) === ENTRY + W ? ENTRY + W : ENTRY + W;
    s.mine.kind[target] = B.Empty; refreshField(s);
    const iron = target + W;
    s.mine.kind[iron] = B.Iron; s.mine.hp[iron] = 6; s.mine.maxHp[iron] = 6;
    for (let i = 0; i < s.mine.tag.length; i++) s.mine.tag[i] = 0;
    s.items = [];
    expect(setTag(s, iron, true)).toBeNull();
    const start = s.res.iron;
    let sawItem = false;
    const ok = run(s, 60, q => { if (q.items.some(it => it.kind === 'iron')) { sawItem = true; expect(q.res.iron).toBe(start); } return q.res.iron > start; });
    expect(sawItem).toBe(true);
    expect(ok).toBe(true);
  });

  test('AC-05 dusk: crew heads home; a worker with no path is marked and hunted at night', () => {
    const s = fresh(); land(s);
    // strand one worker in a sealed pocket
    const w = s.workers.find(q => q.cls === 'miner')!;
    const pocket = cellIdx(3, 12);
    for (const d of [0, -1, 1, -W, W]) { s.mine.kind[pocket + d] = d === 0 ? B.Empty : B.Hard; }
    refreshField(s);
    w.below = true; w.x = 3.5; w.y = 2 + 12 + 0.5; w.route = []; w.path = []; w.goal = '';
    s.clock = s.dayLen - 21;
    run(s, 2);
    expect(s.dusk).toBe(true);
    run(s, 3);
    expect(w.stranded).toBe(true);
    const others = s.workers.filter(q => q !== w && q.below);
    expect(others.every(q => q.goal === 'ascend' || q.goal === 'stuck')).toBe(true);
    run(s, 25, q => q.phase === 'night' && q.uenemies.some(u => u.kind === 'borer'));
    expect(s.uenemies.some(u => u.kind === 'borer')).toBe(true);
  });

  test('AC-06 night ends within ~1 s of the last kill', () => {
    const s = fresh(); land(s);
    s.clock = s.dayLen - 0.01;
    run(s, 0.1);
    expect(s.phase).toBe('night');
    s.waves = [];
    for (const e of s.enemies) e.hp = 0;
    const e = spawnEnemy(s, 'skitter', 8, -10);
    run(s, 0.1);
    e.hp = 0.1; e.hp -= 1;
    const t0 = s.day;
    run(s, 1.0, q => q.day > t0);
    expect(s.day).toBe(t0 + 1);
  });

  test('AC-07 first two turrets free; third MG costs 3 iron 1 crimsite (Turret Price −1, floor 1)', () => {
    const s = fresh(); land(s);
    s.res.iron = 10; s.res.crim = 3;
    const mounts = s.mounts.map(m => m.id);
    expect(placeTurret(s, 'mg', mounts[0])).toBeNull();
    expect(placeTurret(s, 'mg', mounts[1])).toBeNull();
    expect(turretCost(s, 'mg')).toEqual({ iron: 3, crim: 1, larva: 0 });
    expect(placeTurret(s, 'mg', mounts[2])).toBeNull();
    expect(s.res.iron).toBe(7); expect(s.res.crim).toBe(2);
    s.mods.push('tprice');
    expect(turretCost(s, 'mg').iron).toBe(2);
  });

  test('AC-08 selling a 5/1 turret returns +5 iron +1 crimsite and charges the 1-iron fee', () => {
    const s = fresh(); land(s);
    s.freeTurrets = 0; s.unlocked.auto = { stars: 0, lines: [] };
    s.res.iron = 10; s.res.crim = 2;
    placeTurret(s, 'auto', s.mounts[0].id);
    expect(s.res.iron).toBe(5); expect(s.res.crim).toBe(1);
    const t = s.turrets[0];
    expect(sellTurret(s, t.id)).toBeNull();
    expect(s.res.iron).toBe(9); expect(s.res.crim).toBe(2);
    expect(s.mounts[0].turret).toBe(-1);
  });

  test('AC-09 a sixth identical turret is refused with a reason', () => {
    const s = fresh(); land(s);
    s.res.iron = 99; s.res.crim = 99;
    for (let i = 0; i < 5; i++) expect(placeTurret(s, 'mg', s.mounts[i].id)).toBeNull();
    expect(placeTurret(s, 'mg', s.mounts[5].id)).toMatch(/5 identical/);
  });

  test('AC-10 coal gate: order at night spends coal now, descends at dawn with SAVING, counter resets', () => {
    const s = fresh(); land(s);
    s.clock = s.dayLen - 0.01; run(s, 0.1);
    expect(s.phase).toBe('night');
    s.res.coal = 6;
    expect(orderDrill(s)).toBeNull();
    expect(s.res.coal).toBe(0); expect(s.drillQueued).toBe(true);
    s.waves = []; s.enemies = [];
    const saves: string[] = [];
    const dt = 1 / 30;
    for (let t = 0; t < 8 && s.depth === 50; t += dt) { step(s, dt, { blueprints: [] }); for (const f of s.ffx) saves.push(f.t); s.ffx.length = 0; }
    expect(s.depth).toBe(100);
    expect(saves).toContain('descent');
    expect(saves).toContain('save');
    expect(s.drillQueued).toBe(false);
  });

  test('AC-11 hatch cracks only near workers through connected rock; jets shake before firing', () => {
    const s = fresh(2, MULE, 4242); land(s);
    // build a controlled hatch in solid rock
    for (let i = 0; i < s.mine.kind.length; i++) if (s.mine.kind[i] !== B.Bedrock) s.mine.kind[i] = B.Rock;
    const h = cellIdx(8, 8);
    s.mine.kind[h] = B.Hatch; s.mine.fx = { [h]: { jetT: 0.01 } };
    s.workers.forEach(w => { w.below = false; });
    tickHazards(s, 0.05);
    expect(Object.values(s.mine.fx).some(f => f.crack !== undefined)).toBe(false); // nobody near
    const w = s.workers[0]; w.below = true; w.x = 8.5; w.y = 2 + 3 + 0.5; // 5 blocks above
    s.mine.fx[h].jetT = 0.01;
    tickHazards(s, 0.05);
    expect(Object.values(s.mine.fx).some(f => f.crack !== undefined)).toBe(true);
    // disconnected block within 4 cannot crack
    const s2 = fresh(2, MULE, 4243); land(s2);
    for (let i = 0; i < s2.mine.kind.length; i++) if (s2.mine.kind[i] !== B.Bedrock) s2.mine.kind[i] = B.Empty;
    const h2 = cellIdx(8, 8); s2.mine.kind[h2] = B.Hatch; s2.mine.fx = { [h2]: { jetT: 0.01 } };
    s2.mine.kind[cellIdx(10, 8)] = B.Rock; // isolated by open cell (9,8)
    const w2 = s2.workers[0]; w2.below = true; w2.x = 8.5; w2.y = 2 + 6 + 0.5;
    tickHazards(s2, 0.05);
    expect(s2.mine.fx[cellIdx(10, 8)]?.crack).toBeUndefined();
    // jets: telegraph window (jetT < 1.5 → shaking) always precedes a firing
    const s3 = fresh(); land(s3);
    const j = cellIdx(5, 5); s3.mine.kind[j] = B.Jet; s3.mine.fx = { [j]: { jetDir: 0, jetT: 3 } };
    let shook = false, fired = false;
    for (let t = 0; t < 4 && !fired; t += 0.05) { if ((s3.mine.fx[j].jetT ?? 9) < 1.5) shook = true; tickHazards(s3, 0.05); fired = s3.ffx.some(f => f.t === 'jet'); if (fired) expect(shook).toBe(true); }
    expect(fired).toBe(true);
  });

  test('AC-12 eclipse is forecast, disables day abilities next day, never twice within 5 days; low tiers roll fewer bad events', () => {
    const s = fresh(2); land(s);
    s.unlocked.lance = { stars: 0, lines: [] };
    build(s, 'lance', freePad(s));
    let forecastDay = -1, eclipseDay = -1;
    const eclipses: number[] = [];
    for (let d = 2; d < 80; d++) {
      s.day = d; rollDay(s);
      if (s.events.tomorrow === 'eclipse' && forecastDay < 0) forecastDay = d;
      if (s.events.today === 'eclipse') { eclipses.push(d); if (eclipseDay < 0) eclipseDay = d; }
    }
    expect(forecastDay).toBeGreaterThan(0);
    expect(eclipseDay).toBe(forecastDay + 1);
    for (let i = 1; i < eclipses.length; i++) expect(eclipses[i] - eclipses[i - 1]).toBeGreaterThanOrEqual(5);
    s.events.today = 'eclipse'; s.phase = 'day';
    expect(abilityReady(s, s.abilities.day[0])).toMatch(/Eclipse/);
    // bad-event share: tier 2 vs tier 6 over many rolls
    const share = (tier: number) => { const q = fresh(tier, MULE, 91 + tier); let bad = 0, all = 0; for (let d = 3; d < 800; d++) { q.day = d; q.events.tomorrow = null; q.events.lastEclipse = d; rollDay(q); if (q.events.today) { all++; if (['borers', 'surge', 'eclipse', 'polar', 'blizzard', 'bloom', 'overgrowth'].includes(q.events.today)) bad++; } } return bad / all; };
    expect(share(2)).toBeLessThan(share(6));
  });

  test('AC-13 readability: every block, enemy and card has numbers/text before purchase', () => {
    for (const k of Object.keys(BLOCKS)) expect(blockWiki(+k)?.text.length).toBeGreaterThan(10);
    for (const k of Object.keys(ENEMIES)) expect(enemyWiki(k)?.text.length).toBeGreaterThan(10);
    for (const k of Object.keys(TURRETS)) expect(techStats(k).length).toBeGreaterThanOrEqual(2);
  });

  test('AC-14 save after a descent and continue: identical future', () => {
    const s = fresh(); land(s);
    run(s, 20);
    const a = JSON.parse(JSON.stringify(s)) as GameState;
    const b = JSON.parse(JSON.stringify(s)) as GameState;
    a.ffx = []; b.ffx = [];
    run(a, 40); run(b, 40);
    expect(JSON.stringify({ ...a, ffx: [] })).toBe(JSON.stringify({ ...b, ffx: [] }));
  });

  test('AC-15 draft: reroll −1, banned card never returns, pick unlocks with its star bonus', () => {
    const s = fresh(); land(s);
    openDraft(s, 'tech', []);
    expect(s.draft!.cards.length).toBeGreaterThanOrEqual(2);
    const r0 = s.rerolls;
    expect(reroll(s, [])).toBeNull();
    expect(s.rerolls).toBe(r0 - 1);
    const banned = s.draft!.cards[0].tech;
    expect(ban(s, 0, [])).toBeNull();
    for (let i = 0; i < 30; i++) { openDraft(s, 'tech', []); expect(s.draft!.cards.map(c => c.tech)).not.toContain(banned); s.draft = null; }
    // force a turret card with 2 stars and a range line
    s.draft = { kind: 'tech', cards: [{ tech: 'rail', stars: 2, lines: ['range'] }] };
    pick(s, 0);
    expect(s.unlocked.rail.stars).toBe(2);
    s.res.iron = 20; s.res.crim = 20; s.res.larva = 5;
    placeTurret(s, 'rail', s.mounts[0].id);
    const st = turretStats(s, s.turrets[0]);
    expect(st.range).toBeCloseTo(21.1 * 1.4 * (1 + 0.12), 1); // ★★ +40% range (verified card) and the MULE Turret Radius trait
  });

  test('AC-16 lab tiers gated by lab count; tier 2 costs 8 iron 1 crimsite', () => {
    const s = fresh(); land(s);
    build(s, 'lab', freePad(s));
    s.res.iron = 50; s.res.crim = 5;
    expect(research(s, 'jaw')).toBeNull();
    expect(canResearch(s, 'jaw')).toBe('Build more laboratories');
    build(s, 'lab', freePad(s));
    const i0 = s.res.iron, c0 = s.res.crim;
    expect(research(s, 'jaw')).toBeNull();
    expect([i0 - s.res.iron, c0 - s.res.crim]).toEqual([8, 1]);
  });

  test('AC-17 boss is warned, descends with escorts and withdraws; night ends after the escorts die', () => {
    const s = fresh(2, MULE, 55); land(s);
    // jump to the boss stratum (target − 1 = 2) through the real descent
    s.res.coal = 6; orderDrill(s); s.clock = s.dayLen - 0.01;
    run(s, 0.1); s.waves = []; s.enemies = [];
    const evs: string[] = [];
    const dt = 1 / 30;
    for (let t = 0; t < 10 && s.stratum < 2; t += dt) { step(s, dt, { blueprints: [] }); s.ffx.length = 0; }
    expect(s.stratum).toBe(2);
    expect(s.boss?.night).toBe(s.day + 1);
    // next day: warning banner event
    s.clock = s.dayLen - 0.01; run(s, 0.1); s.waves = []; s.enemies = [];
    for (let t = 0; t < 5 && s.phase !== 'day'; t += dt) { step(s, dt, { blueprints: [] }); for (const f of s.ffx) evs.push(f.t); s.ffx.length = 0; }
    expect(evs).toContain('bosswarn');
    s.clock = s.dayLen - 0.01;
    for (let t = 0; t < 0.2; t += dt) { step(s, dt, { blueprints: [] }); for (const f of s.ffx) evs.push(f.t); s.ffx.length = 0; }
    expect(evs).toContain('bossarrive');
    // let it spawn, then damage it past the withdraw threshold
    for (let t = 0; t < 15 && !s.enemies.some(e => e.boss); t += dt) { step(s, dt, { blueprints: [] }); s.ffx.length = 0; }
    const boss = s.enemies.find(e => e.boss)!;
    expect(boss).toBeTruthy();
    boss.hp = boss.maxHp * 0.45;
    boss.y = -8; // mid-shaft, so the climb takes a while
    for (let t = 0; t < 1; t += dt) { step(s, dt, { blueprints: [] }); s.ffx.length = 0; }
    expect(boss.state).toBe('withdraw');
    expect(s.boss!.withdrew).toBe(true);
    // kill everything else; the night ends only when the escorts are dead and the boss has left
    const day = s.day;
    for (let t = 0; t < 60 && s.day === day; t += dt) { s.waves = []; for (const e of s.enemies) if (!e.boss) e.hp = 0; step(s, dt, { blueprints: [] }); s.ffx.length = 0; }
    expect(s.day).toBe(day + 1);
  });

  test('AC-18 launch needs target depth + charge; result XP lines sum; deeper/longer pays more', () => {
    const mk = (extraStrata: number, extraDays: number) => {
      const s = fresh(2, MULE, 9); land(s);
      s.stratum = 3 + extraStrata; s.depth = s.stratum * 50; s.day = 12 + extraDays;
      expect(canLaunch(s)).toMatch(/charges/i);
      deliver(s, 'charge');
      expect(canLaunch(s)).toBeNull();
      expect(launch(s)).toBeNull();
      run(s, 13, q => q.phase === 'over');
      return s.result!;
    };
    const a = mk(0, 0), b = mk(3, 18);
    expect(a.success).toBe(true);
    expect(a.xpLines.reduce((x, l) => x + l.xp, 0)).toBe(a.xp);
    expect(b.xp).toBeGreaterThan(a.xp * 1.5);
    const s0 = fresh(); land(s0);
    expect(canLaunch(s0)).toMatch(/Reach/);
  });

  test('AC-19 a 10-worker qualification with 9 workers is unmet', () => {
    const s = fresh(2, MULE, 3); land(s);
    s.contract.quals = [{ id: 'workers', n: 10, text: 'Have at least 10 workers at the end of the contract', blueprint: 'tesla' }];
    while (s.workers.length < 9) s.workers.push(makeWorker(s, 'miner'));
    s.stratum = 3; s.depth = 150; deliver(s, 'charge'); launch(s); run(s, 13, q => q.phase === 'over');
    expect(s.result!.quals[0].met).toBe(false);
    const p = newProfile();
    applyResult(p, s, s.result!);
    expect(p.blueprints).not.toContain('tesla');
  });

  test('AC-20 a 30/15/7 node with 200/74/2 minerals is refused', () => {
    const p = newProfile();
    p.minerals = { ochre: 200, jade: 74, void: 2 };
    p.xp = 99999; p.owned = ['o1', 'o3'];
    expect(canBuy(p, 'o5')).toBe('Not enough minerals');
    expect(buy(p, 'o5')).toBe('Not enough minerals');
    expect(p.minerals).toEqual({ ochre: 200, jade: 74, void: 2 });
  });

  test('AC-21 BROOD: two Chewers use 1.0 workforce (0.5 each)', () => {
    const s = fresh(2, { platform: 'brood', core: 'standard', dept: null, startTechs: [], bonuses: [] }); land(s);
    build(s, 'hatchery', freePad(s));
    const before = workforceUsed(s);
    s.res.iron = 10; s.res.larva = 3;
    expect(recruit(s, 'miner')).toBeNull();
    expect(recruit(s, 'miner')).toBeNull();
    expect(workforceUsed(s) - before).toBeCloseTo(1.0, 5);
  });

  test('AC-23 defeat: core 0 → contract failed, reduced payout, never more than success at equal depth', () => {
    const s = fresh(2, MULE, 12); land(s);
    s.retrieved = { ochre: 10, jade: 8, void: 2 };
    s.stratum = 3; s.depth = 150; s.day = 12;
    const w = JSON.parse(JSON.stringify(s)) as GameState;
    s.core.hp = 0; fail(s);
    expect(s.phase).toBe('over');
    expect(s.result!.success).toBe(false);
    expect(s.result!.retrieved).toEqual({ ochre: 5, jade: 4, void: 1 });
    expect(s.result!.reward).toEqual({ ochre: 0, jade: 0, void: 0 });
    deliver(w, 'charge'); launch(w); run(w, 13, q => q.phase === 'over');
    expect(w.result!.xp).toBeGreaterThan(s.result!.xp);
    expect(TIERS[1].strata).toBe(3);
  });

  test('mine generation always offers the coal quota and connects the landing', () => {
    for (let seed = 1; seed < 40; seed++) {
      const s = fresh(1 + (seed % 8), MULE, seed); land(s);
      const coal = s.mine.kind.filter(k => k === B.Coal).length;
      expect(coal).toBeGreaterThanOrEqual(6);
      expect(s.mine.kind[ENTRY]).toBe(B.Empty);
      s.stratum = s.contract.targetStrata; s.mine = generateMine(s);
      expect(s.mine.kind.filter(k => k === B.Charge).length).toBeGreaterThanOrEqual(s.contract.charges);
    }
  });
});
