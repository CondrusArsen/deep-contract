// Assembles release/DeepContract.html: one self-contained file with the bundled JS and CSS inlined and every
// asset (fonts, sprites, audio) embedded as base64 in a JSON block. Opens from file:// with no server or network.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'release');
fs.mkdirSync(outDir, { recursive: true });

let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(dist, 'game.js'), 'utf8');
const cssFile = fs.readdirSync(dist).find(f => f.endsWith('.css'));
const css = cssFile ? fs.readFileSync(path.join(dist, cssFile), 'utf8') : '';

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src', 'assets', 'manifest.json'), 'utf8'));
const table = {};
let raw = 0;
for (const e of manifest) {
  const buf = fs.readFileSync(path.join(root, 'public', 'assets', e.path));
  raw += buf.length;
  table[e.key] = buf.toString('base64');
}

// strip the external references Vite emitted
html = html.replace(/<script type="module"[^>]*src="[^"]*"[^>]*><\/script>\s*/g, '');
html = html.replace(/<link rel="stylesheet"[^>]*>\s*/g, '');
html = html.replace(/<link rel="modulepreload"[^>]*>\s*/g, '');
const safeJs = js.replace(/<\/script/gi, '<\\/script');
const assetJson = JSON.stringify(table);
html = html.replace(/<script type="application\/json" id="dc-assets"><\/script>/, () => `<script type="application/json" id="dc-assets">${assetJson}</script>`);
html = html.replace('</head>', () => `<style>${css}</style>\n</head>`);
html = html.replace('</body>', () => `<script type="module">${safeJs}</script>\n</body>`);

// guard: nothing in the file may point at the network or at sibling files
const markup = html.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
const external = [...markup.matchAll(/\b(?:src|href)\s*=\s*"(?!data:|#|blob:)([^"]+)"/g)].map(m => m[1]);
const urls = [...markup.matchAll(/url\((?!["']?data:)([^)]+)\)/g)].map(m => m[1]);
if (external.length || urls.length) {
  console.error('External references left in the page:', external, urls);
  process.exit(1);
}
const out = path.join(outDir, 'DeepContract.html');
fs.writeFileSync(out, html);
const size = fs.statSync(out).size;
console.log(`release/DeepContract.html  ${(size / 1024 / 1024).toFixed(2)} MB  (${manifest.length} assets, ${(raw / 1024 / 1024).toFixed(2)} MB raw; js ${(js.length / 1024).toFixed(0)} KB, css ${(css.length / 1024).toFixed(0)} KB)`);
