// Original procedural pixel art: platform chassis, storeys, core, deck buildings, wall turrets, mounts.
import { addFrames, hex, mix, Pix, shade, SPR, type RGBA } from '../pixel';

const OUT: RGBA = [14, 10, 7, 255];
const C = {
  rust: hex('#8a4a2a'), rust2: hex('#6a3620'), steel: hex('#6a7078'), steel2: hex('#4a5058'), steelHi: hex('#9aa2aa'),
  olive: hex('#5a6440'), brass: hex('#b8862a'), dark: hex('#2a2622'), amber: hex('#ffcf5a'), glass: hex('#6fd8ff'),
  red: hex('#d84030'), hazard: hex('#e8a020'), wood: hex('#7a5530'), green: hex('#6ad05a'), purple: hex('#a060e0'),
};

function rivets(p: Pix, x: number, y: number, w: number, step: number, c: RGBA = C.steelHi) { for (let i = x; i < x + w; i += step) p.set(i, y, c); }
function hazard(p: Pix, x: number, y: number, w: number, h: number) { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) p.set(x + i, y + j, ((i + j) >> 1) % 2 ? C.hazard : C.dark); }
function windowLit(p: Pix, x: number, y: number, w: number, h: number, col = C.amber) { p.rect(x, y, w, h, shade(col, 0.8)); p.hline(x, y, w, mix(col, hex('#ffffff'), 0.5)); p.set(x + w - 1, y + h - 1, shade(col, 0.5)); }
function pipe(p: Pix, x0: number, y0: number, x1: number, y1: number, c: RGBA) { p.line(x0, y0, x1, y1, c); p.line(x0, y0 + 1, x1, y1 + 1, shade(c, 0.6)); }

