// Technology draft pool, bonus modifiers, contract conditions, laboratory rows and planet events.
import type { BiomeId } from '../types';

// Techs available in every pool (subject to platform restrictions); blueprints need a qualification first.
export const BASE_POOL = ['mg', 'minigun', 'auto', 'shotgun', 'rocket', 'flamer', 'laser', 'weak', 'cryo',
  'lance', 'horn', 'overclock', 'flakburst', 'stasis', 'kinamp', 'expamp', 'nrgcap', 'factory', 'lab'];
export const BLUEPRINTS = ['mortar', 'blade', 'flak', 'tesla', 'welder', 'damper', 'sunlens', 'rail', 'medic', 'drone'];
export const BLUEPRINT_NAME_ORDER = BLUEPRINTS;

export interface ModDef { id: string; name: string; text: string; bad?: boolean }

export const BONUS_MODS: Record<string, ModDef> = {
  radius: { id: 'radius', name: 'Turret Radius', text: 'Effective turret radius +12%.' },
  tprice: { id: 'tprice', name: 'Turret Price', text: 'Turret price in iron −1. The price may not be lower than 1 iron.' },
  nightdmg: { id: 'nightdmg', name: 'Night Enemy Damage', text: 'All damage to the night swarm +10%.' },
  blast: { id: 'blast', name: 'Explosion Radius', text: 'Explosion radius +25%.' },
  brecharge: { id: 'brecharge', name: 'Building Recharge', text: 'Ability building recharge speed +10%.' },
  jaw: { id: 'jaw', name: 'Jawforce Drill Bits', text: 'Mining speed +15%.' },
  feet: { id: 'feet', name: 'Fleet Feet', text: 'Worker speed +10%.' },
  skin: { id: 'skin', name: 'Thick Skin', text: 'Worker HP +25%.' },
  lucky: { id: 'lucky', name: 'Lucky Seams', text: '+25% chance of a double drop from ore.' },
  coalnose: { id: 'coalnose', name: 'Coal Nose', text: 'Coal quota −1 (not below 4).' },
  overtime: { id: 'overtime', name: 'Overtime', text: 'Day length +12%.' },
  scrap: { id: 'scrap', name: 'Scrap Refund', text: 'Selling costs no fee.' },
  shift: { id: 'shift', name: 'Double Shift', text: 'Hiring speed +40%.' },
  plating: { id: 'plating', name: 'Core Plating', text: 'Core durability +15 (repaired at once).' },
  tracer: { id: 'tracer', name: 'Tracer Rounds', text: 'Kinetic turret attack speed +10%.' },
  caps: { id: 'caps', name: 'Overcharged Capacitors', text: 'Energy turret damage +12%.' },
  shaped: { id: 'shaped', name: 'Shaped Charges', text: 'Explosive turret damage +12%.' },
  nrecharge: { id: 'nrecharge', name: 'Nighttime Ability Recharge', text: 'Nighttime ability recharge speed +20%.' },
};

export const MALUS_MODS: Record<string, ModDef> = {
  perm: { id: 'perm', name: 'Permanent Resources', text: 'Permanent mineral deposits in the mine −50%.', bad: true },
  vigor: { id: 'vigor', name: 'Swarm Vigor', text: 'Night swarm HP +15%.', bad: true },
  shortday: { id: 'shortday', name: 'Short Days', text: 'Day length −15%.', bad: true },
  deepcoal: { id: 'deepcoal', name: 'Deep Coal', text: 'Coal quota +1.', bad: true },
  tax: { id: 'tax', name: 'Turret Tax', text: 'Turret price in iron +1.', bad: true },
  borers: { id: 'borers', name: 'Restless Borers', text: 'Underground night spawns ×2.', bad: true },
  brittle: { id: 'brittle', name: 'Brittle Deck', text: 'Only the first building is free.', bad: true },
  fees: { id: 'fees', name: 'Heavy Fees', text: 'Selling costs 2 iron.', bad: true },
};

