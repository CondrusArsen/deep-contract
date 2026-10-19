import { test, expect } from 'vitest';
import { makeContract } from '../src/core/contract';
import { runContract } from './bot';

test('bot plays a tier-1 and tier-2 contract to an end', () => {
  for (const tier of [1, 2]) {
    const c = makeContract(1234 + tier, tier, { biomes: ['cave'], blueprints: [], perks: [] });
    const { s, t } = runContract(c, { platform: 'mule', core: 'standard', dept: null, startTechs: [], bonuses: [] }, { log: true });
    console.log('tier', tier, 'phase', s.phase, 'result', JSON.stringify(s.result), 'time', (t / 60).toFixed(1), 'min');
    expect(s.day).toBeGreaterThan(1);
  }
});
