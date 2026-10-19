import type { RngState } from './rng';

export type BiomeId = 'cave' | 'frost' | 'jungle';
export type PlatformId = 'mule' | 'brood' | 'stone';
export type CoreId = 'standard' | 'titan' | 'plasma' | 'ion' | 'phoenix';
export type DeptId = 'security' | 'mining' | 'logistics' | 'hr' | 'rnd' | 'accounting';
export type ResKey = 'iron' | 'crim' | 'coal' | 'larva';
export type MinKey = 'ochre' | 'jade' | 'void';
export type WorkerClass = 'miner' | 'hauler' | 'guard';
export type DmgType = 'kin' | 'exp' | 'nrg';
export type Family = 'kin' | 'exp' | 'nrg';
export type Focus = 'core' | 'far' | 'strong' | 'weak' | 'near' | 'nearfar';
export type HaulPriority = 'auto' | 'coal' | 'iron' | 'crim' | 'min';

export type Phase = 'landing' | 'day' | 'night' | 'descent' | 'launch' | 'over';

export type ItemKind = 'iron' | 'crim' | 'coal' | 'ochre' | 'jade' | 'void' | 'tech' | 'bonus' | 'charge';

export interface Costs { iron: number; crim: number; larva: number }
export interface Minerals { ochre: number; jade: number; void: number }

// Block kinds in the mine grid (numeric for compact saves)
export enum B {
  Empty = 0, Dirt, Rock, Hard, Bedrock,
  Iron, Crim, Coal, Ochre, Jade, Void,
  Cache, Bonus, Charge,
  Hatch, Hole, Jet, Volatile,
  Ice, IceHeart, CryoJet, Snow,
  Vine, Root, Pod, Mud,
}

export interface CellFx {
  crack?: number;      // hatch crack timer (s) → Rockmite
  from?: number;       // hatch that made the crack
  jetDir?: number;     // 0 right 1 down 2 left 3 up
  jetT?: number;       // jet cycle timer
  holeT?: number;      // black-hole cycle timer
  holeTarget?: number; // index being rifted
  holeCoal?: number;   // stored coal
  heartT?: number;     // ice heart regrowth timer
  podT?: number;       // pod swell timer (−1 idle)
  rootT?: number;      // root growth timer
  over?: number;       // vine overgrowth layers on this block
  fuse?: number;       // volatile fuse
  puddle?: number;     // mud puddle on an empty cell (slow)
}

export interface Mine {
  w: number; h: number;
  kind: number[]; hp: number[]; maxHp: number[]; tag: number[];
  fx: Record<number, CellFx>;
  seen: number[]; // fog: 1 when revealed
}

export interface Worker {
  id: number; cls: WorkerClass; x: number; y: number; hp: number; maxHp: number;
  st: 'deck' | 'walk' | 'dig' | 'pick' | 'fight' | 'climb' | 'cocoon';
  path: number[];       // remaining cell indices
  route: { x: number; y: number }[]; // explicit waypoints (ladder/deck)
  goal: string;         // 'dig:idx' | 'item:id' | 'home' | 'deliver' | 'escort' | 'hunt:id' | 'idle'
  job: number;          // target cell / item / enemy id
  carry: ItemKind[];
  cd: number; anim: number; face: number; below: boolean;
  stranded: boolean; frozen: number; slowT: number; hurtT: number; incubate: number;
  deckX: number;
  xp?: number; lvl?: number; // grows with work (blocks dug, loads hauled, enemies bitten): +speed per level
}

export interface Item { id: number; kind: ItemKind; x: number; y: number; claim: number; cell: number }

export interface UEnemy {
  id: number; kind: 'mite' | 'borer'; x: number; y: number; hp: number; maxHp: number;
  cd: number; target: number; path: number[]; ttl: number; anim: number; hurtT: number;
}

export interface Enemy {
  id: number; kind: string; x: number; y: number; vx: number; vy: number;
  hp: number; maxHp: number; shield: number; maxShield: number; shieldCd: number;
  armor: number; speed: number; dmg: number; slowT: number; slowF: number; weakT: number;
  burnT: number; burnDps: number; anim: number; hurtT: number; wall: number; // wall side for crawlers (-1 none)
  state: string; t: number; boss: boolean; phase: number; ex: number; // ex: spare per-kind value
  latched: number; // flies latched
  tc: number;      // seconds spent at the platform (bosses)
}

export interface Turret {
  id: number; mount: number; type: string; stars: number; lines: string[]; focus: Focus;
  upg: [number, number, number]; cd: number; spin: number; heat: number; overheat: number;
  ang: number; target: number; disabled: number; overclock: number; spent: Costs; beamT: number;
  kills: number; dmgDone: number;
}

