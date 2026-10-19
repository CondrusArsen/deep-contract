// bug.games (bloomplay runtime) integration. It only activates when the game runs inside the platform's iframe;
// opened as a standalone file — or anywhere else — every function here is a no-op and nothing is requested.
import { adoptSave, setSaveMirror, type SaveName } from '../core/save';

interface Bloomplay {
  init(): Promise<unknown>;
  loaded(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  onPause(fn: () => void): void;
  onResume(fn: () => void): void;
  kv: { get(key: string): Promise<unknown>; set(key: string, value: unknown): Promise<unknown> };
  progress: { set(label: string): void; moment(name: string): void };
  analytics: { track(event: string, props?: Record<string, unknown>): void };
  profile?: { get(): Promise<unknown> };
}

/** the game's owner on bug.games (account condrus): keeps their progress when a new progress generation ships */
const OWNER = ['R0rUGMZ3gW4E', 'condrus'];
/** who is playing: undefined = could not be told (then nothing is reset), null = a guest */
let user: unknown = undefined;

let bp: Bloomplay | null = null;
let playing = false;
const within = <T>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<null>(r => setTimeout(() => r(null), ms))]);
const safe = (fn: () => void) => { try { fn(); } catch { /* the platform never breaks the game */ } };

/** Connect when embedded in the platform; resolves false at once when the game is standalone. */
export async function connectPlatform(): Promise<boolean> {
  if (window.parent === window) return false;
  try {
    const url = '/sdk/bloomplay.js'; // served by the platform on the game's own origin
    const mod = (await within(import(/* @vite-ignore */ url), 6000)) as { bloomplay: Bloomplay } | null;
    if (!mod?.bloomplay) return false;
    const ctx = (await within(mod.bloomplay.init(), 6000)) as { user?: unknown } | null;
    if (!ctx) return false;
    bp = mod.bloomplay;
    if ('user' in ctx) user = ctx.user;
    else user = await within(bp.profile?.get() ?? Promise.resolve(undefined), 4000).catch(() => undefined);
    return true;
  } catch { return false; }
}
export const onPlatform = () => !!bp;
/** is the player the game's owner? null when the platform could not say who is playing */
export function isOwner(): boolean | null {
  if (user === undefined) return null;
  if (!user) return false;
  const who = JSON.stringify(user).toLowerCase();
  return OWNER.some(k => who.includes(`"${k.toLowerCase()}"`));
}

// ---- saves: the player store is the truth, localStorage the synchronous cache ------------------------------
const pending = new Map<SaveName, { at: number; data: string | null }>();
let flushTimer = 0;
/** Before the game reads its saves: take the player-store copies that are newer, then mirror every write. */
export async function pullSaves() {
  if (!bp) return;
  for (const name of ['profile', 'run'] as const) {
    const v = (await within(bp.kv.get(`save.${name}`).catch(() => null), 4000)) as { at?: unknown; data?: unknown } | null;
    if (v && typeof v.at === 'number' && (typeof v.data === 'string' || v.data === null)) adoptSave(name, v.data, v.at);
  }
  setSaveMirror((name, data, at) => {
    pending.set(name, { at, data });
    clearTimeout(flushTimer);
    flushTimer = window.setTimeout(() => { void flushSaves(); }, 1000);
  });
}
/** Write queued saves to the player store now (pause, checkpoints, before a reload). */
export async function flushSaves() {
  clearTimeout(flushTimer);
  if (!bp || !pending.size) return;
  const jobs = [...pending].map(([name, v]) => bp!.kv.set(`save.${name}`, v).catch(() => null));
  pending.clear();
  await within(Promise.all(jobs), 4000);
}

// ---- lifecycle, progress, moments -------------------------------------------------------------------------
export function platformLoaded(onPause: () => void, onResume: () => void) {
  if (!bp) return;
  const b = bp;
  safe(() => b.onPause(() => { void flushSaves(); onPause(); }));
  safe(() => b.onResume(onResume));
  safe(() => b.loaded());
}
export function gameplay(on: boolean) {
  if (!bp || on === playing) return;
  playing = on;
  const b = bp;
  safe(() => (on ? b.gameplayStart() : b.gameplayStop()));
}
export function progress(label: string) { const b = bp; if (b) safe(() => b.progress.set(label)); }
export function moment(name: string) { const b = bp; if (b) safe(() => b.progress.moment(name)); }
export function track(event: string, props?: Record<string, unknown>) { const b = bp; if (b) safe(() => b.analytics.track(event, props)); }
