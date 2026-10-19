// Original procedural pixel art: crews (three platforms × three roles), underground enemies, the swarm and bosses.
import { addFrames, hex, mix, Pix, shade, SPR, type RGBA } from '../pixel';

const OUT: RGBA = [16, 11, 8, 255];
export const ROLE_COL: Record<string, string> = { miner: '#ffc23c', hauler: '#4fb0ff', guard: '#ff5d4a' };

type Pose = 'idle' | 'walk' | 'climb' | 'act';

function human(p: Pix, role: string, pose: Pose, f: number, kind: 'mule' | 'stone') {
  const helmet = hex(ROLE_COL[role]);
  const skin = kind === 'stone' ? hex('#e0a47a') : hex('#e7b58a');
  const body = kind === 'stone' ? hex(role === 'guard' ? '#5a4a3a' : '#6a4a2a') : hex(role === 'guard' ? '#4a5a3e' : '#5a4e3c');
  const legs = hex('#2e2a26');
  const wide = kind === 'stone' ? 1 : 0;
  const bob = pose === 'idle' ? (f % 2) : pose === 'walk' ? (f % 2) : 0;
  const x0 = 3 - wide, top = 3 + bob + (kind === 'stone' ? 2 : 0);
  if (pose === 'climb') {
    // back view on a ladder: arms up alternating
    p.rect(x0 + 1, top, 5 + wide * 2, 3, helmet);
    p.rect(x0 + 1, top + 3, 5 + wide * 2, 2, shade(skin, 0.8));
    p.rect(x0, top + 5, 7 + wide * 2, 4, body);
    const up = f % 2;
    p.rect(x0 - 1, top + (up ? 1 : 4), 1, 4, skin); p.rect(x0 + 7 + wide * 2, top + (up ? 4 : 1), 1, 4, skin);
    p.rect(x0 + 1, top + 9, 2, 3 - (up ? 1 : 0), legs); p.rect(x0 + 4 + wide * 2, top + 9, 2, 3 - (up ? 0 : 1), legs);
    p.outline(OUT);
    return;
  }
  // helmet + lamp
  p.rect(x0 + 1, top, 6 + wide, 2, helmet);
  p.rect(x0, top + 2, 8 + wide, 1, shade(helmet, 0.8));
  if (role === 'miner') p.set(x0 + 7 + wide, top + 1, hex('#fff6c0'));
  // head
  p.rect(x0 + 2, top + 3, 5 + wide, 3, skin);
  p.set(x0 + 5 + wide, top + 4, hex('#1a1410'));
  if (kind === 'stone') { p.rect(x0 + 1, top + 5, 6 + wide, 3, hex('#c0602a')); p.set(x0 + 6 + wide, top + 7, hex('#e08040')); }
  // torso
  const ty = top + 6;
  p.rect(x0 + 1, ty, 6 + wide, 4, body);
  p.hline(x0 + 1, ty, 6 + wide, shade(body, 1.3));
  p.set(x0 + 3, ty + 1, helmet); // role badge
  if (role === 'hauler') { p.bevel(x0 - 2, ty - 1, 4, 5, hex('#8a6a3a')); }
  if (role === 'guard' && kind === 'stone') { p.rect(x0 - 2, ty, 3, 4, hex('#606870')); p.set(x0 - 2, ty + 4, hex('#ff9a2a')); }
  // legs
  const ly = ty + 4;
  const lh = 16 - ly;
  if (pose === 'walk') {
    const ph = f % 4;
    const a = ph === 0 ? 0 : ph === 1 ? 1 : ph === 2 ? 0 : -1;
    p.rect(x0 + 2 + a, ly, 2, lh, legs); p.rect(x0 + 5 - a + wide, ly, 2, lh, shade(legs, 1.3));
  } else {
    p.rect(x0 + 2, ly, 2, lh, legs); p.rect(x0 + 5 + wide, ly, 2, lh, shade(legs, 1.3));
  }
  // arms & tools
  const ax = x0 + 6 + wide, ay = ty + 1;
  if (role === 'miner') {
    if (kind === 'stone') {
      // blaster: TNT stick in hand
      const lift = pose === 'act' ? f % 3 : 0;
      p.rect(ax, ay - lift, 2, 3, skin);
      p.rect(ax + 1, ay - 3 - lift, 2, 3, hex('#d8402a')); p.set(ax + 2, ay - 4 - lift, hex('#fff08a'));
    } else if (pose === 'act') {
      const k = f % 3;
      const hx = k === 0 ? ax + 1 : k === 1 ? ax + 3 : ax + 4, hy = k === 0 ? ay - 5 : k === 1 ? ay - 3 : ay + 1;
      p.line(ax, ay + 1, hx, hy, hex('#8a6a40'));
      p.line(hx - 2, hy - (k === 2 ? -1 : 1), hx + 2, hy + (k === 2 ? 1 : 1), hex('#b8c4cc'));
      p.rect(ax, ay, 2, 2, skin);
    } else {
      p.rect(ax, ay, 1, 3, skin);
      p.line(ax - 1, ay + 3, ax + 3, ay - 2, hex('#8a6a40')); p.line(ax + 1, ay - 3, ax + 4, ay - 1, hex('#b8c4cc'));
    }
  } else if (role === 'guard') {
    const rec = pose === 'act' && f % 3 === 1 ? -1 : 0;
    p.rect(ax - 1, ay + 1, 2, 2, skin);
    p.hline(ax - 1 + rec, ay + 1, 6, hex('#3a4046')); p.hline(ax + 1 + rec, ay + 2, 3, hex('#23282c'));
    if (pose === 'act' && f % 3 === 1) p.set(ax + 6, ay + 1, hex('#ffe08a'));
  } else {
    p.rect(ax, ay, 1, 3, skin);
  }
  p.outline(OUT);
}

