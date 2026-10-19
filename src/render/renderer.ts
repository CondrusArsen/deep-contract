// World renderer: integer-scale pixel art on a canvas sized in device pixels.
import { BUILDINGS } from '../core/data/buildings';
import { ENEMIES } from '../core/data/enemies';
import { TURRETS } from '../core/data/turrets';
import { turretStats } from '../core/night';
import { digField } from '../core/tutorial';
import { B, type Enemy, type GameState, type Worker } from '../core/types';
import { CORE_X, CORE_Y, dist, ENTRY, LADDER_X, MINE_H, MINE_TOP, mountX, PAD_X, shaftTop, STOREY_FLOOR, storeysAvailable, W } from '../core/world';
import { BARREL } from './art/structures';
import { Fx } from './fx';
import { LICENSED } from './art/index';
import { frame, hex, type Frame } from './pixel';

export interface ViewState {
  dig: boolean; selMount: number; selPad: number; selTurret: number; selBuilding: number;
  reticle: { type: string; x: number; y: number; r: number } | null; hoverCell: number; t: number;
  previewTurret: string | null; highlightCells: number[];
  /** the guide's current world target (arrow + outline), and cells flashed for a moment (e.g. all coal) */
  tutTarget: { x: number; y: number; w: number; h: number; label: string } | null;
  flashCells: number[]; flashT: number;
}

export class Camera {
  x = 8.5; y = -4; k = 3; // world centre (blocks) and zoom (device px per art px)
  tx = 8.5; ty = -4; follow = true;
}

const TILE = 16;

export class Renderer {
  cv: HTMLCanvasElement; ctx: CanvasRenderingContext2D;
  dpr = 1; cw = 0; ch = 0;
  cam = new Camera();
  fx = new Fx();
  bgCache: HTMLCanvasElement | null = null; bgKey = '';
  constructor(cv: HTMLCanvasElement) {
    this.cv = cv;
    this.ctx = cv.getContext('2d', { alpha: false })!;
  }
  resize() {
    this.dpr = Math.min(3, window.devicePixelRatio || 1);
    const r = this.cv.getBoundingClientRect();
    this.cw = Math.max(1, Math.round(r.width * this.dpr));
    this.ch = Math.max(1, Math.round(r.height * this.dpr));
    if (this.cv.width !== this.cw || this.cv.height !== this.ch) { this.cv.width = this.cw; this.cv.height = this.ch; }
    this.ctx.imageSmoothingEnabled = false;
    this.bgCache = null;
  }
  get S() { return TILE * this.cam.k; }

