// Guidance in play: the objective card of the guided first contract (one objective, one highlighted target, a
// SKIP button) and, on every contract, help finding coal (a tap on DRILL without coal shows where it is; a long
// wait without coal progress points at the nearest seam).
import { coalQuota } from '../core/mods';
import { coalSecured, digStep, nearestBlock, tutActive, tutTargetPos, tutTick, TUT_STEPS, type TutTarget } from '../core/tutorial';
import { B } from '../core/types';
import { W } from '../core/world';
import { audio } from '../audio/audio';
import { h } from './dom';
import type { GameView } from './game';

const COAL_IDLE_S = 45;

export class Guide {
  g: GameView;
  card: HTMLElement; num: HTMLElement; text: HTMLElement; skip: HTMLButtonElement;
  lastKey = ''; lastUi: HTMLElement | null = null; skipArmed = 0;
  coalIdle = 0; coalLast = -1; coalShown = 0; coalToastDone = false;

  constructor(g: GameView) {
    this.g = g;
    this.num = h('span', { class: 'obj-n' });
    this.text = h('span', { class: 'obj-t' });
    this.skip = h('button', { class: 'obj-skip', 'aria-label': 'Skip the tutorial' }, 'SKIP') as HTMLButtonElement;
    this.skip.addEventListener('click', e => { e.stopPropagation(); this.onSkip(); });
    this.card = h('div', { class: 'objective hidden', role: 'status', 'aria-live': 'polite', title: 'Show me' }, this.num, this.text, this.skip);
    // tapping the objective brings its target back into view
    this.card.addEventListener('click', () => { this.lastKey = ''; audio.play('click'); });
    g.root.appendChild(this.card);
  }

  get active() { return tutActive(this.g.s); }

  onSkip() {
    const s = this.g.s;
    if (!s.tut) return;
    if (!this.skipArmed) {
      this.skipArmed = window.setTimeout(() => { this.skipArmed = 0; this.skip.textContent = 'SKIP'; this.skip.classList.remove('armed'); }, 3000);
      this.skip.textContent = 'TAP AGAIN TO SKIP'; this.skip.classList.add('armed');
      audio.play('click');
      return;
    }
    clearTimeout(this.skipArmed); this.skipArmed = 0;
    s.tut.skipped = true;

    this.g.app.skipTutorial();
    this.clearTarget();
    this.card.classList.add('hidden');
    this.g.toast('Tutorial skipped — hints stay on (Settings)');
    this.g.measureInsets();
    audio.play('close');
  }

  clearTarget() { this.pulse(null); this.g.view.tutTarget = null; }

  /** highlight one button with an arrow and a caption (HOLD / TAP / SPEED UP) */
  pulse(el: HTMLElement | null, label = 'TAP') {
    if (el !== this.lastUi) {
      if (this.lastUi) { this.lastUi.classList.remove('tut-pulse', 'tut-side'); this.lastUi.removeAttribute('data-tut'); }
      this.lastUi = el;
      // a button inside a scrolling sheet is scrolled into view
      if (el?.closest('.sheet-body')) el.scrollIntoView({ block: 'nearest' });
    }
    if (!el) return;
    el.classList.add('tut-pulse');
    if (el.dataset.tut !== label) el.dataset.tut = label;
    // buttons at the top of the screen get the arrow from the side (there is no room above them)
    el.classList.toggle('tut-side', el.getBoundingClientRect().top < 110);
  }

  /** the caption for a highlighted button */
  uiLabel(t: TutTarget): string {
    if (t && 'ui' in t) return t.ui === 'drill' || t.ui === 'launch' ? 'HOLD' : t.ui === 'speed' ? 'SPEED UP' : 'TAP';
    return 'TAP';
  }

  /** the caption over a spot in the world: what it is */
  worldLabel(t: TutTarget): string {
    if (!t || 'ui' in t) return '';
    if ('pad' in t) return 'BUILD';
    if ('mount' in t) return 'TURRET';
    switch (this.g.s.mine.kind[t.cell]) {
      case B.Iron: return 'IRON';
      case B.Coal: return 'COAL';
      case B.Cache: return 'CRATE';
      case B.Charge: return 'CHARGE';
      default: return 'DIG HERE';
    }
  }

  /** a HUD / sheet button that stands for the target */
  uiEl(t: TutTarget): HTMLElement | null {
    const g = this.g;
    if (!t) return null;
    if ('ui' in t) {
      switch (t.ui) {
        case 'drill': return g.actDrill;
        case 'dig': return g.actDig;
        case 'launch': return g.actLaunch;
        // only while time runs at ×1: once the player speeds up, the button stops asking
        case 'speed': return g.s.speed === 1 ? g.hud.speed : null;
        case 'build': return g.root.querySelector<HTMLElement>('.sheet .btn.primary');
      }
    }
    // the target pad's or mount's own sheet is open: its BUILD button is the next thing to tap (another pad's sheet
    // keeps the arrow on the right pad)
    const own = ('pad' in t && g.sheets.kind === 'pad' && g.view.selPad === t.pad) || ('mount' in t && g.sheets.kind === 'mount' && g.view.selMount === t.mount);
    if (own) { const b = g.root.querySelector<HTMLButtonElement>('.sheet .btn.primary'); return b && !b.disabled ? b : null; }
    return null;
  }

  tick(rdt: number) {
    const g = this.g, s = g.s;
    if (s.phase === 'launch' || s.phase === 'over') { this.clearTarget(); this.card.classList.add('hidden'); return; }
    if (this.active) this.tickTutorial(rdt);
    else {
      if (!this.card.classList.contains('hidden')) { this.card.classList.add('hidden'); g.measureInsets(); }
      this.tickCoal(rdt);
    }
  }

