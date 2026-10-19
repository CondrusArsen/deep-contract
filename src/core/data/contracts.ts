import type { BiomeId, Minerals, MinKey } from '../types';

export interface TierDef { n: number; name: string; strata: number; charges: number; reward: Minerals; hp: number; xp: number; minerals: MinKey[]; bossFrom: boolean; divLvl: number }

export const TIERS: TierDef[] = [
  { n: 1, name: 'Intern', strata: 2, charges: 1, reward: { ochre: 10, jade: 6, void: 0 }, hp: 1.0, xp: 1.0, minerals: ['ochre', 'jade'], bossFrom: false, divLvl: 1 },
  { n: 2, name: 'Shift Lead', strata: 3, charges: 1, reward: { ochre: 19, jade: 14, void: 0 }, hp: 1.15, xp: 1.6, minerals: ['ochre', 'jade', 'void'], bossFrom: true, divLvl: 1 },
  { n: 3, name: 'Site Foreman', strata: 4, charges: 1, reward: { ochre: 26, jade: 26, void: 6 }, hp: 1.32, xp: 2.3, minerals: ['ochre', 'jade', 'void'], bossFrom: true, divLvl: 3 },
  { n: 4, name: 'Deep Supervisor', strata: 4, charges: 1, reward: { ochre: 32, jade: 32, void: 9 }, hp: 1.52, xp: 3.0, minerals: ['ochre', 'jade', 'void'], bossFrom: true, divLvl: 5 },
  { n: 5, name: 'Pit Boss', strata: 5, charges: 2, reward: { ochre: 40, jade: 38, void: 12 }, hp: 1.75, xp: 3.8, minerals: ['ochre', 'jade', 'void'], bossFrom: true, divLvl: 7 },
  { n: 6, name: 'Regional Manager', strata: 5, charges: 2, reward: { ochre: 48, jade: 46, void: 16 }, hp: 2.0, xp: 4.7, minerals: ['ochre', 'jade', 'void'], bossFrom: true, divLvl: 9 },
  { n: 7, name: 'Executive Driller', strata: 6, charges: 2, reward: { ochre: 58, jade: 54, void: 22 }, hp: 2.3, xp: 5.7, minerals: ['ochre', 'jade', 'void'], bossFrom: true, divLvl: 11 },
  { n: 8, name: 'Board Member', strata: 6, charges: 3, reward: { ochre: 70, jade: 66, void: 30 }, hp: 2.65, xp: 7.0, minerals: ['ochre', 'jade', 'void'], bossFrom: true, divLvl: 13 },
];

export const BIOME_NAME: Record<BiomeId, string> = { cave: 'CAVERNOUS', frost: 'FROST', jungle: 'JUNGLE' };

const SYL_A = ['Gris', 'Thorn', 'Bleak', 'Cold', 'Rust', 'Grim', 'Hollow', 'Ash', 'Murk', 'Stone', 'Brine', 'Pale', 'Vex', 'Dun', 'Cinder', 'Sorrow', 'Iron', 'Glum', 'Slag', 'Wither'];
const SYL_B = ['holm', 'reach', 'mire', 'vault', 'deep', 'spire', 'gate', 'rest', 'fall', 'hollow', 'maw', 'crest', 'well', 'moor', 'drift', 'coil', 'shelf', 'barrow'];
export const planetName = (r: () => number) => `${SYL_A[Math.floor(r() * SYL_A.length)]}${SYL_B[Math.floor(r() * SYL_B.length)]}-${['I', 'II', 'III', 'IV', 'V', 'VI', 'IX'][Math.floor(r() * 7)]}`;

export const OBJECTIVES = [
  { id: 'mag', name: 'MAGNETIC FIELD RESET', text: 'Our client\'s planetary magnetic field has become "a liability". Descend to the target depth and deliver a core charge. The Division thanks you for your compliance.' },
  { id: 'quake', name: 'TECTONIC ALIGNMENT', text: 'Continental plates are drifting outside of the agreed schedule. Detonating the core will bring them back in line. Overtime is not compensated.' },
  { id: 'demo', name: 'CONTROLLED DEMOLITION', text: 'A shareholder has decided this planet should not exist. Please make that happen with minimal paperwork.' },
  { id: 'cool', name: 'CORE COOLING', text: 'The planet\'s core is running hot and so are our investors. Reach target depth, charge the core, and bring the temperature down. Permanently.' },
  { id: 'survey', name: 'DEEP SURVEY', text: 'Sensors report something valuable underneath the swarm. Collect what you can on the way down; the core launch will tidy up afterwards.' },
];

export interface QualTemplate { id: string; text: (n: number, ctx: { biome: string; target: number; boss: string }) => string; n: (tier: number, strata: number) => number; minTier: number }
export const QUALS: QualTemplate[] = [
  { id: 'deeper', text: (n, c) => `Reach a depth of ${n} m on a ${c.biome.toLowerCase()} planet`, n: (_t, s) => (s + 1) * 50, minTier: 1 },
  { id: 'workers', text: n => `Have at least ${n} workers at the end of the contract`, n: t => 6 + t * 2, minTier: 1 },
  { id: 'core', text: n => `Finish with the core at ${n}% or more`, n: t => Math.min(90, 70 + t * 2), minTier: 1 },
  { id: 'nolosses', text: n => n === 0 ? 'Lose no workers' : `Lose no more than ${n} workers`, n: t => (t >= 4 ? 1 : 0), minTier: 1 },
  { id: 'labs', text: n => `Build ${n} laboratories`, n: t => Math.min(4, 2 + Math.floor(t / 3)), minTier: 1 },
  { id: 'boss', text: (_n, c) => `Kill ${c.boss} before it escapes`, n: () => 1, minTier: 2 },
  { id: 'fast', text: n => `Launch by day ${n}`, n: (_t, s) => 3 + s * 3, minTier: 1 },
  { id: 'mixed', text: n => `Never have more than ${n} identical turrets`, n: () => 3, minTier: 2 },
];
