import type { BiomeId } from '../types';

export interface EnemyDef {
  id: string; name: string; hp: number; speed: number; core: number; weight: number; armor?: number; shield?: number;
  mover: 'fly' | 'crawl' | 'thread' | 'float'; minStratum: number; biome?: BiomeId; radius: number; wiki: string;
}

export const ENEMIES: Record<string, EnemyDef> = {
  skitter: { id: 'skitter', name: 'Skitter', hp: 20, speed: 2.2, core: 3, weight: 1, mover: 'fly', minStratum: 1, radius: 0.45,
    wiki: 'Winged swarm drone. Descends in loose clouds.' },
  darter: { id: 'darter', name: 'Darter', hp: 12, speed: 4.2, core: 2, weight: 1, mover: 'fly', minStratum: 1, radius: 0.4,
    wiki: 'Fast dart-shaped flyer, very quick. Fast-firing guns handle it best.' },
  carapace: { id: 'carapace', name: 'Carapace', hp: 80, speed: 1.1, core: 6, weight: 4, armor: 5, mover: 'crawl', minStratum: 2, radius: 0.6,
    wiki: 'Armoured beetle that crawls down the shaft walls. Armour 5 is subtracted from every kinetic hit (halved against explosions, ignored by energy).' },
  shieldbug: { id: 'shieldbug', name: 'Shieldbug', hp: 30, speed: 1.8, core: 4, weight: 3, shield: 40, mover: 'fly', minStratum: 2, radius: 0.55,
    wiki: 'Carries a 40-point shield that regenerates after 2.5 s without damage. Energy ×2 and explosives ×1.5 against the shield; kinetic ×0.5.' },
  broodsac: { id: 'broodsac', name: 'Broodsac', hp: 60, speed: 1.0, core: 5, weight: 4, mover: 'float', minStratum: 3, radius: 0.7,
    wiki: 'Bloated carrier. Bursts into four Skitterlings when killed.' },
  skitterling: { id: 'skitterling', name: 'Skitterling', hp: 8, speed: 3.0, core: 1, weight: 0, mover: 'fly', minStratum: 99, radius: 0.3,
    wiki: 'Hatchling released by a Broodsac.' },
  detonator: { id: 'detonator', name: 'Detonator', hp: 35, speed: 2.8, core: 12, weight: 4, mover: 'fly', minStratum: 3, radius: 0.5,
    wiki: 'Suicide beetle. Dives straight for the core and deals 12 damage on impact. Kill it early.' },
  spitter: { id: 'spitter', name: 'Spitter', hp: 40, speed: 1.6, core: 3, weight: 3, mover: 'fly', minStratum: 4, radius: 0.55,
    wiki: 'Stops beside turrets and spits acid: the turret is disabled for 4 s. Moves on after two spits.' },
  rimeback: { id: 'rimeback', name: 'Rimeback', hp: 90, speed: 1.2, core: 6, weight: 5, armor: 6, mover: 'crawl', minStratum: 3, biome: 'frost', radius: 0.65,
    wiki: 'Frost beetle with armour 6. Immune to slowing effects.' },
  mender: { id: 'mender', name: 'Mender', hp: 45, speed: 1.4, core: 3, weight: 4, mover: 'float', minStratum: 3, biome: 'jungle', radius: 0.6,
    wiki: 'Spore-cloud creature that heals swarm members within 2.5 blocks by 6 HP/s.' },
  // Bosses
  weaver: { id: 'weaver', name: 'The Weaver', hp: 900, speed: 0.7, core: 4, weight: 0, mover: 'thread', minStratum: 99, biome: 'cave', radius: 2.2,
    wiki: 'Giant spider. Descends on a thread, lays Skitter eggs every 6 s and withdraws up the shaft after losing half its HP. Can be killed while it climbs away.' },
  rimeclad: { id: 'rimeclad', name: 'Rimeclad', hp: 1100, speed: 0.55, core: 5, weight: 0, shield: 400, mover: 'crawl', minStratum: 99, biome: 'frost', radius: 2.0,
    wiki: 'Frost colossus behind a 400-point crystal shield (kinetic ×0.25). Freezes turrets within 5 blocks every 8 s. Withdraws at half HP.' },
  bloomrot: { id: 'bloomrot', name: 'Bloomrot', hp: 1000, speed: 0.6, core: 4, weight: 0, mover: 'float', minStratum: 99, biome: 'jungle', radius: 2.1,
    wiki: 'Floating spore mass. Splits off two Sporelings at 75% and 50% HP and withdraws at 40%.' },
  sporeling: { id: 'sporeling', name: 'Sporeling', hp: 150, speed: 1.3, core: 4, weight: 0, mover: 'float', minStratum: 99, radius: 0.9,
    wiki: 'Fragment of Bloomrot, released as it splits.' },
};

export const BOSS_OF: Record<BiomeId, string> = { cave: 'weaver', frost: 'rimeclad', jungle: 'bloomrot' };
export const BOSS_WITHDRAW: Record<string, number> = { weaver: 0.5, rimeclad: 0.5, bloomrot: 0.4 };

export interface UEnemyDef { id: 'mite' | 'borer'; name: string; hp: number; speed: number; bite: number; biteCd: number; wiki: string }
export const UENEMIES: Record<string, UEnemyDef> = {
  mite: { id: 'mite', name: 'Rockmite', hp: 12, speed: 1.8, bite: 1.2, biteCd: 1.0, wiki: 'Hatches from cracks made by hatch blocks. Hunts the nearest worker through open cells.' },
  borer: { id: 'borer', name: 'Borer', hp: 30, speed: 2.1, bite: 4, biteCd: 1.3, wiki: 'Underground worm that tunnels through rock. Hunts workers who are below at night (and in daylight during Borer Activity).' },
};
