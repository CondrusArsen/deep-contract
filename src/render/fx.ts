// Visual effects driven by simulation events: pixel particles, beams, rings, floating numbers, shake.
import type { FxEvent, GameState } from '../core/types';
import { B } from '../core/types';
import { CORE_X, CORE_Y, mountX } from '../core/world';

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string; size: number; grav: number; drag: number; glow?: boolean }
interface Beam { x0: number; y0: number; x1: number; y1: number; life: number; max: number; col: string; w: number; pts?: number[] }
interface Ring { x: number; y: number; r0: number; r1: number; life: number; max: number; col: string }
interface Txt { x: number; y: number; vy: number; life: number; max: number; text: string; col: string; size: number }
interface Flash { x: number; y: number; r: number; life: number; max: number; col: string }

const ORE_COL: Record<number, string[]> = {
  [B.Iron]: ['#6fb6f2', '#bfe4ff'], [B.Crim]: ['#ff4a6a', '#ffb0c0'], [B.Coal]: ['#9a6ee0', '#d8c0ff'], [B.Ochre]: ['#ffa12a', '#ffe0a0'],
  [B.Jade]: ['#34e8a8', '#b0ffe0'], [B.Void]: ['#c05cff', '#f0c8ff'], [B.Ice]: ['#a9dcf5', '#e8f8ff'], [B.Snow]: ['#c9dae6', '#ffffff'],
  [B.Vine]: ['#4f8a3c', '#9ae060'], [B.Mud]: ['#6a5436', '#8a7550'], [B.Dirt]: ['#76563f', '#5a4030'], [B.Cache]: ['#ffcf5a', '#7a5a2a'], [B.Bonus]: ['#fff0a0', '#c8962a'], [B.Charge]: ['#57f0ff', '#dcfeff'],
};

export class Fx {
  ps: P[] = []; beams: Beam[] = []; rings: Ring[] = []; txt: Txt[] = []; flashes: Flash[] = [];
  shake = 0; flashScreen = 0; flashCol = '#fff';
  reduce = false; shakeOn = true;

