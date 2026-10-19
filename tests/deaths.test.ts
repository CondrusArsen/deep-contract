import { test } from 'vitest';
import { makeContract, newGame } from '../src/core/contract';
import { step } from '../src/core/sim';
import { botAct } from './bot';
test.skipIf(!process.env.DEATHS)('death causes', () => {
  const causes: Record<string, number> = {}; const when: Record<string, number> = {};
  for (let seed = 1000; seed < 1000 + +(process.env.N ?? 12); seed++) {
    const c = makeContract(seed * 7, +(process.env.TIER ?? 2), { biomes: [(process.env.BIOME ?? 'cave') as 'cave'], blueprints: [], perks: [] });
    const s = newGame(c, { platform: 'mule', core: 'standard', dept: null, startTechs: [], bonuses: [] }, { perks: [], divLevel: 1, blueprints: [] });
    const dt = 1 / 30; let t = 0; const lastHurt = new Map<number, string>();
    while (s.phase !== 'over' && s.day < 30 && t < 5000) {
      if (Math.floor(t * 2) !== Math.floor((t + dt) * 2)) botAct(s, {});
      const alive = new Set(s.workers.map(w => w.id));
      step(s, dt, { blueprints: [] });
      for (const f of s.ffx) if (f.t === 'hurt') { const w = s.workers.find(q => Math.abs(q.x - (f.x ?? 0)) < 0.01 && Math.abs(q.y - (f.y ?? 0)) < 0.01); lastHurt.set(w ? w.id : -1, f.s ?? '?'); if (!w) { causes['?' + f.s] = (causes['?' + f.s] ?? 0); } }
      for (const f of s.ffx) if (f.t === 'death') { const k = `${f.s}`; }
      for (const id of alive) if (!s.workers.some(w => w.id === id)) { const c2 = lastHurt.get(id) ?? 'unknown'; causes[c2] = (causes[c2] ?? 0) + 1; const ph = s.phase + (s.dusk ? '-dusk' : ''); when[ph] = (when[ph] ?? 0) + 1; }
      s.ffx.length = 0; t += dt;
    }
  }
  console.log('causes', JSON.stringify(causes), 'phase', JSON.stringify(when));
}, 600000);