export interface Building {
  id: number; pad: number; type: string; stars: number; lines: string[]; t: number; spent: Costs; stock: number;
}

export interface Projectile {
  id: number; kind: string; x: number; y: number; vx: number; vy: number; dmg: number; dt: DmgType;
  splash: number; pierce: number; target: number; life: number; from: number; hit: number[];
  tx: number; ty: number; arc: number;
}

export interface Mount { id: number; side: -1 | 1; y: number; turret: number }
export interface Pad { id: number; storey: number; x: number; y: number; open: boolean; building: number }

export interface AbilityState { type: string; cd: number; active: number }

export interface DraftCard { tech: string; stars: number; lines: string[] }
export interface Draft { kind: 'tech' | 'bonus'; cards: DraftCard[] }

export interface EventState { id: string; day: number }

export interface BossState { kind: string; night: number; warned: boolean; done: boolean; killed: boolean; withdrew: boolean }

export interface ContractDef {
  seed: number; tier: number; planet: string; biome: BiomeId; objective: string; blurb: string;
  targetStrata: number; charges: number; minerals: MinKey[]; reward: Minerals;
  bonus: string | null; malus: string | null; quals: QualDef[];
  /** the guided first contract: seeded starter resources, a gentle first night, the objective chain */
  tutorial?: boolean;
}
export interface QualDef { id: string; n: number; text: string; blueprint: string }

export interface Setup {
  platform: PlatformId; core: CoreId; dept: DeptId | null; startTechs: string[]; bonuses: string[];
}

export interface Stats {
  kills: number; workersLost: number; blocks: number; delivered: number; coreHits: number; built: number;
  sold: number; drafts: number; recruits: number; bossKills: number; bossRepels: number; maxIdentical: number;
  labs: number; maxWorkers: number;
}

export interface GameState {
  v: number;
  contract: ContractDef; setup: Setup; rng: RngState; nextId: number;
  phase: Phase; day: number; clock: number; dayLen: number; nightT: number; dusk: boolean;
  stratum: number; depth: number; speed: number;
  res: { iron: number; crim: number; coal: number; larva: number };
  retrieved: Minerals; charges: number;
  core: { hp: number; max: number; phoenixUsed: boolean };
  drillQueued: boolean; firstDrillDone: boolean; descentT: number;
  mine: Mine; shaftH: number;
  workers: Worker[]; items: Item[]; uenemies: UEnemy[]; enemies: Enemy[];
  turrets: Turret[]; buildings: Building[]; projectiles: Projectile[];
  mounts: Mount[]; pads: Pad[];
  recruitQ: { cls: WorkerClass; t: number; paid: Costs }[];
  unlocked: Record<string, { stars: number; lines: string[] }>; // techs available this contract
  banned: string[]; rerolls: number; bans: number; draftQ: ('tech' | 'bonus')[]; draft: Draft | null;
  mods: string[];            // modifications list (bonus techs + conditions + traits)
  lab: Record<string, number>; // row -> tier bought
  abilities: { day: AbilityState[]; night: AbilityState[] };
  freeBuildings: number; freeTurrets: number;
  events: { today: string | null; tomorrow: string | null; lastEclipse: number; log: EventState[] };
  boss: BossState | null; bossSchedule: number[];
  waves: { t: number; kind: string; x: number }[]; waveTotal: number; enrage: boolean;
  recall: boolean; haul: HaulPriority;
  stats: Stats;
  savedAt: number; result: ResultData | null;
  wormT: number; ffx: FxEvent[];
  perks: string[]; deptLvl: number;
  tnt: { id: number; cell: number; x: number; y: number; t: number; power: number; from: number }[];
  clouds: { x: number; y: number; r: number; t: number; dps: number }[];
  zones: Zone[];
  entryDist: number[];
  quietT: number;
  /** guided first contract: index of the current objective (see core/tutorial.ts); absent on normal contracts */
  tut?: { done: string[]; skipped: boolean; t: number; coalIdle: number };
}

export interface Zone { kind: string; x: number; y: number; r: number; t: number; dur: number; power: number; target: number; fired: boolean }

export interface ResultData {
  success: boolean; depth: number; days: number; corePct: number; stars: number;
  xpLines: { label: string; xp: number }[]; xp: number;
  retrieved: Minerals; reward: Minerals; quals: { text: string; met: boolean; blueprint: string }[];
  evacuated: number;
}

// Transient events emitted by the simulation for audio, particles and UI toasts.
export interface FxEvent { t: string; x?: number; y?: number; a?: number; b?: number; s?: string; id?: number }
