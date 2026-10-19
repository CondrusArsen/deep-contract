// Mine blocks: licensed base textures (ARoach 16×16 set, graded — see ASSETS.md) plus original overlays for
// hazards, crates and charge veins; original procedural fallbacks for anything missing. 16×16 art px per block.
import { B } from '../../core/types';
import { addCanvasFrames, addFrames, frameCanvas, hex, mix, Pix, SPR, shade, type RGBA } from '../pixel';

const T = 16;
const BIOMES = ['cave', 'frost', 'jungle'] as const;

function fallbackStone(p: Pix, base: RGBA) {
  p.rect(0, 0, T, T, base);
  p.noise(0, 0, T, T, [shade(base, 0.85), shade(base, 1.15)], 0.45);
  for (let k = 0; k < 4; k++) {
    const w = 4 + Math.floor(p.rnd() * 5), h = 3 + Math.floor(p.rnd() * 4), x = Math.floor(p.rnd() * (T - w)), y = Math.floor(p.rnd() * (T - h));
    p.hline(x, y, w, shade(base, 1.3)); p.vline(x, y, h, shade(base, 1.3)); p.hline(x, y + h - 1, w, shade(base, 0.65)); p.vline(x + w - 1, y, h, shade(base, 0.65));
  }
}

function crystals(p: Pix, col: RGBA, n: number) {
  const hi = mix(col, hex('#ffffff'), 0.55), lo = shade(col, 0.5);
  for (let k = 0; k < n; k++) {
    const x = 3 + Math.floor(p.rnd() * 9), y = 5 + Math.floor(p.rnd() * 8), h = 3 + Math.floor(p.rnd() * 3);
    p.vline(x, y - h, h, col); p.vline(x + 1, y - h + 1, h - 1, lo); p.set(x, y - h, hi); p.set(x - 1, y - 1, col);
  }
}

function crate(p: Pix, body: RGBA, band: RGBA, glow: RGBA) {
  p.bevel(2, 3, 12, 11, body);
  p.hline(2, 6, 12, band); p.hline(2, 10, 12, band);
  p.vline(7, 3, 11, shade(body, 0.7)); p.vline(8, 3, 11, shade(body, 1.2));
  p.rect(6, 7, 4, 3, glow); p.set(7, 8, mix(glow, hex('#ffffff'), 0.6));
  p.outline([10, 8, 6, 255]);
}

/** Composite an overlay onto the biome's rock (or a given base key) and register it. */
function over(key: string, baseKey: string, overlays: Pix[], baseFrame = 0) {
  const out: HTMLCanvasElement[] = [];
  for (const o of overlays) {
    const c = frameCanvas(baseKey, baseFrame) ?? (() => { const p = new Pix(T, T, 3); fallbackStone(p, hex('#4a4744')); return p.toCanvas(); })();
    c.getContext('2d')!.drawImage(o.toCanvas(), 0, 0);
    out.push(c);
  }
  addCanvasFrames(key, out, 0, 0);
}

const mk = (seed: number, fn: (p: Pix) => void) => { const p = new Pix(T, T, seed); fn(p); return p; };

