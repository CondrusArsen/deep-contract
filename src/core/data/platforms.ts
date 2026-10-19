import type { CoreId, DeptId, PlatformId, WorkerClass } from '../types';

export interface WorkerDef { name: string; hp: number; speed: number; power: number; slot: number; cost: [number, number, number]; desc: string }

export interface PlatformDef {
  id: PlatformId; name: string; blurb: string; traits: string[]; starting: string[]; startTurrets: string[];
  recruit: string; startCrew: WorkerClass[]; baseCap: number; orderCap: number; workers: Record<WorkerClass, WorkerDef>;
  startIron: number; startCrim: number;
}

export const PLATFORMS: Record<PlatformId, PlatformDef> = {
  mule: {
    id: 'mule', name: 'MULE-class Platform', recruit: 'barracks',
    blurb: 'The standard Contract Division platform. Reliable, forgiving, human-crewed. Hiring requires a Barracks.',
    traits: ['Turret Radius', 'Lucky Seams'], starting: ['barracks', 'factory', 'lab'], startTurrets: ['mg', 'auto'],
    startCrew: ['miner', 'miner', 'hauler', 'guard'], baseCap: 4, orderCap: 20, startIron: 8, startCrim: 0,
    workers: {
      miner: { name: 'Miner', hp: 10, speed: 2.4, power: 1.0, slot: 1, cost: [2, 0, 0], desc: 'Digs tagged blocks.' },
      hauler: { name: 'Hauler', hp: 10, speed: 2.8, power: 1, slot: 1, cost: [1, 0, 0], desc: 'Carries loose ore and crates to the platform.' },
      guard: { name: 'Guard', hp: 16, speed: 2.6, power: 3, slot: 1, cost: [2, 1, 0], desc: 'Shoots underground enemies (range 4) and escorts miners.' },
    },
  },
  brood: {
    id: 'brood', name: 'BROOD-class Platform', recruit: 'hatchery',
    blurb: 'Bioform crew grown on board. Myrmids take half a workforce slot each: twice the bodies, each cheaper to lose. Deals extra damage to the night swarm.',
    traits: ['Night Enemy Damage', 'Hatchery'], starting: ['hatchery', 'lab', 'tower', 'incub'], startTurrets: ['laser'],
    startCrew: ['miner', 'miner', 'miner', 'hauler', 'hauler', 'guard'], baseCap: 4, orderCap: 30, startIron: 8, startCrim: 1,
    workers: {
      miner: { name: 'Chewer', hp: 7, speed: 2.8, power: 0.8, slot: 0.5, cost: [1, 0, 1], desc: 'Chews through tagged blocks.' },
      hauler: { name: 'Porter', hp: 7, speed: 3.1, power: 1, slot: 0.5, cost: [1, 0, 1], desc: 'Carries loose ore and crates to the platform.' },
      guard: { name: 'Sentinel', hp: 10, speed: 3.0, power: 3, slot: 0.5, cost: [1, 0, 1], desc: 'Bites underground enemies at close range and escorts chewers.' },
    },
  },
  stone: {
    id: 'stone', name: 'STONEBEARD-class Platform', recruit: 'meadhall',
    blurb: 'Delver crews. Blasters clear tagged clusters with timed charges; Jetguards fly straight to trouble. Sturdy but pricey.',
    traits: ['Explosion Radius', 'Mead Hall'], starting: ['meadhall', 'factory', 'lab'], startTurrets: ['mg', 'rocket'],
    startCrew: ['miner', 'miner', 'hauler', 'guard'], baseCap: 4, orderCap: 24, startIron: 9, startCrim: 0,
    workers: {
      miner: { name: 'Blaster', hp: 14, speed: 2.0, power: 10, slot: 1, cost: [3, 0, 0], desc: 'Plants a charge on a tagged block; the blast hits every tagged block within 1.5.' },
      hauler: { name: 'Porter', hp: 14, speed: 2.4, power: 2, slot: 1, cost: [2, 0, 0], desc: 'Carries two items per trip.' },
      guard: { name: 'Jetguard', hp: 18, speed: 3.4, power: 4, slot: 1, cost: [3, 1, 0], desc: 'Jetpack guard: flies without climbing penalty, shoots at range 5.' },
    },
  },
};

export interface CoreDef { id: CoreId; name: string; hp: number; desc: string }
export const CORES: Record<CoreId, CoreDef> = {
  standard: { id: 'standard', name: 'Standard Core', hp: 100, desc: '100 durability.' },
  titan: { id: 'titan', name: 'Titan Core', hp: 130, desc: '130 durability. Heavy plating, nothing else.' },
  plasma: { id: 'plasma', name: 'Plasma Core', hp: 100, desc: '100 durability. When hit it discharges: 15 energy damage to attackers within 3 blocks.' },
  ion: { id: 'ion', name: 'Ion Core', hp: 90, desc: '90 durability. Turrets within 9 blocks of the core fire 15% faster.' },
  phoenix: { id: 'phoenix', name: 'Phoenix Core', hp: 80, desc: '80 durability. Once per contract, a fatal hit restores it to 35%.' },
};

export interface DeptDef { id: DeptId; name: string; perk: (lvl: number) => string; unlock?: string }
export const DEPTS: Record<DeptId, DeptDef> = {
  security: { id: 'security', name: 'Security Department', perk: l => `Turret damage +${5 * l}%. Adds the Railgun to the draft pool.`, unlock: 'rail' },
  mining: { id: 'mining', name: 'Mining Operations', perk: l => `Mining speed +${8 * l}%. Adds the Charge Drone to the draft pool.`, unlock: 'drone' },
  logistics: { id: 'logistics', name: 'Logistics', perk: l => `Hauler speed +${8 * l}%.${l >= 3 ? ' Haulers carry one more item.' : ''}` },
  hr: { id: 'hr', name: 'Human Resources', perk: l => `Hiring speed +${15 * l}%, recruits cost 1 iron less (min 1). Adds the Med Beacon to the draft pool.`, unlock: 'medic' },
  rnd: { id: 'rnd', name: 'Research & Development', perk: l => `+1 reroll; quality star odds +${5 * l}%. Adds the Tesla Coil to the draft pool.`, unlock: 'tesla' },
  accounting: { id: 'accounting', name: 'Accounting', perk: l => `Contract reward +${10 * l}%.${l >= 2 ? ' Selling is free of the 1-iron fee.' : ''}` },
};
export const deptLevel = (divLevel: number) => Math.min(3, 1 + Math.floor(divLevel / 5));
