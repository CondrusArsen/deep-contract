// Launch cutscene: shuttle lands, crew boards, the core is lowered into the drill, the planet's core detonates,
// cut to orbit. Drawn with the world renderer's primitives at integer scale.
import type { GameState } from '../core/types';
import { CORE_X, W } from '../core/world';
import { frame } from './pixel';
import type { Renderer } from './renderer';

let stars: { x: number; y: number; b: number }[] = [];

export function drawLaunch(r: Renderer, s: GameState, t: number) {
  const ctx = r.ctx, k = r.cam.k;
  if (t < 9.2) {
    // on the platform
    r.cam.follow = true; r.cam.tx = W / 2; r.cam.ty = -3;
    const coreDrop = t < 4.5 ? 0 : Math.min(3.2, (t - 4.5) * 0.9);
    const view = { dig: false, selMount: -1, selPad: -1, selTurret: -1, selBuilding: -1, reticle: null, hoverCell: -1, t, previewTurret: null, highlightCells: [], tutTarget: null, flashCells: [], flashT: 0 };
    // temporarily move the core for the drop by shifting a fake phase: draw world normally, then overlay
    r.hideWorkers = t > 4.2; // the crew has boarded
    r.draw(s, view, 1 / 60);
    const S = r.S;
    const { ox, oy } = r.origin();
    const X = (x: number) => Math.round(x * S + ox), Y = (y: number) => Math.round(y * S + oy);
    // shuttle
    const shY = t < 2.5 ? -30 + (t / 2.5) * 26.2 : t < 7 ? -3.8 : -3.8 - (t - 7) * (t - 7) * 6;
    drawShuttle(ctx, X(CORE_X), Y(shY), k, t, 3);
    if (t > 7) { for (let i = 0; i < 6; i++) r.fx.ps.push({ x: CORE_X + (Math.random() - 0.5), y: shY + 0.2, vx: (Math.random() - 0.5) * 2, vy: 4 + Math.random() * 3, life: 0.5, max: 0.5, col: Math.random() < 0.5 ? '#ffd27a' : '#ff8a2a', size: 2, grav: 0, drag: 1, glow: true }); }
    // core lowering into the drill with steam
    if (coreDrop > 0) {
      const f = frame('core.glow', Math.floor(t * 8));
      if (f) {
        // the core sinks through the deck hatch into the drill; clip below the deck floor so it disappears downward
        ctx.save();
        ctx.beginPath(); ctx.rect(X(CORE_X - 2), Y(-4), Math.round(4 * S), Math.round(4 + 2.4) * S); ctx.clip();
        ctx.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, X(CORE_X) - f.ax * k, Y(-1.6 + coreDrop) - f.ay * k, f.sw * k, f.sh * k);
        ctx.restore();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(X(CORE_X), Y(-1.6 + coreDrop), 0, X(CORE_X), Y(-1.6 + coreDrop), 4 * S);
        g.addColorStop(0, `rgba(255,170,60,${0.25 + coreDrop * 0.12})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(X(CORE_X - 4), Y(-5.6 + coreDrop), 8 * S, 8 * S);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (Math.random() < 0.6) r.fx.smoke(CORE_X + (Math.random() - 0.5) * 3, 0.5, 1, 'rgba(220,220,220,0.5)', -1.5);
      r.fx.shake = Math.max(r.fx.shake, 0.08 + coreDrop * 0.05);
    }
    if (t > 8.2) { const a = Math.min(1, (t - 8.2) / 1); ctx.fillStyle = `rgba(255,245,210,${a})`; ctx.fillRect(0, 0, r.cw, r.ch); }
    caption(r, t < 2.5 ? 'EVACUATION SHUTTLE INBOUND' : t < 4.5 ? 'CREW BOARDING' : t < 8 ? 'LOWERING THE CORE INTO THE DRILL' : '');
  } else {
    // orbit
    const tt = t - 9.2;
    ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, r.cw, r.ch);
    if (!stars.length) for (let i = 0; i < 160; i++) stars.push({ x: Math.random(), y: Math.random(), b: Math.random() });
    for (const st of stars) { ctx.fillStyle = `rgba(255,240,220,${0.3 + st.b * 0.7})`; ctx.fillRect(Math.round(st.x * r.cw), Math.round(st.y * r.ch), k, k); }
    const cx = r.cw / 2, cy = r.ch * 0.55, R = Math.min(r.cw, r.ch) * 0.28;
    const px = Math.max(2, k * 2);
    const biomeCol = s.contract.biome === 'frost' ? ['#8fb8d8', '#5a7a9a', '#dfefff'] : s.contract.biome === 'jungle' ? ['#4a7a3a', '#2e5a2a', '#9ac06a'] : ['#8a6a4a', '#5a4632', '#b8966a'];
    for (let y = -R; y < R; y += px) for (let x = -R; x < R; x += px) {
      const d = Math.hypot(x, y);
      if (d > R) continue;
      const n = Math.sin(x * 0.05 + y * 0.03) + Math.sin(x * 0.021 - y * 0.047);
      let col = n > 0.6 ? biomeCol[2] : n > -0.3 ? biomeCol[0] : biomeCol[1];
      const shadeF = (x + y) / (2 * R);
      if (shadeF > 0.25) col = '#241a14';
      // cracks glowing outward from the drill site
      const ang = Math.atan2(y, x);
      const crack = Math.abs(Math.sin(ang * 5 + d * 0.02)) < 0.08 + tt * 0.02 && d < R * Math.min(1, tt * 0.6);
      ctx.fillStyle = crack ? (Math.random() < 0.5 ? '#ffd27a' : '#ff6a1a') : col;
      ctx.fillRect(Math.round(cx + x), Math.round(cy + y), px, px);
    }
    if (tt > 1.2) { const a = Math.max(0, 1 - (tt - 1.2) / 1.2); ctx.fillStyle = `rgba(255,220,150,${a * 0.8})`; ctx.beginPath(); ctx.arc(cx, cy, R * (1 + (tt - 1.2) * 0.6), 0, Math.PI * 2); ctx.fill(); }
    // shuttle leaving
    drawShuttle(ctx, Math.round(cx + R * 1.2 + tt * 40 * k), Math.round(cy - R * 1.1 - tt * 26 * k), k, t, 1);
    caption(r, tt < 1.5 ? 'CORE DETONATION' : 'CONTRACT FULFILLED');
  }
}

function caption(r: Renderer, text: string) {
  if (!text) return;
  const ctx = r.ctx;
  ctx.font = `${Math.round(22 * r.dpr)}px 'DC Terminal', monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000'; ctx.fillText(text, r.cw / 2 + 2, r.ch * 0.16 + 2);
  ctx.fillStyle = '#ffb23c'; ctx.fillText(text, r.cw / 2, r.ch * 0.16);
}

function drawShuttle(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, t: number, scale = 1) {
  const u = Math.max(1, Math.round(k * scale));
  const rows = [
    '.....aa.....', '....abba....', '...abbbba...', '...abccba...', '..abbccbba..', '..abbbbbba..', '.abbbddbbba.', '.abbbddbbba.',
    'abbbbbbbbbba', 'abeebbbbeeba', 'aeeeabbaeeea', 'ae..a..a..ea', 'a...f..f...a',
  ];
  const pal: Record<string, string> = { a: '#1a1410', b: '#c8c0b0', c: '#6ff3ff', d: '#d84030', e: '#6a7078', f: Math.floor(t * 20) % 2 ? '#ffd27a' : '#ff8a2a' };
  const w = rows[0].length * u, hgt = rows.length * u;
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
    const c = rows[j][i];
    if (c === '.') continue;
    ctx.fillStyle = pal[c];
    ctx.fillRect(x - w / 2 + i * u, y - hgt + j * u, u, u);
  }
}
