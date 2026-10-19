// A new progress generation: a profile from before it starts over once (settings kept), the owner's is kept, and a
// profile already on the current generation is left alone.
import { expect, test } from 'vitest';
import { newProfile, PROGRESS_EPOCH } from '../src/core/profile';
import { applyProgressEpoch, loadProfile, saveProfile } from '../src/core/save';

function veteran() {
  const p = newProfile();
  delete p.epoch;
  p.contracts = 4; p.wins = 3; p.xp = 900; p.tutorial = 'done'; p.owned = ['o1']; p.achievements = { descent: 1 };
  p.minerals = { ochre: 40, jade: 12, void: 2 };
  p.settings.music = 0.1;
  return p;
}

test('a profile from before the new generation starts over once, keeping its settings', () => {
  saveProfile(veteran());
  expect(applyProgressEpoch(false)).toBe('reset');
  const p = loadProfile();
  expect(p.tutorial).toBe('contract');
  expect(p.contracts).toBe(0);
  expect(p.xp).toBe(0);
  expect(p.owned).toEqual([]);
  expect(p.achievements).toEqual({});
  expect(p.minerals).toEqual({ ochre: 0, jade: 0, void: 0 });
  expect(p.settings.music).toBe(0.1);
  expect(p.epoch).toBe(PROGRESS_EPOCH);
  // only once
  p.contracts = 1; saveProfile(p);
  expect(applyProgressEpoch(false)).toBe('current');
  expect(loadProfile().contracts).toBe(1);
});

test("the owner's progress is kept and stamped", () => {
  saveProfile(veteran());
  expect(applyProgressEpoch(true)).toBe('kept');
  const p = loadProfile();
  expect(p.contracts).toBe(4);
  expect(p.tutorial).toBe('done');
  expect(p.epoch).toBe(PROGRESS_EPOCH);
  expect(applyProgressEpoch(false)).toBe('current');
});

test('a brand-new player is already on the current generation', () => {
  saveProfile(newProfile());
  expect(applyProgressEpoch(false)).toBe('current');
});
