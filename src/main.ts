import './ui/styles.css';
import { loadAll } from './assets/loader';
import { audio } from './audio/audio';
import { CUES } from './audio/cues';
import { applyProgressEpoch } from './core/save';
import { connectPlatform, flushSaves, isOwner, platformLoaded, pullSaves } from './platform/bloomplay';
import { buildAllArt } from './render/art/index';
import { App } from './ui/app';
import { h } from './ui/dom';

async function boot() {
  const root = document.getElementById('app')!;
  const bar = h('i');
  const label = h('span', { class: 'small muted' }, 'Loading…');
  const loading = h('div', { class: 'loading' }, h('div', { class: 't', style: 'font-size:34px;color:var(--amber)' }, 'DEEP CONTRACT'), h('div', { class: 'bar' }, bar), label);
  root.appendChild(loading);
  const platform = connectPlatform(); // bug.games iframe only; resolves false at once when standalone
  try {
    await loadAll((d, t) => { bar.style.width = `${(100 * d) / t}%`; });
    label.textContent = 'Preparing sprites and sound…';
    await new Promise(r => setTimeout(r, 0));
    buildAllArt();
    await audio.decodeAll();
  } catch (e) {
    label.textContent = `Failed to load: ${(e as Error).message}`;
    console.error(e);
    return;
  }
  let epoch = 'standalone';
  if (await platform) {
    label.textContent = 'Syncing saves…';
    await pullSaves();
    // a new progress generation: everyone but the owner starts over once (only when we know who is playing)
    const owner = isOwner();
    if (owner !== null) { epoch = applyProgressEpoch(owner); if (epoch !== 'current') await flushSaves(); }
    else epoch = 'unknown player';
  }
  loading.remove();
  const app = new App(root);
  // handles used by the automated end-to-end checks (tools/e2e.mjs)
  Object.assign(window, { dc: app, __dc_audio: audio, __dc_cues: CUES, __dc_epoch: epoch });
  app.start();
  platformLoaded(() => app.platformPause(), () => audio.resume());
}
boot();