export function buildBlockArt() {
  // licensed biome-agnostic keys → per-biome keys
  for (const bio of BIOMES) {
    if (SPR.has('blk.ice')) SPR.set(`blk.${bio}.${B.Ice}`, SPR.get('blk.ice')!);
    if (SPR.has('blk.mud')) SPR.set(`blk.${bio}.${B.Mud}`, SPR.get('blk.mud')!);
  }
  // procedural fallbacks for base textures (only when the licensed atlas is missing)
  const FALL: Record<string, string> = { [B.Rock]: '#4a4744', soft: '#5a4030', [B.Hard]: '#343c47', [B.Bedrock]: '#17151a', back: '#17130f', [B.Iron]: '#4a4744', [B.Crim]: '#4a4744', [B.Coal]: '#4a4744', [B.Ochre]: '#4a4744', [B.Jade]: '#4a4744', [B.Void]: '#5a2a7a', [B.Ice]: '#5d9ec8', [B.Mud]: '#4a3a26' };
  for (const bio of BIOMES) for (const k of Object.keys(FALL)) {
    const key = `blk.${bio}.${k}`;
    if (SPR.has(key)) continue;
    addFrames(key, [0, 1, 2].map(v => mk(90 + v, p => fallbackStone(p, shade(hex(FALL[k]), k === 'back' ? 1 : 1)))), 0, 0);
  }
  for (const bio of BIOMES) {
    const rock = `blk.${bio}.${B.Rock}`, hard = `blk.${bio}.${B.Hard}`, ice = `blk.${bio}.${B.Ice}`;
    over(`blk.${bio}.${B.Cache}`, rock, [mk(40, p => crate(p, hex('#7a5a2a'), hex('#3b2a14'), hex('#ffcf5a')))]);
    over(`blk.${bio}.${B.Bonus}`, rock, [mk(41, p => crate(p, hex('#c8962a'), hex('#6e4c10'), hex('#fff0a0')))]);
    over(`blk.${bio}.${B.Charge}`, hard, [0, 1].map(v => mk(42 + v, p => { crystals(p, hex('#57f0ff'), 4); p.disc(8, 9, 2.2, hex('#bffcff', 200)); p.outline([8, 30, 40, 200]); })));
    over(`blk.${bio}.${B.Hatch}`, rock, [mk(43, p => {
      for (const [x, y, r] of [[5, 6, 3.2], [10, 8, 3.6], [6, 11, 2.8]] as const) { p.blob(x, y, r, r * 0.9, hex('#c9602a')); p.set(x - 1, y - 1, hex('#ffc08a')); }
      p.outline([30, 12, 6, 255]);
    })]);
    // black hole, 4-frame swirl (replaces the block entirely)
    addFrames(`blk.${bio}.${B.Hole}`, [0, 1, 2, 3].map(f => mk(44, p => {
      p.rect(0, 0, T, T, hex('#0a0610'));
      for (let a = 0; a < 3; a++) for (let r = 2; r < 8; r += 0.5) { const ang = a * 2.094 + r * 0.8 + f * 0.7; p.set(8 + Math.cos(ang) * r, 8 + Math.sin(ang) * r, r > 5 ? hex('#6a2aa8') : hex('#b060ff')); }
      p.disc(8, 8, 2, hex('#000000')); p.set(8, 7, hex('#e0b0ff'));
    })), 0, 0);
    for (const [id, col] of [[B.Jet, '#c8b098'], [B.CryoJet, '#8fe0ff']] as const) {
      for (let d = 0; d < 4; d++) {
        const dx = d === 0 ? 1 : d === 2 ? -1 : 0, dy = d === 1 ? 1 : d === 3 ? -1 : 0;
        over(`blk.${bio}.${id}.${d}`, rock, [mk(45 + d, p => {
          p.disc(8, 8, 4, hex('#2a2622')); p.disc(8, 8, 2.5, hex('#171311'));
          for (let k = 2; k < 8; k++) { p.set(8 + dx * k + (dy ? -1 : 0), 8 + dy * k + (dx ? -1 : 0), hex('#6c655e')); p.set(8 + dx * k + (dy ? 1 : 0), 8 + dy * k + (dx ? 1 : 0), hex('#6c655e')); }
          p.set(8 + dx * 3, 8 + dy * 3, hex(col)); p.set(8 + dx * 4, 8 + dy * 4, hex(col));
        })]);
      }
    }
    over(`blk.${bio}.${B.Volatile}`, rock, [0, 1].map(v => mk(47 + v, p => {
      p.line(2, 3, 7, 8, hex('#ff5a2a')); p.line(7, 8, 13, 5, hex('#ff5a2a')); p.line(7, 8, 9, 14, hex('#ff8a3a')); p.set(7, 8, hex('#ffd08a'));
      if (v) { p.line(3, 12, 6, 10, hex('#ff5a2a')); }
    })));
    over(`blk.${bio}.${B.IceHeart}`, ice, [mk(51, p => { p.disc(8, 8, 4, hex('#c9f2ff')); p.disc(8, 8, 2.5, hex('#ffffff')); p.set(6, 6, hex('#5fc6ff')); p.outline([20, 60, 90, 255]); })]);
    over(`blk.${bio}.${B.Root}`, rock, [mk(52, p => {
      p.line(1, 14, 8, 8, hex('#7a4a26')); p.line(8, 8, 14, 2, hex('#7a4a26')); p.line(8, 8, 13, 14, hex('#8a5a30')); p.line(8, 8, 3, 3, hex('#6a3c1e'));
      p.disc(8, 8, 2.5, hex('#9a6a3a')); p.set(7, 7, hex('#caa06a')); p.outline([30, 18, 10, 255]);
    })]);
    over(`blk.${bio}.${B.Pod}`, rock, [0, 1, 2].map(f => mk(53, p => {
      const r = 4 + f * 1.2;
      p.blob(8, 9, r, r * 0.9, f === 2 ? hex('#e8ff5a') : hex('#b8d84a'));
      p.set(6, 6, hex('#ffffff'));
      for (let k = 0; k < 4; k++) p.set(5 + k * 2, 9 + (k % 2), hex('#6a8a20'));
      p.outline([20, 30, 8, 255]);
    })));
  }
  // damage cracks (3 stages)
  addFrames('crack', [1, 2, 3].map(stage => mk(60 + stage, p => {
    const c = hex('#0c0907', 220);
    p.line(8, 8, 3, 4, c); if (stage > 1) { p.line(8, 8, 13, 6, c); p.line(8, 8, 6, 14, c); }
    if (stage > 2) { p.line(3, 4, 1, 9, c); p.line(13, 6, 15, 12, c); p.line(8, 8, 12, 14, c); }
  })), 0, 0);
  addFrames('hatchcrack', [0, 1].map(f => mk(70, p => { const c = f ? hex('#ffb040') : hex('#ff6a20'); p.line(3, 3, 8, 7, c); p.line(8, 7, 12, 3, c); p.line(8, 7, 7, 13, c); p.line(7, 13, 11, 14, c); })), 0, 0);
  addFrames('overgrowth', [mk(71, p => { for (let k = 0; k < 4; k++) { const x = Math.floor(p.rnd() * 16); p.line(x, 0, x + 2, 8 + Math.floor(p.rnd() * 7), hex('#62b040')); } for (let k = 0; k < 5; k++) p.set(Math.floor(p.rnd() * 16), Math.floor(p.rnd() * 16), hex('#9ae060')); })], 0, 0);
  addFrames('puddle', [mk(72, p => { p.ellipse(8, 14, 7, 2, hex('#5a4228', 220)); p.hline(4, 13, 4, hex('#8a6a40')); })], 0, 0);

  // loose items 8×8 (original)
  const item = (key: string, fn: (p: Pix) => void) => { const p = new Pix(8, 8, key.length * 13); fn(p); p.outline([12, 9, 6, 255]); addFrames(`item.${key}`, [p], 4, 7); };
  item('iron', p => { p.blob(4, 4.5, 2.8, 2.2, hex('#6fb6f2')); p.set(3, 3, hex('#e0f4ff')); });
  item('crim', p => { p.vline(3, 2, 5, hex('#ff4a6a')); p.vline(4, 1, 6, hex('#ff8098')); p.vline(5, 3, 4, hex('#b02040')); });
  item('coal', p => { p.blob(4, 4.5, 2.8, 2.2, hex('#3a342e')); p.blob(3.6, 4, 1.6, 1.2, hex('#5a524a')); p.set(3, 3, hex('#f0e8da')); p.set(5, 5, hex('#d8cfc0')); });
  item('ochre', p => { p.blob(4, 4.5, 2.6, 2.4, hex('#ffa12a')); p.set(3, 3, hex('#ffe0a0')); });
  item('jade', p => { p.vline(3, 2, 5, hex('#34e8a8')); p.vline(4, 1, 6, hex('#8fffd8')); p.vline(5, 3, 4, hex('#1a9a70')); });
  item('void', p => { p.rect(2, 2, 4, 4, hex('#b24dff')); p.set(2, 2, hex('#f0c8ff')); p.rect(4, 4, 2, 2, hex('#6a20a0')); });
  item('tech', p => { p.bevel(1, 2, 6, 5, hex('#7a5a2a')); p.rect(3, 4, 2, 1, hex('#ffcf5a')); });
  item('bonus', p => { p.bevel(1, 2, 6, 5, hex('#c8962a')); p.rect(3, 4, 2, 1, hex('#fff0a0')); });
  item('charge', p => { p.vline(3, 1, 6, hex('#57f0ff')); p.vline(4, 0, 7, hex('#dcfeff')); p.vline(5, 2, 5, hex('#1aa0c0')); });
}
