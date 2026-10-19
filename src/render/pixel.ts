// Pixel painter: draws original pixel art into small canvases on the art-pixel grid, then registers frames.
export type RGBA = [number, number, number, number];

export function hex(c: string, a = 255): RGBA {
  const n = parseInt(c.slice(1), 16);
  if (c.length === 4) return [((n >> 8) & 15) * 17, ((n >> 4) & 15) * 17, (n & 15) * 17, a];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}
export const shade = (c: RGBA, f: number): RGBA => [Math.max(0, Math.min(255, Math.round(c[0] * f))), Math.max(0, Math.min(255, Math.round(c[1] * f))), Math.max(0, Math.min(255, Math.round(c[2] * f))), c[3]];
export const mix = (a: RGBA, b: RGBA, t: number): RGBA => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t), Math.round(a[3] + (b[3] - a[3]) * t)];

export class Pix {
  w: number; h: number; d: Uint8ClampedArray;
  seed: number;
  constructor(w: number, h: number, seed = 1) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); this.seed = seed || 1; }
  rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  set(x: number, y: number, c: RGBA | null) {
    x = Math.round(x); y = Math.round(y);
    if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    if (c[3] >= 255) { this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = 255; return; }
    const a = c[3] / 255, ia = 1 - a;
    this.d[i] = c[0] * a + this.d[i] * ia; this.d[i + 1] = c[1] * a + this.d[i + 1] * ia; this.d[i + 2] = c[2] * a + this.d[i + 2] * ia;
    this.d[i + 3] = Math.min(255, c[3] + this.d[i + 3] * ia);
  }
  get(x: number, y: number): RGBA | null {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    const i = (y * this.w + x) * 4;
    return this.d[i + 3] ? [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]] : null;
  }
  rect(x: number, y: number, w: number, h: number, c: RGBA) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  hline(x: number, y: number, w: number, c: RGBA) { this.rect(x, y, w, 1, c); }
  vline(x: number, y: number, h: number, c: RGBA) { this.rect(x, y, 1, h, c); }
  /** box with 1px light top/left and dark bottom/right edges */
  bevel(x: number, y: number, w: number, h: number, c: RGBA, hi = 1.25, lo = 0.62) {
    this.rect(x, y, w, h, c);
    this.hline(x, y, w, shade(c, hi)); this.vline(x, y, h, shade(c, hi));
    this.hline(x, y + h - 1, w, shade(c, lo)); this.vline(x + w - 1, y, h, shade(c, lo));
  }
  disc(cx: number, cy: number, r: number, c: RGBA) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) this.set(x, y, c);
    }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGBA) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) this.set(x, y, c);
    }
  }
  /** shaded sphere-ish ellipse: light from top-left */
  blob(cx: number, cy: number, rx: number, ry: number, c: RGBA) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const l = -nx * 0.55 - ny * 0.75;
      const f = l > 0.45 ? 1.35 : l > 0.05 ? 1.1 : l > -0.45 ? 0.9 : 0.68;
      this.set(x, y, shade(c, f));
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGBA) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  noise(x: number, y: number, w: number, h: number, cols: RGBA[], density = 0.3) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (this.rnd() < density) this.set(x + i, y + j, cols[Math.floor(this.rnd() * cols.length)]);
  }
  /** add a dark outline around every opaque pixel */
  outline(c: RGBA = [18, 12, 8, 255], diag = false) {
    const src = new Uint8ClampedArray(this.d);
    const op = (x: number, y: number) => x >= 0 && y >= 0 && x < this.w && y < this.h && src[(y * this.w + x) * 4 + 3] > 0;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (op(x, y)) continue;
      if (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1) || (diag && (op(x - 1, y - 1) || op(x + 1, y + 1) || op(x + 1, y - 1) || op(x - 1, y + 1)))) this.set(x, y, c);
    }
  }
  flipX(): Pix {
    const o = new Pix(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = this.get(x, y); if (c) o.set(this.w - 1 - x, y, c); }
    return o;
  }
  blit(src: Pix, ox: number, oy: number) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const c = src.get(x, y); if (c) this.set(ox + x, oy + y, c); }
  }
  toCanvas(): HTMLCanvasElement {
    const cv = document.createElement('canvas');
    cv.width = this.w; cv.height = this.h;
    const ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(this.w, this.h);
    img.data.set(this.d);
    ctx.putImageData(img, 0, 0);
    return cv;
  }
}

// ---- sprite registry --------------------------------------------------------------------------------
export interface Frame { img: CanvasImageSource; sx: number; sy: number; sw: number; sh: number; ax: number; ay: number }
export const SPR = new Map<string, Frame[]>();

/** Packs many small canvases into atlas pages so drawing touches few textures. */
class Packer {
  page: HTMLCanvasElement | null = null; ctx: CanvasRenderingContext2D | null = null;
  x = 0; y = 0; rowH = 0; size = 1024;
  place(c: HTMLCanvasElement): { img: HTMLCanvasElement; x: number; y: number } {
    if (!this.page || this.x + c.width > this.size) { this.x = 0; this.y += this.rowH + 1; this.rowH = 0; }
    if (!this.page || this.y + c.height > this.size) {
      this.page = document.createElement('canvas'); this.page.width = this.size; this.page.height = this.size;
      this.ctx = this.page.getContext('2d')!; this.x = 0; this.y = 0; this.rowH = 0;
    }
    this.ctx!.drawImage(c, this.x, this.y);
    const r = { img: this.page, x: this.x, y: this.y };
    this.x += c.width + 1; this.rowH = Math.max(this.rowH, c.height);
    return r;
  }
}
const packer = new Packer();

export function addFrames(key: string, frames: Pix[], ax?: number, ay?: number) {
  SPR.set(key, frames.map(p => {
    const c = p.toCanvas();
    const r = packer.place(c);
    return { img: r.img, sx: r.x, sy: r.y, sw: p.w, sh: p.h, ax: ax ?? p.w / 2, ay: ay ?? p.h };
  }));
}
export function addCanvasFrames(key: string, canvases: HTMLCanvasElement[], ax?: number, ay?: number) {
  SPR.set(key, canvases.map(c => { const r = packer.place(c); return { img: r.img, sx: r.x, sy: r.y, sw: c.width, sh: c.height, ax: ax ?? c.width / 2, ay: ay ?? c.height }; }));
}
/** Draw a registered frame into a fresh canvas (for compositing overlays). */
export function frameCanvas(key: string, i = 0): HTMLCanvasElement | null {
  const f = frame(key, i);
  if (!f) return null;
  const c = document.createElement('canvas'); c.width = f.sw; c.height = f.sh;
  c.getContext('2d')!.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, 0, 0, f.sw, f.sh);
  return c;
}
export function addImageFrames(key: string, img: CanvasImageSource, rects: [number, number, number, number][], ax?: number, ay?: number) {
  SPR.set(key, rects.map(([x, y, w, h]) => ({ img, sx: x, sy: y, sw: w, sh: h, ax: ax ?? w / 2, ay: ay ?? h })));
}
export function frame(key: string, i = 0): Frame | undefined {
  const f = SPR.get(key);
  if (!f || !f.length) return undefined;
  return f[((Math.floor(i) % f.length) + f.length) % f.length];
}
export const frameCount = (key: string) => SPR.get(key)?.length ?? 0;
