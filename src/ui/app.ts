// Application shell: profile, screens, contract lifecycle.
import { makeContract, newGame } from '../core/contract';
import { TURRETS } from '../core/data/turrets';
import { applyResult, divLevel, type Profile } from '../core/profile';
import { clearRun, loadProfile, loadRun, saveProfile, saveRun } from '../core/save';
import type { ContractDef, GameState, Setup } from '../core/types';
import { audio } from '../audio/audio';
import { TIERS } from '../core/data/contracts';
import { ACH_BY_KEY, type AchDef } from '../core/data/achievements';
import { BARREL } from '../render/art/structures';
import { frame } from '../render/pixel';
import { h } from './dom';
import { GameView } from './game';
import * as screens from './screens';

export class App {
  root: HTMLElement;
  profile: Profile;
  game: GameView | null = null;
  screen: HTMLElement | null = null;
  lastResult: { s: GameState; out: ReturnType<typeof applyResult> } | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.profile = loadProfile();
    this.applySettings();
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('touchend', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
  }

  applySettings() {
    const st = this.profile.settings;
    audio.setVolumes(st.master, st.music, st.sfx);
    document.querySelectorAll('.crt').forEach(c => c.classList.toggle('off', !st.crt));
  }
  saveProfile() { saveProfile(this.profile); }

  /** Earn an achievement. The first time: reward minerals, remember it and show it (unless `quiet`, when the caller
   *  shows it). Returns the definition when new. */
  achieve(key: string, quiet = false): AchDef | null {
    const d = ACH_BY_KEY[key];
    if (!d) return null;
    const got = (this.profile.achievements ??= {});
    if (got[key]) return null;
    got[key] = Date.now();
    for (const k of ['ochre', 'jade', 'void'] as const) this.profile.minerals[k] += d.reward[k];
    this.saveProfile();
    if (!quiet) this.game?.achievementToast(d);
    return d;
  }
  get divLevel() { return divLevel(this.profile); }

  show(el: HTMLElement) {
    this.screen?.remove();
    this.screen = el;
    this.root.appendChild(el);
    el.scrollTop = 0;
  }
  closeGame() { this.game?.destroy(); this.game = null; }
  /** The tab was hidden: save, show the pause menu, silence the audio. */
  platformPause() { audio.suspend(); this.game?.platformPause(); }

  start() { this.toTitle(); }
  toTitle() { this.closeGame(); audio.setMusic('menu'); this.show(screens.title(this)); }
  toHq() { this.closeGame(); audio.setMusic('menu'); this.show(screens.hq(this)); }
  toBoard() { this.show(screens.board(this)); }
  toUpgrades() { this.show(screens.upgrades(this)); }
  toArchive() { this.show(screens.archive(this)); }
  toCredits(back: () => void) { this.show(screens.credits(this, back)); }
  openSettings(back: () => void) {
    if (this.game) { const m = screens.settingsModal(this, () => { m.remove(); back(); }); this.root.appendChild(m); return; }
    this.show(screens.settings(this, back));
  }

  continueRun() {
    const s = loadRun();
    if (!s) { this.toHq(); return; }
    this.playState(s);
  }

  /** A new profile's first tier-1 contract is the guided one. */
  startContract(c: ContractDef, setup: Setup) {
    if (this.profile.tutorial === 'contract' && c.tier === 1) c = { ...c, tutorial: true };
    this.profile.lastSetup = setup;
    this.saveProfile();
    const s = newGame(c, setup, { perks: this.profile.owned.slice(), divLevel: this.divLevel, blueprints: this.profile.blueprints.slice() });
    saveRun(s);
    this.playState(s);
  }

  playState(s: GameState) {
    this.screen?.remove(); this.screen = null;
    this.closeGame();
    this.game = new GameView(this, s);
    this.game.mount(this.root);
    if (s.contract.biome === 'frost') this.achieve('frost');
    if (s.contract.biome === 'jungle') this.achieve('jungle');
    
  }