export const TRAIT_MODS: Record<string, ModDef> = {
  'Turret Radius': { id: 'radius', name: 'Turret Radius', text: 'Effective turret radius +12%.' },
  'Lucky Seams': { id: 'lucky', name: 'Lucky Seams', text: '+25% chance of a double drop from ore.' },
  'Night Enemy Damage': { id: 'nightdmg', name: 'Night Enemy Damage', text: 'All damage to the night swarm +10%.' },
  'Explosion Radius': { id: 'blast', name: 'Explosion Radius', text: 'Explosion radius +25%.' },
};

/** granted by the game itself rather than drafted or rolled */
export const GIFT_MODS: Record<string, ModDef> = {
  welcome: { id: 'welcome', name: 'Welcome Bonus', text: 'First contract: the crew digs 50% faster.' },
};
export const ALL_MODS: Record<string, ModDef> = { ...BONUS_MODS, ...MALUS_MODS, ...GIFT_MODS };

export interface LabRow { id: string; name: string; per: string; icon: string }
export const LAB_ROWS: LabRow[] = [
  { id: 'jaw', name: 'Jawforce Enhancement', per: 'Mining speed +25% per tier', icon: 'pick' },
  { id: 'legs', name: 'Legwork', per: 'Worker move speed +12% per tier', icon: 'boot' },
  { id: 'plate', name: 'Plating', per: 'Worker HP +25% per tier', icon: 'shield' },
  { id: 'haul', name: 'Haulage', per: 'Tiers 1/3: haul speed +10%; tiers 2/4: +1 carry capacity', icon: 'crate' },
  { id: 'aim', name: 'Marksmanship', per: 'Guard damage +30% per tier', icon: 'target' },
  { id: 'hire', name: 'Recruitment', per: 'Hiring time −15% per tier', icon: 'person' },
];
// Tier costs [iron, crim] and labs needed. Tiers 2–4 verified (8/1, 14/2, 20/3).
export const LAB_TIERS = [{ cost: [4, 0], labs: 1 }, { cost: [8, 1], labs: 2 }, { cost: [14, 2], labs: 3 }, { cost: [20, 3], labs: 4 }];

export interface EventDef { id: string; name: string; text: string; bad: boolean; biome?: BiomeId; forecast?: boolean; warnText?: string }
export const EVENTS: Record<string, EventDef> = {
  borers: { id: 'borers', name: 'Borer Activity', text: 'Increased daytime activity of underground worms!', bad: true },
  eclipse: { id: 'eclipse', name: 'Eclipse', text: 'Daytime abilities are unavailable.', bad: true, forecast: true, warnText: 'An eclipse is coming! Daytime abilities will be unavailable tomorrow.' },
  dayoff: { id: 'dayoff', name: 'Day Off', text: 'The workers feel a surge of energy! Their speed is increased.', bad: false },
  rich: { id: 'rich', name: 'Rich Seam', text: 'Double ore drops are twice as likely today.', bad: false },
  supply: { id: 'supply', name: 'Supply Drop', text: 'Head office dropped 5 iron on the deck.', bad: false },
  surge: { id: 'surge', name: 'Swarm Surge', text: 'Tonight\'s swarm is 30% larger. Each kill tonight pays 1 iron in 4.', bad: true },
  polar: { id: 'polar', name: 'Polar Night', text: 'Daytime abilities are unavailable.', bad: true, biome: 'frost', forecast: true, warnText: 'Polar night falls tomorrow! Daytime abilities will be unavailable.' },
  blizzard: { id: 'blizzard', name: 'Blizzard', text: 'Workers move 30% slower today.', bad: true, biome: 'frost' },
  thaw: { id: 'thaw', name: 'Thaw', text: 'Ice is soft and stops regrowing today.', bad: false, biome: 'frost' },
  bloom: { id: 'bloom', name: 'Spore Bloom', text: 'Spore pods swell twice as fast today.', bad: true, biome: 'jungle' },
  overgrowth: { id: 'overgrowth', name: 'Overgrowth', text: 'Roots creep twice as fast today.', bad: true, biome: 'jungle' },
  monsoon: { id: 'monsoon', name: 'Monsoon', text: 'Mud puddles are everywhere; ore drops are richer.', bad: false, biome: 'jungle' },
};