  private shaftCache: { key: string; cv: HTMLCanvasElement } | null = null;
  /** The shaft's back wall (with its haze) and the rock walls, at one pixel per texel. They only change when the
   *  shaft grows or the biome changes; drawn scaled by the integer zoom with smoothing off, the result is identical
   *  to drawing every tile, at a fraction of the cost (about 900 tile draws per frame on a phone otherwise). */
  shaftLayer(biome: string, yTopRow: number) {
    const key = `${biome}|${yTopRow}`;
    if (this.shaftCache?.key === key) return this.shaftCache.cv;
    const cols = W + 4, rows = MINE_TOP - yTopRow;
    const cv = document.createElement('canvas'); cv.width = cols * TILE; cv.height = rows * TILE;
    const c = cv.getContext('2d')!;
    const put = (f: Frame | undefined, x: number, y: number) => { if (f) c.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, (x + 2) * TILE - f.ax, (y - yTopRow) * TILE - f.ay, f.sw, f.sh); };
    for (let y = yTopRow; y < 0; y++) for (let x = 1; x < W - 1; x++) put(frame(`blk.${biome}.back`, (x * 7 + y * 13) & 3), x, y);
    c.fillStyle = 'rgba(8,10,16,0.35)'; c.fillRect(3 * TILE, 0, (W - 2) * TILE, -yTopRow * TILE); // darker haze in the shaft
    for (let y = yTopRow; y < MINE_TOP; y++) for (const x of [-2, -1, 0, W - 1, W, W + 1]) put(frame(`blk.${biome}.${B.Rock}`, (x * 5 + y * 3) & 3), x, y);
    this.shaftCache = { key, cv };
    return cv;
  }
  /** zoom that fits `blocks` across the canvas width */
  /** zoom that fits `blocks` across the canvas width; rounds up when the overflow is under one block per side */
  fitK(blocks: number) {
    const f = this.cw / (blocks * TILE);
    const up = Math.ceil(f);
    if ((blocks * TILE * up - this.cw) / (TILE * up) <= 2.05) return Math.max(1, up);
    return Math.max(1, Math.floor(f));
  }
  minK() { return Math.max(1, Math.floor(this.cw / (24 * TILE))); }
  maxK() { return Math.max(this.fitK(17) + 1, Math.ceil((64 * this.dpr) / TILE)); }
  origin() {
    const S = this.S;
    return { ox: Math.round(this.cw / 2 - this.cam.x * S), oy: Math.round(this.ch / 2 - this.cam.y * S) };
  }
  toScreen(x: number, y: number) { const { ox, oy } = this.origin(); return { x: (x * this.S + ox) / this.dpr, y: (y * this.S + oy) / this.dpr }; }
  toWorld(cssX: number, cssY: number) { const { ox, oy } = this.origin(); return { x: (cssX * this.dpr - ox) / this.S, y: (cssY * this.dpr - oy) / this.S }; }

  insetTop = 0; insetBottom = 0; // CSS px covered by HUD at the top / bottom
  hideWorkers = false; // set by the launch cutscene once the crew has boarded
  /** camera y that puts world y at the centre of the HUD-free band */
  centerY(y: number) { return y - ((this.insetTop - this.insetBottom) / 2) * this.dpr / this.S; }
  clampCam(s: GameState) {
    const c = this.cam;
    const halfW = this.cw / 2 / this.S;
    const up = this.ch / 2 / this.S - (this.insetTop * this.dpr) / this.S;
    const down = this.ch / 2 / this.S - (this.insetBottom * this.dpr) / this.S;
    const top = shaftTop(s) - 3 + up, bottom = MINE_TOP + MINE_H + 2 - down;
    const left = -1 + halfW, right = W + 1 - halfW;
    const cy = (y: number) => (top > bottom ? (top + bottom) / 2 : Math.max(top, Math.min(bottom, y)));
    const cx = (x: number) => (left > right ? W / 2 : Math.max(left, Math.min(right, x)));
    c.y = cy(c.y); c.x = cx(c.x);
    // the follow target too, so easing ends where the view can actually be
    if (c.follow) { c.ty = cy(c.ty); c.tx = cx(c.tx); }
  }

  // ---------------------------------------------------------------------------------------------
  draw(s: GameState, v: ViewState, dt: number) {
    const ctx = this.ctx, S = this.S, k = this.cam.k;
    this.fx.update(dt);
    // camera easing
    const c = this.cam;
    if (c.follow) { c.x += (c.tx - c.x) * Math.min(1, dt * 4); c.y += (c.ty - c.y) * Math.min(1, dt * 4); }
    this.clampCam(s);
    let { ox, oy } = this.origin();
    if (this.fx.shake > 0 && this.fx.shakeOn) { ox += Math.round((Math.random() - 0.5) * this.fx.shake * 8 * k); oy += Math.round((Math.random() - 0.5) * this.fx.shake * 8 * k); }
    const X = (x: number) => Math.round(x * S + ox), Y = (y: number) => Math.round(y * S + oy);
    const spr = (f: Frame | undefined, x: number, y: number, scale = 1, alpha = 1) => {
      if (!f) return;
      if (alpha < 1) ctx.globalAlpha = alpha;
      ctx.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, Math.round(x * S + ox - f.ax * k * scale), Math.round(y * S + oy - f.ay * k * scale), f.sw * k * scale, f.sh * k * scale);
      if (alpha < 1) ctx.globalAlpha = 1;
    };
    const px = (x: number, y: number, w: number, h: number, col: string) => { ctx.fillStyle = col; ctx.fillRect(X(x), Y(y), Math.max(1, Math.round(w * S)), Math.max(1, Math.round(h * S))); };
    const biome = s.contract.biome;
    const top = shaftTop(s);
    const night = s.phase === 'night';
    const t = v.t;

    // 1) background
    ctx.fillStyle = biome === 'frost' ? '#0b1016' : biome === 'jungle' ? '#0a0f0a' : '#0c0a08';
    ctx.fillRect(0, 0, this.cw, this.ch);
    this.drawParallax(s, ox, oy, S);

    // 2) shaft back wall and walls: static, pre-rendered once per shaft height and drawn in one call
    const yTopRow = Math.floor(top) - 2;
    const layer = this.shaftLayer(biome, yTopRow);
    ctx.drawImage(layer, X(-2), Y(yTopRow), layer.width * k, layer.height * k);
    // metal rails on the wall faces
    ctx.fillStyle = '#3a3e44'; ctx.fillRect(X(0.85), Y(yTopRow), Math.round(0.15 * S), (MINE_TOP - yTopRow) * S);
    ctx.fillRect(X(W - 1), Y(yTopRow), Math.round(0.15 * S), (MINE_TOP - yTopRow) * S);
    // wall decor on the inner faces (licensed plant/cave props where available)
    for (let y = Math.ceil(top); y < -1; y++) {
      const hsh = ((y * 73856093) ^ (s.stratum * 19349663)) >>> 0;
      if (hsh % 5 !== 0) continue;
      const side = hsh & 8 ? -1 : 1;
      const kinds = biome === 'jungle' ? ['decor.fern', 'decor.mushroom_brown', 'decor.spiderweb'] : biome === 'frost' ? ['decor.limestone_stromatolite', 'decor.spiderweb', 'decor.amethyst_crystal'] : ['decor.spiderweb', 'decor.limestone_stromatolite', 'decor.mushroom_red', 'decor.amethyst_crystal'];
      const f = frame(kinds[(hsh >> 4) % kinds.length]);
      if (!f) continue;
      ctx.globalAlpha = 0.7;
      ctx.save(); ctx.translate(X(side < 0 ? 1 : W - 1), Y(y + 1));
      if (side > 0) ctx.scale(-1, 1);
      ctx.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, 0, -f.sh * k, f.sw * k, f.sh * k);
      ctx.restore(); ctx.globalAlpha = 1;
    }
    // depth fog: the shaft darkens and cools toward the mouth
    {
      const g = ctx.createLinearGradient(0, Y(top - 2), 0, Y(-6));
      g.addColorStop(0, night ? 'rgba(20,10,30,0.75)' : 'rgba(10,8,14,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(X(1), Y(top - 2), (W - 2) * S, Y(-6) - Y(top - 2));
    }
    if (Math.random() < 0.15) this.fx.ps.push({ x: 1.5 + Math.random() * (W - 3), y: top + Math.random() * 3, vx: 0, vy: 0.6 + Math.random(), life: 4, max: 4, col: 'rgba(200,180,150,0.35)', size: 1, grav: 0, drag: 0 });
    // shaft mouth marker
    ctx.fillStyle = 'rgba(255,90,69,0.25)'; ctx.fillRect(X(1), Y(top - 0.1), (W - 2) * S, Math.max(1, Math.round(0.08 * S)));
    // mounts
    for (const m of s.mounts) {
      const mx = m.side < 0 ? 0.85 : W - 1.0;
      const f = frame('mount.socket');
      if (f) {
        ctx.save(); ctx.translate(X(mx + (m.side < 0 ? 0 : 0.35)), Y(m.y));
        if (m.side > 0) ctx.scale(-1, 1);
        ctx.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, m.side > 0 ? -f.sw * k : 0, -f.ay * k, f.sw * k, f.sh * k);
        ctx.restore();
      }
      if (m.turret < 0 && (night || v.selMount === m.id || v.dig === false)) {
        const a = v.selMount === m.id ? 1 : night ? 0.8 : 0.45;
        spr(frame('pad.hammer'), mountX(m.side) + (m.side < 0 ? 0.3 : -0.3), m.y, 1, a);
      }
      if (v.selMount === m.id) this.bracket(X(mountX(m.side) - 0.7), Y(m.y - 0.8), 1.4 * S, 1.6 * S, '#6ff3ff', k);
    }

    // 3) mine
    this.drawMine(s, v, X, Y, spr, px);

    // 4) platform
    this.drawPlatform(s, v, X, Y, spr, px, t);

    // 5) workers on deck & below
    if (!this.hideWorkers) for (const w of s.workers) this.drawWorker(s, w, spr, X, Y, t);
    for (const tn of s.tnt) spr(frame('tnt', Math.floor(t * 8)), tn.x, tn.y + 0.5);

    // 6) underground enemies
    for (const u of s.uenemies) {
      if (u.kind === 'mite') { spr(frame('u.mite', Math.floor(u.anim)), u.x, u.y + 0.45); }
      else {
        const inRock = (() => { const cx = Math.floor(u.x), cy = Math.floor(u.y - MINE_TOP); if (cx < 0 || cx >= W || cy < 0 || cy >= MINE_H) return true; return s.mine.kind[cy * W + cx] !== B.Empty; })();
        if (LICENSED.has('u.borer')) {
          const f = frame('u.borer', Math.floor(u.anim * 0.6));
          if (f) {
            ctx.globalAlpha = inRock ? 0.6 : 1;
            ctx.save(); ctx.translate(X(u.x), Y(u.y));
            const tgt = s.workers.find(w => w.below);
            if (tgt && tgt.x < u.x) ctx.scale(-1, 1);
            ctx.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, -f.ax * k, -f.ay * k, f.sw * k, f.sh * k);
            ctx.restore(); ctx.globalAlpha = 1;
          }
        } else {
          for (let sgi = 3; sgi >= 1; sgi--) spr(frame('u.borer.seg'), u.x - Math.cos(u.anim * 0.5) * 0.35 * sgi, u.y - Math.sin(u.anim * 0.7) * 0.3 * sgi + 0.1 * sgi, 1, inRock ? 0.55 : 1);
          spr(frame('u.borer.head', Math.floor(u.anim * 0.5)), u.x, u.y, 1, inRock ? 0.7 : 1);
        }
        if (inRock && Math.random() < 0.08) this.fx.burst(u.x, u.y, 1, ['#6a5040'], 1, 0.3, 4);
      }
      if (u.hp < u.maxHp) this.hpBar(X(u.x - 0.5), Y(u.y - 0.8), 1 * S, u.hp / u.maxHp, k);
      if (u.hurtT > 0) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(X(u.x - 0.4), Y(u.y - 0.4), 0.8 * S, 0.8 * S); }
    }
    // spore clouds
    for (const cl of s.clouds) { ctx.fillStyle = `rgba(190,230,80,${0.12 + 0.1 * Math.sin(t * 6)})`; ctx.beginPath(); ctx.arc(X(cl.x), Y(cl.y), cl.r * S, 0, Math.PI * 2); ctx.fill(); }

    // 7) turrets
    for (const tu of s.turrets) {
      const m = s.mounts.find(q => q.id === tu.mount);
      if (!m) continue;
      const tx = mountX(m.side), ty = m.y;
      spr(frame(`t.${tu.type}`, m.side < 0 ? 0 : 1), tx, ty);
      const bar = BARREL[tu.type];
      if (bar && bar[0] > 0) this.barrel(tx, ty, tu.ang, bar, X, Y, k, tu.overclock > 0);
      if (tu.disabled > 0) { ctx.fillStyle = 'rgba(160,220,60,0.45)'; ctx.fillRect(X(tx - 0.5), Y(ty - 0.5), S, S); }
      if (tu.stars) this.pips(X(tx) - (tu.stars * 2 * k) / 2, Y(ty + 0.62), tu.stars, k);
      // continuous beams
      if (tu.beamT > 0) {
        const d = TURRETS[tu.type];
        const e = s.enemies.find(q => q.id === tu.target);
        if (d.proj === 'wall') this.beamLine(X(tx), Y(ty), X(m.side < 0 ? W - 1 : 1), Y(ty), '#ff4a3a', '#ffd0c0', k);
        else if (e && d.proj === 'flame') this.flame(tx, ty, e.x, e.y, X, Y, k, t);
        else if (e && tu.type === 'cryo') this.beamLine(X(tx), Y(ty), X(e.x), Y(e.y), '#6ff3ff', '#e8ffff', k);
      }
      if (v.selTurret === tu.id) {
        const st = turretStats(s, tu);
        this.rangeRing(X(tx), Y(ty), st.range * S, k);
        this.bracket(X(tx - 0.8), Y(ty - 0.8), 1.6 * S, 1.6 * S, '#6ff3ff', k);
      }
    }
    if (v.selMount >= 0 && v.previewTurret) {
      const m = s.mounts.find(q => q.id === v.selMount);
      if (m) this.rangeRing(X(mountX(m.side)), Y(m.y), TURRETS[v.previewTurret].range * S * (1 + 0.12 * s.mods.filter(q => q === 'radius').length), k);
    }

    // 8) swarm
    for (const e of s.enemies) this.drawEnemy(s, e, spr, X, Y, k, t);

    // 9) projectiles
    for (const p of s.projectiles) {
      if (p.kind === 'bullet') { ctx.fillStyle = '#fff2b0'; const len = 0.35; ctx.fillRect(X(p.x) - k, Y(p.y) - k, 2 * k, 2 * k); ctx.fillStyle = 'rgba(255,210,120,0.6)'; ctx.fillRect(X(p.x - p.vx * 0.012 * len * 6) - k / 2, Y(p.y - p.vy * 0.012 * len * 6) - k / 2, k, k); }
      else if (p.kind === 'rocket') { ctx.fillStyle = '#d8d0c0'; ctx.fillRect(X(p.x) - k, Y(p.y) - k, 3 * k, 2 * k); this.fx.ps.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.35, max: 0.35, col: 'rgba(200,190,180,0.5)', size: 2, grav: -1, drag: 0 }); }
      else if (p.kind === 'shell' || p.kind === 'flak') { ctx.fillStyle = '#2a2a2a'; ctx.fillRect(X(p.x) - k * 1.5, Y(p.y) - k * 1.5, 3 * k, 3 * k); ctx.fillStyle = '#ffb23c'; ctx.fillRect(X(p.x) - k / 2, Y(p.y) - k / 2, k, k); }
      else if (p.kind === 'fly') spr(frame('p.fly', Math.floor(t * 20)), p.x, p.y);
      else if (p.kind === 'drone') spr(frame('p.drone', Math.floor(t * 16)), p.x, p.y);
    }
    // latched flies
    for (const e of s.enemies) if (e.latched) for (let i = 0; i < e.latched; i++) spr(frame('p.fly', Math.floor(t * 20) + i), e.x + Math.cos(i * 2.1 + t * 3) * 0.4, e.y + Math.sin(i * 2.1 + t * 3) * 0.3);

    // 10) zones
    for (const z of s.zones) {
      if (z.kind === 'stasis') { ctx.fillStyle = `rgba(111,243,255,${0.12 + 0.05 * Math.sin(t * 8)})`; ctx.beginPath(); ctx.arc(X(z.x), Y(z.y), z.r * S, 0, Math.PI * 2); ctx.fill(); this.circle(X(z.x), Y(z.y), z.r * S, '#6ff3ff', k); }
      if (z.kind === 'sun') { ctx.fillStyle = `rgba(255,240,170,${0.35 + 0.2 * Math.sin(t * 30)})`; ctx.fillRect(X(z.x - 0.8), Y(top), 1.6 * S, (CORE_Y - top) * S); ctx.fillStyle = 'rgba(255,255,230,0.8)'; ctx.fillRect(X(z.x - 0.2), Y(top), 0.4 * S, (CORE_Y - top) * S); }
      if (z.kind === 'drone' && !z.fired) { const blink = Math.floor(t * 8) % 2; this.circle(X(z.x), Y(z.y), 1.6 * S, blink ? '#ff5a45' : '#ffd27a', k); }
    }

    // 11) fx
    this.drawFx(X, Y, k, S);

    // 12) overlays: reticle, stranded markers
    if (v.reticle) {
      const r = v.reticle;
      this.circle(X(r.x), Y(r.y), Math.max(0.6, r.r) * S, '#ffd27a', k);
      ctx.fillStyle = '#ffd27a';
      ctx.fillRect(X(r.x) - 4 * k, Y(r.y) - k / 2, 8 * k, k); ctx.fillRect(X(r.x) - k / 2, Y(r.y) - 4 * k, k, 8 * k);
      if (r.type === 'lance') { ctx.fillStyle = 'rgba(160,160,255,0.35)'; ctx.fillRect(X(Math.floor(r.x)), Y(Math.floor(r.y - MINE_TOP) + MINE_TOP - 1), S, 3 * S); }
      if (r.type === 'sunlens') { ctx.fillStyle = 'rgba(255,240,170,0.18)'; ctx.fillRect(X(r.x - 1.2), Y(top), 2.4 * S, (CORE_Y - top) * S); }
    }
    for (const w of s.workers) if (w.stranded || (w.below && (s.phase === 'night' || s.dusk))) {
      const blink = Math.floor(t * 4) % 2;
      ctx.fillStyle = w.stranded ? (blink ? '#ff5a45' : '#ffd27a') : '#ffd27a';
      ctx.fillRect(X(w.x) - k, Y(w.y - 1.55), 2 * k, 4 * k); ctx.fillRect(X(w.x) - k, Y(w.y - 1.55) + 5 * k, 2 * k, 2 * k);
    }

    // 13) lighting
    this.lighting(s, X, Y, S, t);
    if (this.fx.flashScreen > 0) { ctx.globalAlpha = Math.min(0.45, this.fx.flashScreen); ctx.fillStyle = this.fx.flashCol; ctx.fillRect(0, 0, this.cw, this.ch); ctx.globalAlpha = 1; }

    // 14) guidance, above the lighting so it is never dimmed
    this.drawGuide(v, X, Y, S, k, t);
  }

  /** The guide's target: a pulsing outline with a bouncing arrow, or an arrow on the screen edge pointing to it
   *  when it is off screen; plus cells flashed for a moment (all coal after a DRILL tap without coal). */
  drawGuide(v: ViewState, X: (x: number) => number, Y: (y: number) => number, S: number, k: number, t: number) {
    const ctx = this.ctx;
    if (v.flashCells.length && v.flashT > 0) {
      const a = 0.45 + 0.4 * Math.abs(Math.sin(t * 7));
      ctx.strokeStyle = `rgba(255,210,122,${a})`; ctx.lineWidth = Math.max(2, k);
      for (const c of v.flashCells) ctx.strokeRect(X(c % W) + k / 2, Y(MINE_TOP + Math.floor(c / W)) + k / 2, S - k, S - k);
    }
    const g = v.tutTarget;
    if (!g) return;
    const u = Math.max(2, Math.round(k * 1.25));
    const x0 = X(g.x), y0 = Y(g.y), w = Math.round(g.w * S), h = Math.round(g.h * S);
    const pulse = 0.5 + 0.5 * Math.sin(t * 5);
    const bandTop = this.insetTop * this.dpr + 6 * u, bandBot = this.ch - this.insetBottom * this.dpr - 6 * u;
    const cx = x0 + w / 2;
    const visible = x0 + w > 0 && x0 < this.cw && y0 + h > bandTop - 4 * u && y0 < bandBot;
    if (visible) {
      const pad = Math.round(pulse * u);
      ctx.strokeStyle = '#1a1006'; ctx.lineWidth = Math.max(3, u + 2);
      ctx.strokeRect(x0 - pad, y0 - pad, w + 2 * pad, h + 2 * pad);
      ctx.strokeStyle = `rgba(255,210,122,${0.7 + 0.3 * pulse})`; ctx.lineWidth = Math.max(2, u);
      ctx.strokeRect(x0 - pad, y0 - pad, w + 2 * pad, h + 2 * pad);
      const bob = Math.round(Math.sin(t * 6) * 1.5 * u);
      const ay = Math.max(bandTop - 2 * u, y0 - 9 * u + bob);
      this.guideArrow(cx, ay, u, 1);
      // the caption goes over the arrow, or under the target when the arrow is pressed against the top of the view
      if (g.label) {
        const lx = Math.max(this.labelHalf(g.label, u), Math.min(this.cw - this.labelHalf(g.label, u), cx));
        if (ay - 11 * u >= bandTop - 6 * u) this.guideLabel(g.label, lx, ay - 2 * u, u);
        else this.guideLabel(g.label, lx, y0 + h + pad + 12 * u, u);
      }
    } else {
      // off screen: an arrow at the edge of the visible band, pointing toward the target
      const below = y0 >= bandBot, above = y0 + h <= bandTop - 4 * u;
      const ex = Math.max(8 * u, Math.min(this.cw - 8 * u, cx));
      if (below) this.guideArrow(ex, bandBot - 8 * u + Math.round(pulse * u), u, 1);
      else if (above) this.guideArrow(ex, bandTop + Math.round(pulse * u), u, -1);
      else this.guideArrow(x0 < 0 ? 6 * u : this.cw - 6 * u, Math.max(bandTop, Math.min(bandBot - 8 * u, y0)), u, 1);
      if (g.label) this.guideLabel(g.label, Math.max(this.labelHalf(g.label, u), Math.min(this.cw - this.labelHalf(g.label, u), ex)), below ? bandBot - 9 * u : bandTop + 19 * u, u);
    }
  }
  /** a chunky pixel arrow; dir 1 points down (its tip at y + 7u), -1 points up (tip at y) */
  guideArrow(cx: number, y: number, u: number, dir: 1 | -1) {
    const ctx = this.ctx;
    const rows = ['..###..', '..###..', '..###..', '#######', '.#####.', '..###..', '...#...'];
    const shape = dir === 1 ? rows : [...rows].reverse();
    const x0 = Math.round(cx - 3.5 * u), y0 = Math.round(y);
    ctx.fillStyle = '#1a1006';
    for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (shape[j][i] === '#') ctx.fillRect(x0 + i * u - u, y0 + j * u - u, 3 * u, 3 * u);
    ctx.fillStyle = '#ffd27a';
    for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (shape[j][i] === '#') ctx.fillRect(x0 + i * u, y0 + j * u, u, u);
  }
  /** half the width of a guide caption, to keep it on screen */
  labelHalf(text: string, u: number) {
    this.ctx.font = `${Math.round(9 * u)}px 'DC Terminal', monospace`;
    return this.ctx.measureText(text).width / 2 + 2 * u;
  }
  guideLabel(text: string, cx: number, y: number, u: number) {
    const ctx = this.ctx;
    ctx.font = `${Math.round(9 * u)}px 'DC Terminal', monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    // a dark plate keeps the caption readable over ore and HUD-coloured blocks
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(18,12,6,0.85)'; ctx.fillRect(Math.round(cx - tw / 2 - 3 * u), Math.round(y - 9 * u), Math.round(tw + 6 * u), Math.round(10 * u));
    ctx.fillStyle = '#1a1006'; ctx.fillText(text, cx + u, y + u);
    ctx.fillStyle = '#ffd27a'; ctx.fillText(text, cx, y);
    ctx.textBaseline = 'alphabetic';
  }

  // ---------------------------------------------------------------------------------------------
  drawParallax(s: GameState, ox: number, oy: number, S: number) {
    const ctx = this.ctx;
    const key = `${s.contract.biome}:${this.cw}x${this.ch}:${S}`;
    if (!this.bgCache || this.bgKey !== key) {
      const c = document.createElement('canvas'); c.width = Math.ceil(this.cw); c.height = Math.ceil(this.ch * 2);
      const g = c.getContext('2d')!;
      const cols = s.contract.biome === 'frost' ? ['#101820', '#16222e', '#1c2c3a'] : s.contract.biome === 'jungle' ? ['#0e140c', '#141e12', '#1a2818'] : ['#100d0a', '#17120e', '#1f1812'];
      let seed = 7;
      const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      const px = Math.max(2, Math.round(S / 8));
      for (let layer = 0; layer < 3; layer++) {
        g.fillStyle = cols[layer];
        for (let i = 0; i < 14; i++) {
          const w = (0.3 + r() * 0.5) * c.width, h = (0.04 + r() * 0.08) * c.height;
          const x = r() * c.width - w / 2, y = r() * c.height;
          for (let yy = 0; yy < h; yy += px) { const inset = Math.abs(yy - h / 2) / (h / 2); g.fillRect(Math.round(x + inset * w * 0.3 / px) * px, Math.round((y + yy) / px) * px, Math.round(w * (1 - inset * 0.6) / px) * px, px); }
        }
      }
      this.bgCache = c; this.bgKey = key;
    }
    const py = ((oy * 0.3) % this.ch + this.ch) % this.ch;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(this.bgCache, 0, -py);
    ctx.drawImage(this.bgCache, 0, this.bgCache.height - py);
    ctx.globalAlpha = 1;
    void ox;
  }

  drawMine(s: GameState, v: ViewState, X: (x: number) => number, Y: (y: number) => number, spr: (f: Frame | undefined, x: number, y: number, sc?: number, a?: number) => void, px: (x: number, y: number, w: number, h: number, c: string) => void) {
    const ctx = this.ctx, S = this.S, k = this.cam.k, m = s.mine, biome = s.contract.biome;
    const t = v.t;
    if (s.phase === 'landing') {
      // the surface: bedrock crust
      for (let y = 0; y < MINE_H; y++) for (let x = 0; x < W; x++) spr(frame(`blk.${biome}.${B.Bedrock}`, (x + y) & 1), x, MINE_TOP + y);
      return;
    }
    const top = Math.max(0, Math.floor((0 - this.origin().oy) / S - MINE_TOP) - 1);
    const bot = Math.min(MINE_H - 1, Math.ceil((this.ch - this.origin().oy) / S - MINE_TOP) + 1);
    for (let cy = top; cy <= bot; cy++) for (let cx = 0; cx < W; cx++) {
      const i = cy * W + cx, kd = m.kind[i];
      const wx = cx, wy = MINE_TOP + cy;
      const vHash = (cx * 7 + cy * 13 + s.stratum * 5) & 7;
      if (kd === B.Empty) {
        spr(frame(`blk.${biome}.back`, vHash & 3), wx, wy);
        if (s.entryDist[i] < 0) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(X(wx), Y(wy), S, S); }
        const fx = m.fx[i];
        if (fx?.puddle) spr(frame('puddle'), wx, wy);
        if (fx?.fuse !== undefined) { ctx.fillStyle = Math.floor(t * 10) % 2 ? 'rgba(255,90,40,0.6)' : 'rgba(255,220,120,0.5)'; ctx.fillRect(X(wx + 0.2), Y(wy + 0.2), 0.6 * S, 0.6 * S); }
        continue;
      }
      let key: string;
      let fi = vHash;
      switch (kd) {
        case B.Dirt: case B.Snow: case B.Vine: key = `blk.${biome}.soft`; break;
        case B.Jet: case B.CryoJet: key = `blk.${biome}.${kd}.${m.fx[i]?.jetDir ?? 0}`; break;
        case B.Hole: key = `blk.${biome}.${kd}`; fi = Math.floor(t * 6); break;
        case B.Pod: { const pt = m.fx[i]?.podT ?? -1; key = `blk.${biome}.${kd}`; fi = pt < 0 ? 0 : pt > 1 ? 1 : 2; break; }
        default: key = `blk.${biome}.${kd}`;
      }
      // jets shake before firing
      let jx = 0;
      if ((kd === B.Jet || kd === B.CryoJet) && (m.fx[i]?.jetT ?? 9) < 1.5) jx = (Math.floor(t * 30) % 2 ? 1 : -1) / 16;
      spr(frame(key, fi), wx + jx, wy);
      // coal glints now and then, so seams catch the eye
      if (kd === B.Coal) {
        const ph = (t * 0.9 + vHash * 0.37 + cx * 0.13) % 1;
        if (ph < 0.3) {
          const a = Math.sin((ph / 0.3) * Math.PI);
          const gx = X(wx) + (3 + ((cx * 5 + cy * 3) % 10)) * k, gy = Y(wy) + (3 + ((cx * 3 + cy * 7) % 9)) * k;
          ctx.fillStyle = `rgba(255,248,232,${a})`; ctx.fillRect(gx, gy, k, k);
          ctx.fillStyle = `rgba(255,248,232,${a * 0.5})`; ctx.fillRect(gx - k, gy, k, k); ctx.fillRect(gx + k, gy, k, k); ctx.fillRect(gx, gy - k, k, k); ctx.fillRect(gx, gy + k, k, k);
        }
      }
      // exposure shading: blocks not touching open space are darker
      let exposed = false;
      for (const n of [i - 1, i + 1, i - W, i + W]) if (n >= 0 && n < m.kind.length && Math.abs((n % W) - cx) <= 1 && m.kind[n] === B.Empty) exposed = true;
      if (cy === 0) exposed = exposed || true;
      if (!exposed) { ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(X(wx), Y(wy), S, S); }
      else {
        // rim light toward open neighbours
        ctx.fillStyle = 'rgba(255,220,170,0.16)';
        if (cy > 0 && m.kind[i - W] === B.Empty) ctx.fillRect(X(wx), Y(wy), S, k);
        if (cx > 0 && m.kind[i - 1] === B.Empty) ctx.fillRect(X(wx), Y(wy), k, S);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        if (cy < MINE_H - 1 && m.kind[i + W] === B.Empty) ctx.fillRect(X(wx), Y(wy + 1) - k, S, k);
        if (cx < W - 1 && m.kind[i + 1] === B.Empty) ctx.fillRect(X(wx + 1) - k, Y(wy), k, S);
      }
      const fx = m.fx[i];
      if (fx?.over) spr(frame('overgrowth'), wx, wy, 1, 0.5 + 0.25 * fx.over);
      if (fx?.crack !== undefined) spr(frame('hatchcrack', Math.floor(t * 4)), wx, wy);
      if (kd === B.IceHeart || kd === B.Charge || kd === B.Cache || kd === B.Bonus) {
        const a = 0.15 + 0.1 * Math.sin(t * 3 + cx);
        ctx.fillStyle = kd === B.Charge ? `rgba(87,240,255,${a})` : kd === B.IceHeart ? `rgba(200,240,255,${a})` : `rgba(255,207,90,${a})`;
        ctx.fillRect(X(wx - 0.15), Y(wy - 0.15), 1.3 * S, 1.3 * S);
      }
      // damage cracks
      if (m.maxHp[i] > 0 && m.hp[i] < m.maxHp[i] && kd !== B.Bedrock) {
        const f = 1 - m.hp[i] / m.maxHp[i];
        spr(frame('crack', f < 0.34 ? 0 : f < 0.67 ? 1 : 2), wx, wy);
      }
    }
    // dig orders on top of every block so neighbours never cover the corner brackets; an order the crew cannot get
    // to yet (untagged rock in the way) is drawn dim
    const way = digField(s).d;
    for (let cy = top; cy <= bot; cy++) for (let cx = 0; cx < W; cx++) {
      const i = cy * W + cx;
      if (m.tag[i] && m.kind[i] !== B.Empty) this.bracket(X(cx) + k, Y(MINE_TOP + cy) + k, S - 2 * k, S - 2 * k, way[i] > 0 ? '#8a6a2e' : '#ffc23c', k, 3);
    }
    // black-hole rift arcs
    for (const key in m.fx) {
      const fx = m.fx[+key];
      if ((fx.holeTarget ?? -1) >= 0 && (fx.holeT ?? 9) <= 3) {
        const a = +key, b = fx.holeTarget!;
        const ax = (a % W) + 0.5, ay = MINE_TOP + Math.floor(a / W) + 0.5, bx = (b % W) + 0.5, by = MINE_TOP + Math.floor(b / W) + 0.5;
        this.zigzag(X(ax), Y(ay), X(bx), Y(by), Math.floor(t * 20) % 2 ? '#b060ff' : '#e0b0ff', k);
        ctx.strokeStyle = 'rgba(176,96,255,0.8)'; ctx.lineWidth = k;
        ctx.strokeRect(X(bx - 0.5) + k, Y(by - 0.5) + k, S - 2 * k, S - 2 * k);
      }
    }
    // hover / painting highlight
    if (v.dig && v.hoverCell >= 0) {
      const hx = v.hoverCell % W, hy = MINE_TOP + Math.floor(v.hoverCell / W);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = k; ctx.strokeRect(X(hx) + k / 2, Y(hy) + k / 2, S - k, S - k);
    }
    for (const c of v.highlightCells) { const hx = c % W, hy = MINE_TOP + Math.floor(c / W); ctx.fillStyle = 'rgba(111,243,255,0.25)'; ctx.fillRect(X(hx), Y(hy), S, S); }
    // items
    for (const it of s.items) spr(frame(`item.${it.kind}`), it.x, it.y + 0.2 + Math.sin(t * 3 + it.id) * 0.03);
    // floor under the stratum
    for (let x = 0; x < W; x++) spr(frame(`blk.${biome}.${B.Bedrock}`, x & 1), x, MINE_TOP + MINE_H);
    px(0, MINE_TOP + MINE_H + 1, W, 3, '#0a0808');
  }

  drawPlatform(s: GameState, v: ViewState, X: (x: number) => number, Y: (y: number) => number, spr: (f: Frame | undefined, x: number, y: number, sc?: number, a?: number) => void, px: (x: number, y: number, w: number, h: number, c: string) => void, t: number) {
    const ctx = this.ctx, S = this.S, k = this.cam.k;
    const descending = s.phase === 'descent';
    const dy = descending ? Math.sin(t * 40) * 0.03 : 0;
    const lampsRed = s.dusk || s.phase === 'night';
    // storeys
    const avail = storeysAvailable(s);
    for (let st = 1; st < 3; st++) {
      const pads = s.pads.filter(p => p.storey === st);
      const any = pads.some(p => p.open);
      if (!any && st >= avail) continue;
      for (const p of pads) {
        if (p.open) spr(frame('plat.floor'), p.x, STOREY_FLOOR[st] + dy);
        else if (st < avail) spr(frame('plat.scaffold'), p.x, STOREY_FLOOR[st] + 3.5 + dy, 1, 0.45);
      }
      if (any) { spr(frame('plat.post'), 1.2, STOREY_FLOOR[st - 1] + dy); spr(frame('plat.post'), W - 1.2, STOREY_FLOOR[st - 1] + dy); }
    }
    // ladder from deck down to the landing
    for (let y = 0; y < MINE_TOP + 0.5; y += 1) spr(frame('ladder'), LADDER_X, y + dy);
    // chassis
    spr(frame('plat.chassis'), 1, 0 + dy);
    const wf = descending ? Math.floor(t * 12) : 0;
    for (let i = 0; i < 8; i++) spr(frame('plat.wheel', wf), 1.8 + i * 1.95, 1.55 + dy);
    if (descending) spr(frame('plat.drill', Math.floor(t * 16)), LADDER_X, 1.9 + dy);
    // lamps
    for (const lx of [5.2, 11.8]) {
      spr(frame('plat.lamp', lampsRed ? 1 : 0), lx, -0.2 + dy);
      if (lampsRed && Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = 'rgba(255,60,40,0.18)'; ctx.beginPath(); ctx.moveTo(X(lx), Y(-0.2)); ctx.lineTo(X(lx - 2), Y(2.5)); ctx.lineTo(X(lx + 2), Y(2.5)); ctx.fill(); }
    }
    // core
    spr(frame('core.housing'), CORE_X, 0 + dy);
    const pulse = 0.6 + 0.4 * Math.sin(t * 3);
    if (s.phase !== 'launch') spr(frame('core.glow', Math.floor(t * 6)), CORE_X, CORE_Y + dy);
    const hpf = s.core.hp / s.core.max;
    if (hpf < 0.35 && Math.floor(t * 4) % 2) { ctx.fillStyle = 'rgba(255,60,40,0.3)'; ctx.fillRect(X(CORE_X - 1.1), Y(CORE_Y - 1.1), 2.2 * S, 2.2 * S); }
    void pulse;
    // pads and buildings
    for (const p of s.pads) {
      if (p.storey >= avail && !p.open) continue;
      const b = s.buildings.find(q => q.id === p.building);
      if (b) {
        const f = frame(`b.${b.type}`, Math.floor(t * 2 + p.id));
        spr(f, p.x, p.y + dy);
        if (b.stars) this.pips(X(p.x) - (b.stars * 2 * k) / 2, Y(p.y + dy) - 34 * k, b.stars, k);
        if (b.type === 'factory') { const pr = b.t / 35; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(X(p.x - 0.8), Y(p.y + 0.12), 1.6 * S, k * 2); ctx.fillStyle = '#9fd6ff'; ctx.fillRect(X(p.x - 0.8), Y(p.y + 0.12), 1.6 * S * pr, k * 2); }
        if (b.type === 'factory' && Math.random() < 0.05) this.fx.smoke(p.x + 0.6, p.y - 2, 1, 'rgba(120,110,100,0.35)', -0.6);
      } else if (p.open && s.phase !== 'landing') {
        spr(frame('pad.hammer'), p.x, p.y - 0.7 + dy, 1, v.selPad === p.id ? 1 : 0.55);
      } else if (!p.open) {
        // unassembled pad on an available storey: faint dashed frame, tap to scaffold
        ctx.fillStyle = 'rgba(255,178,60,0.22)';
        const x0 = X(p.x - 0.9), y0 = Y(p.y - 1.9 + dy), w = Math.round(1.8 * S), hh = Math.round(1.8 * S);
        for (let q = 0; q < w; q += 3 * k) { ctx.fillRect(x0 + q, y0, k, k); ctx.fillRect(x0 + q, y0 + hh - k, k, k); }
        for (let q = 0; q < hh; q += 3 * k) { ctx.fillRect(x0, y0 + q, k, k); ctx.fillRect(x0 + w - k, y0 + q, k, k); }
      }
      if (v.selPad === p.id) this.bracket(X(p.x - 1), Y(p.y - 2 + dy), 2 * S, 2 * S, '#6ff3ff', k);
    }
    // recruit queue progress over the recruit building
    void px;
  }

  drawWorker(s: GameState, w: Worker, spr: (f: Frame | undefined, x: number, y: number, sc?: number, a?: number) => void, X: (x: number) => number, Y: (y: number) => number, t: number) {
    const ctx = this.ctx, k = this.cam.k, S = this.S;
    const plat = s.setup.platform;
    if (w.incubate > 0 || w.st === 'cocoon') { spr(frame('cocoon', Math.floor(t * 2)), w.x, w.y + 0.5); return; }
    const onLadder = Math.abs(w.x - LADDER_X) < 0.05 && w.y > -0.45 && w.y < MINE_TOP + 0.6 && (w.route.length > 0 || w.goal === 'descend');
    let pose = 'idle';
    if (onLadder) pose = 'climb';
    else if (w.st === 'dig' || w.st === 'fight' || w.st === 'pick') pose = 'act';
    else if (w.path.length || w.route.length) pose = 'walk';
    const dir = w.face >= 0 ? 'r' : 'l';
    const fr = pose === 'walk' ? w.anim : pose === 'act' ? t * 8 : pose === 'climb' ? w.y * 3 : t * 2;
    const f = frame(`w.${plat}.${w.cls}.${pose}.${dir}`, fr);
    // feet at the bottom of the cell (below) or on the deck
    const footY = w.below && !onLadder ? w.y + 0.5 : w.y + 0.5;
    spr(f, w.x, footY);
    if (w.hurtT > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; spr(f, w.x, footY); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    if (w.carry.length) spr(frame(`item.${w.carry[0]}`), w.x - w.face * 0.25, footY - 0.95);
    if (w.frozen > 0) { ctx.fillStyle = 'rgba(170,240,255,0.45)'; ctx.fillRect(X(w.x - 0.4), Y(footY - 1), 0.8 * S, S); }
    if (w.hp < w.maxHp) this.hpBar(X(w.x - 0.4), Y(footY - 1.15), 0.8 * S, w.hp / w.maxHp, k);
  }

  drawEnemy(s: GameState, e: Enemy, spr: (f: Frame | undefined, x: number, y: number, sc?: number, a?: number) => void, X: (x: number) => number, Y: (y: number) => number, k: number, t: number) {
    const ctx = this.ctx, S = this.S;
    const d = ENEMIES[e.kind];
    if (e.kind === 'weaver') {
      // thread
      ctx.fillStyle = 'rgba(230,220,210,0.7)'; ctx.fillRect(X(e.x) - k / 2, Y(shaftTop(s) - 4), k, Y(e.y - 1.2) - Y(shaftTop(s) - 4));
    }
    if (e.kind === 'weaver' && !LICENSED.has('e.weaver')) {
      // legs
      for (let i = 0; i < 8; i++) {
        const side = i < 4 ? -1 : 1, j = i % 4;
        const ph = Math.sin(t * 4 + i) * 0.25;
        const bx = e.x + side * 0.6, by = e.y - 0.4 + j * 0.35;
        const kx = e.x + side * (2.4 + j * 0.2), ky = by - 1.4 + j * 0.3 + ph;
        const fx = e.x + side * (3.2 + j * 0.35), fy = by + 1.4 + j * 0.4 - ph;
        this.pixLine(X(bx), Y(by), X(kx), Y(ky), '#2a1418', k * 3);
        this.pixLine(X(kx), Y(ky), X(fx), Y(fy), '#3a1a22', k * 2);
      }
    }
    const fn = e.boss ? t * 6 : e.anim * 0.8;
    const key = e.kind === 'bloomrot' && e.tc > 0 && LICENSED.has('e.bloomrot.hit') ? 'e.bloomrot.hit' : `e.${e.kind}`;
    const fr = frame(key, fn);
    // flip crawlers/bugs to face their motion
    if (fr && e.vx < -0.2 && !e.boss && ENEMIES[e.kind].mover !== 'crawl') {
      ctx.save(); ctx.translate(X(e.x), Y(e.y)); ctx.scale(-1, 1);
      ctx.drawImage(fr.img, fr.sx, fr.sy, fr.sw, fr.sh, -fr.ax * k, -fr.ay * k, fr.sw * k, fr.sh * k); ctx.restore();
    } else if (fr && ENEMIES[e.kind].mover === 'crawl' && e.wall > 0 && !e.boss) {
      ctx.save(); ctx.translate(X(e.x), Y(e.y)); ctx.scale(-1, 1);
      ctx.drawImage(fr.img, fr.sx, fr.sy, fr.sw, fr.sh, -fr.ax * k, -fr.ay * k, fr.sw * k, fr.sh * k); ctx.restore();
    } else spr(fr, e.x, e.y);
    if (e.hurtT > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; spr(fr, e.x, e.y); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    if (e.shield > 0) { ctx.strokeStyle = `rgba(111,243,255,${0.4 + 0.4 * e.shield / Math.max(1, e.maxShield)})`; ctx.lineWidth = k; ctx.beginPath(); ctx.arc(X(e.x), Y(e.y), (d.radius + 0.25) * S, 0, Math.PI * 2); ctx.stroke(); }
    if (e.weakT > 0) { ctx.fillStyle = '#c060ff'; ctx.fillRect(X(e.x) - k, Y(e.y - d.radius - 0.35), 2 * k, 2 * k); }
    if (e.slowT > 0 || s.zones.some(z => z.kind === 'stasis' && dist(z.x, z.y, e.x, e.y) <= z.r)) { ctx.fillStyle = 'rgba(111,243,255,0.35)'; ctx.fillRect(X(e.x - 0.3), Y(e.y - 0.3), 0.6 * S, 0.6 * S); }
    if (e.burnT > 0 && Math.random() < 0.3) this.fx.ps.push({ x: e.x + (Math.random() - 0.5) * 0.5, y: e.y, vx: 0, vy: -1.5, life: 0.3, max: 0.3, col: '#ff8a2a', size: 1, grav: 0, drag: 0, glow: true });
    if (e.boss) {
      const w = 5 * S;
      this.hpBar(X(e.x) - w / 2, Y(e.y - d.radius - 0.9), w, e.hp / e.maxHp, k, 3);
      if (e.maxShield) this.hpBar(X(e.x) - w / 2, Y(e.y - d.radius - 0.9) - 4 * k, w, e.shield / e.maxShield, k, 2, '#6ff3ff');
    } else if (e.hp < e.maxHp && e.maxHp >= 30) this.hpBar(X(e.x - 0.5), Y(e.y - d.radius - 0.35), S, e.hp / e.maxHp, k);
    if (e.state === 'spit') { ctx.fillStyle = '#c8e040'; ctx.fillRect(X(e.x) - k, Y(e.y + 0.5), 2 * k, 2 * k); }
  }

  drawFx(X: (x: number) => number, Y: (y: number) => number, k: number, S: number) {
    const ctx = this.ctx, fx = this.fx;
    for (const f of fx.flashes) { const a = f.life / f.max; ctx.globalAlpha = a; ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(X(f.x), Y(f.y), f.r * S * (1.2 - a * 0.2), 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (const b of fx.beams) { ctx.globalAlpha = Math.min(1, b.life / b.max * 1.5); this.pixLine(X(b.x0), Y(b.y0), X(b.x1), Y(b.y1), b.col, b.w * k); }
    ctx.globalAlpha = 1;
    for (const r of fx.rings) { const p = 1 - r.life / r.max; ctx.globalAlpha = r.life / r.max; this.circle(X(r.x), Y(r.y), (r.r0 + (r.r1 - r.r0) * p) * S, r.col, k); }
    ctx.globalAlpha = 1;
    for (const p of fx.ps) {
      ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.6);
      ctx.fillStyle = p.col;
      const sz = p.size * k;
      ctx.fillRect(X(p.x) - (sz >> 1), Y(p.y) - (sz >> 1), sz, sz);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const t of fx.txt) {
      ctx.globalAlpha = Math.min(1, (t.life / t.max) * 2);
      const size = Math.round(6 * k * t.size) ;
      ctx.font = `${size}px 'DC Terminal', monospace`;
      ctx.fillStyle = '#000'; ctx.fillText(t.text, X(t.x) + k, Y(t.y) + k);
      ctx.fillStyle = t.col; ctx.fillText(t.text, X(t.x), Y(t.y));
    }
    ctx.globalAlpha = 1;
  }

  lighting(s: GameState, X: (x: number) => number, Y: (y: number) => number, S: number, t: number) {
    const ctx = this.ctx;
    let tint: string | null = null;
    if (s.phase === 'night') tint = 'rgba(10,14,40,0.38)';
    else if (s.dusk) tint = `rgba(120,30,10,${0.12 + 0.06 * Math.sin(t * 4)})`;
    else if (s.events.today === 'eclipse' || s.events.today === 'polar') tint = 'rgba(20,20,40,0.28)';
    if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, 0, this.cw, this.ch); }
    // additive glows
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x: number, y: number, r: number, col: string) => {
      const g = ctx.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r * S);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(X(x - r), Y(y - r), 2 * r * S, 2 * r * S);
    };
    const pulse = 0.85 + 0.15 * Math.sin(t * 3);
    glow(CORE_X, CORE_Y, 5.5, `rgba(255,150,40,${0.28 * pulse})`);
    if (s.dusk || s.phase === 'night') { const b = Math.floor(t * 2) % 2 ? 0.25 : 0.1; glow(5.2, -0.2, 2.5, `rgba(255,40,20,${b})`); glow(11.8, -0.2, 2.5, `rgba(255,40,20,${b})`); }
    for (const f of this.fx.flashes) glow(f.x, f.y, f.r * 2, 'rgba(255,190,90,0.25)');
    for (const p of this.fx.ps) if (p.glow) glow(p.x, p.y, 0.5, 'rgba(255,170,60,0.12)');
    if (s.phase === 'night') for (const e of s.enemies) glow(e.x, e.y, e.boss ? 3 : 1.1, e.boss ? 'rgba(255,60,40,0.18)' : 'rgba(255,80,50,0.13)');
    for (const t of s.turrets) if (t.cd > 0 && t.target >= 0 && s.phase === 'night') { const m = s.mounts.find(q => q.id === t.mount); if (m) glow(mountX(m.side), m.y, 1.2, 'rgba(255,200,120,0.08)'); }
    for (const it of s.items) if (it.kind === 'charge' || it.kind === 'tech' || it.kind === 'bonus') glow(it.x, it.y, 1, it.kind === 'charge' ? 'rgba(87,240,255,0.25)' : 'rgba(255,207,90,0.2)');
    for (const w of s.workers) if (w.below && w.cls === 'miner' && s.setup.platform !== 'brood') glow(w.x + w.face * 0.3, w.y - 0.3, 1.8, 'rgba(255,230,160,0.07)');
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---- primitives ---------------------------------------------------------------------------------
  barrel(tx: number, ty: number, ang: number, b: [number, number, string, string], X: (x: number) => number, Y: (y: number) => number, k: number, hot: boolean) {
    const ctx = this.ctx;
    const [len, th, col, tip] = b;
    const cx = X(tx), cy = Y(ty);
    const cos = Math.cos(ang), sin = Math.sin(ang);
    for (let i = 2; i <= len + 2; i++) {
      for (let j = -Math.floor(th / 2); j < Math.ceil(th / 2); j++) {
        const ax = Math.round(i * cos - j * sin), ay = Math.round(i * sin + j * cos);
        ctx.fillStyle = i >= len + 1 ? (hot ? '#ffd27a' : tip) : col;
        ctx.fillRect(cx + ax * k, cy + ay * k, k, k);
      }
    }
  }
  pixLine(x0: number, y0: number, x1: number, y1: number, col: string, w: number) {
    const ctx = this.ctx;
    ctx.fillStyle = col;
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / Math.max(1, w * 0.7)));
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), Math.ceil(w), Math.ceil(w)); }
  }
  beamLine(x0: number, y0: number, x1: number, y1: number, c1: string, c2: string, k: number) {
    this.pixLine(x0, y0, x1, y1, c1, 3 * k);
    this.pixLine(x0, y0, x1, y1, c2, k);
  }
  flame(tx: number, ty: number, ex: number, ey: number, X: (x: number) => number, Y: (y: number) => number, k: number, t: number) {
    const ang = Math.atan2(ey - ty, ex - tx);
    for (let i = 0; i < 18; i++) {
      const d = (i / 18) * 4.5, sp = (Math.sin(t * 40 + i * 7) * 0.5) * d * 0.25;
      const x = tx + Math.cos(ang) * d - Math.sin(ang) * sp, y = ty + Math.sin(ang) * d + Math.cos(ang) * sp;
      this.ctx.fillStyle = i < 6 ? '#fff2b0' : i < 12 ? '#ffb23c' : '#ff5a1a';
      const sz = (1 + Math.floor(d)) * k;
      this.ctx.fillRect(X(x) - sz / 2, Y(y) - sz / 2, sz, sz);
    }
  }
  zigzag(x0: number, y0: number, x1: number, y1: number, col: string, k: number) {
    const n = 6; let px = x0, py = y0;
    for (let i = 1; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n + (i < n ? (Math.random() - 0.5) * 6 * k : 0), y = y0 + (y1 - y0) * i / n + (i < n ? (Math.random() - 0.5) * 6 * k : 0);
      this.pixLine(px, py, x, y, col, k); px = x; py = y;
    }
  }
  circle(cx: number, cy: number, r: number, col: string, k: number) {
    const ctx = this.ctx; ctx.fillStyle = col;
    const n = Math.max(24, Math.floor(r / k * 1.5));
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; ctx.fillRect(Math.round(cx + Math.cos(a) * r - k / 2), Math.round(cy + Math.sin(a) * r - k / 2), k, k); }
  }
  rangeRing(cx: number, cy: number, r: number, k: number) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255,210,122,0.06)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    this.circle(cx, cy, r, 'rgba(255,210,122,0.8)', k);
  }
  bracket(x: number, y: number, w: number, h: number, col: string, k: number, len = 4) {
    const ctx = this.ctx; ctx.fillStyle = col;
    const L = len * k, T = k;
    ctx.fillRect(x, y, L, T); ctx.fillRect(x, y, T, L);
    ctx.fillRect(x + w - L, y, L, T); ctx.fillRect(x + w - T, y, T, L);
    ctx.fillRect(x, y + h - T, L, T); ctx.fillRect(x, y + h - L, T, L);
    ctx.fillRect(x + w - L, y + h - T, L, T); ctx.fillRect(x + w - T, y + h - L, T, L);
  }
  hpBar(x: number, y: number, w: number, f: number, k: number, h = 2, col?: string) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(Math.round(x) - k, Math.round(y) - k, Math.round(w) + 2 * k, (h + 2) * k);
    ctx.fillStyle = col ?? (f > 0.5 ? '#8ff09a' : f > 0.25 ? '#ffb23c' : '#ff5a45');
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w * Math.max(0, f)), h * k);
  }
  pips(x: number, y: number, n: number, k: number) { const ctx = this.ctx; ctx.fillStyle = '#ffc23c'; for (let i = 0; i < n; i++) ctx.fillRect(Math.round(x + i * 2 * k), Math.round(y), k * 1.5, k * 1.5); }
}

export const _r = { hex, BUILDINGS, PAD_X, ENTRY };