  /** Straight from the title into the guided first contract (no menus before play). */
  startTutorial() {
    const c = makeContract(this.profile.boardSeed * 31 + 7, 1, { biomes: ['cave'], blueprints: this.profile.blueprints, perks: this.profile.owned });
    this.startContract(c, { platform: 'mule', core: 'standard', dept: null, startTechs: [], bonuses: [] });
  }
  skipTutorial() { this.profile.tutorial = 'done'; this.saveProfile(); }

  quickRestart(s: GameState) {
    clearRun();
    this.startContract(s.contract, s.setup);
  }

  contractOver(s: GameState) {
    if (!s.result) return;
    const out = applyResult(this.profile, s, s.result);
    const r = s.result;
    
    const earned: AchDef[] = [];
    const got = (k: string) => { const d = this.achieve(k, true); if (d) earned.push(d); };
    if (r.success) {
      got('launch');
      if (s.contract.tier >= 5) got('tier5');
      if (s.contract.tier >= 8) got('tier8');
    }
    // the guided first contract hands over to the HQ step (buy a first upgrade); a failed one is guided again
    if (s.tut && !s.tut.skipped && r.success && this.profile.tutorial === 'contract') this.profile.tutorial = 'upgrade';
    this.saveProfile();
    clearRun();
    this.lastResult = { s, out };
    this.closeGame();
    audio.setMusic(null);
    audio.play(s.result.success ? 'victory' : 'defeat');
    this.show(screens.result(this, s, out, earned));
  }

  // ---- small sprite canvases for cards ----------------------------------------------------------------
  private cache = new Map<string, HTMLCanvasElement>();
  techCanvas(id: string, px: number): HTMLCanvasElement {
    const key = `${id}:${px}`;
    const cached = this.cache.get(key);
    if (cached) return cached.cloneNode(true) as HTMLCanvasElement && this.copy(cached);
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    c.style.width = `${px}px`; c.style.height = `${px}px`;
    c.style.imageRendering = 'pixelated';
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    if (TURRETS[id]) {
      const f = frame(`t.${id}`, 0);
      if (f) ctx.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, 2, 4, 24, 24);
      const b = BARREL[id];
      if (b && b[0] > 0) {
        const ang = -0.5;
        for (let i = 2; i <= b[0] + 2; i++) for (let j = -Math.floor(b[1] / 2); j < Math.ceil(b[1] / 2); j++) {
          ctx.fillStyle = i >= b[0] + 1 ? b[3] : b[2];
          ctx.fillRect(16 + Math.round(i * Math.cos(ang) - j * Math.sin(ang)), 16 + Math.round(i * Math.sin(ang) + j * Math.cos(ang)), 1, 1);
        }
      }
    } else {
      const f = frame(`b.${id}`, 0);
      if (f) ctx.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, 0, 0, 32, 32);
    }
    this.cache.set(key, c);
    return this.copy(c);
  }
  private copy(src: HTMLCanvasElement) {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height; c.style.cssText = src.style.cssText;
    c.getContext('2d')!.drawImage(src, 0, 0);
    c.setAttribute('aria-hidden', 'true');
    return c;
  }
  workerCanvas(cls: string, px: number, platform?: string) {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16; c.style.width = `${px}px`; c.style.height = `${px}px`; c.style.imageRendering = 'pixelated';
    const f = frame(`w.${platform ?? this.game?.s.setup.platform ?? 'mule'}.${cls}.idle.r`, 0);
    if (f) c.getContext('2d')!.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, Math.round(8 - f.ax), 16 - f.sh, f.sw, f.sh);
    return c;
  }
  enemyCanvasEl(kind: string) {
    const f = frame(`e.${kind}`, 0);
    const c = document.createElement('canvas');
    const sc = f ? Math.max(1, Math.min(4, Math.floor(96 / Math.max(f.sw, f.sh)))) : 1;
    c.width = f ? f.sw * sc : 16; c.height = f ? f.sh * sc : 16;
    c.style.imageRendering = 'pixelated'; c.style.alignSelf = 'center';
    const ctx = c.getContext('2d')!; ctx.imageSmoothingEnabled = false;
    if (f) ctx.drawImage(f.img, f.sx, f.sy, f.sw, f.sh, 0, 0, f.sw * sc, f.sh * sc);
    return c;
  }
  techIcon(_id: string, _px: number) { return h('span'); }
}
