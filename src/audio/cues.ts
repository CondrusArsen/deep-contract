// Cue sheet: game events → processed audio files (public/assets/audio, provenance in ASSETS.md).
// limit = minimum seconds between two plays of the cue, voices = simultaneous voices, pitch = random rate range.
export interface CueDef {
  files: string[]; bus?: 'sfx' | 'ui' | 'alarm'; gain?: number; limit?: number; voices?: number; pitch?: [number, number]; duck?: number; maxLen?: number;
  synth?: 'hold' | 'horn' | 'beep';
}
export interface MusicDef { file: string; gain?: number; loopStart?: number; loopEnd?: number }

const f = (name: string, n: number) => Array.from({ length: n }, (_, i) => `audio/sfx/${name}_${i}`);

export const CUES: Record<string, CueDef> = {
  // UI
  click: { files: f('click', 3), bus: 'ui', gain: 0.9, limit: 0.03, voices: 3 },
  open: { files: f('open', 2), bus: 'ui', gain: 0.7, limit: 0.05 },
  close: { files: f('close', 2), bus: 'ui', gain: 0.7, limit: 0.05 },
  toggle: { files: f('toggle', 2), bus: 'ui', gain: 1.2, limit: 0.05 },
  tag: { files: f('tag', 2), bus: 'ui', gain: 1.0, limit: 0.03, voices: 4, pitch: [0.95, 1.1] },
  untag: { files: f('untag', 1), bus: 'ui', gain: 0.9, limit: 0.03, voices: 4, pitch: [0.8, 0.9] },
  error: { files: f('error', 2), bus: 'ui', gain: 0.8, limit: 0.15 },
  confirm: { files: f('confirm', 1), bus: 'ui', gain: 0.9 },
  draft: { files: f('draft', 1), bus: 'ui', gain: 1.0 },
  reroll: { files: f('reroll', 1), bus: 'ui', gain: 1.0 },
  pick: { files: f('pick', 3), bus: 'ui', gain: 1.0 },
  ban: { files: f('ban', 2), bus: 'ui', gain: 1.0 },
  purchase: { files: f('purchase', 2), bus: 'ui', gain: 1.0 },
  hold: { files: [], bus: 'ui', synth: 'hold', gain: 0.35, limit: 0.2 },
  // economy & mine
  deliver: { files: f('deliver', 3), gain: 0.55, limit: 0.12, voices: 2, pitch: [0.95, 1.08] },
  pickup: { files: f('pickup', 3), gain: 0.9, limit: 0.08, voices: 2 },
  produce: { files: f('produce', 1), gain: 0.7, limit: 0.3 },
  recruit: { files: f('recruit', 2), gain: 0.9 },
  upgrade: { files: f('upgrade', 1), gain: 0.9, limit: 0.1 },
  build: { files: f('build', 4), gain: 1.0, limit: 0.1, pitch: [0.95, 1.05] },
  sell: { files: f('sell', 3), gain: 0.9, limit: 0.1 },
  dig: { files: f('dig', 5), gain: 0.7, limit: 0.07, voices: 4, pitch: [0.9, 1.12] },
  break: { files: f('break', 3), gain: 0.9, limit: 0.06, voices: 3, pitch: [0.9, 1.1] },
  crumble: { files: f('crumble', 3), gain: 0.9, limit: 0.06, voices: 3 },
  crack: { files: f('crack', 1), gain: 1.0, pitch: [1.2, 1.4] },
  oredrop: { files: f('oredrop', 3), gain: 0.6, limit: 0.06, voices: 3, pitch: [0.9, 1.2] },
  // turrets
  mg: { files: f('mg', 1), gain: 0.55, limit: 0.06, voices: 4, pitch: [0.92, 1.08] },
  auto: { files: f('mg', 1), gain: 0.7, limit: 0.08, voices: 3, pitch: [0.7, 0.78] },
  shotgun: { files: f('mg', 1), gain: 0.8, limit: 0.1, voices: 2, pitch: [0.55, 0.62] },
  minigun: { files: f('minigun', 3), gain: 0.5, limit: 0.12, voices: 3 },
  rail: { files: f('rail', 3), gain: 0.8, limit: 0.15, voices: 2 },
  rocket: { files: f('rocket', 1), gain: 0.55, limit: 0.12, voices: 3, pitch: [0.95, 1.1] },
  mortar: { files: f('mortar', 1), gain: 0.7, limit: 0.15, voices: 2, pitch: [0.8, 0.9] },
  flakfire: { files: f('flakfire', 1), gain: 0.6, limit: 0.12, voices: 2, pitch: [1.15, 1.3] },
  explode: { files: f('explode', 5), gain: 0.7, limit: 0.06, voices: 4, pitch: [0.9, 1.1] },
  explode_big: { files: f('explode_big', 2), gain: 1.0, limit: 0.2, voices: 2 },
  laser: { files: f('laser', 5), gain: 0.6, limit: 0.06, voices: 4, pitch: [0.95, 1.08] },
  hum: { files: f('hum', 1), gain: 0.45, limit: 0.45, voices: 2 },
  cryo: { files: f('cryo', 1), gain: 0.45, limit: 0.25, voices: 2, pitch: [1.2, 1.3] },
  flame: { files: f('flame', 1), gain: 0.55, limit: 0.2, voices: 2 },
  tesla: { files: f('tesla', 2), gain: 0.55, limit: 0.12, voices: 2 },
  flies: { files: f('bite', 2), gain: 0.5, limit: 0.3, pitch: [1.4, 1.6] },
  overheat: { files: f('overheat', 1), gain: 0.6, limit: 0.5 },
  // swarm
  hit: { files: f('hit', 5), gain: 0.35, limit: 0.04, voices: 4, pitch: [0.9, 1.2] },
  bugdie: { files: [...f('bugdie', 6), ...f('squish', 2)], gain: 0.6, limit: 0.05, voices: 4, pitch: [0.9, 1.15] },
  corehit: { files: f('corehit', 3), bus: 'alarm', gain: 1.0, limit: 0.15, voices: 2 },
  spit: { files: f('spit', 1), gain: 0.8, limit: 0.2 },
  eggs: { files: f('eggs', 1), gain: 0.8 },
  shieldbreak: { files: f('shieldbreak', 2), gain: 0.6, limit: 0.1 },
  // underground & hazards
  hurt: { files: f('hurt', 6), gain: 0.7, limit: 0.25, voices: 2 },
  death: { files: f('death', 3), bus: 'alarm', gain: 0.9, limit: 0.3 },
  bite: { files: f('bite', 2), gain: 0.6, limit: 0.2, voices: 2 },
  hatch: { files: f('hatch', 2), gain: 0.9 },
  borer: { files: f('borer', 2), gain: 0.9, pitch: [0.6, 0.75] },
  spore: { files: f('spore', 3), gain: 0.9 },
  swell: { files: f('swell', 1), gain: 0.8 },
  steam: { files: f('steam', 1), gain: 0.8, limit: 0.3 },
  freeze: { files: f('freeze', 1), gain: 0.7, limit: 0.3 },
  rift: { files: f('rift', 1), gain: 0.6 },
  swallow: { files: f('swallow', 1), gain: 0.8 },
  fuse: { files: f('fuse', 1), gain: 0.7, limit: 0.2 },
  gshot: { files: f('gshot', 2), gain: 1.3, limit: 0.1, voices: 2 },
  emerge: { files: f('emerge', 1), gain: 0.7 },
  // abilities
  lance: { files: f('lance', 1), gain: 0.9 },
  drone: { files: f('drone', 1), gain: 0.8 },
  heal: { files: f('heal', 1), gain: 0.8 },
  horn: { files: [], synth: 'horn', gain: 0.5 },
  overclock: { files: f('overclock', 1), gain: 0.8 },
  flakcall: { files: f('flakcall', 1), gain: 0.8 },
  stasis: { files: f('stasis', 1), gain: 0.8 },
  sun: { files: f('sun', 1), gain: 0.7 },
  // phases & events
  alarm: { files: f('alarm', 1), bus: 'alarm', gain: 1.0, limit: 2, duck: 3.4 },
  nightfall: { files: f('nightfall', 1), bus: 'alarm', gain: 0.9, limit: 2, duck: 2.5 },
  dawn: { files: f('dawn', 1), bus: 'alarm', gain: 0.8, limit: 2, duck: 2 },
  event: { files: f('event', 1), bus: 'ui', gain: 1.0, limit: 0.5 },
  bosswarn: { files: f('bosswarn', 1), bus: 'alarm', gain: 0.9, duck: 2.5 },
  boss: { files: f('boss', 1), bus: 'alarm', gain: 1.0, duck: 4 },
  bosswithdraw: { files: f('bosswithdraw', 1), gain: 0.9 },
  charge: { files: f('charge', 1), bus: 'alarm', gain: 0.8, duck: 2 },
  phoenix: { files: f('phoenix', 1), bus: 'alarm', gain: 0.9, duck: 2 },
  weld: { files: f('weld', 1), gain: 0.6 },
  supply: { files: f('supply', 2), gain: 0.8 },
  drill: { files: f('drill', 1), gain: 0.8 },
  drill_start: { files: f('drill_start', 1), gain: 0.8, limit: 1 },
  drill_stop: { files: f('drill_stop', 1), gain: 0.8, limit: 1 },
  corealarm: { files: [], bus: 'alarm', synth: 'beep', gain: 0.25, limit: 0.9 },
  launch: { files: f('launch', 1), bus: 'alarm', gain: 1.0 },
  detonate: { files: f('detonate', 1), bus: 'alarm', gain: 1.0 },
  victory: { files: f('victory', 1), bus: 'alarm', gain: 0.9 },
  defeat: { files: f('defeat', 1), bus: 'alarm', gain: 0.9 },
};

// Loop regions: files are cut exactly on the loop (tools/process_audio.py), so the whole buffer loops.
export const MUSIC: Record<string, MusicDef> = {
  day: { file: 'audio/music/day', gain: 1.0 },
  night: { file: 'audio/music/night', gain: 0.9 },
  boss: { file: 'audio/music/boss', gain: 0.9 },
  menu: { file: 'audio/music/menu', gain: 0.9 },
};
export const MUSIC_SAMPLES: Record<string, number> = { day: 4498200, night: 3445974, boss: 7697434, menu: 9419980 };
