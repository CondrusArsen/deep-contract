// Contract board generation and the initial state of a contract.
import { BUILDINGS } from './data/buildings';
import { BIOME_NAME, OBJECTIVES, planetName, QUALS, TIERS } from './data/contracts';
import { BOSS_OF, ENEMIES } from './data/enemies';
import { CORES, deptLevel, PLATFORMS } from './data/platforms';
import { BLUEPRINTS, BONUS_MODS, MALUS_MODS, TRAIT_MODS } from './data/techs';
import { generateMine, refreshField } from './mine';
import { coalQuota, dayLength } from './mods';
import { makeRng, rnd, rpick, rshuffle, type RngState } from './rng';
import type { BiomeId, ContractDef, GameState, Setup } from './types';
import { buildMounts, buildPads } from './world';
import { makeWorker } from './workers';
import { techPool, makeCard } from './draft';

export interface BoardCtx { biomes: BiomeId[]; blueprints: string[]; perks: string[] }

export function makeContract(seed: number, tierN: number, ctx: BoardCtx): ContractDef {
  const r: RngState = makeRng(seed);
  const f = () => rnd(r);
  const tier = TIERS[tierN - 1];
  const biome = rpick(r, ctx.biomes);
  const obj = rpick(r, OBJECTIVES);
  const bonus = tierN >= 2 ? rpick(r, Object.keys(BONUS_MODS)) : null;
  const malus = tierN >= 2 ? rpick(r, Object.keys(MALUS_MODS)) : null;
  const qpool = rshuffle(r, QUALS.filter(q => q.minTier <= tierN && (q.id !== 'boss' || tier.bossFrom)));
  const locked = BLUEPRINTS.filter(b => !ctx.blueprints.includes(b));
  const quals = qpool.slice(0, 2).map((q, i) => {
    const n = q.n(tierN, tier.strata);
    return { id: q.id, n, text: q.text(n, { biome: BIOME_NAME[biome], target: tier.strata * 50, boss: ENEMIES[BOSS_OF[biome]].name }), blueprint: locked[(Math.floor(f() * 97) + i) % Math.max(1, locked.length)] ?? '' };
  });
  const rewardMult = 1;
  return {
    seed, tier: tierN, planet: planetName(f), biome, objective: obj.name, blurb: obj.text,
    targetStrata: tier.strata, charges: tier.charges, minerals: tier.minerals.slice(),
    reward: { ochre: Math.round(tier.reward.ochre * rewardMult), jade: Math.round(tier.reward.jade * rewardMult), void: tier.reward.void },
    bonus, malus, quals,
  };
}

export interface MetaSnapshot { perks: string[]; divLevel: number; blueprints: string[] }