  tickTutorial(rdt: number) {
    const g = this.g, s = g.s;
    const { finished, current } = tutTick(s, rdt);
    for (const id of finished) {

      audio.play('confirm');
      this.card.classList.remove('flash'); void this.card.offsetWidth; this.card.classList.add('flash');
    }
    if (this.card.classList.contains('hidden')) { this.card.classList.remove('hidden'); g.measureInsets(); }
    if (!current) {
      // between objectives (e.g. the drill is ordered and dusk is a while away): say what happens next
      const fast = s.speed > 1;
      const txt = s.drillQueued ? `Drill ordered for dawn. Dig more ore until dusk${fast ? '' : ', or speed up time'}` : fast ? 'Keep digging until dusk' : 'Keep digging, or speed up time';
      if (this.text.textContent !== txt) this.text.textContent = txt;
      this.num.textContent = `${s.tut!.done.length}/${TUT_STEPS.length}`;
      this.pulse(this.uiEl({ ui: 'speed' }), 'SPEED UP');
      g.view.tutTarget = null;
      return;
    }
    const n = TUT_STEPS.indexOf(current) + 1;
    const txt = current.text(s);
    if (this.text.textContent !== txt) this.text.textContent = txt;
    const nn = `${n}/${TUT_STEPS.length}`;
    if (this.num.textContent !== nn) this.num.textContent = nn;
    // target: a button (pulsing) or a spot in the world (arrow drawn by the renderer)
    const t = current.target(s, g.view.dig);
    const el = this.uiEl(t);
    this.pulse(el, this.uiLabel(t));
    const pos = el ? null : tutTargetPos(s, t);
    g.view.tutTarget = pos ? { ...pos, label: this.worldLabel(t) } : null;
    const key = `${current.id}|${JSON.stringify(t)}`;
    if (key !== this.lastKey) { this.lastKey = key; this.offT = 0; if (pos && t) this.bringIntoView(t, pos); }
    else if (pos && t) {
      // the camera moved on its own (dusk, a descent) and the target is out of view: bring it back once the
      // player has not touched the world for a few seconds
      this.offT = this.inView(pos) ? 0 : this.offT + rdt;
      if (this.offT > 5 && performance.now() - g.lastInputAt > 5000) { this.offT = 0; this.bringIntoView(t, pos); }
    }
  }
  offT = 0;

  /** is a world rectangle wholly inside the part of the screen not covered by the HUD (with room for a finger)? */
  inView(pos: { x: number; y: number; w: number; h: number }) {
    const g = this.g, r = g.r;
    const a = r.toScreen(pos.x, pos.y), b = r.toScreen(pos.x + pos.w, pos.y + pos.h);
    const rect = g.canvas.getBoundingClientRect();
    return a.x > 8 && b.x < rect.width - 8 && a.y > r.insetTop + 8 && b.y < rect.height - r.insetBottom - 10;
  }

  /** move the camera so a world target is on screen (only when it is not) */
  bringIntoView(t: NonNullable<TutTarget>, pos: { x: number; y: number; w: number; h: number }) {
    const g = this.g, r = g.r;
    const cx = pos.x + pos.w / 2, cy = pos.y + pos.h / 2;
    if (this.inView(pos)) return;
    const view = 'cell' in t ? 'mine' : 'pad' in t ? 'deck' : cy > -8 ? 'deck' : 'shaft';
    g.camTo(view as 'mine');
    const c = r.cam;
    c.tx = Math.max(0, Math.min(W, cx));
    c.ty = r.centerY(cy);
  }

  // ---- coal help on every contract -------------------------------------------------------------------------
  tickCoal(rdt: number) {
    const g = this.g, s = g.s;
    const need = s.phase === 'day' && !s.dusk && s.stratum >= 1 && !s.drillQueued && coalSecured(s) < coalQuota(s);
    if (!need) { this.coalIdle = 0; this.coalShown = 0; if (g.view.tutTarget?.label?.includes('COAL')) g.view.tutTarget = null; return; }
    const secured = coalSecured(s);
    if (secured !== this.coalLast) { this.coalLast = secured; this.coalIdle = 0; this.coalShown = 0; if (g.view.tutTarget?.label?.includes('COAL')) g.view.tutTarget = null; }
    this.coalIdle += rdt * Math.max(1, s.speed);
    if (this.coalIdle >= COAL_IDLE_S && !g.menuPause) {
      const c = nearestBlock(s, B.Coal);
      if (c < 0) return;
      // coal behind other blocks: point at the block to tag first
      const step = digStep(s, c);
      const pos = tutTargetPos(s, { cell: step })!;
      g.view.tutTarget = { ...pos, label: step === c ? 'COAL' : 'DIG TO COAL' };
      if (!this.coalShown) {
        this.coalShown = 1;
        if (!this.coalToastDone) { this.coalToastDone = true; g.toast(`The drill needs ${coalQuota(s)} coal: tag the black seams (DIG)`); }
      }
    }
  }

  /** DRILL tapped without enough coal: flash every coal block and bring the nearest one into view */
  showCoal() {
    const g = this.g, s = g.s;
    const cells: number[] = [];
    for (let i = 0; i < s.mine.kind.length; i++) if (s.mine.kind[i] === B.Coal) cells.push(i);
    if (!cells.length) return;
    g.view.flashCells = cells; g.view.flashT = 3;
    const c = nearestBlock(s, B.Coal, false);
    const pos = tutTargetPos(s, { cell: c });
    if (pos) this.bringIntoView({ cell: c }, pos);
  }
}
