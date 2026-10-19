// Balance sweep with the heuristic bot (run with BALANCE=1 npx vitest run tests/balance.test.ts).
import { test } from 'vitest';
import { makeContract } from '../src/core/contract';
import type { BiomeId, PlatformId } from '../src/core/types';
import { runContract } from './bot';

const on = !!process.env.BALANCE;
const seeds = +(process.env.SEEDS ?? 4);

test.skipIf(!on)('balance sweep', () => {
  const rows: string[] = [];
  const combos: [number, PlatformId, BiomeId, string[] | undefined, string][] = [];
  const noUp = new Set<string>(['MG raw']);
  for (const tier of (process.env.TIERS ?? '1,2,3,4,5,6').split(',').map(Number)) combos.push([tier, 'mule', 'cave', undefined, '']);
  if (process.env.MGONLY) combos.push([3, 'mule', 'cave', ['mg'], 'MG only'], [3, 'mule', 'cave', ['mg'], 'MG raw'], [4, 'mule', 'cave', ['mg'], 'MG only']);
  if (!process.env.TIERS) {
    for (const p of ['brood', 'stone'] as PlatformId[]) combos.push([2, p, 'cave', undefined, '']);
    for (const b of ['frost', 'jungle'] as BiomeId[]) combos.push([2, 'mule', b, undefined, '']);
    combos.push([3, 'mule', 'cave', ['mg'], 'MG only']);
  }
  for (const [tier, platform, biome, mix, label] of combos) {
    let wins = 0, days = 0, core = 0, mins = 0, kills = 0, lost = 0, bossKills = 0, bossRepel = 0, depthFail = 0, fails = 0;
    for (let i = 0; i < seeds; i++) {
      const c = makeContract(1000 + i * 17 + tier, tier, { biomes: [biome], blueprints: [], perks: [] });
      const { s, t } = runContract(c, { platform, core: 'standard', dept: null, startTechs: [], bonuses: [] }, { turretMix: mix, maxDays: 50, daysPerStratum: +(process.env.DPS ?? 1), noUpgrade: noUp.has(label) });
      if (s.result?.success) wins++; else { fails++; depthFail += s.depth; }
      days += s.day; core += s.result ? s.result.corePct : 0; mins += t / 60; kills += s.stats.kills; lost += s.stats.workersLost;
      bossKills += s.stats.bossKills; bossRepel += s.stats.bossRepels;
    }
    rows.push(`T${tier} ${platform.padEnd(5)} ${biome.padEnd(6)} ${label.padEnd(8)} win ${wins}/${seeds}  days ${(days / seeds).toFixed(1)}  core ${(core / seeds).toFixed(0)}%  time ${(mins / seeds).toFixed(1)} min  kills ${(kills / seeds).toFixed(0)}  lost ${(lost / seeds).toFixed(1)}  boss k/r ${bossKills}/${bossRepel}${fails ? `  fail depth ${(depthFail / fails).toFixed(0)}` : ''}`);
    console.log(rows[rows.length - 1]);
  }
}, 600000);

test.skipIf(!process.env.NIGHTS)('per-night trace', async () => {
  const { newGame } = await import('../src/core/contract');
  const { step } = await import('../src/core/sim');
  const { botAct } = await import('./bot');
  const tier = +(process.env.TIER ?? 2);
  const c = makeContract(+(process.env.SEED ?? 1017), tier, { biomes: [(process.env.BIOME ?? 'cave') as BiomeId], blueprints: [], perks: [] });
  const s = newGame(c, { platform: (process.env.PLAT ?? 'mule') as PlatformId, core: 'standard', dept: null, startTechs: [], bonuses: [] }, { perks: [], divLevel: 1, blueprints: [] });
  const dt = 1 / 30; let t = 0; let nightCore = 0, nightSpawn = 0, lastPhase = '';
  while (s.phase !== 'over' && s.day < 40 && t < 7200) {
    if (Math.floor(t * 2) !== Math.floor((t + dt) * 2)) botAct(s, {});
    if (s.phase === 'night' && lastPhase !== 'night') { nightCore = s.core.hp; nightSpawn = s.waveTotal; }
    if (s.phase !== 'night' && lastPhase === 'night') console.log(`night ${s.day - 1} s${s.stratum} spawned ${nightSpawn} coreLoss ${(nightCore - s.core.hp).toFixed(0)} core ${s.core.hp.toFixed(0)} turrets ${s.turrets.map(q => q.type).join(',')} res ${s.res.iron}/${s.res.crim} workers ${s.workers.length} blds ${s.buildings.map(b => b.type).join(',')}`);
    lastPhase = s.phase;
    step(s, dt, { blueprints: [] }); s.ffx.length = 0; t += dt;
  }
  console.log('end', s.phase, s.result?.success, 'day', s.day, 'depth', s.depth, 'core', s.core.hp.toFixed(0));
}, 600000);
