// Contract result: depth / days / core %, XP lines that sum to the total, retrieved minerals, reward, qualifications.
import { TIERS } from './data/contracts';
import { perk } from './mods';
import type { GameState, Minerals, QualDef, ResultData } from './types';

export function qualMet(s: GameState, q: QualDef, success: boolean): boolean {
  if (!success) return false;
  const pct = Math.round((100 * Math.max(0, s.core.hp)) / s.core.max);
  switch (q.id) {
    case 'deeper': return s.depth >= q.n;
    case 'workers': return s.workers.filter(w => w.hp > 0).length >= q.n;
    case 'core': return pct >= q.n;
    case 'nolosses': return s.stats.workersLost <= q.n;
    case 'labs': return s.stats.labs >= q.n;
    case 'boss': return s.stats.bossKills >= 1;
    case 'fast': return s.day <= q.n;
    case 'mixed': return s.stats.maxIdentical <= q.n;
  }
  return false;
}

export function computeResult(s: GameState, success: boolean): ResultData {
  const tier = TIERS[s.contract.tier - 1];
  const corePct = Math.round((100 * Math.max(0, s.core.hp)) / s.core.max);
  const evacuated = success ? s.workers.filter(w => w.hp > 0).length : 0;
  const quals = s.contract.quals.map(q => ({ text: q.text, met: qualMet(s, q, success), blueprint: q.blueprint }));
  const lines: { label: string; xp: number }[] = [];
  const evac = 10 * evacuated + corePct;
  const diff = Math.round(tier.xp * (40 * s.stratum + 8 * s.day));
  if (success) {
    lines.push({ label: 'Evacuation', xp: evac });
    lines.push({ label: 'Difficulty', xp: diff });
    const met = quals.filter(q => q.met).length;
    if (met) lines.push({ label: 'Qualifications', xp: 150 * met });
  } else {
    lines.push({ label: 'Severance (40%)', xp: Math.round(0.4 * diff) });
  }
  const xp = lines.reduce((a, l) => a + l.xp, 0);
  const salv = perk(s, 'o8') ? 1.15 : 1;
  const retrieved: Minerals = success
    ? { ochre: Math.round(s.retrieved.ochre * salv), jade: Math.round(s.retrieved.jade * salv), void: s.retrieved.void }
    : { ochre: Math.floor(s.retrieved.ochre * 0.5), jade: Math.floor(s.retrieved.jade * 0.5), void: Math.floor(s.retrieved.void * 0.5) };
  const rm = 1 + (perk(s, 'o6') ? 0.1 : 0) + (s.setup.dept === 'accounting' ? 0.1 * s.deptLvl : 0);
  const reward: Minerals = success
    ? { ochre: Math.round(s.contract.reward.ochre * rm), jade: Math.round(s.contract.reward.jade * rm), void: Math.round(s.contract.reward.void * rm) }
    : { ochre: 0, jade: 0, void: 0 };
  const allQ = quals.length > 0 && quals.every(q => q.met);
  const stars = success ? 1 + (corePct >= 50 ? 1 : 0) + (allQ || s.stratum > s.contract.targetStrata ? 1 : 0) : 0;
  return { success, depth: s.depth, days: s.day, corePct, stars, xpLines: lines, xp, retrieved, reward, quals, evacuated };
}
