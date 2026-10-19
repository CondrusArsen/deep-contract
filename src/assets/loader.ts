// Asset loading. In the single-file build every asset is embedded as base64 inside
// <script type="application/json" id="dc-assets">; in development files are fetched from /assets/.
// Nothing is requested over the network in the shipped file: images, fonts and audio are decoded from memory.
import manifest from './manifest.json';

export interface AssetEntry { key: string; path: string; type: 'font' | 'image' | 'audio' | 'text'; meta?: Record<string, unknown> }
export const MANIFEST = manifest as AssetEntry[];

let embedded: Record<string, string> | null = null;
function embeddedTable(): Record<string, string> | null {
  if (embedded) return embedded;
  const el = document.getElementById('dc-assets');
  if (!el || !el.textContent || el.textContent.length < 4) return null;
  embedded = JSON.parse(el.textContent) as Record<string, string>;
  el.textContent = ''; // free the big string
  return embedded;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function loadBytes(e: AssetEntry): Promise<ArrayBuffer> {
  const t = embeddedTable();
  if (t) {
    const b64 = t[e.key];
    if (!b64) throw new Error(`missing embedded asset ${e.key}`);
    const bytes = b64ToBytes(b64);
    delete t[e.key];
    return bytes.buffer as ArrayBuffer;
  }
  const r = await fetch(`./assets/${e.path}`);
  if (!r.ok) throw new Error(`asset ${e.path}: ${r.status}`);
  return r.arrayBuffer();
}

export const images = new Map<string, ImageBitmap | HTMLImageElement | HTMLCanvasElement>();
export const audioBytes = new Map<string, ArrayBuffer>();
export const texts = new Map<string, string>();

async function decodeImage(buf: ArrayBuffer): Promise<ImageBitmap | HTMLImageElement> {
  const blob = new Blob([buf], { type: 'image/png' });
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(blob); } catch { /* fall back */ }
  }
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('img')); img.src = url; });
  return img;
}

export async function loadAll(onProgress: (done: number, total: number) => void) {
  const total = MANIFEST.length;
  let done = 0;
  const tick = () => onProgress(++done, total);
  const jobs = MANIFEST.map(async e => {
    const buf = await loadBytes(e);
    if (e.type === 'font') {
      const family = String(e.meta?.family ?? e.key);
      const face = new FontFace(family, buf, { weight: String(e.meta?.weight ?? '400'), style: 'normal', display: 'block' } as FontFaceDescriptors);
      await face.load();
      (document.fonts as unknown as { add(f: FontFace): void }).add(face);
    } else if (e.type === 'image') images.set(e.key, await decodeImage(buf));
    else if (e.type === 'audio') audioBytes.set(e.key, buf);
    else texts.set(e.key, new TextDecoder().decode(buf));
    tick();
  });
  await Promise.all(jobs);
}
