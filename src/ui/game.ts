// The contract screen: canvas + HUD + input + sheets. Drives the simulation with a fixed 60 Hz step.
import { abilityReady, useAbility } from '../core/abilities';
import { progress } from '../platform/bloomplay';
import { TIERS } from '../core/data/contracts';
import { BUILDINGS } from '../core/data/buildings';
import { ENEMIES } from '../core/data/enemies';
import { PLATFORMS } from '../core/data/platforms';
import { EVENTS } from '../core/data/techs';
import { TURRETS } from '../core/data/turrets';
import { canOrderDrill, orderDrill, setTag, workforceCap } from '../core/economy';
import { coalQuota } from '../core/mods';
import { saveRun } from '../core/save';
import { canLaunch, launch, step } from '../core/sim';
import { B, type FxEvent, type GameState, type HaulPriority } from '../core/types';
import { workforceUsed } from '../core/workers';
import { CORE_X, CORE_Y, dist, MINE_H, MINE_TOP, mountX, shaftTop, W, worldCell } from '../core/world';
import { audio } from '../audio/audio';
import { Renderer, type ViewState } from '../render/renderer';
import type { App } from './app';
import { h, icon, setText, holdButton, clear, armGhostGuard } from './dom';
import { Sheets } from './sheets';
import { Guide } from './guide';
import { digField } from '../core/tutorial';
import type { AchDef } from '../core/data/achievements';
import { drawLaunch } from '../render/cutscene';

const STEP = 1 / 60;
const EVENT_BANNER: Record<string, { title: string; text: string; kind: 'bad' | 'good' | 'info' }> = {};

export class GameView {
  app: App; s: GameState;
  root: HTMLElement; canvas: HTMLCanvasElement; r: Renderer;
  view: ViewState = { dig: false, selMount: -1, selPad: -1, selTurret: -1, selBuilding: -1, reticle: null, hoverCell: -1, t: 0, previewTurret: null, highlightCells: [], tutTarget: null, flashCells: [], flashT: 0 };
  paused = false; menuPause = false; acc = 0; last = 0; raf = 0; alive = true;
  sheets: Sheets;
  hud: Record<string, HTMLElement> = {};
  banners: HTMLElement; toasts: HTMLElement;
  prevPhase = ''; lastDusk = false; drillStop: (() => void) | null = null;
  pointers = new Map<number, { x: number; y: number; sx: number; sy: number; t0: number; moved: boolean; button: number }>();
  pinch: { d: number; k: number; mx: number; my: number } | null = null;
  pressTimer = 0; painting: { on: boolean; last: number } | null = null; panning = false; longPressed = false;
  hintEl: HTMLElement | null = null;
  bannerMap = new Map<string, HTMLElement>();
  cutT = 0;
  guide!: Guide;
  wayHints = 0;
  insetObs: ResizeObserver | null = null;
  lastInputAt = 0; // last touch/click on the world (the guide leaves the camera alone while the player is looking)

  constructor(app: App, s: GameState) {
    this.app = app; this.s = s;
    this.root = h('div', { class: 'game', style: 'position:absolute;inset:0' });
    this.canvas = h('canvas', { class: 'world', 'aria-label': 'Game world' });
    this.root.appendChild(this.canvas);
    this.r = new Renderer(this.canvas);
    this.r.fx.shakeOn = app.profile.settings.shake;
    this.banners = h('div', { class: 'banners' });
    this.toasts = h('div', { class: 'toast-wrap', role: 'status', 'aria-live': 'polite' });
    this.sheets = new Sheets(this);
    this.buildHud();
    this.guide = new Guide(this);
    this.root.appendChild(this.toasts);
    this.root.appendChild(h('div', { class: 'skip-hint' }, 'HOLD ANYWHERE TO SKIP'));
    this.root.appendChild(h('div', { class: `crt ${app.profile.settings.crt ? '' : 'off'}` }));
    this.bindInput();
    for (const e of Object.keys(EVENTS)) EVENT_BANNER[e] = { title: EVENTS[e].name, text: EVENTS[e].text, kind: EVENTS[e].bad ? 'bad' : 'good' };
  }

