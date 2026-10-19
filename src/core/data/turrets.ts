import type { DmgType, Family } from '../types';

export interface TurretDef {
  id: string; name: string; family: Family; cost: [number, number, number]; // iron, crim, larva(brood only)
  rate: number; dmg: number; range: number; dt: DmgType; proj: 'bullet' | 'rail' | 'rocket' | 'shell' | 'flak' | 'beam' | 'flame' | 'wall' | 'chain' | 'pellet' | 'fly' | 'drone';
  speed?: number; splash?: number; pierce?: number; pellets?: number; spread?: number;
  desc: string; tip: string; brood?: boolean; minRange?: number;
  lineSet: string[]; // possible quality lines
}

// Rates are shots per second, damage per hit, range in blocks. Verified cards are marked in DESIGN.md.
export const TURRETS: Record<string, TurretDef> = {
  mg: { id: 'mg', name: 'Machine Gun', family: 'kin', cost: [3, 1, 0], rate: 1.8, dmg: 8, range: 11, dt: 'kin', proj: 'bullet', speed: 26,
    desc: 'Effective against low-HP and fast targets. High accuracy, low damage, fast attack speed.', tip: 'Cheap backbone. Weak against armour and shields.', lineSet: ['dmg', 'rate', 'range'] },
  minigun: { id: 'minigun', name: 'Minigun', family: 'kin', cost: [4, 1, 0], rate: 1.5, dmg: 4, range: 12, dt: 'kin', proj: 'bullet', speed: 28,
    desc: 'Spins up on a locked target, up to ×5 rate of fire. Great against high-HP targets, poor against swarms. Overheats after 8 s of fire.', tip: 'Put it where big targets linger.', lineSet: ['dmg', 'rate', 'range'] },
  auto: { id: 'auto', name: 'Autocannon', family: 'kin', cost: [5, 1, 0], rate: 1.2, dmg: 10, range: 11, dt: 'kin', proj: 'bullet', speed: 24,
    desc: 'Deals ×2.5 damage to enemies above 60% HP. Effective at the top of the shaft, where the swarm is still healthy.', tip: 'Mount it high.', lineSet: ['dmg', 'rate', 'range'] },
  rail: { id: 'rail', name: 'Railgun', family: 'kin', cost: [3, 2, 1], rate: 0.2, dmg: 36, range: 21.1, dt: 'kin', proj: 'rail', pierce: 99,
    desc: 'Deals damage to every enemy in the projectile\'s path. Huge range, slow reload.', tip: 'Line it up with the descent path.', lineSet: ['dmg', 'range', 'range'] },
  shotgun: { id: 'shotgun', name: 'Scattergun', family: 'kin', cost: [5, 1, 0], rate: 0.8, dmg: 4, range: 8, dt: 'kin', proj: 'pellet', pellets: 6, spread: 0.45, speed: 22,
    desc: 'Fires 6 pellets in a 25° cone. Short range; shreds clusters near the platform.', tip: 'Low mounts only.', lineSet: ['dmg', 'rate', 'range'] },
  rocket: { id: 'rocket', name: 'Rocket Pod', family: 'exp', cost: [4, 1, 0], rate: 0.5, dmg: 18, range: 13, dt: 'exp', proj: 'rocket', splash: 1.5, speed: 11,
    desc: 'Homing rockets with a 1.5-block blast. Good against groups and shields.', tip: 'Splash is halved by nothing; armour is halved by explosions.', lineSet: ['dmg', 'rate', 'splash'] },
  mortar: { id: 'mortar', name: 'Thumper Mortar', family: 'exp', cost: [5, 2, 0], rate: 0.35, dmg: 30, range: 16, dt: 'exp', proj: 'shell', splash: 2.2, speed: 9, minRange: 3,
    desc: 'Lobbed shells with a 2.2-block blast. Cannot hit targets closer than 3 blocks.', tip: 'Area denial for the upper shaft.', lineSet: ['dmg', 'rate', 'splash'] },
  flamer: { id: 'flamer', name: 'Fury Flamer', family: 'exp', cost: [5, 1, 0], rate: 8, dmg: 2.5, range: 5, dt: 'exp', proj: 'flame', splash: 0,
    desc: 'Continuous flame cone (range 5): 20 damage/s and sets targets burning (4/s for 3 s).', tip: 'Guards the last metres before the core.', lineSet: ['dmg', 'range', 'range'] },
  flak: { id: 'flak', name: 'Shrapnel Flak', family: 'exp', cost: [4, 2, 0], rate: 0.6, dmg: 10, range: 12, dt: 'exp', proj: 'flak', splash: 2.5, speed: 16,
    desc: 'Airburst shell: 10 damage plus six 4-damage fragments within 2.5 blocks.', tip: 'Counters Broodsac splits.', lineSet: ['dmg', 'rate', 'splash'] },
  laser: { id: 'laser', name: 'Laser Turret', family: 'nrg', cost: [4, 1, 0], rate: 0.7, dmg: 10, range: 17.8, dt: 'nrg', proj: 'beam',
    desc: 'Shoots lasers in a huge radius. If the target has less than half its HP, the laser deals triple damage.', tip: 'Finisher. Pair it with something that softens targets.', lineSet: ['dmg', 'rate', 'range'] },
  blade: { id: 'blade', name: 'Lightblade', family: 'nrg', cost: [6, 2, 0], rate: 10, dmg: 1.4, range: 15, dt: 'nrg', proj: 'wall',
    desc: 'Projects a horizontal beam from wall to wall at its own height: 14 damage/s to everything that crosses it.', tip: 'Every enemy must cross the line.', lineSet: ['dmg', 'dmg', 'rate'] },
  weak: { id: 'weak', name: 'Weakening Laser', family: 'nrg', cost: [4, 2, 0], rate: 1, dmg: 3, range: 14, dt: 'nrg', proj: 'beam',
    desc: 'Marks the target for 4 s: it takes ×1.6 damage from every source.', tip: 'Force multiplier for big targets.', lineSet: ['rate', 'range', 'dur'] },
  cryo: { id: 'cryo', name: 'Cryo Beam', family: 'nrg', cost: [4, 1, 0], rate: 6, dmg: 0.7, range: 12, dt: 'nrg', proj: 'beam',
    desc: 'Continuous beam: 4 damage/s and slows the target by 50% while held.', tip: 'Buys time for everything else.', lineSet: ['dmg', 'range', 'range'] },
  tesla: { id: 'tesla', name: 'Tesla Coil', family: 'nrg', cost: [5, 2, 0], rate: 0.8, dmg: 12, range: 9, dt: 'nrg', proj: 'chain',
    desc: 'Lightning that jumps to up to 4 targets within 3 blocks of each other.', tip: 'Clusters and escorts.', lineSet: ['dmg', 'rate', 'range'] },
  tower: { id: 'tower', name: 'Swarm Watchtower', family: 'kin', cost: [3, 1, 1], rate: 0.5, dmg: 3, range: 12, dt: 'kin', proj: 'fly', brood: true,
    desc: 'Launches flies that latch onto targets and bite for 3 damage/s each (up to 3 per target).', tip: 'Damage over time; stacks on bosses.', lineSet: ['dmg', 'rate', 'range'] },
  incub: { id: 'incub', name: 'Incubator', family: 'kin', cost: [4, 1, 1], rate: 0, dmg: 8, range: 10, dt: 'kin', proj: 'drone', brood: true,
    desc: 'Hatches two swarmling drones at nightfall that hunt the swarm (8 damage bites).', tip: 'Drones chase leaks near the core.', lineSet: ['dmg', 'rate', 'range'] },
};

export const FOCUS_LABEL: Record<string, string> = {
  core: 'Closest to core', far: 'Farthest from core', strong: 'Highest HP', weak: 'Lowest HP', near: 'Closest to turret', nearfar: 'Farthest from turret',
};

export const LINE_TEXT: Record<string, string> = {
  dmg: 'Damage +20%', rate: 'Attack speed +15%', range: 'Attack range +20%', splash: 'Blast radius +25%', dur: 'Effect duration +30%',
  recharge: 'Ability recharge speed +10%', effect: 'Effect +20%',
};

// Per-turret upgrade tracks: damage / rate / range, 2 levels each, paid in iron + crimsite.
export const UPGRADE_TRACKS = [
  { key: 'dmg', name: 'Barrel', text: 'Damage +25%', per: 0.25 },
  { key: 'rate', name: 'Feed', text: 'Attack speed +20%', per: 0.2 },
  { key: 'range', name: 'Optics', text: 'Range +15%', per: 0.15 },
] as const;
export const UPGRADE_COST = [[2, 1], [4, 2]];
export const MAX_IDENTICAL = 5;
