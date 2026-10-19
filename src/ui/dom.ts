// Tiny DOM helpers and original pixel icons (SVG built from bit masks).
type Attrs = Record<string, unknown> & { class?: string; style?: string; on?: Record<string, (e: Event) => void> };
type Child = Node | string | number | null | undefined | false | Child[];

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs | null = null, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'on') { for (const [ev, fn] of Object.entries(v as Record<string, (e: Event) => void>)) el.addEventListener(ev, fn); }
      else if (k === 'class') el.className = String(v);
      else if (k === 'style') el.setAttribute('style', String(v));
      else if (k === 'html') el.innerHTML = String(v);
      else if (k in el && typeof v !== 'string') (el as unknown as Record<string, unknown>)[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  append(el, children);
  return el;
}
function append(el: Element, children: Child[]) {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
}
export const clear = (el: Element) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
export function setText(el: Element, s: string) { if (el.textContent !== s) el.textContent = s; }

// ---- pixel icons -----------------------------------------------------------------------------------
// Each icon: rows of chars; '.' = empty, other chars index the palette.
const ICONS: Record<string, { p: Record<string, string>; m: string[] }> = {
  iron: { p: { a: '#bfe4ff', b: '#6fb4f0', c: '#2e5e96' }, m: ['...aa...', '..abba..', '.abbbbc.', 'abbbbbbc', 'abbbbcbc', '.bbbcbc.', '..cccc..', '........'] },
  crim: { p: { a: '#ffd0da', b: '#ff5d7a', c: '#a3203a' }, m: ['...a....', '..aab...', '..abb.a.', '.abbbabc', '.abbcbbc', 'abbcbbc.', '.bcccbc.', '..cccc..'] },
  coal: { p: { a: '#f2eadc', b: '#4e4740', c: '#1c1916' }, m: ['........', '..abb...', '.abbbbc.', 'abbbbbbc', 'abbbbcbc', 'bbbbcbcc', '.bcccc..', '........'] },
  larva: { p: { a: '#f4ffc0', b: '#c4e060', c: '#6f8a20' }, m: ['........', '..aab...', '.abbbb..', '.bbcbbc.', '..bbbbc.', '..cbbcc.', '...ccc..', '........'] },
  ochre: { p: { a: '#ffc570', b: '#ff9f2a' }, m: ['..aaaa..', '.abbbbb.', 'abbbbb..', 'abbb....', 'abbb....', 'abbbbb..', '.abbbbb.', '..aaaa..'] },
  jade: { p: { a: '#9dffd9', b: '#2fdca0' }, m: ['aaaaaaaa', 'abbbbbba', 'a.bbbbba', 'a..bbbba', 'a...bbba', 'a....bba', 'a.....ba', 'aaaaaaaa'] },
  void: { p: { a: '#e3a8ff', b: '#b24dff' }, m: ['aaaa....', 'abba....', 'abbaaaaa', 'aaaabbba', '...abbba', '...abbba', '...aaaaa', '........'] },
  pause: { p: { a: 'currentColor' }, m: ['........', '.aa..aa.', '.aa..aa.', '.aa..aa.', '.aa..aa.', '.aa..aa.', '.aa..aa.', '........'] },
  play: { p: { a: 'currentColor' }, m: ['........', '.a......', '.aaa....', '.aaaaa..', '.aaaaa..', '.aaa....', '.a......', '........'] },
  hammer: { p: { a: 'currentColor' }, m: ['.aaaa...', 'aaaaaa..', 'aaaaaa..', '...aa...', '...aa...', '...aa...', '...aa...', '...aa...'] },
  pick: { p: { a: 'currentColor' }, m: ['.aaaaa..', 'a..a..a.', '...a....', '...a....', '...a....', '...a....', '...a....', '........'] },
  recall: { p: { a: 'currentColor' }, m: ['...a....', '..aaa...', '.aaaaa..', '...a....', '...a....', '...a....', '.aaaaa..', '........'] },
  drill: { p: { a: 'currentColor' }, m: ['aaaaaaaa', 'a.aaaa.a', '.aaaaaa.', '..aaaa..', '..aaaa..', '...aa...', '...aa...', '........'] },
  launch: { p: { a: 'currentColor' }, m: ['...aa...', '..aaaa..', '..a..a..', '..aaaa..', '.aaaaaa.', 'aa.aa.aa', '...aa...', '..a..a..'] },
  info: { p: { a: 'currentColor' }, m: ['..aaaa..', '.aa..aa.', '.....aa.', '....aa..', '...aa...', '........', '...aa...', '........'] },
  star: { p: { a: '#ffc23c', b: '#ff8a1c' }, m: ['...aa...', '...aa...', 'aaaaaaaa', '.aaaaab.', '..aaab..', '.aab.ab.', '.ab...b.', '........'] },
  stare: { p: { a: 'rgba(255,178,60,0.25)' }, m: ['...aa...', '...aa...', 'aaaaaaaa', '.aaaaaa.', '..aaaa..', '.aa..aa.', '.a....a.', '........'] },
  x: { p: { a: 'currentColor' }, m: ['........', '.a....a.', '..a..a..', '...aa...', '...aa...', '..a..a..', '.a....a.', '........'] },
  check: { p: { a: 'currentColor' }, m: ['........', '.......a', '......aa', 'a....aa.', 'aa..aa..', '.aaaa...', '..aa....', '........'] },
  lock: { p: { a: 'currentColor' }, m: ['..aaaa..', '.a....a.', '.a....a.', 'aaaaaaaa', 'aaa..aaa', 'aaa..aaa', 'aaaaaaaa', '........'] },
  gear: { p: { a: 'currentColor' }, m: ['...aa...', '.aaaaaa.', '.aa..aa.', 'aa....aa', 'aa....aa', '.aa..aa.', '.aaaaaa.', '...aa...'] },
  person: { p: { a: 'currentColor' }, m: ['...aa...', '..aaaa..', '...aa...', '.aaaaaa.', 'a.aaaa.a', '..aaaa..', '..a..a..', '..a..a..'] },
  miner: { p: { a: '#ffc23c', b: '#e7b58a', c: '#6b5a44' }, m: ['..aaaa..', '.aaaaaa.', '..bbbb..', '..bbbb..', '.cccccc.', '.cccccc.', '..c..c..', '..c..c..'] },
  hauler: { p: { a: '#4fb0ff', b: '#e7b58a', c: '#6b5a44' }, m: ['..aaaa..', '.aaaaaa.', '..bbbb..', '..bbbb..', '.cccccc.', '.cccccc.', '..c..c..', '..c..c..'] },
  guard: { p: { a: '#ff5d4a', b: '#e7b58a', c: '#4d5a44' }, m: ['..aaaa..', '.aaaaaa.', '..bbbb..', '..bbbb..', '.cccccc.', '.cccccc.', '..c..c..', '..c..c..'] },
  crewcap: { p: { a: 'currentColor' }, m: ['...aa...', '..aaaa..', '...aa...', '.aaaaaa.', 'a.aaaa.a', '..aaaa..', '..a..a..', '..a..a..'] },
  core: { p: { a: '#fff2b0', b: '#ffb23c', c: '#b3561a' }, m: ['..cccc..', '.cbbbbc.', 'cbbaabbc', 'cbaaaabc', 'cbaaaabc', 'cbbaabbc', '.cbbbbc.', '..cccc..'] },
  speed: { p: { a: 'currentColor' }, m: ['........', 'a...a...', 'aa..aa..', 'aaa.aaa.', 'aaa.aaa.', 'aa..aa..', 'a...a...', '........'] },
  warn: { p: { a: 'currentColor' }, m: ['...aa...', '...aa...', '..a..a..', '..a..a..', '.a.aa.a.', '.a....a.', 'a..aa..a', 'aaaaaaaa'] },
  skull: { p: { a: 'currentColor' }, m: ['.aaaaaa.', 'aaaaaaaa', 'a..aa..a', 'a..aa..a', 'aaaaaaaa', '.aa..aa.', '.a.aa.a.', '........'] },
  target: { p: { a: 'currentColor' }, m: ['..aaaa..', '.a....a.', 'a..aa..a', 'a.a..a.a', 'a.a..a.a', 'a..aa..a', '.a....a.', '..aaaa..'] },
  eye: { p: { a: 'currentColor' }, m: ['........', '..aaaa..', '.a....a.', 'a..aa..a', 'a..aa..a', '.a....a.', '..aaaa..', '........'] },
  shaft: { p: { a: 'currentColor' }, m: ['a......a', 'a..a...a', 'a....a.a', 'a.a....a', 'a...a..a', 'aaaaaaaa', 'a......a', 'a......a'] },
  up: { p: { a: 'currentColor' }, m: ['...aa...', '..aaaa..', '.aaaaaa.', 'aa.aa.aa', '...aa...', '...aa...', '...aa...', '........'] },
  down: { p: { a: 'currentColor' }, m: ['........', '...aa...', '...aa...', '...aa...', 'aa.aa.aa', '.aaaaaa.', '..aaaa..', '...aa...'] },
  ban: { p: { a: 'currentColor' }, m: ['..aaaa..', '.a....a.', 'a....a.a', 'a...a..a', 'a..a...a', 'a.a....a', '.a....a.', '..aaaa..'] },
  reroll: { p: { a: 'currentColor' }, m: ['..aaaa.a', '.a....aa', 'a....aaa', 'a.......', '.......a', 'aaa....a', 'aa....a.', 'a.aaaa..'] },
  sell: { p: { a: 'currentColor' }, m: ['...a....', '.aaaaa..', 'a..a....', '.aaaa...', '...a.a..', 'aaaaaa..', '...a....', '........'] },
};