export function buildStructureArt() {
  // ---- chassis 240×32 ----
  {
    const p = new Pix(240, 36, 101);
    p.bevel(0, 4, 240, 5, C.steel);
    rivets(p, 3, 6, 236, 6);
    p.bevel(4, 9, 232, 14, C.rust);
    for (let x = 8; x < 232; x += 24) { p.bevel(x, 11, 18, 10, shade(C.rust, 1.08)); p.set(x + 2, 13, C.steelHi); p.set(x + 15, 19, C.steelHi); }
    hazard(p, 4, 22, 232, 3);
    // central drill housing and hatch
    p.bevel(104, 2, 32, 26, C.steel2);
    p.rect(114, 4, 12, 26, hex('#120e0b'));
    for (let y = 6; y < 30; y += 4) p.hline(115, y, 10, C.wood);
    p.vline(115, 4, 26, shade(C.wood, 1.2)); p.vline(124, 4, 26, shade(C.wood, 1.2));
    // exhaust stacks
    for (const x of [6, 14, 220, 228]) { p.bevel(x, -2 + 4, 6, 6, C.steel2); }
    pipe(p, 20, 16, 60, 16, C.brass); pipe(p, 180, 16, 220, 16, C.brass);
    p.outline(OUT);
    addFrames('plat.chassis', [p], 0, 4);
  }
  addFrames('plat.wheel', [0, 1, 2, 3].map(f => {
    const p = new Pix(18, 18, 102);
    p.disc(9, 9, 8.5, C.dark);
    p.disc(9, 9, 7, C.steel2);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + f * Math.PI / 16; p.set(9 + Math.cos(a) * 7.5, 9 + Math.sin(a) * 7.5, C.steelHi); p.line(9, 9, 9 + Math.cos(a) * 5, 9 + Math.sin(a) * 5, shade(C.steel, 0.9)); }
    p.disc(9, 9, 2.5, C.brass);
    p.outline(OUT);
    return p;
  }), 9, 9);
  addFrames('plat.drill', [0, 1, 2].map(f => {
    const p = new Pix(28, 26, 103);
    for (let y = 0; y < 22; y++) { const w = Math.round(12 - y * 0.5); p.hline(14 - w, y, w * 2, ((y + f * 2) >> 1) % 2 ? C.steelHi : C.steel2); }
    p.outline(OUT);
    return p;
  }), 14, 0);
  // storey floor segment (per pad) and posts
  addFrames('plat.floor', [(() => { const p = new Pix(32, 6, 104); p.bevel(0, 0, 32, 4, C.steel2); rivets(p, 2, 1, 30, 5); p.vline(4, 4, 2, C.dark); p.vline(27, 4, 2, C.dark); p.outline(OUT); return p; })()], 16, 0);
  addFrames('plat.post', [(() => { const p = new Pix(6, 56, 105); p.rect(1, 0, 4, 56, C.steel2); for (let y = 0; y < 56; y += 8) { p.line(1, y, 4, y + 7, C.steel); } p.vline(1, 0, 56, C.steelHi); p.outline(OUT); return p; })()], 3, 56);
  addFrames('plat.scaffold', [(() => { const p = new Pix(32, 56, 106); for (let y = 0; y < 56; y += 8) p.line(2, y, 29, y + 8, hex('#6a7078', 160)); p.hline(0, 54, 32, hex('#9aa2aa', 180)); return p; })()], 16, 56);
  // lamps: amber / red
  addFrames('plat.lamp', [C.amber, C.red].map(c => { const p = new Pix(6, 6, 107); p.disc(3, 3, 2.6, c); p.set(2, 2, hex('#ffffff')); p.outline(OUT); return p; }), 3, 3);
  // ladder segment 8×16
  addFrames('ladder', [(() => { const p = new Pix(10, 16, 108); p.vline(1, 0, 16, C.wood); p.vline(8, 0, 16, C.wood); for (let y = 2; y < 16; y += 5) p.hline(1, y, 8, shade(C.wood, 1.3)); return p; })()], 5, 0);

  // ---- core 48×48 (housing) + 4 glow frames ----
  {
    const p = new Pix(52, 52, 110);
    p.disc(26, 26, 25, C.dark);
    p.disc(26, 26, 23, C.steel2);
    for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; p.rect(26 + Math.cos(a) * 20 - 1, 26 + Math.sin(a) * 20 - 1, 3, 3, C.steelHi); }
    p.disc(26, 26, 17, hex('#3a2a1a'));
    p.rect(22, 0, 8, 6, C.steel); p.rect(0, 22, 6, 8, C.steel); p.rect(46, 22, 6, 8, C.steel);
    p.bevel(8, 44, 36, 8, C.rust);
    p.outline(OUT);
    addFrames('core.housing', [p], 26, 52);
  }
  if (!SPR.has('core.glow')) addFrames('core.glow', [0, 1, 2, 3].map(f => {
    const p = new Pix(34, 34, 111);
    p.disc(17, 17, 15.5, hex('#ff8a1a'));
    p.disc(17, 17, 12.5 + (f % 2) * 0.5, hex('#ffb23c'));
    p.disc(17, 17, 9, hex('#ffe070'));
    p.disc(15, 15, 4 + (f === 2 ? 1 : 0), hex('#fffbe0'));
    for (let k = 0; k < 6; k++) { const a = k * 1.047 + f * 0.26; p.set(17 + Math.cos(a) * 13, 17 + Math.sin(a) * 13, hex('#fff0a0')); }
    return p;
  }), 17, 17);

  // ---- deck buildings 32×32 ----
  const bld = (id: string, draw: (p: Pix, f: number) => void, frames = 2) => {
    const fr: Pix[] = [];
    for (let f = 0; f < frames; f++) { const p = new Pix(32, 32, id.length * 31 + 7); draw(p, f); p.outline(OUT); fr.push(p); }
    addFrames(`b.${id}`, fr, 16, 32);
  };
  bld('barracks', (p, f) => {
    p.bevel(3, 12, 26, 20, C.olive);
    p.rect(1, 9, 30, 4, C.rust); p.hline(1, 9, 30, shade(C.rust, 1.3));
    p.rect(13, 20, 6, 12, C.dark); p.set(17, 26, C.brass);
    windowLit(p, 6, 16, 5, 4, f ? C.amber : shade(C.amber, 0.85)); windowLit(p, 21, 16, 5, 4, C.amber);
    p.vline(26, 0, 10, C.steel2); p.rect(27, 1, 4, 3, C.red);
  });
  bld('meadhall', (p, f) => {
    p.bevel(2, 14, 28, 18, C.wood);
    for (let x = 4; x < 30; x += 4) p.vline(x, 14, 18, shade(C.wood, 0.8));
    for (let k = 0; k < 8; k++) p.hline(1 + k * 2, 13 - k, 30 - k * 4, shade(C.rust, 1 - k * 0.03));
    p.disc(9, 22, 3, C.steel); p.disc(23, 22, 3, C.steel); p.set(9, 22, C.brass); p.set(23, 22, C.brass);
    p.rect(14, 22, 5, 10, C.dark); windowLit(p, 15, 18, 3, 2, f ? C.amber : shade(C.amber, 0.8));
  });
  bld('hatchery', (p, f) => {
    p.ellipse(16, 30, 15, 4, hex('#4a3a2a'));
    const pods = [[9, 20, 7], [21, 18, 8], [15, 10, 6]] as const;
    for (const [x, y, r] of pods) { p.blob(x, y, r, r * 0.95, hex('#c8b040')); p.line(x - r + 2, y, x + r - 2, y, hex('#8a7020')); p.set(x - 2, y - 3, hex('#fff8c0')); }
    if (f) p.disc(21, 18, 2, hex('#ffffff', 120));
  });
  bld('factory', (p, f) => {
    p.bevel(2, 14, 28, 18, C.rust);
    p.bevel(20, 2, 7, 13, C.steel2);
    p.rect(6, 20, 10, 8, hex('#2a1208'));
    p.rect(7, 22, 8, 5, f ? hex('#ff9a2a') : hex('#ff6a1a')); p.hline(7, 22, 8, hex('#ffe08a'));
    rivets(p, 4, 16, 26, 4);
    p.set(23, 1, hex('#8a8a8a', 180)); p.set(24, 0, hex('#9a9a9a', 140));
  });
  bld('lab', (p, f) => {
    p.bevel(4, 24, 24, 8, C.steel2);
    p.disc(16, 15, 10, hex('#3a6a78', 170));
    p.disc(16, 15, 8.5, hex('#2a8a7a', 150));
    p.blob(16, 17, 6, 5, hex('#5ae0a0', 200));
    p.set(13, 10, hex('#e0fff0')); p.set(12, 11, hex('#e0fff0'));
    for (let k = 0; k < 3; k++) p.disc(12 + k * 4, 20 - ((k + f) % 3) * 3, 0.9, hex('#e0fff8'));
    p.vline(4, 16, 8, C.brass); p.vline(27, 16, 8, C.brass); p.set(4, 15, C.glass); p.set(27, 15, f ? C.glass : hex('#ffffff'));
  });
  bld('welder', (p, f) => {
    p.bevel(4, 22, 24, 10, C.steel2);
    p.line(10, 22, 16, 10, C.hazard); p.line(11, 22, 17, 10, shade(C.hazard, 0.7));
    p.line(16, 10, 24, 14, C.hazard); p.line(16, 11, 24, 15, shade(C.hazard, 0.7));
    p.rect(23, 14, 3, 4, C.steel);
    if (f) { p.set(24, 19, hex('#ffffff')); p.set(26, 20, hex('#fff08a')); p.set(22, 21, hex('#8fe0ff')); }
  });
  bld('damper', (p, f) => {
    p.bevel(6, 24, 20, 8, C.steel2);
    p.bevel(12, 6 + f * 2, 8, 18 - f * 2, C.steel);
    p.bevel(8, 3 + f * 2, 16, 4, C.brass);
    hazard(p, 6, 28, 20, 2);
  });
  bld('kinamp', (p, f) => {
    p.bevel(3, 14, 26, 18, C.olive);
    for (let x = 6; x < 27; x += 3) { p.rect(x, 8 + ((x >> 1) + f) % 2, 2, 7, C.brass); p.set(x, 8 + ((x >> 1) + f) % 2, hex('#ffe08a')); }
    windowLit(p, 8, 20, 16, 3, C.amber);
  });
  bld('expamp', (p, f) => {
    p.bevel(3, 24, 26, 8, C.steel2);
    for (let k = 0; k < 3; k++) { p.bevel(5 + k * 8, 8, 7, 16, C.red); p.hline(5 + k * 8, 12, 7, C.hazard); p.set(8 + k * 8, 9, f ? hex('#ffffff') : C.hazard); }
  });
  bld('nrgcap', (p, f) => {
    p.bevel(3, 24, 26, 8, C.steel2);
    for (let k = 0; k < 3; k++) { p.bevel(5 + k * 8, 6, 7, 18, hex('#2a4a7a')); p.rect(7 + k * 8, 8 + (f + k) % 3 * 3, 3, 3, C.glass); }
  });
  bld('lance', (p, f) => {
    p.bevel(8, 22, 16, 10, C.steel2);
    p.bevel(12, 4, 8, 18, hex('#3a3a6a'));
    p.disc(16, 8, 3.5, hex('#8a8aff')); p.disc(16, 8, 1.8, f ? hex('#ffffff') : hex('#c0c0ff'));
    p.line(6, 20, 12, 10, C.steel); p.line(26, 20, 20, 10, C.steel);
  });
  bld('drone', (p, f) => {
    p.bevel(3, 26, 26, 6, C.steel2); hazard(p, 5, 27, 22, 2);
    const y = 12 - f;
    p.bevel(10, y, 12, 6, C.red); p.hline(4, y - 2, 8, C.steelHi); p.hline(20, y - 2, 8, C.steelHi); p.vline(8, y - 2, 3, C.steel); p.vline(24, y - 2, 3, C.steel);
    p.set(16, y + 3, C.amber);
  });
  bld('medic', (p, f) => {
    p.bevel(3, 14, 26, 18, hex('#d8d0c0'));
    p.rect(13, 16, 6, 14, C.red); p.rect(9, 20, 14, 6, C.red);
    p.rect(12, 6, 8, 8, C.steel2); p.disc(16, 9, 2.5, f ? C.red : hex('#ff8a7a'));
  });
  bld('horn', (p, f) => {
    p.bevel(12, 12, 8, 20, C.steel2);
    p.line(4, 4, 16, 12, C.brass); p.line(4, 20, 16, 13, C.brass); p.vline(4, 4, 17, C.brass);
    for (let y = 5; y < 20; y++) p.hline(5, y, Math.max(0, 11 - Math.abs(y - 12)), shade(C.brass, 0.7));
    if (f) { p.line(0, 8, 2, 10, C.amber); p.line(0, 16, 2, 14, C.amber); }
  });
  bld('overclock', (p, f) => {
    p.bevel(4, 10, 24, 22, C.steel);
    p.disc(16, 20, 8, C.dark);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + f * Math.PI / 4; p.line(16, 20, 16 + Math.cos(a) * 7, 20 + Math.sin(a) * 7, C.steelHi); }
    p.disc(16, 20, 2, C.brass);
    p.rect(8, 4, 16, 6, C.steel2); p.hline(9, 6, 14, f ? C.amber : shade(C.amber, 0.7));
  });
  bld('flakburst', (p, f) => {
    p.bevel(3, 22, 26, 10, C.olive);
    for (let k = 0; k < 3; k++) { p.line(7 + k * 8, 22, 10 + k * 8, 6, C.steel2); p.line(8 + k * 8, 22, 11 + k * 8, 6, C.steel); p.set(10 + k * 8, 6, f ? C.amber : C.dark); }
  });
  bld('stasis', (p, f) => {
    p.bevel(8, 24, 16, 8, C.steel2);
    p.vline(16, 8, 16, C.steel);
    for (let r = 4; r <= 10; r += 3) { for (let a = 0; a < 6.28; a += 0.25) p.set(16 + Math.cos(a) * r, 12 + Math.sin(a) * r * 0.45, (r / 3 + f) % 2 ? C.glass : hex('#b0f0ff')); }
    p.disc(16, 12, 2, hex('#ffffff'));
  });
  bld('sunlens', (p, f) => {
    p.bevel(10, 22, 12, 10, C.steel2);
    for (let x = 2; x < 30; x++) { const y = 8 + Math.round(((x - 16) ** 2) / 26); p.vline(x, y, 2, x % 3 ? C.brass : hex('#ffe08a')); }
    p.vline(16, 4, 18, C.steel); p.disc(16, 4, 2.2, f ? hex('#ffffff') : hex('#fff0a0'));
  });
  // closed pad (needs scaffolding) and hammer marker
  addFrames('pad.hammer', [(() => { const p = new Pix(10, 10, 120); p.rect(1, 1, 7, 3, C.amber); p.rect(4, 4, 2, 5, C.amber); p.outline(OUT); return p; })()], 5, 5);

  // ---- turrets ----
  addFrames('mount.socket', [(() => { const p = new Pix(8, 16, 130); p.bevel(0, 0, 6, 16, C.steel2); p.set(2, 3, C.steelHi); p.set(2, 12, C.steelHi); p.rect(5, 6, 3, 4, C.steel); p.outline(OUT); return p; })()], 0, 8);
  // wall turrets: 24×24, wall plate on the left, pivot (head centre) at (14, 12)
  const head = (id: string, base: RGBA, draw?: (p: Pix, cx: number, cy: number) => void) => {
    const p = new Pix(24, 24, id.length * 13 + 131);
    p.bevel(0, 2, 5, 20, C.steel2); p.set(2, 4, C.steelHi); p.set(2, 19, C.steelHi);
    p.rect(5, 9, 4, 6, C.steel); p.hline(5, 9, 4, C.steelHi); p.hline(5, 14, 4, C.dark);
    p.blob(14, 12, 7.5, 7.5, base);
    p.hline(10, 6, 8, shade(base, 1.35)); p.set(9, 7, shade(base, 1.2));
    for (let a = 0; a < 6.28; a += 1.05) p.set(14 + Math.cos(a) * 6, 12 + Math.sin(a) * 6, shade(base, 0.6));
    draw?.(p, 14, 12);
    p.outline(OUT);
    addFrames(`t.${id}`, [p, p.flipX()], 14, 12);
  };
  head('mg', hex('#5a7a3a'), (p, x, y) => { p.disc(x, y, 3, C.steel2); p.set(x, y, C.dark); p.set(x - 1, y - 1, C.steelHi); });
  head('minigun', hex('#4a6a3a'), (p, x, y) => { p.disc(x, y, 4, C.steel); for (let a = 0; a < 6.28; a += 2.09) p.set(x + Math.cos(a) * 2, y + Math.sin(a) * 2, C.dark); });
  head('auto', hex('#6a6a3a'), (p, x, y) => { p.bevel(x - 3, y - 3, 7, 7, C.steel2); p.set(x, y, C.dark); });
  head('rail', hex('#3a4a6a'), (p, x, y) => { p.hline(x - 5, y - 1, 11, C.glass); p.hline(x - 5, y + 1, 11, C.glass); p.set(x, y, hex('#dffcff')); });
  head('shotgun', hex('#7a5a3a'), (p, x, y) => { p.rect(x - 3, y - 2, 7, 5, C.dark); p.hline(x - 3, y - 2, 7, C.steel); });
  head('rocket', hex('#6a3a2a'), (p, x, y) => { p.bevel(x - 5, y - 5, 11, 11, C.olive); for (const [dx, dy] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { p.disc(x + dx, y + dy, 1.3, C.dark); p.set(x + dx, y + dy, C.red); } });
  head('mortar', hex('#5a5a4a'), (p, x, y) => { p.disc(x, y, 4, C.dark); p.disc(x, y, 2.5, hex('#3a3a3a')); });
  head('flamer', hex('#8a3a1a'), (p, x, y) => { p.bevel(x - 6, y + 2, 6, 6, C.red); p.set(x - 4, y + 4, C.amber); p.disc(x + 1, y - 1, 2.5, C.dark); });
  head('flak', hex('#6a6a6a'), (p, x, y) => { p.bevel(x - 4, y - 4, 9, 9, C.olive); p.rect(x - 1, y - 1, 3, 3, C.dark); });
  head('laser', hex('#4a3a6a'), (p, x, y) => { p.disc(x, y, 4, hex('#ff3a3a')); p.disc(x - 1, y - 1, 1.5, hex('#ffc0c0')); });
  head('blade', hex('#6a2a2a'), (p, x, y) => { p.rect(x - 4, y - 5, 9, 10, hex('#ff5a3a')); p.hline(x - 4, y, 9, hex('#ffe0c0')); p.vline(x + 4, y - 5, 10, hex('#ffe0c0')); });
  head('weak', hex('#4a2a6a'), (p, x, y) => { p.disc(x, y, 4, hex('#c060ff')); p.set(x - 1, y - 1, hex('#f0d0ff')); });
  head('cryo', hex('#2a4a6a'), (p, x, y) => { p.disc(x, y, 4, hex('#8ff0ff')); p.set(x - 1, y - 1, hex('#ffffff')); });
  head('tesla', hex('#3a3a4a'), (p, x, y) => { for (let yy = y - 6; yy <= y + 5; yy += 2) p.hline(x - 4, yy, 9, C.brass); p.disc(x, y - 7, 2.5, hex('#aef0ff')); });
  head('tower', hex('#5a4a2a'), (p, x, y) => { p.blob(x, y, 5, 5, hex('#c8b040')); p.set(x - 2, y - 1, C.dark); p.set(x + 1, y + 2, C.dark); p.set(x + 2, y - 2, C.dark); });
  head('incub', hex('#4a5a2a'), (p, x, y) => { p.blob(x, y, 5, 6, hex('#b8e070')); p.hline(x - 4, y, 9, hex('#6a8a20')); p.set(x - 2, y - 3, hex('#f0ffd0')); });
}

// Barrel look per turret type: [length px, thickness px, colour, tip colour]
export const BARREL: Record<string, [number, number, string, string]> = {
  mg: [10, 2, '#2e3236', '#6a7078'], minigun: [11, 4, '#3a3e42', '#9aa2aa'], auto: [11, 3, '#2a2e32', '#5a6068'], rail: [15, 3, '#3a4a6a', '#6ff3ff'],
  shotgun: [8, 4, '#3a2e26', '#6a5a4a'], rocket: [6, 5, '#4a4a3a', '#8a8a6a'], mortar: [7, 5, '#2a2a2a', '#6a6a6a'], flamer: [8, 3, '#5a3a2a', '#ff9a3a'],
  flak: [10, 3, '#4a4a4a', '#8a8a8a'], laser: [9, 3, '#3a2a4a', '#ff5a5a'], blade: [0, 0, '#000', '#000'], weak: [9, 2, '#3a2a4a', '#d080ff'],
  cryo: [9, 3, '#2a3a4a', '#8ff0ff'], tesla: [0, 0, '#000', '#000'], tower: [4, 4, '#5a4a2a', '#c8b040'], incub: [0, 0, '#000', '#000'],
};
