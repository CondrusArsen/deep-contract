// Daily planet events: rolled at dawn; eclipse/polar night are forecast a day ahead (at most once per 5 days).
import { EVENTS } from './data/techs';
import { rchance, rweighted } from './rng';
import { supplyDrop } from './economy';
import type { GameState } from './types';

export function rollDay(s: GameState) {
  const r = s.rng;
  const tier = s.contract.tier;
  s.events.today = null;
  if (s.events.tomorrow) {
    s.events.today = s.events.tomorrow;
    s.events.tomorrow = null;
    s.events.lastEclipse = s.day;
  } else if (s.day >= 3 && rchance(r, 0.4)) {
    const pool = Object.values(EVENTS).filter(e => !e.forecast && (!e.biome || e.biome === s.contract.biome));
    const ev = rweighted(r, pool, e => (e.bad ? (tier <= 3 ? 0.5 : 1) : 1) * (e.biome ? 1.3 : 1));
    if (ev) s.events.today = ev.id;
  }
  if (s.events.today) {
    s.events.log.push({ id: s.events.today, day: s.day });
    s.ffx.push({ t: 'event', s: s.events.today });
    if (s.events.today === 'supply') supplyDrop(s);
    if (s.events.today === 'monsoon') {
      // puddles appear in a few open cells
      let n = 0;
      for (let i = 0; i < s.mine.kind.length && n < 6; i++) if (s.mine.kind[i] === 0 && rchance(r, 0.15)) { s.mine.fx[i] = { ...(s.mine.fx[i] ?? {}), puddle: 1 }; n++; }
    }
  }
  // forecast for tomorrow
  const bossTomorrow = s.boss && !s.boss.done && s.boss.night === s.day + 1;
  if (!s.events.tomorrow && !bossTomorrow && s.day >= 2 && s.day - s.events.lastEclipse >= 5 && s.events.today !== 'eclipse' && s.events.today !== 'polar') {
    if (rchance(r, tier <= 3 ? 0.12 : 0.2)) {
      s.events.tomorrow = s.contract.biome === 'frost' && rchance(r, 0.6) ? 'polar' : 'eclipse';
      s.ffx.push({ t: 'forecast', s: s.events.tomorrow });
    }
  }
}