export function newGame(contract: ContractDef, setup: Setup, meta: MetaSnapshot): GameState {
  const pl = PLATFORMS[setup.platform];
  const perks = meta.perks;
  const has = (id: string) => perks.includes(id);
  const s: GameState = {
    v: 1, contract, setup, rng: makeRng(contract.seed ^ 0x5bd1e995), nextId: 1,
    phase: 'landing', day: 1, clock: 0, dayLen: 180, nightT: 0, dusk: false, stratum: 0, depth: 0, speed: 1,
    res: { iron: pl.startIron + (has('o1') ? 2 : 0) + (has('o4') ? 2 : 0) + (has('o10') ? 3 : 0), crim: pl.startCrim + (has('o2') ? 1 : 0) + (has('o10') ? 1 : 0), coal: 6, larva: setup.platform === 'brood' ? 2 : 0 },
    retrieved: { ochre: 0, jade: 0, void: 0 }, charges: 0,
    core: { hp: 100, max: 100, phoenixUsed: false },
    drillQueued: false, firstDrillDone: false, descentT: 0,
    mine: generateMineStub(), shaftH: 16,
    workers: [], items: [], uenemies: [], enemies: [], turrets: [], buildings: [], projectiles: [], mounts: [], pads: [],
    recruitQ: [], unlocked: {}, banned: [], rerolls: 1 + (has('r1') ? 1 : 0) + (has('r5') ? 1 : 0) + (setup.dept === 'rnd' ? 1 : 0),
    bans: 2 + (has('r3') ? 1 : 0), draftQ: [], draft: null, mods: [], lab: {}, abilities: { day: [], night: [] },
    freeBuildings: 2, freeTurrets: has('d3') ? 3 : 2,
    events: { today: null, tomorrow: null, lastEclipse: -10, log: [] }, boss: null, bossSchedule: [],
    waves: [], waveTotal: 0, enrage: false, recall: false, haul: 'auto',
    stats: { kills: 0, workersLost: 0, blocks: 0, delivered: 0, coreHits: 0, built: 0, sold: 0, drafts: 0, recruits: 0, bossKills: 0, bossRepels: 0, maxIdentical: 0, labs: 0, maxWorkers: 0 },
    savedAt: 0, result: null, wormT: 0, ffx: [],
    perks, deptLvl: setup.dept ? deptLevel(meta.divLevel) : 0, tnt: [], clouds: [], zones: [], entryDist: [], quietT: 0,
  };
  // modifications: platform traits, contract conditions, chosen bonuses
  for (const t of pl.traits) if (TRAIT_MODS[t]) s.mods.push(TRAIT_MODS[t].id);
  if (contract.bonus) s.mods.push(contract.bonus);
  if (contract.malus) s.mods.push(contract.malus);
  for (const b of setup.bonuses) if (BONUS_MODS[b] && !s.mods.includes(b)) s.mods.push(b);
  if (s.mods.includes('brittle')) s.freeBuildings = 1;
  // the guided first contract: a welcome bonus and the objective chain
  if (contract.tutorial) { s.mods.push('welcome'); s.tut = { done: [], skipped: false, t: 0, coalIdle: 0 }; }
  // core
  const core = CORES[setup.core];
  let hp = core.hp + (has('d1') ? 10 : 0) + (has('d4') ? 10 : 0) + (has('d8') ? 15 : 0);
  if (s.mods.includes('plating')) hp += 15;
  s.core = { hp, max: hp, phoenixUsed: false };
  // technologies available from the start
  for (const t of [...pl.starting, ...pl.startTurrets]) s.unlocked[t] = { stars: 0, lines: [] };
  for (const t of setup.startTechs) if (!s.unlocked[t]) s.unlocked[t] = { stars: 1, lines: [] };
  if (has('r9')) {
    const pool = techPool(s, meta.blueprints);
    if (pool.length) { const c = makeCard(s, rpick(s.rng, pool)); s.unlocked[c.tech] = { stars: 1, lines: c.lines }; }
  }
  // crew
  const crew = [...pl.startCrew];
  if (has('w1')) crew.push('miner');
  if (has('w3')) crew.push('hauler');
  if (has('w6')) crew.push('guard');
  for (const c of crew) s.workers.push(makeWorker(s, c));
  s.stats.maxWorkers = s.workers.length;
  s.dayLen = dayLength(s);
  s.res.coal = coalQuota(s); // the landing descent always has exactly one quota aboard
  s.pads = buildPads([]);
  s.mounts = buildMounts(s);
  // the surface: a thin crust with nothing in it until the first descent
  s.mine = generateMineStub();
  refreshField(s);
  return s;
}

function generateMineStub() {
  const N = 17 * 14;
  return { w: 17, h: 14, kind: new Array(N).fill(4), hp: new Array(N).fill(999), maxHp: new Array(N).fill(999), tag: new Array(N).fill(0), fx: {}, seen: new Array(N).fill(1) };
}

export function enterStratum(s: GameState) {
  s.stratum++;
  s.depth = s.stratum * 50;
  s.shaftH = Math.min(40, 16 + 4 * (s.stratum - 1));
  s.mounts = buildMounts(s);
  s.mine = generateMine(s);
  s.items = []; s.uenemies = []; s.tnt = []; s.clouds = [];
  refreshField(s);
}

export const buildingName = (t: string) => BUILDINGS[t]?.name ?? t;
export { BIOME_NAME };
