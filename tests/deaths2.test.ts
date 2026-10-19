import { test } from 'vitest';
import { makeContract, newGame } from '../src/core/contract';
import { step } from '../src/core/sim';
import { botAct } from './bot';
test.skipIf(!process.env.D2)('trace deaths seed', () => {
  const c = makeContract(+(process.env.SEED ?? 55), +(process.env.TIER ?? 2), { biomes: ['cave'], blueprints: [], perks: [] });
  const s = newGame(c, { platform: 'mule', core: 'standard', dept: null, startTechs: [], bonuses: [] }, { perks: [], divLevel: 1, blueprints: [] });
  const dt = 1 / 30; let t = 0;
  while (s.phase !== 'over' && s.day < 30 && t < 5000) {
    if (Math.floor(t * 2) !== Math.floor((t + dt) * 2)) botAct(s, {});
    step(s, dt, { blueprints: [] });
    for (const f of s.ffx) if (f.t === 'death') console.log(`day ${s.day} ${s.phase}${s.dusk ? '/dusk' : ''} clock ${s.clock.toFixed(0)} death ${f.s} at ${f.x?.toFixed(1)},${f.y?.toFixed(1)} uen ${s.uenemies.map(u => u.kind).join(',')} hurt-by: ${s.ffx.filter(q => q.t === 'hurt').map(q => q.s).join(',')}`);
    s.ffx.length = 0; t += dt;
  }
});