export function icon(name: string, cls = 'icon'): SVGSVGElement {
  const def = ICONS[name] ?? ICONS.info;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  const w = def.m[0].length, hgt = def.m.length;
  svg.setAttribute('viewBox', `0 0 ${w} ${hgt}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  for (let y = 0; y < hgt; y++) {
    let x = 0;
    const row = def.m[y];
    while (x < w) {
      const c = row[x];
      if (c === '.') { x++; continue; }
      let e = x;
      while (e < w && row[e] === c) e++;
      const r = document.createElementNS(ns, 'rect');
      r.setAttribute('x', String(x)); r.setAttribute('y', String(y)); r.setAttribute('width', String(e - x)); r.setAttribute('height', '1');
      r.setAttribute('fill', def.p[c] ?? 'currentColor');
      svg.appendChild(r);
      x = e;
    }
  }
  return svg;
}

export function stars(n: number, max = 3, big = false) {
  const el = h('span', { class: big ? 'stars big' : 'stars', 'aria-label': `${n} of ${max} stars` });
  for (let i = 0; i < max; i++) el.appendChild(icon(i < n ? 'star' : 'stare'));
  return el;
}

export function res(kind: string, n: number | string, cls = '') {
  return h('span', { class: `res ${cls}`, style: `color: var(--${kind === 'crim' ? 'crim' : kind})` }, icon(kind), String(n));
}

export function costEl(c: { iron: number; crim: number; larva: number }, afford?: { iron: number; crim: number; larva: number }) {
  const el = h('span', { class: 'cost' });
  const add = (k: 'iron' | 'crim' | 'larva', v: number) => {
    const short = afford && afford[k] < v;
    el.appendChild(h('span', { class: `res ${short ? 'red' : ''}`, style: short ? '' : `color: var(--${k})` }, icon(k), String(v)));
  };
  add('iron', c.iron); add('crim', c.crim);
  if (c.larva) add('larva', c.larva);
  return el;
}

/** Press-and-hold commit helper for buttons (sell, drill, launch). */
// ---- ghost clicks ---------------------------------------------------------------------------------
// After a touch the browser sends a compatibility click to whatever is under the finger when it lifts.
// An action that runs before that (long-press, completed hold) can put a new element there — a sheet, its
// dimmed backdrop, the result screen — which would then receive the click. armGhostGuard swallows it.
let ghost: { x: number; y: number; t: number } | null = null;
export function armGhostGuard(x: number, y: number, pointerType: string) {
  if (pointerType !== 'mouse') ghost = { x, y, t: performance.now() };
}
window.addEventListener('click', e => {
  if (!ghost) return;
  const g = ghost; ghost = null;
  if (performance.now() - g.t < 1500 && Math.hypot(e.clientX - g.x, e.clientY - g.y) < 40) { e.preventDefault(); e.stopPropagation(); }
}, true);
window.addEventListener('pointerdown', () => { ghost = null; }, true); // a new touch means no click is pending

export function holdButton(el: HTMLElement, ms: number, onDone: () => void, canStart: () => boolean = () => true, onTick?: (p: number) => void) {
  let t0 = 0, raf = 0, active = false, px = 0, py = 0, ptype = 'mouse';
  const fill = h('span', { class: el.classList.contains('act') ? 'fill' : 'hold-fill' });
  el.appendChild(fill);
  const stop = () => { active = false; cancelAnimationFrame(raf); fill.style.width = '0'; };
  const frame = () => {
    if (!active) return;
    const p = Math.min(1, (performance.now() - t0) / ms);
    fill.style.width = `${p * 100}%`;
    onTick?.(p);
    if (p >= 1) { stop(); armGhostGuard(px, py, ptype); onDone(); return; }
    raf = requestAnimationFrame(frame);
  };
  el.addEventListener('pointerdown', e => {
    if (!canStart()) return;
    e.preventDefault();
    px = e.clientX; py = e.clientY; ptype = e.pointerType;
    try { el.setPointerCapture((e as PointerEvent).pointerId); } catch { /* ignore */ }
    active = true; t0 = performance.now(); raf = requestAnimationFrame(frame);
  });
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);
  el.addEventListener('lostpointercapture', stop);
  el.addEventListener('keydown', e => { if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') { if (!active && canStart()) { active = true; t0 = performance.now(); raf = requestAnimationFrame(frame); } e.preventDefault(); } });
  el.addEventListener('keyup', stop);
  return { cancel: stop, get active() { return active; } };
}