  burst(x: number, y: number, n: number, cols: string[], speed = 3, life = 0.6, grav = 6, size = 1, glow = false) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.3 + Math.random() * 0.9);
      this.ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.3, life: life * (0.6 + Math.random() * 0.6), max: life, col: cols[i % cols.length], size, grav, drag: 1.5, glow });
    }
  }
  smoke(x: number, y: number, n: number, col = 'rgba(120,110,100,0.5)', rise = -0.8) {
    for (let i = 0; i < n; i++) this.ps.push({ x: x + (Math.random() - 0.5), y: y + (Math.random() - 0.5), vx: (Math.random() - 0.5) * 0.8, vy: rise * (0.5 + Math.random()), life: 1.2 + Math.random(), max: 2, col, size: 2 + Math.floor(Math.random() * 2), grav: 0, drag: 0.6 });
  }
  text(x: number, y: number, text: string, col: string, size = 1) { this.txt.push({ x, y, vy: -1.2, life: 1.3, max: 1.3, text, col, size }); }
  ring(x: number, y: number, r0: number, r1: number, col: string, life = 0.4) { this.rings.push({ x, y, r0, r1, life, max: life, col }); }
  beam(x0: number, y0: number, x1: number, y1: number, col: string, w = 1, life = 0.12) { this.beams.push({ x0, y0, x1, y1, life, max: life, col, w }); }
  flash(x: number, y: number, r: number, col: string, life = 0.15) { this.flashes.push({ x, y, r, life, max: life, col }); }
  explosion(x: number, y: number, r: number, big = false) {
    this.flash(x, y, r * 1.6, 'rgba(255,200,90,0.9)', 0.18);
    this.ring(x, y, 0.2, r, '#ffd070', 0.3);
    this.burst(x, y, big ? 40 : 18, ['#fff4c0', '#ffb23c', '#ff6a1a', '#8a3010'], big ? 7 : 4.5, 0.55, 3, 1, true);
    this.smoke(x, y, big ? 10 : 4, 'rgba(70,60,55,0.55)');
    this.shake = Math.max(this.shake, big ? 0.5 : 0.18);
  }

  onEvent(e: FxEvent, s: GameState) {
    const x = e.x ?? 0, y = e.y ?? 0;
    switch (e.t) {
      case 'dig': this.burst(x + (Math.random() - 0.5) * 0.6, y, 3, ORE_COL[e.a ?? 0] ?? ['#8a8078', '#5a5048'], 2.2, 0.35, 9); break;
      case 'break': {
        const cols = ORE_COL[e.a ?? 0] ?? ['#8a8078', '#5a5048', '#6a6058'];
        this.burst(x, y, 12, [...cols, '#5a5048'], 3.5, 0.6, 12, 1);
        this.smoke(x, y, 2, 'rgba(110,100,90,0.35)');
        break;
      }
      case 'boom': case 'blast': this.explosion(x, y, e.a ?? 1.5, (e.a ?? 1) > 2); break;
      case 'flak': this.explosion(x, y, e.a ?? 2, false); this.burst(x, y, 10, ['#e0e0e0', '#ffd070'], 7, 0.3, 0); break;
      case 'hurt': this.burst(x, y - 0.3, 4, ['#ff4a3a', '#a01a10'], 2, 0.4, 8); this.text(x, y - 0.8, `-${Math.round(e.a ?? 1)}`, '#ff6a5a'); break;
      case 'death': this.burst(x, y, 14, ['#ff4a3a', '#e7b58a', '#6a5a44'], 3.5, 0.8, 10); this.text(x, y - 1, 'LOST', '#ff5a45', 1.2); break;
      case 'kill': this.burst(x, y, 10, s.contract.biome === 'jungle' ? ['#c8e060', '#6a8a20'] : ['#e8ff6a', '#8aa020', '#c23a36'], 4, 0.5, 6); break;
      case 'bossdie': this.explosion(x, y, 4, true); this.flashScreen = 0.5; this.flashCol = '#fff2c0'; break;
      case 'ukill': this.burst(x, y, 10, ['#9a8a7a', '#c07068', '#e8ff6a'], 3, 0.5, 10); break;
      case 'hit': this.burst(x, y, 2, ['#fff2b0', '#ffb23c'], 3, 0.15, 0, 1, true); break;
      case 'corehit': this.ring(CORE_X, CORE_Y, 0.5, 3, '#ff5a45', 0.45); this.burst(x, y, 8, ['#ff5a45', '#ffb23c'], 4, 0.4, 3); this.shake = Math.max(this.shake, 0.35); this.flashScreen = 0.25; this.flashCol = '#ff3a2a'; break;
      case 'mg': case 'auto': case 'mini': case 'shotgun': this.muzzle(s, e.id ?? -1, e.a); break;
      case 'rail': { this.beam(x, y, e.a ?? x, e.b ?? y, '#6ff3ff', 2, 0.25); this.beam(x, y, e.a ?? x, e.b ?? y, '#ffffff', 1, 0.12); this.muzzle(s, e.id ?? -1); break; }
      case 'laser': this.beam(x, y, e.a ?? x, e.b ?? y, '#ff4a3a', 2, 0.14); this.beam(x, y, e.a ?? x, e.b ?? y, '#ffd0c0', 1, 0.08); this.burst(e.a ?? x, e.b ?? y, 3, ['#ff8a7a'], 2, 0.2, 0, 1, true); break;
      case 'weak': this.beam(x, y, e.a ?? x, e.b ?? y, '#c060ff', 1, 0.18); break;
      case 'chain': {
        const n = (e.s ?? '').split(',').map(Number);
        for (let i = 2; i + 1 < n.length; i += 2) this.beam(n[i - 2], n[i - 1], n[i], n[i + 1], '#aef0ff', 1, 0.16);
        break;
      }
      case 'gshot': this.beam(x, y - 0.3, e.a ?? x, e.b ?? y, '#ffe08a', 1, 0.07); this.burst(e.a ?? x, e.b ?? y, 2, ['#ffe08a'], 2, 0.15, 0); break;
      case 'bite': this.burst(e.a ?? x, e.b ?? y, 3, ['#ff4a3a'], 2, 0.25, 6); break;
      case 'jet': case 'cryojet': {
        const d = e.a ?? 0, n = e.b ?? 0;
        const dx = d === 0 ? 1 : d === 2 ? -1 : 0, dy = d === 1 ? 1 : d === 3 ? -1 : 0;
        for (let i = 0; i < 26; i++) { const k = Math.random() * (n + 0.6); this.ps.push({ x: x + dx * k + (Math.random() - 0.5) * 0.5, y: y + dy * k + (Math.random() - 0.5) * 0.5, vx: dx * 4 + (Math.random() - 0.5), vy: dy * 4 + (Math.random() - 0.5), life: 0.6, max: 0.6, col: e.t === 'jet' ? 'rgba(230,230,230,0.7)' : 'rgba(170,240,255,0.8)', size: 2, grav: 0, drag: 2 }); }
        break;
      }
      case 'rift': { const c = e.a ?? 0; const tx = (c % 17) + 0.5, ty = 2 + Math.floor(c / 17) + 0.5; this.beam(x, y, tx, ty, '#b060ff', 1, 3); break; }
      case 'swallow': this.burst(x, y, 16, ['#b060ff', '#3a1060', '#e0b0ff'], -3, 0.5, 0); break;
      case 'crack': this.burst(x, y, 6, ['#ff9a3a', '#ffe08a'], 2, 0.4, 5); break;
      case 'hatch': this.burst(x, y, 14, ['#8a7a6a', '#ff9a3a'], 3, 0.6, 9); break;
      case 'freeze': this.burst(x, y, 8, ['#e8f8ff', '#8fe0ff'], 2, 0.5, 2); break;
      case 'spore': this.burst(x, y, 20, ['rgba(200,230,90,0.8)', 'rgba(150,190,60,0.7)'], 2.5, 1.2, -0.5); break;
      case 'swell': this.ring(x, y, 0.5, 2.5, '#d8ff5a', 1.8); break;
      case 'vine': this.burst(x, y, 4, ['#62b040', '#9ae060'], 1.5, 0.5, 4); break;
      case 'plant': this.burst(x, y, 3, ['#fff08a'], 1.5, 0.3, 0); break;
      case 'deliver': this.text(8.5, -1.2, deliverText(e.s ?? ''), '#ffd27a'); break;
      case 'lvlup': this.burst(x, y - 0.5, 10, ['#6ff3ff', '#ffffff', '#ffd27a'], 2.5, 0.6, 6); this.text(x, y - 1.2, `LVL ${e.a ?? 2}`, '#6ff3ff', 1.1); break;
      case 'pickup': this.burst(x, y, 3, ['#ffd27a'], 1.5, 0.3, 4); break;
      case 'build': this.smoke(x, y, 6, 'rgba(160,140,110,0.5)', -0.5); this.burst(x, y, 10, ['#ffb23c', '#fff2c0'], 3, 0.4, 6); break;
      case 'sell': {
        this.smoke(x, y, 8, 'rgba(255,150,60,0.55)', -0.4);
        let yy = y - 1.4;
        if (e.s && e.s !== '-0') { this.text(x, yy, `${e.s} iron`, '#ff8a6a'); yy -= 0.6; }
        if (e.b) { this.text(x, yy, `+${e.b} crimsite`, '#ff8098'); yy -= 0.6; }
        if (e.a) this.text(x, yy, `+${e.a} iron`, '#9fd6ff');
        break;
      }
      case 'upgrade': this.ring(x, y, 0.2, 1.4, '#ffd27a', 0.4); break;
      case 'produce': this.text(x, y, e.s === 'crim' ? '+1 crimsite' : e.s === 'larva' ? '+1 larva' : '+1 iron', e.s === 'crim' ? '#ff8098' : e.s === 'larva' ? '#d8f07a' : '#9fd6ff'); break;
      case 'lance': this.beam(x, y - 3, x, y + 3, '#a0a0ff', 3, 0.5); this.beam(x, y - 3, x, y + 3, '#ffffff', 1, 0.3); this.shake = Math.max(this.shake, 0.2); break;
      case 'dronedrop': this.ring(x, y, 1.6, 0.3, '#ff5a45', 1.4); break;
      case 'heal': this.ring(x, y, 0.3, e.a ?? 4, '#8ff09a', 0.6); this.burst(x, y, 12, ['#8ff09a', '#ffffff'], 2, 0.8, -1); break;
      case 'flakcall': this.ring(x, y, 2.5, 0.2, '#ffd070', 0.6); break;
      case 'stasis': this.ring(x, y, 0.3, 3.5, '#6ff3ff', 0.5); break;
      case 'overclock': { const t = s.turrets.find(q => q.id === e.id); const m = t && s.mounts.find(q => q.id === t.mount); if (m) this.ring(mountX(m.side), m.y, 0.3, 1.8, '#ffd27a', 0.5); break; }
      case 'spit': this.beam(x, y, e.a ?? x, e.b ?? y, '#c8e040', 2, 0.3); this.burst(e.a ?? x, e.b ?? y, 8, ['#c8e040', '#6a8a20'], 2, 0.6, 3); break;
      case 'frostnova': this.ring(x, y, 0.5, e.a ?? 5, '#aef0ff', 0.7); this.burst(x, y, 24, ['#e8f8ff', '#8fe0ff'], 6, 0.6, 0); break;
      case 'eggs': this.burst(x, y + 1, 8, ['#e87a2a', '#ffd070'], 2, 0.5, 6); break;
      case 'split': this.explosion(x, y, 2); break;
      case 'shieldbreak': this.ring(x, y, 0.4, 1.4, '#6ff3ff', 0.3); break;
      case 'bosswithdraw': this.text(x, y - 2, 'WITHDRAWING', '#ffd27a', 1.4); break;
      case 'bounty': this.text(x, y, '+1 iron', '#9fd6ff'); break;
      case 'overheat': this.smoke(x, y, 4, 'rgba(200,200,200,0.5)'); break;
      case 'weld': this.burst(CORE_X, CORE_Y, 12, ['#fff2b0', '#8fe0ff'], 3, 0.5, 5); break;
      case 'phoenix': this.ring(CORE_X, CORE_Y, 0.5, 6, '#ffb23c', 1); this.flashScreen = 0.6; this.flashCol = '#ffb23c'; break;
      case 'descent': this.shake = Math.max(this.shake, 0.3); break;
      case 'emerge': this.burst(x, y, 8, ['#d8e090', '#fff'], 2, 0.4, 5); break;
      case 'recruit': this.burst(x, y - 0.5, 6, ['#ffd27a'], 1.5, 0.4, 2); break;
      case 'borer': this.burst(x, y, 10, ['#6a5040', '#8a7060'], 3, 0.6, 8); break;
      case 'burrow': this.burst(x, y, 8, ['#6a5040'], 2, 0.5, 8); break;
      case 'sun': this.flash(x, 0, 2, 'rgba(255,240,180,0.6)', 0.3); break;
    }
  }

  muzzle(s: GameState, id: number, a?: number) {
    const t = s.turrets.find(q => q.id === id);
    const m = t && s.mounts.find(q => q.id === t.mount);
    if (!t || !m) return;
    const ang = a ?? t.ang;
    const x = mountX(m.side) + Math.cos(ang) * 0.6, y = m.y + Math.sin(ang) * 0.6;
    this.flash(x, y, 0.45, 'rgba(255,230,140,0.95)', 0.06);
  }

  update(dt: number) {
    for (let i = this.ps.length - 1; i >= 0; i--) {
      const p = this.ps[i];
      p.life -= dt;
      if (p.life <= 0) { this.ps.splice(i, 1); continue; }
      p.vy += p.grav * dt;
      const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (const arr of [this.beams, this.rings, this.txt, this.flashes] as { life: number }[][]) {
      for (let i = arr.length - 1; i >= 0; i--) { arr[i].life -= dt; if (arr[i].life <= 0) arr.splice(i, 1); }
    }
    for (const t of this.txt) t.y += t.vy * dt;
    this.shake = Math.max(0, this.shake - dt * 1.6);
    this.flashScreen = Math.max(0, this.flashScreen - dt * 1.8);
    if (this.ps.length > 1600) this.ps.splice(0, this.ps.length - 1600);
  }
}

function deliverText(s: string) {
  const counts: Record<string, number> = {};
  for (const k of s.split(',')) if (k) counts[k] = (counts[k] ?? 0) + 1;
  const name: Record<string, string> = { iron: 'iron', crim: 'crimsite', coal: 'coal', ochre: 'ochre', jade: 'jade', void: 'void', tech: 'TECH CRATE', bonus: 'BONUS CRATE', charge: 'CORE CHARGE' };
  return Object.entries(counts).map(([k, n]) => (k === 'tech' || k === 'bonus' || k === 'charge' ? name[k] : `+${n} ${name[k]}`)).join('  ');
}
