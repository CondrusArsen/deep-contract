// Achievements are earned once per profile, each with a small mineral reward.
import type { Minerals } from '../types';

export interface AchDef { key: string; name: string; text: string; reward: Minerals }
const m = (ochre: number, jade: number, v = 0): Minerals => ({ ochre, jade, void: v });

export const ACHIEVEMENTS: AchDef[] = [
  { key: 'descent', name: 'First descent', text: 'Lower the platform into a mine.', reward: m(2, 0) },
  { key: 'night', name: 'First night held', text: 'Survive a night in the shaft.', reward: m(3, 0) },
  { key: 'tech', name: 'First technology', text: 'Open a tech cache and pick a card.', reward: m(0, 2) },
  { key: 'target', name: 'Target depth reached', text: 'Reach a contract\'s target depth.', reward: m(3, 0) },
  { key: 'charge', name: 'Core charged', text: 'Haul a charge crystal home.', reward: m(0, 2) },
  { key: 'launch', name: 'Planet core detonated', text: 'Finish a contract with a launch.', reward: m(5, 3) },
  { key: 'bossWithdraw', name: 'A boss driven off', text: 'Make a boss withdraw up the shaft.', reward: m(0, 4) },
  { key: 'bossKill', name: 'A boss destroyed', text: 'Kill a boss before it escapes.', reward: m(0, 0, 2) },
  { key: 'frost', name: 'A frozen world', text: 'Take a contract on a frost planet.', reward: m(0, 3) },
  { key: 'jungle', name: 'A jungle world', text: 'Take a contract on a jungle planet.', reward: m(0, 3) },
  { key: 'tier5', name: 'Pit Boss contract won', text: 'Win a tier 5 contract.', reward: m(0, 0, 3) },
  { key: 'tier8', name: 'Board Member contract won', text: 'Win a tier 8 contract.', reward: m(0, 0, 6) },
];
export const ACH_BY_KEY: Record<string, AchDef> = Object.fromEntries(ACHIEVEMENTS.map(a => [a.key, a]));
