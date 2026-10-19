export type BuildingCat = 'general' | 'day' | 'night' | 'util';

export interface BuildingDef {
  id: string; name: string; cat: BuildingCat; cost: [number, number, number];
  desc: string; stack?: string; cd?: number; target?: 'mine' | 'shaft' | 'turret' | 'none';
  platform?: 'mule' | 'brood' | 'stone';
}

export const BUILDINGS: Record<string, BuildingDef> = {
  barracks: { id: 'barracks', name: 'Barracks', cat: 'general', cost: [3, 0, 0], platform: 'mule',
    desc: 'Used for recruiting units. Each building of this type increases the hiring speed and the worker limit (+3).' },
  meadhall: { id: 'meadhall', name: 'Mead Hall', cat: 'general', cost: [4, 0, 0], platform: 'stone',
    desc: 'Delver quarters. Recruits Blasters, Porters and Jetguards. Each hall raises the worker limit by 3 and speeds up hiring.' },
  hatchery: { id: 'hatchery', name: 'Hatchery', cat: 'general', cost: [6, 2, 0], platform: 'brood',
    desc: 'Produces a larva every 20 s (stores 3). Hatch larvae into Myrmid workers (0.5 workforce each). Each hatchery raises the workforce limit by 3.' },
  factory: { id: 'factory', name: 'Foundry', cat: 'general', cost: [4, 0, 0],
    desc: 'Produces 1 iron every 35 s, day and night.' },
  lab: { id: 'lab', name: 'Laboratory', cat: 'general', cost: [2, 0, 0],
    desc: 'Worker upgrades. Tier 1 needs one laboratory; tiers 2, 3 and 4 need two, three and four laboratories on the platform.' },
  welder: { id: 'welder', name: 'Core Welder', cat: 'util', cost: [4, 2, 0],
    desc: 'Repairs 3 core durability at every dawn (stacks).' },
  damper: { id: 'damper', name: 'Seismic Damper', cat: 'util', cost: [3, 1, 0],
    desc: 'Borers spawn half as often (each extra damper: another −25%).' },
  kinamp: { id: 'kinamp', name: 'Kinetic Amplifier', cat: 'util', cost: [4, 1, 0],
    desc: 'Passive: kinetic (machine-gun type) turrets fire 12% faster per amplifier (max 3).' },
  expamp: { id: 'expamp', name: 'Blast Amplifier', cat: 'util', cost: [4, 1, 0],
    desc: 'Passive: explosive turrets deal 15% more damage per amplifier (max 3).' },
  nrgcap: { id: 'nrgcap', name: 'Capacitor Bank', cat: 'util', cost: [4, 1, 0],
    desc: 'Passive: energy turrets deal 12% more damage per bank (max 3).' },
  // Day abilities
  lance: { id: 'lance', name: 'Bore Lance', cat: 'day', cost: [4, 1, 0], cd: 70, target: 'mine', stack: 'Each extra building reduces the cooldown by 10 s.',
    desc: 'Active daytime ability. Destroys up to three blocks in a vertical line with a precision beam and kills underground enemies along it.' },
  drone: { id: 'drone', name: 'Charge Drone', cat: 'day', cost: [4, 1, 0], cd: 55, target: 'mine', stack: 'Each extra building reduces the cooldown by 8 s.',
    desc: 'Active daytime ability. Drops a charge that blasts a 3×3 area after 1.5 s: 12 damage to blocks, 20 to underground enemies, 4 to workers.' },
  medic: { id: 'medic', name: 'Med Beacon', cat: 'day', cost: [3, 1, 0], cd: 45, target: 'mine', stack: 'Each extra building heals 4 more.',
    desc: 'Active daytime ability. Heals workers within 4 blocks by 12 and speeds them up for 5 s.' },
  horn: { id: 'horn', name: 'Rally Horn', cat: 'day', cost: [3, 1, 0], cd: 90, target: 'none', stack: 'Each extra building adds 5 s.',
    desc: 'Active daytime ability. All workers move and dig 40% faster for 20 s.' },
  // Night abilities
  overclock: { id: 'overclock', name: 'Overclocker', cat: 'night', cost: [3, 1, 0], cd: 15, target: 'turret', stack: 'Each extra building increases the duration by 20%.',
    desc: 'Active nighttime ability. Makes one turret shoot 300% faster for 6 s.' },
  flakburst: { id: 'flakburst', name: 'Flak Burst', cat: 'night', cost: [4, 1, 0], cd: 22, target: 'shaft', stack: 'Each extra building adds 10 damage.',
    desc: 'Active nighttime ability. Airburst at the reticle after 0.6 s: 45 explosive damage within 2.5 blocks.' },
  stasis: { id: 'stasis', name: 'Stasis Field', cat: 'night', cost: [4, 1, 0], cd: 30, target: 'shaft', stack: 'Each extra building adds 1 s.',
    desc: 'Active nighttime ability. Slows every enemy within 3.5 blocks by 60% for 6 s.' },
  sunlens: { id: 'sunlens', name: 'Sun Lens', cat: 'night', cost: [5, 2, 0], cd: 40, target: 'shaft', stack: 'Each extra building adds 1 s of burn.',
    desc: 'Active nighttime ability. Focuses a vertical beam on the reticle column: 30 energy damage/s for 3 s.' },
};

export const ABILITY_EFFECT_TEXT: Record<string, string> = {
  lance: 'Destroys 3 blocks in a vertical line', drone: '3×3 blast after 1.5 s', medic: 'Heal 12 within 4 blocks', horn: '+40% worker speed, 20 s',
  overclock: 'One turret +300% fire rate', flakburst: '45 damage, radius 2.5', stasis: 'Slow 60%, radius 3.5', sunlens: '30 dps beam column, 3 s',
};