function myrmid(p: Pix, role: string, pose: Pose, f: number) {
  const col = hex(ROLE_COL[role]);
  const chit = hex('#4a3a2e');
  const leg = hex('#2a201a');
  const bob = pose === 'walk' ? f % 2 : 0;
  const y = 9 + bob;
  if (pose === 'climb') {
    p.blob(6, 7, 3, 4, chit); p.set(6, 5, col); p.blob(6, 12, 2.5, 3, shade(col, 0.8));
    const up = f % 2;
    p.line(3, 6, 1, up ? 3 : 6, leg); p.line(9, 6, 11, up ? 6 : 3, leg); p.line(3, 11, 1, up ? 14 : 11, leg); p.line(9, 11, 11, up ? 11 : 14, leg);
    p.outline(OUT);
    return;
  }
  // abdomen (left), thorax, head (right)
  p.blob(3.5, y, 3, 2.6, role === 'hauler' ? hex('#3a6a9a') : shade(col, 0.75));
  if (role === 'hauler') { p.hline(2, y - 1, 3, hex('#8fd0ff')); }
  p.blob(7, y, 2, 1.8, chit);
  p.blob(10, y - 1, 2.2, 2, chit);
  p.set(11, y - 2, role === 'guard' ? hex('#ff4a3a') : hex('#ffe060'));
  // mandibles
  const open = pose === 'act' ? f % 2 : 0;
  const mc = role === 'guard' ? hex('#c8b8a0') : hex('#a89070');
  p.line(12, y - 1, 14, y - 1 - open, mc); p.line(12, y, 14, y + open, mc);
  if (role === 'guard') { p.set(15, y - 1 - open, mc); p.set(15, y + open, mc); }
  // antennae
  p.line(10, y - 3, 12, y - 6, leg); p.set(13, y - 6, col);
  // legs (3 visible)
  const ph = pose === 'walk' ? f % 4 : 0;
  for (let k = 0; k < 3; k++) {
    const lx = 5 + k * 2.2;
    const sw = ((k + ph) % 2 ? 1 : -1) * (pose === 'walk' ? 1 : 0);
    p.line(lx, y + 1, lx + sw - 1, 15, leg);
  }
  p.set(4, y - 2, col); // role mark
  p.outline(OUT);
}

