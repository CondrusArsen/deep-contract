// localStorage persistence. Every access is guarded: storage can be missing or blocked (private mode, file://).
import { defaultSettings, newProfile, PROGRESS_EPOCH, type Profile } from './profile';
import type { GameState } from './types';

const PROFILE_KEY = 'deepcontract.profile.v1';
const RUN_KEY = 'deepcontract.run.v1';
const STAMPS_KEY = 'deepcontract.stamps.v1'; // when each save was last written, to pick the newer of two copies
const mem = new Map<string, string | null>();
export let storageOk = true;

function get(key: string): string | null {
  try { return localStorage.getItem(key); } catch { storageOk = false; return mem.get(key) ?? null; }
}
function set(key: string, v: string | null) {
  try {
    if (v === null) localStorage.removeItem(key); else localStorage.setItem(key, v);
  } catch { storageOk = false; }
  mem.set(key, v);
}

export type SaveName = 'profile' | 'run';
const KEYS: Record<SaveName, string> = { profile: PROFILE_KEY, run: RUN_KEY };
/** Receives every save write (the bug.games player store when the game runs there — see platform/bloomplay.ts). */
type Mirror = (name: SaveName, data: string | null, at: number) => void;
let mirror: Mirror | null = null;
export function setSaveMirror(m: Mirror | null) { mirror = m; }
function stamps(): Partial<Record<SaveName, number>> { try { return JSON.parse(get(STAMPS_KEY) ?? '{}'); } catch { return {}; } }
function write(name: SaveName, data: string | null) {
  const at = Date.now();
  set(KEYS[name], data);
  const st = stamps(); st[name] = at; set(STAMPS_KEY, JSON.stringify(st));
  mirror?.(name, data, at);
}
/** Take a copy saved elsewhere if it is newer than the local one. */
export function adoptSave(name: SaveName, data: string | null, at: number) {
  const st = stamps();
  if ((st[name] ?? 0) >= at) return;
  set(KEYS[name], data);
  st[name] = at; set(STAMPS_KEY, JSON.stringify(st));
}
/** Erase the profile and the saved contract (both copies). */
export function wipeSaves() { write('profile', null); write('run', null); }

export function loadProfile(): Profile {
  const raw = get(PROFILE_KEY);
  if (raw) {
    try {
      const p = JSON.parse(raw) as Profile;
      if (p && p.v === 1) {
        p.settings = { ...defaultSettings(), ...(p.settings ?? {}) };
        p.seen = p.seen ?? {};
        p.achievements = p.achievements ?? {};
        // profiles from before the guided contract: veterans skip it, a profile that never finished one gets it
        p.tutorial = p.tutorial ?? (p.contracts > 0 ? 'done' : 'contract');
        return p;
      }
    } catch { /* fall through */ }
  }
  return newProfile();
}

export function saveProfile(p: Profile) { write('profile', JSON.stringify(p)); }

/**
 * A profile from an older progress generation starts over once: progress, achievements and the saved contract go,
 * the player's settings stay. `keep` (the game's owner) only stamps the new generation.
 */
export function applyProgressEpoch(keep: boolean): 'current' | 'kept' | 'reset' {
  const p = loadProfile();
  if ((p.epoch ?? 1) >= PROGRESS_EPOCH) return 'current';
  if (keep) { p.epoch = PROGRESS_EPOCH; saveProfile(p); return 'kept'; }
  const fresh = newProfile();
  fresh.settings = p.settings;
  saveProfile(fresh);
  clearRun();
  return 'reset';
}

export function saveRun(s: GameState) {
  s.savedAt = Date.now();
  const ffx = s.ffx;
  s.ffx = [];
  try { write('run', JSON.stringify(s)); } finally { s.ffx = ffx; }
}

export function loadRun(): GameState | null {
  const raw = get(RUN_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as GameState;
    if (!s || s.v !== 1 || s.phase === 'over') return null;
    s.ffx = [];
    return s;
  } catch { return null; }
}

export function clearRun() { write('run', null); }
export const hasRun = () => !!loadRun();