  mount(parent: HTMLElement) {
    parent.appendChild(this.root);
    this.r.resize();
    this.measureInsets();
    // HUD rows appear and change height during play (ability slots, the objective card): keep the insets current
    if (typeof ResizeObserver !== 'undefined') {
      this.insetObs = new ResizeObserver(() => this.measureInsets());
      for (const q of ['.hud-tl .hud-panel', '.hud-tr', '.hud-bottom']) { const el = this.root.querySelector(q); if (el) this.insetObs.observe(el); }
      if (this.guide) this.insetObs.observe(this.guide.card);
    }
    this.initCamera();
    this.last = performance.now();
    this.schedule();
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVis);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    this.syncMusic();
    this.refreshEventBanners();
    this.maybeHint();
  }
  destroy() {
    this.alive = false;
    this.insetObs?.disconnect();
    cancelAnimationFrame(this.raf); clearTimeout(this.watchdog);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVis);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKeyUp);
    this.drillStop?.(); this.drillStop = null;
    this.root.remove();
  }
  onResize = () => {
    const was = this.portrait, dpr = this.r.dpr;
    this.r.resize(); this.clampZoom(); this.measureInsets();
    // turning the phone changes the zoom policy (fit width vs fit rows), and moving the window to a screen with
    // another pixel density changes what a zoom step means: re-frame the current view in both cases
    if (this.portrait !== was || this.r.dpr !== dpr) {
      const c = this.r.cam;
      if (this.s.phase === 'landing') c.k = this.zoomFor('deck'); // the landing shot keeps its framing
      else if (this.s.phase !== 'launch') { this.camTo(this.viewNow as 'deck'); c.x = c.tx; c.y = c.ty; }
    }
  };
  /** The platform paused us (its overlay, or the tab went to the background): save and show the pause menu. */
  platformPause() {
    const s = this.s;
    if (s.phase === 'over' || s.phase === 'launch' || this.sheets.draftOpen || this.sheets.modal) { if (s.phase !== 'over') saveRun(s); return; }
    this.sheets.openPause();
  }
  onVis = () => { if (document.hidden) { if (this.s.phase !== 'over') saveRun(this.s); audio.suspend(); } else audio.resume(); };

  // ---------------------------------------------------------------------------------------------
  initCamera() {
    const c = this.r.cam;
    c.k = this.zoomFor('deck');
    if (this.s.phase === 'landing') { c.x = c.tx = W / 2; c.y = c.ty = 1; }
    else if (this.s.phase === 'night') this.camTo('shaft');
    else this.camTo('deck');
    c.x = c.tx; c.y = c.ty;
  }
  mineK() { return Math.max(this.r.fitK(W), Math.ceil((44 * this.r.dpr) / 16)); }
  get portrait() { return this.r.ch > this.r.cw * 1.15; }
  /** Zoom policy: portrait fits the width (mine at ≥44 px blocks); landscape/desktop also fits the rows the view needs. */
  zoomFor(where: 'shaft' | 'deck' | 'mine') {
    const r = this.r;
    const kW = r.fitK(W);
    if (this.portrait) return where === 'mine' ? this.mineK() : kW;
    const band = (r.ch / r.dpr - r.insetTop - r.insetBottom) * r.dpr;
    const rows = where === 'shaft' ? 2.4 - (shaftTop(this.s) - 1) : where === 'deck' ? (r.ch / r.dpr < 500 ? 9 : 13) : MINE_H + 1;
    const kH = Math.max(1, Math.floor(band / (rows * 16)));
    const sideRoom = r.cw / r.dpr < 1000 ? 200 : 0; // landscape phones keep side margins for the HUD columns
    const kSide = Math.max(1, Math.floor(((r.cw / r.dpr - sideRoom) * r.dpr) / (W * 16)));
    const minK = Math.max(1, Math.round(((where === 'shaft' ? 16 : 20) * r.dpr) / 16));
    return Math.max(minK, Math.min(kW, kSide, where === 'mine' ? Math.max(kH, Math.round((28 * r.dpr) / 16)) : kH));
  }
  camTo(where: 'shaft' | 'deck' | 'mine') {
    const c = this.r.cam; c.follow = true;
    const top = shaftTop(this.s);
    this.measureInsets();
    c.k = this.zoomFor(where);
    const band = (this.r.ch / this.r.dpr - this.r.insetTop - this.r.insetBottom) * this.r.dpr / (16 * c.k);
    c.tx = W / 2;
    if (where === 'shaft') {
      const lo = top - 1, hi = 2.4;
      c.ty = this.r.centerY(hi - lo <= band ? (lo + hi) / 2 : hi - band / 2);
    } else if (where === 'deck') c.ty = this.r.centerY(band >= 12 ? -1.2 : -0.8);
    else c.ty = this.r.centerY(MINE_TOP - 0.5 + Math.min(MINE_H / 2 + 0.5, band / 2));
    this.updateChips(where);
  }
  measureInsets() {
    const tl = this.root.querySelector('.hud-tl .hud-panel') as HTMLElement | null, tr = this.root.querySelector('.hud-tr') as HTMLElement | null;
    const hb = this.root.querySelector('.hud-bottom') as HTMLElement | null;
    let top = Math.max(tl?.getBoundingClientRect().bottom ?? 0, tr?.getBoundingClientRect().bottom ?? 0);
    const rect = this.canvas.getBoundingClientRect();
    // the objective card sits under the top HUD row (on short landscape screens, at the top between the panels)
    const card = this.guide?.card;
    if (card && !card.classList.contains('hidden')) {
      const short = rect.height < 560 && rect.width > rect.height;
      card.style.top = short ? '' : `${Math.round(top - rect.top + 6)}px`;
      if (!short) top = Math.max(top, card.getBoundingClientRect().bottom);
    }
    this.r.insetTop = Math.max(0, top - rect.top + 4);
    this.r.insetBottom = hb ? Math.max(0, rect.bottom - hb.getBoundingClientRect().top + 4) : 0;
  }
  clampZoom() { const c = this.r.cam; c.k = Math.max(this.r.minK(), Math.min(this.r.maxK(), c.k)); }
  zoomBy(d: number, cx?: number, cy?: number) {
    const c = this.r.cam;
    const before = cx !== undefined ? this.r.toWorld(cx, cy!) : null;
    c.k = Math.max(this.r.minK(), Math.min(this.r.maxK(), c.k + d));
    if (before && cx !== undefined) { const after = this.r.toWorld(cx, cy!); c.x += before.x - after.x; c.y += before.y - after.y; c.tx = c.x; c.ty = c.y; c.follow = false; }
  }

  // ---------------------------------------------------------------------------------------------
  watchdog = 0; lastFrameAt = 0;
  /** rAF normally; a timer fallback keeps the loop alive where rAF is throttled while the page is visible. */
  schedule() {
    this.raf = requestAnimationFrame(this.frame);
    clearTimeout(this.watchdog);
    this.watchdog = window.setTimeout(() => { if (this.alive && !document.hidden && performance.now() - this.lastFrameAt > 180) { cancelAnimationFrame(this.raf); this.frame(performance.now()); } }, 200);
  }
  frame = (now: number) => {
    if (!this.alive) return;
    this.lastFrameAt = performance.now();
    // a window dragged to a screen with another pixel density does not always fire resize
    if (Math.min(3, window.devicePixelRatio || 1) !== this.r.dpr) this.onResize();
    const rdt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.view.t += rdt;
    const s = this.s;
    const running = !this.paused && !this.menuPause && !s.draft && s.phase !== 'over';
    if (running) {
      this.acc += rdt * s.speed;
      let n = 0;
      while (this.acc >= STEP && n < 12) { step(s, STEP, { blueprints: this.app.profile.blueprints }); this.acc -= STEP; n++; this.drainFx(); }
      if (n >= 12) this.acc = 0;
    } else this.drainFx();
    if (s.draft && !this.sheets.draftOpen) this.sheets.openDraft();
    if (s.phase !== this.prevPhase) this.onPhase(this.prevPhase, s.phase);
    if (s.dusk !== this.lastDusk) { this.lastDusk = s.dusk; this.root.querySelector('.vignette-red')?.classList.toggle('on', s.dusk); }
    audio.listenerX = this.r.cam.x;
    if (s.phase === 'night' && s.core.hp / s.core.max < 0.35 && Math.floor(this.view.t / 2.4) !== Math.floor((this.view.t - rdt) / 2.4)) audio.play('corealarm');
    if (this.cutT > 0 && this.cutT < 8.2 && this.cutT + rdt >= 8.2) audio.play('detonate');
    if (s.phase === 'launch' || (s.phase === 'over' && this.cutT > 0 && s.result?.success)) {
      this.cutT += rdt;
      drawLaunch(this.r, s, this.cutT);
      if (s.phase === 'over' && this.cutT > 12.5) this.finish();
    } else {
      this.r.draw(s, this.view, rdt);
      if (s.phase === 'over') this.finish();
    }
    this.updateHud();
    this.guide.tick(rdt);
    if (this.view.flashT > 0) { this.view.flashT -= rdt; if (this.view.flashT <= 0) this.view.flashCells = []; }
    this.schedule();
  };

  finished = false;
  finish() {
    if (this.finished) return;
    this.finished = true;
    this.app.contractOver(this.s);
  }

  onPhase(prev: string, cur: string) {
    this.prevPhase = cur;
    if (cur === 'night') this.camTo('shaft');
    if (cur === 'descent') { this.camTo('deck'); this.drillStop?.(); this.drillStop = audio.loop('drill', 0.9); this.showSaving(); }
    if (prev === 'descent') { this.drillStop?.(); this.drillStop = null; audio.play('drill_stop'); }
    if (prev === 'night' && cur === 'day') this.camTo('deck');
    if (cur === 'launch') { this.cutT = 0.001; this.sheets.closeAll(); audio.setMusic('launch', 1.5); this.root.classList.add('cinematic'); this.hintEl?.remove(); this.hintEl = null; }
    this.syncMusic();
    this.refreshActions();
    this.maybeHint();
  }

  syncMusic() {
    const s = this.s;
    if (s.phase === 'launch' || s.phase === 'over') return;
    const bossHere = s.enemies.some(e => e.boss);
    audio.setMusic(s.phase === 'night' ? (bossHere || (s.boss && s.boss.night === s.day && !s.boss.done) ? 'boss' : 'night') : 'day');
  }

  // ---------------------------------------------------------------------------------------------
  drainFx() {
    const s = this.s;
    if (!s.ffx.length) return;
    const list = s.ffx.splice(0, s.ffx.length);
    for (const e of list) { this.r.fx.onEvent(e, s); this.sound(e); this.ui(e); }
  }

  sound(e: FxEvent) {
    const x = e.x;
    const onScreen = x === undefined || e.y === undefined || Math.abs(e.y - this.r.cam.y) < (this.r.ch / this.r.S) * 0.7;
    const v = onScreen ? 1 : 0.35;
    const P = (c: string, o: { vol?: number; rate?: number } = {}) => audio.play(c, { x, vol: (o.vol ?? 1) * v, rate: o.rate });
    switch (e.t) {
      case 'dig': P('dig', { vol: 0.55 }); break;
      case 'break': P(e.s === 'blast' ? 'crumble' : 'break', { vol: 0.8 }); if ([B.Iron, B.Crim, B.Coal, B.Ochre, B.Jade, B.Void, B.Cache, B.Bonus, B.Charge].includes(e.a ?? -1)) P('oredrop', { vol: 0.6 }); break;
      case 'deliver': audio.play('deliver', { vol: 1.15 }); break;
      case 'lvlup': audio.play('upgrade', { vol: 0.55, rate: 1.1 + 0.05 * (e.a ?? 2) }); break;
      case 'pickup': P('pickup', { vol: 0.5 }); break;
      case 'boom': case 'blast': P((e.a ?? 1) > 2 ? 'explode_big' : 'explode', { vol: 0.8 }); break;
      case 'flak': P('explode', { vol: 0.6 }); break;
      case 'mg': P('mg', { vol: 0.5 }); break;
      case 'mini': P('minigun', { vol: 0.45 }); break;
      case 'auto': P('auto', { vol: 0.6 }); break;
      case 'shotgun': P('shotgun', { vol: 0.6 }); break;
      case 'rail': P('rail'); break;
      case 'rocket': P('rocket', { vol: 0.7 }); break;
      case 'mortar': P('mortar', { vol: 0.7 }); break;
      case 'flakfire': P('flakfire', { vol: 0.6 }); break;
      case 'flame': P('flame', { vol: 0.4 }); break;
      case 'laser': case 'weak': P('laser', { vol: 0.6 }); break;
      case 'cryo': P('cryo', { vol: 0.35 }); break;
      case 'hum': P('hum', { vol: 0.35 }); break;
      case 'chain': audio.play('tesla', { vol: v }); break;
      case 'flies': P('flies', { vol: 0.5 }); break;
      case 'hit': P('hit', { vol: 0.35 }); break;
      case 'kill': P('bugdie', { vol: 0.55 }); break;
      case 'ukill': P('bugdie', { vol: 0.7, rate: 0.8 }); break;
      case 'corehit': audio.play('corehit'); break;
      case 'hurt': P('hurt', { vol: 0.7 }); break;
      case 'death': audio.play('death'); break;
      case 'dusk': audio.play('alarm'); break;
      case 'nightfall': audio.play('nightfall'); break;
      case 'dawn': audio.play('dawn'); break;
      case 'drill': case 'descent': audio.play('drill_start'); break;
      case 'drillqueued': audio.play('confirm'); break;
      case 'build': audio.play('build'); break;
      case 'sell': audio.play('sell'); break;
      case 'upgrade': case 'research': audio.play('upgrade'); break;
      case 'recruit': audio.play('recruit'); break;
      case 'queue': audio.play('click'); break;
      case 'draft': audio.play('draft'); break;
      case 'pick': audio.play('pick'); break;
      case 'reroll': audio.play('reroll'); break;
      case 'ban': audio.play('ban'); break;
      case 'event': audio.play('event'); break;
      case 'forecast': audio.play('event'); break;
      case 'bosswarn': case 'bossforecast': audio.play('bosswarn'); break;
      case 'bossarrive': audio.play('boss'); this.syncMusic(); break;
      case 'bosswithdraw': audio.play('bosswithdraw'); break;
      case 'bossdie': audio.play('explode_big'); break;
      case 'jet': P('steam'); break;
      case 'cryojet': P('freeze'); break;
      case 'rift': P('rift', { vol: 0.7 }); break;
      case 'swallow': P('swallow'); break;
      case 'crack': P('crack', { vol: 0.7 }); break;
      case 'hatch': P('hatch'); break;
      case 'freeze': P('freeze', { vol: 0.5 }); break;
      case 'spore': P('spore'); break;
      case 'swell': P('swell', { vol: 0.6 }); break;
      case 'borer': P('borer'); break;
      case 'bite': P('bite', { vol: 0.6 }); break;
      case 'gshot': P('gshot', { vol: 0.6 }); break;
      case 'plant': P('fuse', { vol: 0.6 }); break;
      case 'lance': audio.play('lance'); break;
      case 'dronedrop': audio.play('drone'); break;
      case 'heal': audio.play('heal'); break;
      case 'horn': audio.play('horn'); break;
      case 'overclock': audio.play('overclock'); break;
      case 'flakcall': audio.play('flakcall'); break;
      case 'stasis': audio.play('stasis'); break;
      case 'sun': audio.play('sun'); break;
      case 'spit': P('spit'); break;
      case 'frostnova': audio.play('freeze'); break;
      case 'eggs': P('eggs'); break;
      case 'split': P('explode'); break;
      case 'shieldbreak': P('shieldbreak', { vol: 0.6 }); break;
      case 'charge': audio.play('charge'); break;
      case 'produce': P('produce', { vol: 0.4 }); break;
      case 'phoenix': audio.play('phoenix'); break;
      case 'weld': audio.play('weld'); break;
      case 'supply': audio.play('supply'); break;
      case 'overheat': P('overheat', { vol: 0.5 }); break;
      case 'launch': audio.play('launch'); break;
      case 'enrage': audio.play('alarm'); break;
      case 'emerge': P('emerge', { vol: 0.6 }); break;
      case 'bounty': P('pickup', { vol: 0.5 }); break;
      case 'save': break;
    }
  }

  ui(e: FxEvent) {
    const s = this.s;
    switch (e.t) {
      case 'dusk': this.bigBanner('DUSK', 'crew returning to the platform', true); break;
      case 'nightfall': this.bigBanner(`NIGHT ${s.day}`, s.waveTotal ? `${s.waveTotal} contacts inbound` : '', true); break;
      case 'dawn': this.bigBanner(`DAY ${s.day}`, s.drillQueued ? 'drilling 50 m' : ''); this.refreshEventBanners(); this.app.achieve('night'); break;
      case 'deliver': this.flyGain(e); break;
      case 'arrive':
        this.toast(`Depth ${e.a} m reached`); this.refreshEventBanners();
        this.app.achieve('descent'); if (s.depth >= s.contract.targetStrata * 50) this.app.achieve('target');
        break;
      case 'save':
        saveRun(s);
        progress(`${TIERS[s.contract.tier - 1].name} · ${s.contract.planet} · ${s.depth}/${s.contract.targetStrata * 50} m · day ${s.day}`);
        break;
      case 'pick': this.app.achieve('tech'); break;
      case 'event': case 'forecast': this.refreshEventBanners(); break;
      case 'bosswarn': case 'bossforecast': this.refreshEventBanners(); if (e.t === 'bosswarn') this.bigBanner('WARNING', `${ENEMIES[e.s!].name} will reach the shaft tonight`, true); break;
      case 'bossarrive': this.bigBanner(ENEMIES[e.s!].name.toUpperCase(), 'boss incoming', true); break;
      case 'bosswithdraw': this.toast(`${ENEMIES[e.s!].name} withdraws up the shaft`); this.refreshEventBanners(); this.app.achieve('bossWithdraw'); break;
      case 'bossdie': this.bigBanner('BOSS KILLED', '+2 void'); this.app.achieve('bossKill'); break;
      case 'death': this.toast(`A ${PLATFORMS[s.setup.platform].workers[(e.s ?? 'miner') as 'miner'].name.toLowerCase()} was lost`, true); break;
      case 'charge': this.app.achieve('charge'); this.bigBanner('CORE CHARGED', s.charges >= s.contract.charges ? 'launch is available by day' : `${s.charges}/${s.contract.charges}`); break;
      case 'drillqueued': this.toast('Drilling next morning — coal spent'); break;
      case 'toast': this.toast(e.s ?? ''); break;
      case 'enrage': this.toast('The swarm is enraged — finish them!', true); break;
      case 'phoenix': this.bigBanner('PHOENIX CORE', 'restored to 35%'); break;
      case 'supply': this.toast('Supply drop: +5 iron'); break;
    }
  }

  /** An achievement earned for the first time: a medal card with its reward. */
  achievementToast(d: AchDef) {
    const parts = (['ochre', 'jade', 'void'] as const).filter(k => d.reward[k] > 0).map(k => h('span', { class: 'res', style: `color:var(--${k})` }, icon(k), `+${d.reward[k]}`));
    const el = h('div', { class: 'ach', role: 'status' }, icon('star', 'icon lg'), h('div', { class: 'col', style: 'gap:1px' }, h('small', null, 'ACHIEVEMENT'), h('b', null, d.name)), h('div', { class: 'row', style: 'gap:6px' }, ...parts));
    this.root.querySelectorAll('.ach').forEach(n => n.remove());
    this.root.appendChild(el);
    audio.play('upgrade', { vol: 0.9 });
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => el.remove(), 3700);
  }

  /** Delivered resources fly from the deck into their HUD counters, which bump. */
  flyGain(e: FxEvent) {
    const kinds = (e.s ?? '').split(',').filter(k => k === 'iron' || k === 'crim' || k === 'coal' || k === 'larva');
    if (!kinds.length || this.root.querySelectorAll('.fly').length > 8) return;
    const rect = this.canvas.getBoundingClientRect();
    const from = this.r.toScreen(e.x ?? 8.5, (e.y ?? -1) - 0.6);
    const count: Record<string, number> = {};
    for (const k of kinds) count[k] = (count[k] ?? 0) + 1;
    let i = 0;
    for (const [k, n] of Object.entries(count)) {
      const target = this.hud[k]?.parentElement;
      if (!target) continue;
      const to = target.getBoundingClientRect();
      const el = h('span', { class: 'fly res', style: `color:var(--${k});left:${from.x}px;top:${from.y + i * 18}px` }, icon(k), `+${n}`);
      this.root.appendChild(el);
      const dx = to.left + to.width / 2 - rect.left - from.x, dy = to.top + to.height / 2 - rect.top - from.y - i * 18;
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = `translate(${dx}px, ${dy}px) scale(0.7)`; el.style.opacity = '0.2'; }));
      setTimeout(() => { el.remove(); target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump'); }, 650);
      i++;
    }
  }

  toast(text: string, bad = false) {
    const t = h('div', { class: `toast ${bad ? 'bad' : ''}` }, text);
    this.toasts.appendChild(t);
    while (this.toasts.children.length > 3) this.toasts.firstChild?.remove();
    setTimeout(() => t.remove(), 3200);
  }
  bigBanner(title: string, sub = '', red = false) {
    this.root.querySelectorAll('.big-banner').forEach(n => n.remove());
    const b = h('div', { class: `big-banner ${red ? 'red' : ''}` }, title, sub ? h('small', null, sub) : null);
    this.root.appendChild(b);
    setTimeout(() => b.remove(), 2500);
  }
  showSaving() {
    const el = h('div', { class: 'saving' }, 'SAVING…');
    this.root.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  /** banner key → collapsed. Banners collapse to their title after a few seconds (they sit over the world on
   *  small screens); a tap expands or collapses one. */
  bannerMin = new Map<string, boolean>();
  refreshEventBanners() {
    const s = this.s;
    if (!this.alive) return;
    clear(this.banners);
    const add = (title: string, text: string, kind: 'bad' | 'good' | 'info') => {
      const key = `${s.day}|${title}`;
      if (!this.bannerMin.has(key)) {
        // small portrait screens and narrow windows: the banner column sits over the upper storeys, so show just the title
        const small = this.portrait && (this.r.ch / this.r.dpr < 760 || this.r.cw / this.r.dpr < 340);
        this.bannerMin.set(key, small);
        window.setTimeout(() => { if (this.bannerMin.get(key) === false) { this.bannerMin.set(key, true); this.refreshEventBanners(); } }, 8000);
      }
      const min = this.bannerMin.get(key)!;
      // toggled on pointerup, not click: browsers snap near-miss taps onto click targets, and a banner sits
      // right beside the wall turrets on small phones
      let down = false;
      this.banners.appendChild(h('div', { class: `banner ${kind === 'good' ? 'good' : kind === 'info' ? 'info' : ''} ${min ? 'min' : ''}`, role: 'button', 'aria-expanded': String(!min), title: min ? 'Show details' : 'Hide details',
        on: { pointerdown: () => { down = true; }, pointerup: () => {
          if (!down) return;
          const open = !!this.bannerMin.get(key);
          this.bannerMin.set(key, !open); this.refreshEventBanners(); audio.play('click');
          if (open) window.setTimeout(() => { if (this.bannerMin.get(key) === false) { this.bannerMin.set(key, true); this.refreshEventBanners(); } }, 8000);
        } } },
        icon('warn', 'icon lg'), h('div', null, h('b', null, title), h('span', { class: 'txt' }, text))));
    };
    if (s.events.today && EVENT_BANNER[s.events.today]) { const b = EVENT_BANNER[s.events.today]; add(b.title, b.text, b.kind); }
    if (s.events.tomorrow) { const d = EVENTS[s.events.tomorrow]; add(d.name, d.warnText ?? '', 'bad'); }
    if (s.boss && !s.boss.done && s.boss.night === s.day && s.phase !== 'night') add(ENEMIES[s.boss.kind].name, `${ENEMIES[s.boss.kind].name} is approaching. It will reach the shaft tonight!`, 'bad');
    else if (s.boss && !s.boss.done && s.boss.night === s.day + 1) add('Seismic readings', `Something huge is climbing toward the shaft. ETA: tomorrow night.`, 'info');
  }

  // ---------------------------------------------------------------------------------------------
  buildHud() {
    const s = this.s;
    const hud = h('div', { class: 'hud' });
    // top-left
    const core = h('div', { class: 'core-bar', title: 'Core durability' });
    for (let i = 0; i < 10; i++) core.appendChild(h('i'));
    const pct = h('span', { class: 'hud-label', style: 'margin-left:6px' }, '100%');
    const depth = h('span', { class: 'num' }, '0 / 150 m');
    const res = h('div', { class: 'hud-res' });
    const mk = (k: string) => { const n = h('span', null, '0'); const el = h('span', { class: 'res', style: `color:var(--${k})`, title: k }, icon(k), n); res.appendChild(el); this.hud[k] = n; return el; };
    mk('iron'); mk('crim'); mk('coal');
    if (s.setup.platform === 'brood') mk('larva');
    const tl = h('div', { class: 'hud-tl' },
      h('div', { class: 'frame hud-panel col', style: 'gap:4px', on: { click: () => this.sheets.openCore() } },
        h('div', { class: 'row' }, h('span', { class: 'hud-label' }, 'CORE'), core, pct),
        h('div', { class: 'row' }, h('span', { class: 'hud-label' }, 'DEPTH'), depth),
        res),
      this.banners);
    this.hud.core = core; this.hud.pct = pct; this.hud.depth = depth;
    // top-right: crew, clock, pause, speed
    const crew = h('div', { class: 'frame crew', on: { click: () => this.sheets.openCrew() } });
    const pl = PLATFORMS[s.setup.platform];
    for (const c of ['miner', 'hauler', 'guard'] as const) { const n = h('span', null, '0'); crew.appendChild(h('span', { class: 'res', title: pl.workers[c].name }, icon(c), n)); this.hud[`c_${c}`] = n; }
    const tot = h('span', null, '0/0'); crew.appendChild(h('span', { class: 'res', title: 'Workforce / limit' }, icon('crewcap'), tot)); this.hud.tot = tot;
    const clock = h('div', { class: 'clock', role: 'img', 'aria-label': 'Day clock' });
    clock.innerHTML = `<svg viewBox="0 0 76 76"><circle cx="38" cy="38" r="33" fill="rgba(18,13,7,0.9)" stroke="currentColor" stroke-opacity="0.35" stroke-width="2"/><circle class="ring" cx="38" cy="38" r="30" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="188.5" stroke-dashoffset="0" transform="rotate(-90 38 38)"/><circle cx="38" cy="38" r="22" fill="none" stroke="currentColor" stroke-opacity="0.4" stroke-width="1" stroke-dasharray="2 3"/></svg>`;
    const clbl = h('div', { class: 'lbl' }, 'DAY', h('span', null, '01'));
    clock.appendChild(clbl);
    clock.style.color = 'var(--amber)';
    this.hud.clock = clock; this.hud.clockDay = clbl.lastChild as HTMLElement;
    const pause = h('button', { class: 'iconbtn', 'aria-label': 'Pause (Esc)', on: { click: () => this.sheets.openPause() } }, icon('pause'));
    const speed = h('button', { class: 'iconbtn', 'aria-label': 'Game speed', title: 'Speed (1/2/3)', on: { click: () => this.cycleSpeed() } }, '×1');
    this.hud.speed = speed;
    const tr = h('div', { class: 'hud-tr' }, crew, clock, h('div', { class: 'col', style: 'gap:6px' }, pause, speed));
    // right: chips (wide screens only; on phones the walls reach the screen edges) + a touch-transparent depth gauge
    const chip = (id: string, label: string, fn: () => void) => { const c = h('button', { class: 'chip', on: { click: fn } }, label); this.hud[`chip_${id}`] = c; return c; };
    const gauge = h('div', { class: 'gauge', title: 'Depth', 'aria-hidden': 'true' });
    this.hud.gauge = gauge;
    const haul = h('button', { class: 'chip', title: 'Hauling priority (H)', on: { click: () => this.cycleHaul() } }, 'AUTO');
    this.hud.haul = haul;
    const right = h('div', { class: 'hud-right wide-only' },
      chip('shaft', 'SHAFT', () => this.camTo('shaft')), chip('deck', 'DECK', () => this.camTo('deck')), chip('mine', 'MINE', () => this.camTo('mine')),
      h('div', { class: 'row', style: 'gap:4px' }, h('button', { class: 'chip', style: 'min-width:44px', 'aria-label': 'Zoom out', on: { click: () => this.zoomBy(-1) } }, '−'), h('button', { class: 'chip', style: 'min-width:44px', 'aria-label': 'Zoom in', on: { click: () => this.zoomBy(1) } }, '+')),
      h('span', { class: 'hud-label', style: 'font-size:13px' }, 'HAUL'), haul);
    const gaugeWrap = h('div', { class: 'gauge-wrap' }, gauge);
    // bottom
    const dayS = h('div', { class: 'slots', 'aria-label': 'Daytime abilities' });
    const nightS = h('div', { class: 'slots', 'aria-label': 'Nighttime abilities' });
    this.hud.dayS = dayS; this.hud.nightS = nightS;
    const actions = h('div', { class: 'actions' });
    this.hud.actions = actions;
    const viewBtn = h('button', { class: 'act view', title: 'Camera: shaft / deck / mine (Z C V)', 'aria-label': 'Cycle camera view', on: { click: () => this.cycleView() } }, icon('eye'), h('span', null, 'DECK'));
    this.hud.viewBtn = viewBtn;
    const bottom = h('div', { class: 'hud-bottom' }, h('div', { class: 'abil-row' }, dayS, viewBtn, nightS), actions);
    hud.append(tl, tr, right, gaugeWrap, bottom);
    this.root.appendChild(h('div', { class: 'vignette-red' }));
    this.root.appendChild(hud);
    this.buildActions();
    this.buildSlots();
  }

  actDrill!: HTMLButtonElement; actLaunch!: HTMLButtonElement; actDig!: HTMLButtonElement; actRecall!: HTMLButtonElement; drillLbl!: HTMLElement; drillCoal!: HTMLElement;
  buildActions() {
    const a = this.hud.actions; clear(a);
    this.actRecall = h('button', { class: 'act', title: 'Recall crew (Q)', on: { click: () => this.toggleRecall() } }, icon('recall'), 'RECALL');
    this.actDig = h('button', { class: 'act', title: 'Dig mode (D): tap or drag blocks to tag them', on: { click: () => this.toggleDig() } }, icon('pick'), 'DIG');
    this.drillLbl = h('span', null, 'DRILL');
    this.drillCoal = h('span', { class: 'coal' }, '0/6');
    this.actDrill = h('button', { class: 'act big', title: 'Hold to order the drill (Enter)' }, icon('drill'), this.drillLbl, this.drillCoal);
    holdButton(this.actDrill, 600, () => this.doDrill(), () => { const why = canOrderDrill(this.s); if (why?.startsWith('Coal')) this.guide.showCoal(); if (why) { this.toast(why, true); audio.play('error'); return false; } audio.play('hold'); return true; });
    this.actLaunch = h('button', { class: 'act big alert hidden', title: 'Hold to launch the core (G)' }, icon('launch'), 'HOLD: LAUNCH');
    holdButton(this.actLaunch, 1500, () => this.doLaunch(), () => { const why = canLaunch(this.s); if (why) { this.toast(why, true); audio.play('error'); return false; } audio.play('hold'); return true; });
    const help = h('button', { class: 'act', title: 'Manual & wiki (?)', on: { click: () => this.sheets.openManual() } }, icon('info'), 'INFO');
    a.append(this.actRecall, this.actDig, this.actDrill, this.actLaunch, help);
  }
  doDrill() {
    const why = orderDrill(this.s);
    if (why) { this.toast(why, true); audio.play('error'); return; }
    this.refreshActions();
    this.maybeHint();
  }
  doLaunch() { const why = launch(this.s); if (why) { this.toast(why, true); audio.play('error'); } }
  toggleDig() { this.view.dig = !this.view.dig; this.actDig.classList.toggle('on', this.view.dig); if (this.view.dig && this.r.cam.y < 0) this.camTo('mine'); audio.play('toggle'); this.maybeHint(); }
  toggleRecall() { this.s.recall = !this.s.recall; this.actRecall.classList.toggle('on', this.s.recall); audio.play('toggle'); this.toast(this.s.recall ? 'Crew recalled to the platform' : 'Crew back to work'); }
  cycleSpeed() { this.s.speed = this.s.speed >= 3 ? 1 : this.s.speed + 1; setText(this.hud.speed, `×${this.s.speed}`); audio.play('toggle'); }
  cycleHaulLabel() { setText(this.hud.haul, { auto: 'AUTO', coal: 'COAL', iron: 'IRON', crim: 'CRIM', min: 'MINERAL' }[this.s.haul]); }
  cycleHaul() {
    const order: HaulPriority[] = ['auto', 'coal', 'iron', 'crim', 'min'];
    this.s.haul = order[(order.indexOf(this.s.haul) + 1) % order.length];
    setText(this.hud.haul, { auto: 'AUTO', coal: 'COAL', iron: 'IRON', crim: 'CRIM', min: 'MINERAL' }[this.s.haul]);
    this.toast(`Haulers prioritise: ${this.s.haul === 'auto' ? 'crates, charges, then coal for the quota' : this.s.haul === 'min' ? 'permanent minerals' : this.s.haul}`);
    audio.play('toggle');
  }

  slotEls: { el: HTMLElement; cdv: HTMLElement; cdt: HTMLElement; type: string | null; night: boolean }[] = [];
  buildSlots() {
    this.slotEls = [];
    for (const night of [false, true]) {
      const host = night ? this.hud.nightS : this.hud.dayS; clear(host);
      for (let i = 0; i < 3; i++) {
        const cdv = h('span', { class: 'cdv' }), cdt = h('span', { class: 'cdt' });
        const el = h('button', { class: `slot empty ${night ? 'night' : ''}`, 'aria-label': `${night ? 'Night' : 'Day'} ability slot ${i + 1}` }, cdv, cdt, h('span', { class: 'kb' }, night ? String(i + 4) : String(i + 1)));
        const rec = { el, cdv, cdt, type: null as string | null, night };
        el.addEventListener('click', () => this.onSlot(rec.type));
        this.bindLongPress(el, () => { if (rec.type) this.sheets.openTech(rec.type); });
        host.appendChild(el);
        this.slotEls.push(rec);
      }
    }
  }
  /** Long-press (touch) / right-click (mouse) opens info; fires once per press, and the click that follows the
   *  lifted finger is swallowed so it does not also trigger the element's tap action. */
  bindLongPress(el: HTMLElement, fn: () => void) {
    let t = 0, fired = false;
    el.addEventListener('pointerdown', e => {
      fired = false;
      t = window.setTimeout(() => { t = 0; fired = true; armGhostGuard(e.clientX, e.clientY, e.pointerType); fn(); }, 520);
    });
    const cancel = () => { if (t) clearTimeout(t); t = 0; };
    el.addEventListener('pointerup', cancel); el.addEventListener('pointerleave', cancel); el.addEventListener('pointercancel', cancel);
    el.addEventListener('contextmenu', e => { e.preventDefault(); cancel(); if (!fired) { fired = true; fn(); } });
  }
  onSlot(type: string | null) {
    if (!type) return;
    const a = [...this.s.abilities.day, ...this.s.abilities.night].find(q => q.type === type);
    if (!a) return;
    const why = abilityReady(this.s, a);
    if (why) { this.toast(why, true); audio.play('error'); return; }
    const d = BUILDINGS[type];
    if (d.target === 'none') { const w = useAbility(this.s, type, 0, 0); if (w) this.toast(w, true); return; }
    // aim with a reticle
    const c = this.r.cam;
    let x = c.x, y = c.y;
    if (d.target === 'mine') { if (y < MINE_TOP) { this.camTo('mine'); y = MINE_TOP + 4; } }
    else if (d.target === 'shaft' || d.target === 'turret') { if (y > 0) { this.camTo('shaft'); y = shaftTop(this.s) / 2; } const e = this.s.enemies[0]; if (e) { x = e.x; y = e.y; } }
    this.view.reticle = { type, x, y, r: type === 'flakburst' ? 2.5 : type === 'stasis' ? 3.5 : type === 'medic' ? 4 : type === 'drone' ? 1.6 : type === 'sunlens' ? 1.2 : 0.8 };
    this.sheets.reticleBar(type);
    audio.play('click');
  }
  fireReticle() {
    const r = this.view.reticle;
    if (!r) return;
    if (r.type === 'overclock') {
      let best = -1, bd = 3;
      for (const t of this.s.turrets) { const m = this.s.mounts.find(q => q.id === t.mount)!; const d = dist(mountX(m.side), m.y, r.x, r.y); if (d < bd) { bd = d; best = t.id; } }
      if (best < 0) { this.toast('Aim at a turret', true); audio.play('error'); return; }
      const w = useAbility(this.s, r.type, r.x, r.y, best);
      if (w) { this.toast(w, true); audio.play('error'); return; }
    } else {
      const w = useAbility(this.s, r.type, r.x, r.y);
      if (w) { this.toast(w, true); audio.play('error'); return; }
    }
    this.view.reticle = null; this.sheets.closeReticle();
  }

  refreshActions() {
    const s = this.s;
    this.actDrill.classList.toggle('dim', s.phase === 'launch');
    this.actRecall.classList.toggle('on', s.recall);
  }

  // ---------------------------------------------------------------------------------------------
  hudCache: Record<string, string> = {};
  updateHud() {
    const s = this.s;
    const put = (k: string, v: string) => { if (this.hudCache[k] !== v) { this.hudCache[k] = v; setText(this.hud[k], v); } };
    for (const k of ['iron', 'crim', 'coal', 'larva']) if (this.hud[k]) put(k, String(s.res[k as 'iron']).padStart(2, '0'));
    const segs = Math.ceil((10 * Math.max(0, s.core.hp)) / s.core.max);
    const coreKey = `${segs}`;
    if (this.hudCache.coreSegs !== coreKey) {
      this.hudCache.coreSegs = coreKey;
      [...this.hud.core.children].forEach((c, i) => c.classList.toggle('off', i >= segs));
      this.hud.core.classList.add('hit'); setTimeout(() => this.hud.core.classList.remove('hit'), 250);
    }
    put('pct', `${Math.round((100 * Math.max(0, s.core.hp)) / s.core.max)}%`);
    put('depth', `${s.depth} / ${s.contract.targetStrata * 50} m`);
    const pl = PLATFORMS[s.setup.platform];
    const cnt = { miner: 0, hauler: 0, guard: 0 };
    for (const w of s.workers) cnt[w.cls]++;
    const dec = s.setup.platform === 'brood';
    for (const c of ['miner', 'hauler', 'guard'] as const) put(`c_${c}`, dec ? (cnt[c] * pl.workers[c].slot).toFixed(1) : String(cnt[c]).padStart(2, '0'));
    const used = workforceUsed(s), cap = workforceCap(s);
    put('tot', dec ? `${used.toFixed(1)}/${String(cap).padStart(2, '0')}` : `${String(used).padStart(2, '0')}/${String(cap).padStart(2, '0')}`);
    this.hud.tot.parentElement!.classList.toggle('red', used >= cap);
    // clock
    const night = s.phase === 'night';
    const frac = s.phase === 'day' ? s.clock / s.dayLen : night ? 1 : 0;
    const ring = this.hud.clock.querySelector('.ring') as SVGCircleElement;
    const off = (188.5 * frac).toFixed(1);
    if (this.hudCache.ring !== off) { this.hudCache.ring = off; ring.setAttribute('stroke-dashoffset', off); }
    const clockCls = night || s.dusk ? 'clock night' : 'clock';
    if (this.hud.clock.className !== clockCls) { this.hud.clock.className = clockCls; this.hud.clock.style.color = night || s.dusk ? 'var(--red)' : 'var(--amber)'; }
    put('clockDay', String(s.day).padStart(2, '0'));
    // drill button
    const q = coalQuota(s);
    const dl = s.phase === 'landing' ? 'HOLD: DRILL' : s.drillQueued ? 'DRILLING NEXT MORNING' : s.phase === 'descent' ? 'DRILLING…' : 'HOLD: DRILL';
    if (this.hudCache.dl !== dl) { this.hudCache.dl = dl; setText(this.drillLbl, dl); }
    const coalTxt = `${String(Math.min(s.res.coal, q)).padStart(2, '0')}/${String(q).padStart(2, '0')}`;
    if (this.hudCache.coal2 !== coalTxt) { this.hudCache.coal2 = coalTxt; setText(this.drillCoal, s.drillQueued || s.phase === 'descent' ? '' : coalTxt); }
    const ready = !canOrderDrill(s);
    this.actDrill.classList.toggle('alert', ready);
    const canL = !canLaunch(s);
    const showLaunch = s.depth >= s.contract.targetStrata * 50 && s.phase === 'day';
    this.actLaunch.classList.toggle('hidden', !showLaunch);
    this.actLaunch.classList.toggle('dim', !canL);
    // gauge
    const tgt = s.contract.targetStrata;
    const maxS = Math.max(tgt + 1, s.stratum + 1);
    const gk = `${s.stratum}/${maxS}/${tgt}`;
    if (this.hudCache.gauge !== gk) {
      this.hudCache.gauge = gk;
      const g = this.hud.gauge; clear(g);
      g.appendChild(h('div', { class: 'fill', style: `height:${(s.stratum / maxS) * 100}%` }));
      for (let i = 1; i < maxS; i++) g.appendChild(h('div', { class: 'tick', style: `top:${(i / maxS) * 100}%` }));
      g.appendChild(h('div', { class: 'target', style: `top:${(tgt / maxS) * 100}%`, title: 'Target depth' }));
      g.appendChild(h('div', { class: 'mark', style: `top:${(s.stratum / maxS) * 100}%` }));
    }
    // ability slots
    const slots = [...s.abilities.day.slice(0, 3), null, null, null].slice(0, 3).concat([...s.abilities.night.slice(0, 3), null, null, null].slice(0, 3));
    slots.forEach((a, i) => {
      const rec = this.slotEls[i];
      const type = a ? a.type : null;
      if (rec.type !== type) {
        rec.type = type;
        rec.el.classList.toggle('empty', !type);
        [...rec.el.querySelectorAll('svg')].forEach(n => n.remove());
        rec.el.setAttribute('aria-label', type ? BUILDINGS[type].name : `${rec.night ? 'Night' : 'Day'} ability slot`);
        [...rec.el.querySelectorAll('canvas')].forEach(n => n.remove());
        if (type) rec.el.insertBefore(this.app.techCanvas(type, 32), rec.el.firstChild);
      }
      if (!a) return;
      const why = abilityReady(s, a);
      const cdFrac = a.cd > 0 ? Math.min(1, a.cd / 60) : 0;
      rec.cdv.style.height = `${cdFrac * 100}%`;
      setText(rec.cdt, a.cd > 0 ? String(Math.ceil(a.cd)) : '');
      rec.el.classList.toggle('ready', !why);
      rec.el.classList.toggle('locked', !!why && why.includes('unavailable'));
    });
    this.sheets.tick();
  }
  viewNow = 'deck';
  updateChips(active: string) {
    for (const id of ['shaft', 'deck', 'mine']) this.hud[`chip_${id}`]?.classList.toggle('on', id === active);
    if (active) { this.viewNow = active; const sp = this.hud.viewBtn?.querySelector('span'); if (sp) sp.textContent = active.toUpperCase(); }
  }
  cycleView() { const order = ['shaft', 'deck', 'mine'] as const; const i = order.indexOf(this.viewNow as 'deck'); this.camTo(order[(i + 1) % 3]); audio.play('toggle'); }

  // ---------------------------------------------------------------------------------------------
  hints: Record<string, string> = {
    landing: 'Hold DRILL to start drilling down. The first 50 m descent happens at once.',
    build: 'Tap a hammer pad on the deck to build. The first two buildings are free.',
    dig: 'Tap DIG, then tap or drag over blocks to tag them. Miners dig tagged blocks; haulers bring the ore home.',
    digmode: 'Tag black coal to fill the drill quota, and glowing crates to find technologies. Long-press any block for details.',
    dusk: 'Dusk: the crew climbs home. Tap a hammer on the shaft walls to place turrets — the first two are free.',
    quota: 'Coal quota met. Hold DRILL: the platform descends 50 m at the next dawn.',
    target: 'Target depth reached. Dig out a cyan charge vein and haul it home, then hold LAUNCH by day. Or keep drilling for a bigger payout.',
  };
  maybeHint() {
    const s = this.s, seen = this.app.profile.seen;
    if (!this.app.profile.settings.hints || this.guide?.active) return;
    let key = '';
    if (s.phase === 'landing') key = 'landing';
    else if (s.phase === 'day' && !s.buildings.length && s.freeBuildings > 0) key = 'build';
    else if (s.phase === 'day' && !this.view.dig && !s.mine.tag.some(Boolean)) key = 'dig';
    else if (this.view.dig && !seen.digmode) key = 'digmode';
    else if (s.dusk || s.phase === 'night') key = s.turrets.length ? '' : 'dusk';
    else if (s.res.coal >= coalQuota(s) && !s.drillQueued) key = 'quota';
    else if (s.depth >= s.contract.targetStrata * 50 && s.charges < s.contract.charges) key = 'target';
    if (!key || seen[key]) { if (this.hintEl && (!key || seen[key])) { this.hintEl.remove(); this.hintEl = null; } return; }
    this.hintEl?.remove();
    const close = h('button', { 'aria-label': 'Dismiss hint', on: { click: () => { seen[key] = true; this.app.saveProfile(); this.hintEl?.remove(); this.hintEl = null; } } }, '×');
    this.hintEl = h('div', { class: 'hint', role: 'note' }, h('span', null, this.hints[key]), close);
    this.root.appendChild(this.hintEl);
    if (key === 'digmode') { seen.digmode = true; }
  }

  // ---------------------------------------------------------------------------------------------
  bindInput() {
    const cv = this.canvas;
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('pointerdown', e => {
      audio.unlock();
      this.lastInputAt = performance.now();
      if (this.s.phase === 'launch' || (this.s.phase === 'over' && this.cutT > 0)) {
        clearTimeout(this.pressTimer);
        this.pressTimer = window.setTimeout(() => { this.s.descentT = 99; this.cutT = Math.max(this.cutT, 12.6); }, 700);
        return;
      }
      cv.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t0: performance.now(), moved: false, button: e.button });
      if (this.pointers.size === 2) {
        // a second finger turns this into a pinch: neither finger may end as a tap
        for (const q of this.pointers.values()) q.moved = true;
        const [a, b] = [...this.pointers.values()];
        this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: this.r.cam.k, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
        this.painting = null; this.panning = false; clearTimeout(this.pressTimer);
        return;
      }
      this.longPressed = false;
      clearTimeout(this.pressTimer);
      this.pressTimer = window.setTimeout(() => {
        const p = this.pointers.get(e.pointerId);
        if (p && !p.moved && this.pointers.size === 1) { this.longPressed = true; this.inspectAt(p.x, p.y); }
      }, 480);
    });
    cv.addEventListener('pointermove', e => {
      const rect = cv.getBoundingClientRect();
      if (e.pointerType === 'mouse' && this.pointers.size === 0) { const w = this.r.toWorld(e.clientX - rect.left, e.clientY - rect.top); this.view.hoverCell = this.view.dig ? worldCell(w.x, w.y) : -1; return; }
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (this.pinch && this.pointers.size >= 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const ratio = d / this.pinch.d;
        const target = Math.round(this.pinch.k * ratio);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const c = this.r.cam; c.follow = false;
        if (target !== c.k) this.zoomBy(target - c.k, mx - rect.left, my - rect.top);
        c.x -= (mx - this.pinch.mx) * this.r.dpr / this.r.S; c.y -= (my - this.pinch.my) * this.r.dpr / this.r.S; c.tx = c.x; c.ty = c.y;
        this.pinch.mx = mx; this.pinch.my = my;
        return;
      }
      if (!p.moved && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 8) {
        p.moved = true; clearTimeout(this.pressTimer);
        const w = this.r.toWorld(p.sx - rect.left, p.sy - rect.top);
        const cell = worldCell(w.x, w.y);
        if (this.view.reticle && p.button === 0) { this.panning = false; }
        else if (this.view.dig && cell >= 0 && p.button === 0 && this.s.phase !== 'landing') {
          const on = !this.s.mine.tag[cell];
          this.painting = { on, last: -1 };
          this.paintAt(p.sx - rect.left, p.sy - rect.top);
        } else this.panning = true;
      }
      if (!p.moved) return;
      if (this.view.reticle && !this.panning) { const w = this.r.toWorld(e.clientX - rect.left, e.clientY - rect.top); this.view.reticle.x = w.x; this.view.reticle.y = w.y; return; }
      if (this.painting) {
        // interpolate along the drag so fast strokes don't skip cells
        const steps = Math.ceil(Math.hypot(dx, dy) / 6);
        for (let i = 1; i <= steps; i++) this.paintAt(e.clientX - rect.left - dx + (dx * i) / steps, e.clientY - rect.top - dy + (dy * i) / steps);
      } else if (this.panning) {
        const c = this.r.cam; c.follow = false;
        c.x -= (dx * this.r.dpr) / this.r.S; c.y -= (dy * this.r.dpr) / this.r.S; c.tx = c.x; c.ty = c.y;
        this.updateChips('');
      }
    });
    const end = (e: PointerEvent) => {
      const p = this.pointers.get(e.pointerId);
      this.pointers.delete(e.pointerId);
      clearTimeout(this.pressTimer);
      if (this.pointers.size < 2 && this.pinch) { this.pinch = null; if (this.pointers.size === 1) this.panning = true; } // the finger left after a pinch keeps panning
      if (!p) return;
      if (e.type === 'pointerup' && !p.moved && !this.longPressed && this.pointers.size === 0) {
        const rect = cv.getBoundingClientRect();
        if (p.button === 2) this.inspectAt(p.x, p.y); else this.tapAt(p.x - rect.left, p.y - rect.top);
      }
      if (this.pointers.size === 0) { this.painting = null; this.panning = false; }
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    // taps, long-presses and drags on the world are handled on pointer events; cancelling touchend stops the
    // browser's follow-up click, which would otherwise land on the sheet (or its backdrop) the tap just opened
    cv.addEventListener('touchend', e => { if (e.cancelable) e.preventDefault(); }, { passive: false });
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = cv.getBoundingClientRect();
      if (e.ctrlKey || Math.abs(e.deltaY) > 0) {
        if (e.shiftKey) { const c = this.r.cam; c.follow = false; c.y += e.deltaY * 0.02; c.ty = c.y; return; }
        this.zoomBy(e.deltaY < 0 ? 1 : -1, e.clientX - rect.left, e.clientY - rect.top);
      }
    }, { passive: false });
  }

  paintAt(cssX: number, cssY: number) {
    const w = this.r.toWorld(cssX, cssY);
    const cell = worldCell(w.x, w.y);
    if (cell < 0 || !this.painting || cell === this.painting.last) return;
    this.painting.last = cell;
    const k = this.s.mine.kind[cell];
    if (k === B.Empty || k === B.Bedrock) return;
    if (!!this.s.mine.tag[cell] === this.painting.on) return;
    const why = setTag(this.s, cell, this.painting.on);
    if (why) { if (why.startsWith('Order')) { this.toast(why, true); this.painting = null; audio.play('error'); } return; }
    audio.play(this.painting.on ? 'tag' : 'untag');
  }

  tapAt(cssX: number, cssY: number) {
    const s = this.s;
    const w = this.r.toWorld(cssX, cssY);
    if (this.view.reticle) { this.view.reticle.x = w.x; this.view.reticle.y = w.y; if (this.view.reticle.type === 'overclock') this.fireReticle(); return; }
    // wall mounts and deck pads: the lowest mounts overlap the outer pads, so the nearest centre wins
    const hit = this.structureAt(w.x, w.y);
    if (hit?.mount) { const m = hit.mount; if (m.turret >= 0) this.sheets.openTurret(m.turret); else this.sheets.openMount(m.id); audio.play('click'); return; }
    if (hit?.pad) {
      const p = hit.pad;
      if (p.building >= 0) { this.sheets.openBuilding(p.building); audio.play('click'); return; }
      if (s.phase !== 'landing' && (p.open || p.storey < 3)) { this.sheets.openPad(p.id); audio.play('click'); return; }
    }
    if (dist(w.x, w.y, CORE_X, CORE_Y) < 1.7) { this.sheets.openCore(); audio.play('click'); return; }
    const cell = worldCell(w.x, w.y);
    if (this.view.dig && cell >= 0 && s.phase !== 'landing') {
      const k = s.mine.kind[cell];
      if (k !== B.Empty && k !== B.Bedrock) {
        const why = setTag(s, cell, !s.mine.tag[cell]);
        if (why) { this.toast(why, true); audio.play('error'); } else audio.play(s.mine.tag[cell] ? 'tag' : 'untag');
        // an order behind untagged rock waits (its brackets are dim): say so the first few times
        if (!why && s.mine.tag[cell] && digField(s).d[cell] > 0 && this.wayHints < 2) { this.wayHints++; this.toast('No way in yet: tag the blocks between it and a tunnel'); }
        this.maybeHint();
        return;
      }
    }
    // enemies / workers / blocks → info
    const e = s.enemies.find(q => dist(q.x, q.y, w.x, w.y) < ENEMIES[q.kind].radius + 0.4);
    if (e) { this.sheets.openEnemy(e.kind); return; }
    if (this.sheets.isOpen()) { this.sheets.closeAll(); return; }
    if (!this.view.dig && cell >= 0 && s.mine.kind[cell] !== B.Empty && s.phase !== 'landing') this.toast('Tap DIG to tag blocks · long-press for details');
  }

  /** the wall mount or deck pad under a world point; where their tap areas overlap, the nearer centre wins */
  structureAt(x: number, y: number): { mount?: GameState['mounts'][number]; pad?: GameState['pads'][number] } | null {
    const s = this.s;
    let best: { mount?: GameState['mounts'][number]; pad?: GameState['pads'][number] } | null = null, bd = 1e9;
    for (const m of s.mounts) { const d = dist(x, y, mountX(m.side), m.y); if (d < 1.05 && d < bd) { bd = d; best = { mount: m }; } }
    for (const p of s.pads) {
      if (Math.abs(x - p.x) > 1 || y > p.y + 0.15 || y < p.y - 2.2) continue;
      const d = dist(x, y, p.x, p.y - 1);
      if (d < bd) { bd = d; best = { pad: p }; }
    }
    return best;
  }

  inspectAt(clientX: number, clientY: number) {
    const s = this.s;
    const rect = this.canvas.getBoundingClientRect();
    const w = this.r.toWorld(clientX - rect.left, clientY - rect.top);
    audio.play('click');
    const e = s.enemies.find(q => dist(q.x, q.y, w.x, w.y) < ENEMIES[q.kind].radius + 0.5);
    if (e) return this.sheets.openEnemy(e.kind);
    const u = s.uenemies.find(q => dist(q.x, q.y, w.x, w.y) < 0.8);
    if (u) return this.sheets.openUEnemy(u.kind);
    const wk = s.workers.find(q => dist(q.x, q.y, w.x, w.y) < 0.7);
    if (wk) return this.sheets.openWorker(wk.id);
    const hit = this.structureAt(w.x, w.y);
    if (hit?.mount) return hit.mount.turret >= 0 ? this.sheets.openTurret(hit.mount.turret) : this.sheets.openMount(hit.mount.id);
    if (hit?.pad && hit.pad.building >= 0) return this.sheets.openBuilding(hit.pad.building);
    const cell = worldCell(w.x, w.y);
    if (cell >= 0) return this.sheets.openBlock(cell);
  }

  keysDown = new Set<string>();
  onKey = (e: KeyboardEvent) => {
    audio.unlock();
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (this.keysDown.has(k) && !['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's'].includes(k)) return;
    this.keysDown.add(k);
    const c = this.r.cam;
    switch (k) {
      case 'escape': if (this.view.reticle) { this.view.reticle = null; this.sheets.closeReticle(); } else if (this.sheets.isOpen()) this.sheets.closeAll(); else this.sheets.openPause(); break;
      case ' ': e.preventDefault(); this.paused = !this.paused; this.toast(this.paused ? 'Paused (Space to resume)' : 'Resumed'); break;
      case 'd': this.toggleDig(); break;
      case 'q': this.toggleRecall(); break;
      case 'h': this.cycleHaul(); break;
      case 'x': this.cycleSpeed(); break;
      case '1': case '2': case '3': case '4': case '5': case '6': {
        const i = +k - 1; const a = i < 3 ? this.s.abilities.day[i] : this.s.abilities.night[i - 3];
        if (a) this.onSlot(a.type); break;
      }
      case 'enter': if (this.view.reticle) this.fireReticle(); else this.holdKey('drill'); break;
      case 'g': this.holdKey('launch'); break;
      case 'arrowup': case 'w': c.follow = false; c.y -= 1.5; c.ty = c.y; break;
      case 'arrowdown': case 's': c.follow = false; c.y += 1.5; c.ty = c.y; break;
      case 'arrowleft': case 'a': c.follow = false; c.x -= 1.5; c.tx = c.x; break;
      case 'arrowright': c.follow = false; c.x += 1.5; c.tx = c.x; break;
      case '+': case '=': this.zoomBy(1); break;
      case '-': this.zoomBy(-1); break;
      case 'z': this.camTo('shaft'); break;
      case 'c': this.camTo('deck'); break;
      case 'v': this.camTo('mine'); break;
      case '?': case 'i': this.sheets.openManual(); break;
    }
  };
  onKeyUp = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); this.keysDown.delete(k); if (this.holding && (k === 'enter' || k === 'g')) this.releaseHold(); };
  holding: { what: string; t0: number; raf: number } | null = null;
  holdKey(what: 'drill' | 'launch') {
    const why = what === 'drill' ? canOrderDrill(this.s) : canLaunch(this.s);
    if (why) { this.toast(why, true); audio.play('error'); return; }
    const btn = what === 'drill' ? this.actDrill : this.actLaunch;
    const fill = btn.querySelector('.fill') as HTMLElement;
    const ms = what === 'drill' ? 600 : 1500;
    const t0 = performance.now();
    audio.play('hold');
    const tick = () => {
      if (!this.holding) return;
      const p = Math.min(1, (performance.now() - t0) / ms);
      if (fill) fill.style.width = `${p * 100}%`;
      if (p >= 1) { this.releaseHold(); if (what === 'drill') this.doDrill(); else this.doLaunch(); return; }
      this.holding.raf = requestAnimationFrame(tick);
    };
    this.holding = { what, t0, raf: requestAnimationFrame(tick) };
  }
  releaseHold() {
    if (!this.holding) return;
    cancelAnimationFrame(this.holding.raf);
    for (const b of [this.actDrill, this.actLaunch]) { const f = b.querySelector('.fill') as HTMLElement; if (f) f.style.width = '0'; }
    this.holding = null;
  }
}

export const _t = TURRETS;
