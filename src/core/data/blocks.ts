import { B, type ItemKind } from '../types';

export interface BlockDef {
  id: B; name: string; hp: number; drop: ItemKind | null; dropN: [number, number];
  solid: boolean; dig: boolean; hazard?: boolean; wiki: string;
}

const d = (id: B, name: string, hp: number, drop: ItemKind | null, dropN: [number, number], wiki: string, extra: Partial<BlockDef> = {}): BlockDef =>
  ({ id, name, hp, drop, dropN, solid: true, dig: true, wiki, ...extra });

export const BLOCKS: Record<number, BlockDef> = {
  [B.Empty]: { id: B.Empty, name: 'Open cave', hp: 0, drop: null, dropN: [0, 0], solid: false, dig: false, wiki: 'Excavated space. Workers walk and climb through any open cell.' },
  [B.Dirt]: d(B.Dirt, 'Loose soil', 3, null, [0, 0], 'Soft ground. 3 durability.'),
  [B.Rock]: d(B.Rock, 'Rock', 6, null, [0, 0], 'Common rock. 6 durability.'),
  [B.Hard]: d(B.Hard, 'Hard rock', 11, null, [0, 0], 'Dense rock found deeper down. 11 durability.'),
  [B.Bedrock]: { id: B.Bedrock, name: 'Bedrock', hp: 999, drop: null, dropN: [0, 0], solid: true, dig: false, wiki: 'The stratum floor and walls. The drill cuts through it at dawn; picks cannot.' },
  [B.Iron]: d(B.Iron, 'Iron ore', 6, 'iron', [1, 2], 'Drops 1–2 iron. Iron pays for buildings, turrets, recruits and research.'),
  [B.Crim]: d(B.Crim, 'Crimsite vein', 8, 'crim', [1, 1], 'Drops 1 crimsite, the red crystal used by advanced structures, turret surcharges and research.'),
  [B.Coal]: d(B.Coal, 'Coal seam', 5, 'coal', [1, 1], 'Drops 1 coal. The drill needs a full coal quota for every 50 m descent.'),
  [B.Ochre]: d(B.Ochre, 'Ochre deposit', 9, 'ochre', [1, 2], 'Permanent mineral. Banked as "retrieved" when the contract succeeds; spent at HQ.'),
  [B.Jade]: d(B.Jade, 'Jade deposit', 9, 'jade', [1, 2], 'Permanent mineral. Banked as "retrieved" when the contract succeeds; spent at HQ.'),
  [B.Void]: d(B.Void, 'Void crystal', 12, 'void', [1, 1], 'The scarcest permanent mineral. Deep and rare; the brake on HQ upgrades.'),
  [B.Cache]: d(B.Cache, 'Tech cache', 6, 'tech', [1, 1], 'A sealed technology crate. Haul it home to draft a new structure for this contract.'),
  [B.Bonus]: d(B.Bonus, 'Bonus cache', 6, 'bonus', [1, 1], 'A gold crate. Haul it home to choose a permanent modifier for this contract.'),
  [B.Charge]: d(B.Charge, 'Charge vein', 14, 'charge', [1, 1], 'A core-charge crystal, only found at or below target depth. Heavy: haulers carry it slowly. Delivered charges enable the core launch.'),
  [B.Hatch]: d(B.Hatch, 'Hatch block', 10, 'crim', [1, 1], 'While a worker is within 5.5 blocks, it cracks a connected block within 4 blocks. A Rockmite hatches from the crack unless the cracked block is dug out first. More cracks on higher tiers.', { hazard: true }),
  [B.Hole]: d(B.Hole, 'Black hole', 16, null, [0, 0], 'Every ~18 s it rifts a nearby block (3 s purple arc) and swallows it with anything on it — workers take heavy damage. Swallowed ore becomes stored coal, released when the hole is dug out.', { hazard: true }),
  [B.Jet]: d(B.Jet, 'Steam vent', 8, 'iron', [0, 1], 'Shakes for 1.5 s, then fires a 4-block jet of steam (6 damage) into open space. Digging it out stops it.', { hazard: true }),
  [B.Volatile]: d(B.Volatile, 'Volatile rock', 4, 'coal', [1, 1], 'Explodes 1.2 s after it is broken or caught in a blast: 7 damage to workers within 1.6 blocks, 8 to neighbouring blocks (chains).', { hazard: true }),
  [B.Ice]: d(B.Ice, 'Ice', 3, null, [0, 0], 'Brittle ice. Ice hearts regrow it into nearby open cells — a tunnel can close behind your crew.'),
  [B.IceHeart]: d(B.IceHeart, 'Ice heart', 12, 'crim', [1, 2], 'Every ~20 s refreezes an open cell next to its ice (not cells with workers). Dig the heart to stop regrowth.', { hazard: true }),
  [B.CryoJet]: d(B.CryoJet, 'Cryo vent', 8, 'iron', [0, 1], 'Shakes for 1.5 s, then fires a 4-block freezing jet: 3 damage and frozen for 3 s.', { hazard: true }),
  [B.Snow]: d(B.Snow, 'Packed snow', 2, null, [0, 0], 'Fast to dig. 2 durability.'),
  [B.Vine]: d(B.Vine, 'Vine mass', 3, null, [0, 0], 'Soft growth. 3 durability.'),
  [B.Root]: d(B.Root, 'Creeper root', 10, 'iron', [1, 1], 'Every ~25 s overgrows a nearby block (+4 durability, up to twice). Dig roots early.', { hazard: true }),
  [B.Pod]: d(B.Pod, 'Spore pod', 4, 'jade', [0, 1], 'Swells when a worker comes within 2.5 blocks and bursts 2 s later into a poison cloud (2 damage/s for 4 s, radius 2). Guards shoot pods from range; digging one bursts it at once.', { hazard: true }),
  [B.Mud]: d(B.Mud, 'Mud', 2, null, [0, 0], 'Leaves a sticky puddle when dug: workers move at half speed through it.'),
};

export const isSolid = (k: number) => k !== B.Empty;
export const isDiggable = (k: number) => k !== B.Empty && k !== B.Bedrock;
export const ORE_KINDS = new Set<number>([B.Iron, B.Crim, B.Coal, B.Ochre, B.Jade, B.Void]);
