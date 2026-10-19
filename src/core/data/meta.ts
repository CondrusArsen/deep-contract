// HQ upgrade tree: prices in ochre / jade / void with division-level gates (R-20).
export interface MetaNode { id: string; branch: number; col: number; name: string; text: string; cost: [number, number, number]; lvl: number; req?: string }

export const BRANCHES = ['Operations', 'Workforce', 'R&D', 'Defence', 'Expansion'];

export const META: MetaNode[] = [
  // Operations
  { id: 'o1', branch: 0, col: 0, name: 'Starter Iron I', text: 'Start every contract with +2 iron.', cost: [6, 0, 0], lvl: 1 },
  { id: 'o2', branch: 0, col: 1, name: 'Starter Crimsite', text: 'Start every contract with +1 crimsite.', cost: [10, 4, 0], lvl: 2, req: 'o1' },
  { id: 'o3', branch: 0, col: 1, name: 'Efficient Foundry', text: 'Foundries produce 20% faster.', cost: [14, 8, 0], lvl: 3, req: 'o1' },
  { id: 'o4', branch: 0, col: 2, name: 'Starter Iron II', text: 'Start every contract with +2 more iron.', cost: [16, 6, 0], lvl: 3, req: 'o2' },
  { id: 'o6', branch: 0, col: 2, name: 'Bonus Clause', text: 'Contract rewards +10%.', cost: [20, 12, 1], lvl: 4, req: 'o3' },
  { id: 'o7', branch: 0, col: 3, name: 'Prospector\'s Eye', text: 'One extra coal seam in every stratum.', cost: [18, 10, 0], lvl: 4, req: 'o4' },
  { id: 'o5', branch: 0, col: 3, name: 'Fusion Module', text: 'Thanks to the fusion module, foundries also produce crimsite (every third output).', cost: [30, 15, 7], lvl: 6, req: 'o3' },
  { id: 'o8', branch: 0, col: 4, name: 'Salvage Rights', text: 'Retrieved minerals +15%.', cost: [35, 20, 3], lvl: 7, req: 'o6' },
  { id: 'o9', branch: 0, col: 5, name: 'Free Market', text: 'Selling structures costs no fee.', cost: [28, 18, 2], lvl: 8, req: 'o8' },
  { id: 'o10', branch: 0, col: 5, name: 'Starter Kit III', text: 'Start every contract with +3 iron and +1 crimsite.', cost: [40, 28, 5], lvl: 10, req: 'o7' },
  // Workforce
  { id: 'w1', branch: 1, col: 0, name: 'Extra Miner', text: 'Start with one more digger.', cost: [8, 4, 0], lvl: 1 },
  { id: 'w2', branch: 1, col: 1, name: 'Hardhats', text: 'Worker HP +15%.', cost: [10, 6, 0], lvl: 2, req: 'w1' },
  { id: 'w3', branch: 1, col: 1, name: 'Extra Hauler', text: 'Start with one more hauler.', cost: [12, 8, 0], lvl: 2, req: 'w1' },
  { id: 'w4', branch: 1, col: 2, name: 'Quick Hires', text: 'Hiring speed +25%.', cost: [14, 10, 0], lvl: 3, req: 'w3' },
  { id: 'w5', branch: 1, col: 2, name: 'Trail Boots', text: 'Worker speed +8%.', cost: [18, 12, 1], lvl: 4, req: 'w2' },
  { id: 'w6', branch: 1, col: 3, name: 'Extra Guard', text: 'Start with one more guard.', cost: [20, 14, 1], lvl: 5, req: 'w4' },
  { id: 'w7', branch: 1, col: 3, name: 'Bigger Order Board', text: 'Order cap +10 tagged blocks.', cost: [22, 14, 1], lvl: 5, req: 'w5' },
  { id: 'w8', branch: 1, col: 4, name: 'Union Contract', text: 'Recruits cost 1 iron less (min 1).', cost: [30, 22, 3], lvl: 7, req: 'w6' },
  { id: 'w10', branch: 1, col: 5, name: 'Field Medics', text: 'Workers aboard the platform heal twice as fast.', cost: [26, 20, 3], lvl: 6, req: 'w8' },
  { id: 'w9', branch: 1, col: 4, name: 'Veteran Crews', text: 'Mining speed +15%.', cost: [38, 26, 5], lvl: 9, req: 'w7' },
  // R&D
  { id: 'r1', branch: 2, col: 0, name: 'Spare Reroll', text: '+1 draft reroll per contract.', cost: [8, 6, 0], lvl: 1 },
  { id: 'r3', branch: 2, col: 1, name: 'Vetting', text: '+1 ban per contract.', cost: [12, 10, 0], lvl: 2, req: 'r1' },
  { id: 'r2', branch: 2, col: 1, name: 'Third Option', text: 'Technology drafts show three cards.', cost: [16, 12, 1], lvl: 3, req: 'r1' },
  { id: 'r4', branch: 2, col: 2, name: 'Quality Control I', text: 'Better odds for 2★ and 3★ technologies.', cost: [20, 16, 2], lvl: 4, req: 'r2' },
  { id: 'r5', branch: 2, col: 2, name: 'Spare Reroll II', text: '+1 more draft reroll per contract.', cost: [24, 18, 2], lvl: 5, req: 'r3' },
  { id: 'r6', branch: 2, col: 3, name: 'Early Discovery', text: 'One extra tech cache in every stratum.', cost: [26, 20, 3], lvl: 6, req: 'r4' },
  { id: 'r8', branch: 2, col: 3, name: 'Bonus Finds', text: 'One extra bonus cache in every stratum.', cost: [30, 24, 4], lvl: 7, req: 'r5' },
  { id: 'r7', branch: 2, col: 4, name: 'Quality Control II', text: 'Much better odds for 2★ and 3★ technologies.', cost: [34, 26, 5], lvl: 8, req: 'r6' },
  { id: 'r9', branch: 2, col: 5, name: 'Prototype Lab', text: 'Start every contract with one random extra technology.', cost: [45, 34, 8], lvl: 11, req: 'r7' },
  // Defence
  { id: 'd1', branch: 3, col: 0, name: 'Reinforced Core I', text: 'Core durability +10.', cost: [8, 6, 0], lvl: 1 },
  { id: 'd2', branch: 3, col: 1, name: 'Rangefinders', text: 'Turret radius +8%.', cost: [12, 8, 0], lvl: 2, req: 'd1' },
  { id: 'd4', branch: 3, col: 1, name: 'Reinforced Core II', text: 'Core durability +10.', cost: [18, 14, 1], lvl: 4, req: 'd1' },
  { id: 'd3', branch: 3, col: 2, name: 'Free Installation', text: 'The first three turrets are free.', cost: [16, 10, 1], lvl: 3, req: 'd2' },
  { id: 'd5', branch: 3, col: 3, name: 'Rapid Recharge', text: 'Nighttime ability recharge +15%.', cost: [20, 14, 2], lvl: 5, req: 'd3' },
  { id: 'd8', branch: 3, col: 3, name: 'Reinforced Core III', text: 'Core durability +15.', cost: [30, 24, 4], lvl: 8, req: 'd4' },
  { id: 'd6', branch: 3, col: 4, name: 'Upgrade Kits', text: 'Turret upgrades cost 25% less (rounded down, min 1 iron).', cost: [24, 18, 2], lvl: 6, req: 'd5' },
  { id: 'd7', branch: 3, col: 5, name: 'Licence Waiver', text: 'Up to 6 identical turrets.', cost: [30, 22, 4], lvl: 8, req: 'd6' },
  { id: 'd9', branch: 3, col: 5, name: 'Floodlights', text: 'The night swarm takes 10% more damage.', cost: [40, 30, 6], lvl: 10, req: 'd8' },
  // Expansion
  { id: 'e9', branch: 4, col: 0, name: 'Department Access', text: 'Choose an oversight department for each contract.', cost: [10, 8, 0], lvl: 2 },
  { id: 'e1', branch: 4, col: 0, name: 'Frost Contracts', text: 'Frost planets appear on the contract board (Rimeclad, ice hearts, cryo vents).', cost: [14, 10, 0], lvl: 2 },
  { id: 'e3', branch: 4, col: 1, name: 'Titan Core', text: 'Unlocks the Titan Core (130 durability).', cost: [16, 12, 1], lvl: 3 },
  { id: 'e2', branch: 4, col: 1, name: 'BROOD Platform', text: 'Unlocks the BROOD-class bioform platform.', cost: [20, 16, 2], lvl: 3, req: 'e9' },
  { id: 'e4', branch: 4, col: 2, name: 'Jungle Contracts', text: 'Jungle planets appear on the contract board (Bloomrot, spore pods, roots).', cost: [24, 20, 2], lvl: 5, req: 'e1' },
  { id: 'e6', branch: 4, col: 2, name: 'Plasma Core', text: 'Unlocks the Plasma Core (discharges at attackers).', cost: [22, 18, 3], lvl: 5, req: 'e3' },
  { id: 'e5', branch: 4, col: 3, name: 'STONEBEARD Platform', text: 'Unlocks the STONEBEARD-class Delver platform.', cost: [30, 24, 4], lvl: 6, req: 'e2' },
  { id: 'e7', branch: 4, col: 3, name: 'Ion Core', text: 'Unlocks the Ion Core (nearby turrets fire faster).', cost: [28, 22, 4], lvl: 7, req: 'e6' },
  { id: 'e10', branch: 4, col: 4, name: 'Relocation Grant', text: 'Four planets on offer per tier instead of three.', cost: [26, 20, 3], lvl: 6, req: 'e4' },
  { id: 'e8', branch: 4, col: 4, name: 'Phoenix Core', text: 'Unlocks the Phoenix Core (survives one fatal hit).', cost: [36, 28, 6], lvl: 9, req: 'e7' },
];

export const META_BY_ID: Record<string, MetaNode> = Object.fromEntries(META.map(n => [n.id, n]));

export const xpForLevel = (lvl: number) => { let s = 0; for (let i = 1; i < lvl; i++) s += 250 + 75 * (i - 1); return s; };
export const levelForXp = (xp: number) => { let l = 1; while (xp >= xpForLevel(l + 1)) l++; return l; };
export const platXpForLevel = (lvl: number) => 350 * (lvl - 1) + 50 * (lvl - 1) * (lvl - 2) / 2;
export const platLevelForXp = (xp: number) => { let l = 1; while (l < 20 && xp >= platXpForLevel(l + 1)) l++; return l; };
export const PLAT_SLOTS = { start1: 2, bonus1: 3, start2: 5, bonus2: 7 };