export function buildUnitArt() {
  const poses: [Pose, number][] = [['idle', 2], ['walk', 4], ['climb', 2], ['act', 3]];
  for (const plat of ['mule', 'brood', 'stone'] as const) {
    for (const role of ['miner', 'hauler', 'guard']) {
      for (const [pose, n] of poses) {
        const right: Pix[] = [];
        for (let f = 0; f < n; f++) {
          const p = new Pix(plat === 'brood' ? 16 : 14, 16, 3);
          if (plat === 'brood') myrmid(p, role, pose, f); else human(p, role, pose, f, plat);
          right.push(p);
        }
        addFrames(`w.${plat}.${role}.${pose}.r`, right, right[0].w / 2, 16);
        addFrames(`w.${plat}.${role}.${pose}.l`, right.map(p => p.flipX()), right[0].w / 2, 16);
      }
    }
  }
  // cocoon
  addFrames('cocoon', [0, 1].map(f => { const p = new Pix(10, 12, 5); p.blob(5, 7, 3.5 + f * 0.3, 4.5, hex('#d8e090')); p.hline(3, 6, 4, hex('#a8b060')); p.hline(3, 9, 4, hex('#a8b060')); p.outline(OUT); return p; }), 5, 12);
  // TNT charge
  addFrames('tnt', [0, 1].map(f => { const p = new Pix(8, 10, 6); p.rect(2, 3, 4, 6, hex('#d8402a')); p.hline(2, 5, 4, hex('#f0e0c0')); p.line(4, 3, 5, 0, hex('#5a4a3a')); if (f) p.set(5, 0, hex('#fff08a')); p.outline(OUT); return p; }), 4, 10);

  // ---- underground ----
  if (!SPR.has('u.mite')) addFrames('u.mite', [0, 1, 2, 3].map(f => {
    const p = new Pix(12, 10, 7);
    p.blob(6, 5, 4.2, 3, hex('#7a6a5a'));
    p.hline(3, 3, 6, hex('#a8988a'));
    p.set(9, 4, hex('#ff5a2a')); p.set(10, 5, hex('#ff5a2a'));
    for (let k = 0; k < 3; k++) { const sw = (k + f) % 2 ? 1 : -1; p.line(4 + k * 2, 7, 3 + k * 2 + sw, 9, hex('#3a3028')); }
    p.outline(OUT); return p;
  }), 6, 9);
  addFrames('u.borer.head', [0, 1].map(f => {
    const p = new Pix(14, 14, 8);
    p.blob(7, 7, 6, 6, hex('#b0605a'));
    p.disc(9, 7, 3.2, hex('#2a0c0a'));
    for (let k = 0; k < 6; k++) { const a = k * 1.047 + f * 0.5; p.set(9 + Math.cos(a) * 3, 7 + Math.sin(a) * 3, hex('#f0e0c8')); }
    p.outline(OUT); return p;
  }), 7, 7);
  addFrames('u.borer.seg', [0].map(() => { const p = new Pix(12, 12, 9); p.blob(6, 6, 5, 5, hex('#9a5048')); p.hline(2, 5, 8, hex('#c07068')); p.outline(OUT); return p; }), 6, 6);

  // ---- swarm ----
  const bug = (key: string, n: number, draw: (p: Pix, f: number) => void, w: number, h: number) => {
    if (SPR.has(`e.${key}`)) return; // licensed sprite already registered
    const frames: Pix[] = [];
    for (let f = 0; f < n; f++) { const p = new Pix(w, h, key.length * 17); draw(p, f); frames.push(p); }
    addFrames(`e.${key}`, frames, w / 2, h / 2);
  };
  const wings = (p: Pix, cx: number, cy: number, span: number, f: number, col: RGBA) => {
    const up = [-3, -1, 1][f % 3];
    p.line(cx, cy, cx - span, cy + up, col); p.line(cx, cy - 1, cx - span + 1, cy + up - 1, col);
    p.line(cx, cy, cx + span, cy + up, col); p.line(cx, cy - 1, cx + span - 1, cy + up - 1, col);
  };
  const wingCol = hex('#d8e8f0', 150);
  bug('skitter', 3, (p, f) => {
    wings(p, 8, 6, 7, f, wingCol);
    p.blob(8, 9, 4.5, 3.8, hex('#c23a36'));
    p.hline(5, 7, 6, hex('#e8645a'));
    p.set(6, 10, hex('#ffd24a')); p.set(10, 10, hex('#ffd24a'));
    p.line(5, 12, 4, 15, hex('#3a1414')); p.line(11, 12, 12, 15, hex('#3a1414')); p.line(8, 13, 8, 15, hex('#3a1414'));
    p.outline(OUT);
  }, 16, 16);
  bug('skitterling', 3, (p, f) => {
    wings(p, 5, 4, 4, f, wingCol);
    p.blob(5, 6, 3, 2.5, hex('#d0504a')); p.set(4, 6, hex('#ffd24a')); p.set(6, 6, hex('#ffd24a'));
    p.outline(OUT);
  }, 10, 10);
  bug('darter', 3, (p, f) => {
    wings(p, 8, 5, 6, f, hex('#ffe0c0', 140));
    p.ellipse(8, 8, 2.5, 5.5, hex('#ff8a2a')); p.vline(8, 4, 8, hex('#ffc070')); p.set(7, 12, hex('#fff08a')); p.set(9, 12, hex('#fff08a'));
    p.line(8, 13, 8, 15, hex('#6a2a10'));
    p.outline(OUT);
  }, 16, 16);
  bug('carapace', 4, (p, f) => {
    // vertical crawler (top-down-ish, heading down)
    for (let k = 0; k < 3; k++) { const sw = (k + f) % 2 ? 2 : 0; p.line(4, 6 + k * 4, 0, 5 + k * 4 + sw, hex('#2a1612')); p.line(15, 6 + k * 4, 19, 5 + k * 4 + sw, hex('#2a1612')); }
    p.blob(10, 11, 7, 8.5, hex('#7a2a24'));
    p.vline(10, 4, 15, hex('#3a120e'));
    p.hline(5, 8, 10, hex('#b04a3a')); p.hline(5, 13, 10, hex('#9a3a30'));
    p.blob(10, 19, 3.5, 2.5, hex('#4a1a14')); p.set(8, 20, hex('#ffcc3a')); p.set(12, 20, hex('#ffcc3a'));
    p.outline(OUT);
  }, 20, 24);
  bug('shieldbug', 3, (p, f) => {
    wings(p, 9, 6, 7, f, wingCol);
    p.blob(9, 10, 5.5, 4.5, hex('#5a3aa0'));
    p.hline(5, 8, 8, hex('#8a6ad0'));
    p.set(7, 11, hex('#6ff3ff')); p.set(11, 11, hex('#6ff3ff'));
    p.outline(OUT);
  }, 18, 16);
  bug('broodsac', 3, (p, f) => {
    wings(p, 10, 5, 6, f, wingCol);
    p.blob(10, 11, 7, 6.5 + (f === 1 ? 0.4 : 0), hex('#d88a9a'));
    p.line(5, 9, 9, 14, hex('#a04a60')); p.line(14, 8, 11, 15, hex('#a04a60'));
    for (let k = 0; k < 4; k++) p.disc(6 + k * 3, 12 + (k % 2), 1, hex('#fff0c0'));
    p.outline(OUT);
  }, 20, 18);
  bug('detonator', 3, (p, f) => {
    wings(p, 8, 5, 6, f, wingCol);
    p.blob(8, 10, 5, 5, hex('#5a2a14'));
    p.blob(8, 11, 3.2, 3.2, f === 1 ? hex('#ffd24a') : hex('#ff8a2a'));
    p.set(6, 6, hex('#ff3a2a')); p.set(10, 6, hex('#ff3a2a'));
    p.outline(OUT);
  }, 16, 16);
  bug('spitter', 3, (p, f) => {
    wings(p, 9, 5, 6, f, wingCol);
    p.blob(9, 10, 5.5, 4.5, hex('#7a9a2a'));
    p.blob(9, 14, 2.5, 1.8, hex('#c8e040'));
    p.set(7, 9, hex('#ff4a3a')); p.set(11, 9, hex('#ff4a3a'));
    p.outline(OUT);
  }, 18, 17);
  bug('rimeback', 4, (p, f) => {
    for (let k = 0; k < 3; k++) { const sw = (k + f) % 2 ? 2 : 0; p.line(4, 6 + k * 4, 0, 5 + k * 4 + sw, hex('#1a2a3a')); p.line(15, 6 + k * 4, 19, 5 + k * 4 + sw, hex('#1a2a3a')); }
    p.blob(10, 11, 7, 8.5, hex('#4a86b8'));
    p.line(6, 5, 10, 9, hex('#dff4ff')); p.line(14, 6, 11, 12, hex('#bfe8ff')); p.vline(10, 4, 15, hex('#1f4a70'));
    p.blob(10, 19, 3.5, 2.5, hex('#2a4a6a')); p.set(8, 20, hex('#aef0ff')); p.set(12, 20, hex('#aef0ff'));
    p.outline(OUT);
  }, 20, 24);
  bug('mender', 3, (p, f) => {
    p.blob(10, 9, 7, 6 + (f % 2) * 0.5, hex('#5aa870', 230));
    for (let k = 0; k < 5; k++) p.set(5 + k * 2.4, 13 + (k + f) % 3, hex('#b8ffc8'));
    p.disc(10, 8, 2, hex('#e8fff0'));
    p.outline(OUT);
  }, 20, 18);
  bug('sporeling', 3, (p, f) => {
    p.blob(12, 12, 9, 8.5 + (f % 2) * 0.4, hex('#8a6aa0'));
    for (let k = 0; k < 7; k++) { const a = k * 0.9 + f * 0.2; p.disc(12 + Math.cos(a) * 6, 12 + Math.sin(a) * 5, 1.4, hex('#e0c060')); }
    p.set(9, 10, hex('#ff5a4a')); p.set(14, 10, hex('#ff5a4a'));
    p.outline(OUT);
  }, 24, 24);
  // bosses: body only; legs/threads/shields are drawn at runtime
  bug('weaver', 2, (p, f) => {
    p.blob(32, 30, 20, 16, hex('#5a2a3a'));
    for (let k = 0; k < 14; k++) { const x = 16 + (k * 7) % 30, y = 20 + ((k * 5) % 16); p.blob(x, y, 3.2 + (k % 3) * 0.5, 3, f && k % 4 === 0 ? hex('#ffd070') : hex('#e87a2a')); p.set(x - 1, y - 1, hex('#ffe0a0')); }
    p.blob(32, 46, 9, 7, hex('#3a1a24'));
    for (let k = 0; k < 4; k++) p.set(28 + k * 2.6, 45, hex('#ff3a2a'));
    p.line(27, 51, 25, 55, hex('#e0d0c0')); p.line(37, 51, 39, 55, hex('#e0d0c0'));
    p.outline(OUT);
  }, 64, 60);
  bug('rimeclad', 2, (p, f) => {
    p.blob(30, 32, 18, 20, hex('#3f6a94'));
    for (let k = 0; k < 7; k++) { const x = 16 + k * 5, h = 8 + (k % 3) * 4; p.vline(x, 14 - (k % 2) * 2, h, hex('#bfe8ff')); p.vline(x + 1, 15 - (k % 2) * 2, h - 1, hex('#7fc0ea')); }
    p.blob(30, 44, 8, 6, hex('#1f3a58'));
    p.set(26, 43, f ? hex('#ffffff') : hex('#9ef0ff')); p.set(34, 43, f ? hex('#ffffff') : hex('#9ef0ff'));
    p.outline(OUT);
  }, 60, 60);
  bug('bloomrot', 2, (p, f) => {
    p.blob(30, 30, 22, 19 + f * 0.6, hex('#6a4a7a'));
    for (let k = 0; k < 12; k++) { const a = k * 0.52; p.disc(30 + Math.cos(a) * 15, 30 + Math.sin(a) * 12, 3 + (k % 3), k % 2 ? hex('#e0c060') : hex('#c89040')); }
    p.disc(30, 30, 6, hex('#2a1a30')); p.disc(30, 30, 3, f ? hex('#ff7a5a') : hex('#ff4a3a'));
    p.outline(OUT);
  }, 60, 60);
  // shared: small drone (incubator swarmling), fly, drone drop
  addFrames('p.drone', [0, 1].map(f => { const p = new Pix(8, 8, 11); p.blob(4, 5, 2.5, 2, hex('#c8e060')); p.hline(1, 2 + f, 6, hex('#ffffff', 140)); p.outline(OUT); return p; }), 4, 4);
  addFrames('p.fly', [0, 1].map(f => { const p = new Pix(5, 5, 12); p.disc(2.5, 3, 1.3, hex('#304010')); p.hline(0, 1 + f, 5, hex('#ffffff', 120)); return p; }), 2, 2);
  void mix;
}
