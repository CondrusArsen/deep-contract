import './ui/styles.css';
import { loadAll } from './assets/loader';
import { audio } from './audio/audio';
import { CUES } from './audio/cues';
import { buildAllArt } from './render/art/index';
import { App } from './ui/app';
import { h } from './ui/dom';

async function boot() {
  const root = document.getElementById('app')!;
  const bar = h('i');
  const label = h('span', { class: 'small muted' }, 'Loading…');
  const loading = h('div', { class: 'loading' }, h('div', { class: 't', style: 'font-size:34px;color:var(--amber)' }, 'DEEP CONTRACT'), h('div', { class: 'bar' }, bar), label);
  root.appendChild(loading);
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
  loading.remove();
  const app = new App(root);
  // handles used by the automated end-to-end checks (tools/e2e.mjs)
  Object.assign(window, { dc: app, __dc_audio: audio, __dc_cues: CUES });
  app.start();
}
boot();
