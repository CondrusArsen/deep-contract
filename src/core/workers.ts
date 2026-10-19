// Autonomous crew: miners dig tagged blocks, haulers carry loose items home, guards fight and escort.
import { PLATFORMS } from './data/platforms';
import { UENEMIES } from './data/enemies';
import { breakBlock, cellIdxOfWorker, dangerCells, explode, hurtWorker } from './mine';
import { blastMult, carryCap, coalQuota, guardMult, mineMult, perk, workerHpMult, workerSpeedMult } from './mods';
import { bfs, lineOfSight, neighbours, pathHome } from './path';
import { rnd } from './rng';
import { B, type GameState, type ItemKind, type Worker, type WorkerClass } from './types';
import { cellCX, cellCY, cellX, cellY, dist, ENTRY, LADDER_X, DECK_WALK_Y, W, worldCell } from './world';
import { deliver } from './economy';

const DECK_SLOTS = [1.6, 2.4, 3.2, 4.0, 4.8, 5.6, 6.4, 10.6, 11.4, 12.2, 13.0, 13.8, 14.6, 15.4];

export function makeWorker(s: GameState, cls: WorkerClass, x?: number): Worker {
  const def = PLATFORMS[s.setup.platform].workers[cls];
  const hp = Math.round(def.hp * workerHpMult(s));
  const deckX = DECK_SLOTS[Math.floor(rnd(s.rng) * DECK_SLOTS.length)] + (rnd(s.rng) - 0.5) * 0.4;
  return {
    id: s.nextId++, cls, x: x ?? deckX, y: DECK_WALK_Y, hp, maxHp: hp, st: 'deck', path: [], route: [], goal: 'idle', job: -1,
    carry: [], cd: rnd(s.rng) * 0.4, anim: rnd(s.rng) * 4, face: 1, below: false, stranded: false, frozen: 0, slowT: 0, hurtT: 0,
    incubate: 0, deckX,
  };
}

export const mustHome = (s: GameState) => s.phase !== 'day' || s.dusk || s.recall;

export function workforceUsed(s: GameState) {
  const pl = PLATFORMS[s.setup.platform];
  let n = 0;
  for (const w of s.workers) if (w.hp > 0) n += pl.workers[w.cls].slot;
  for (const q of s.recruitQ) n += pl.workers[q.cls].slot;
  return Math.round(n * 10) / 10;
}

// ---- crew growth: work earns XP; early levels come fast so the crew visibly improves within minutes ----------
/** total XP needed to reach level 2, 3, 4, 5 */
export const LVL_XP = [0, 0, 5, 14, 30, 55];
export const MAX_LVL = 5;
export const workerLvl = (w: Worker) => w.lvl ?? 1;
/** +8% walking/climbing speed per level above 1 */
export const lvlSpeed = (w: Worker) => 1 + 0.08 * (workerLvl(w) - 1);
/** +12% digging power / +10% guard damage per level above 1 */
export const lvlPower = (w: Worker) => 1 + 0.12 * (workerLvl(w) - 1);
export function gainXp(s: GameState, w: Worker, n: number) {
  w.xp = (w.xp ?? 0) + n;
  let lvl = workerLvl(w);
  while (lvl < MAX_LVL && w.xp >= LVL_XP[lvl + 1]) {
    lvl++;
    s.ffx.push({ t: 'lvlup', x: w.x, y: w.y, a: lvl, id: w.id, s: w.cls });
  }
  w.lvl = lvl;
}

function speedOf(s: GameState, w: Worker, vertical: boolean) {
  const def = PLATFORMS[s.setup.platform].workers[w.cls];
  let v = def.speed * workerSpeedMult(s, w.cls) * lvlSpeed(w);
  const jet = s.setup.platform === 'stone' && w.cls === 'guard';
  if (vertical && !jet) v *= 0.75;
  if (w.carry.includes('charge')) v *= 0.6;
  if (w.slowT > 0) v *= 1.5;
  if (w.below) {
    const c = cellIdxOfWorker(w.x, w.y);
    if (c >= 0 && s.mine.fx[c]?.puddle && !jet) v *= 0.5;
  }
  return v;
}

/** Move toward the next waypoint / path cell. Returns true when nothing is left to walk. */
function walk(s: GameState, w: Worker, dt: number): boolean {
  let budget = dt;
  while (budget > 0) {
    let tx: number, ty: number;
    if (w.route.length) { tx = w.route[0].x; ty = w.route[0].y; }
    else if (w.path.length) {
      const c = w.path[0];
      if (s.mine.kind[c] !== B.Empty) { w.path = []; w.goal = ''; return true; } // blocked (ice regrowth)
      tx = cellCX(c); ty = cellCY(c);
    } else return true;
    const dx = tx - w.x, dy = ty - w.y;
    const d = Math.hypot(dx, dy);
    const v = speedOf(s, w, Math.abs(dy) > Math.abs(dx));
    if (Math.abs(dx) > 0.01) w.face = dx > 0 ? 1 : -1;
    const step = v * budget;
    if (d <= step) {
      w.x = tx; w.y = ty; budget -= d / Math.max(0.01, v);
      if (w.route.length) w.route.shift(); else w.path.shift();
    } else {
      w.x += (dx / d) * step; w.y += (dy / d) * step; budget = 0;
    }
  }
  w.anim += dt * 8;
  return !w.route.length && !w.path.length;
}

const workerCell = (w: Worker) => cellIdxOfWorker(w.x, w.y);

function startDescend(w: Worker) {
  w.route = [{ x: LADDER_X, y: DECK_WALK_Y }, { x: LADDER_X, y: cellCY(ENTRY) }];
  w.goal = 'descend'; w.st = 'climb';
}

function startAscend(s: GameState, w: Worker) {
  const c = workerCell(w);
  const p = pathHome(s.entryDist, c);
  if (!p) { w.stranded = true; w.goal = 'stuck'; w.path = []; return; }
  w.stranded = false;
  w.path = p; w.route = [];
  w.goal = 'ascend'; w.st = 'walk';
  for (const it of s.items) if (it.claim === w.id) it.claim = -1;
}

function arriveDeck(s: GameState, w: Worker) {
  w.below = false; w.stranded = false;
  for (const k of w.carry) deliver(s, k);
  if (w.carry.length) { s.ffx.push({ t: 'deliver', x: w.x, y: w.y, s: w.carry.join(',') }); gainXp(s, w, w.carry.length); }
  w.carry = [];
  w.route = [{ x: w.deckX, y: DECK_WALK_Y }];
  w.goal = 'idle'; w.st = 'walk';
}

// ---- job finding ---------------------------------------------------------------------------

function minerClaims(s: GameState, cell: number, except: number) {
  let n = 0;
  for (const w of s.workers) if (w.id !== except && w.hp > 0 && w.cls === 'miner' && w.goal === 'dig' && w.job === cell) n++;
  for (const t of s.tnt) if (t.cell === cell) n++;
  return n;
}

function findDigJob(s: GameState, w: Worker, from: number) {
  const m = s.mine;
  return bfs(m, from, c => {
    for (const n of neighbours(c)) if (m.tag[n] && m.kind[n] !== B.Empty && m.kind[n] !== B.Bedrock && minerClaims(s, n, w.id) === 0) { w.job = n; return true; }
    return false;
  });
}

function preferredKinds(s: GameState): ItemKind[] | null {
  switch (s.haul) {
    case 'coal': return ['coal'];
    case 'iron': return ['iron'];
    case 'crim': return ['crim'];
    case 'min': return ['ochre', 'jade', 'void'];
    default: {
      const k: ItemKind[] = ['tech', 'bonus', 'charge'];
      if (!s.drillQueued && s.res.coal < coalQuota(s)) k.push('coal');
      return k;
    }
  }
}

function findItem(s: GameState, w: Worker, from: number, maxD = 999) {
  const byCell = new Map<number, number[]>();
  for (const it of s.items) if (it.claim < 0) { const a = byCell.get(it.cell); if (a) a.push(it.id); else byCell.set(it.cell, [it.id]); }
  if (!byCell.size) return null;
  const pick = (kinds: ItemKind[] | null) => {
    let found = -1;
    const r = bfs(s.mine, from, c => {
      const ids = byCell.get(c);
      if (!ids) return false;
      for (const id of ids) {
        const it = s.items.find(q => q.id === id)!;
        if (!kinds || kinds.includes(it.kind)) { found = id; return true; }
      }
      return false;
    }, maxD);
    return r && found >= 0 ? { item: found, path: r.path } : null;
  };
  return pick(preferredKinds(s)) ?? pick(null);
}

function findEnemy(s: GameState, w: Worker) {
  let best = -1, bd = 1e9;
  for (const u of s.uenemies) {
    if (u.hp <= 0) continue;
    const d = dist(u.x, u.y, w.x, w.y);
    if (d < bd) { bd = d; best = u.id; }
  }
  return best;
}

function guardRange(s: GameState) { return s.setup.platform === 'brood' ? 1.4 : s.setup.platform === 'stone' ? 5 : 4; }

// ---- per-class behaviour --------------------------------------------------------------------

function thinkBelow(s: GameState, w: Worker, dt: number) {
  const m = s.mine;
  if (mustHome(s) || w.goal === 'ascend' || w.goal === 'stuck') return;
  const here = workerCell(w);
  if (w.cls === 'miner') {
    const target = w.job;
    const valid = w.goal === 'dig' && target >= 0 && m.tag[target] && m.kind[target] !== B.Empty;
    if (valid && !w.path.length) {
      if (neighbours(here).includes(target)) { w.st = 'dig'; digTick(s, w, target, dt); return; }
    }
    if (valid && w.path.length) return;
    w.cd -= dt;
    if (w.cd > 0 && w.goal !== '') return;
    w.cd = 0.4;
    const r = findDigJob(s, w, here);
    if (r) { w.goal = 'dig'; w.path = r.path; w.st = 'walk'; w.cd = 0; }
    else startAscend(s, w);
    return;
  }
  if (w.cls === 'hauler') {
    const cap = carryCap(s);
    if (w.goal === 'item') {
      const it = s.items.find(q => q.id === w.job);
      if (!it || it.claim !== w.id) { w.goal = ''; }
      else if (!w.path.length) {
        w.st = 'pick'; w.cd -= dt;
        if (w.cd <= 0) {
          w.carry.push(it.kind);
          s.items.splice(s.items.indexOf(it), 1);
          s.ffx.push({ t: 'pickup', x: w.x, y: w.y, s: it.kind });
          w.goal = '';
          if (w.carry.length < cap && !w.carry.includes('charge')) {
            const next = findItem(s, w, here, 5);
            if (next) { claim(s, w, next.item, next.path); return; }
          }
          startAscend(s, w);
        }
        return;
      } else return;
    }
    if (w.goal === 'ascend') return;
    if (w.carry.length >= cap) { startAscend(s, w); return; }
    w.cd -= dt;
    if (w.cd > 0 && w.goal !== '') return;
    w.cd = 0.4;
    const r = findItem(s, w, here);
    if (r) claim(s, w, r.item, r.path);
    else startAscend(s, w);
    return;
  }
  // guard
  const range = guardRange(s);
  w.cd -= dt;
  const tid = findEnemy(s, w);
  const u = s.uenemies.find(q => q.id === tid);
  if (u) {
    const d = dist(u.x, u.y, w.x, w.y);
    const uc = worldCell(u.x, u.y);
    if (d <= range && lineOfSight(m, w.x, w.y, u.x, u.y, worldCell, uc)) {
      w.path = []; w.st = 'fight'; w.face = u.x > w.x ? 1 : -1;
      if (w.cd <= 0) {
        const pl = PLATFORMS[s.setup.platform].workers.guard;
        w.cd = s.setup.platform === 'brood' ? 0.8 : 1.0;
        const dmg = pl.power * guardMult(s) * (1 + 0.1 * (workerLvl(w) - 1));
        u.hp -= dmg; u.hurtT = 0.2;
        if (u.hp <= 0) gainXp(s, w, 3);
        s.ffx.push({ t: s.setup.platform === 'brood' ? 'bite' : 'gshot', x: w.x, y: w.y, a: u.x, b: u.y });
      }
      return;
    }
    if (!w.path.length || w.goal !== 'hunt' || w.job !== u.id || w.cd <= -1) {
      w.cd = Math.min(w.cd, 0);
      const r = bfs(m, here, c => dist(cellCX(c), cellCY(c), u.x, u.y) <= Math.max(1.1, range - 0.5), 40);
      if (r) { w.path = r.path; w.goal = 'hunt'; w.job = u.id; w.st = 'walk'; w.cd = 0.6; return; }
    }
    if (w.path.length) return;
  }
  // pop spore pods from range
  if (s.contract.biome === 'jungle' && w.cd <= 0) {
    for (const key in m.fx) {
      const c = +key;
      if (m.kind[c] !== B.Pod) continue;
      const px = cellCX(c), py = cellCY(c);
      if (dist(px, py, w.x, w.y) > Math.max(range, 4) + 0.5) continue;
      if (s.workers.some(o => o.below && o.hp > 0 && dist(o.x, o.y, px, py) < 2.3)) continue;
      if (!lineOfSight(m, w.x, w.y, px, py, worldCell, c)) continue;
      w.cd = 1.0; w.st = 'fight';
      s.ffx.push({ t: 'gshot', x: w.x, y: w.y, a: px, b: py });
      m.hp[c] -= 3;
      if (m.hp[c] <= 0) breakBlock(s, c, 'blast');
      return;
    }
  }
  // escort the deepest miner
  let far: Worker | null = null, fd = -1;
  for (const o of s.workers) if (o.cls === 'miner' && o.below && o.hp > 0) { const d = s.entryDist[workerCell(o)] ?? 0; if (d > fd) { fd = d; far = o; } }
  if (!far) { if (w.goal !== 'ascend') startAscend(s, w); return; }
  if (w.path.length) return;
  const fc = workerCell(far);
  if (Math.abs(cellX(fc) - cellX(here)) + Math.abs(cellY(fc) - cellY(here)) <= 2) { w.st = 'deck'; return; }
  if (w.cd > 0) return;
  w.cd = 0.8;
  const r = bfs(m, here, c => Math.abs(cellX(fc) - cellX(c)) + Math.abs(cellY(fc) - cellY(c)) <= 1 && c !== fc, 60);
  if (r) { w.path = r.path; w.goal = 'escort'; w.st = 'walk'; }
}

function claim(s: GameState, w: Worker, itemId: number, path: number[]) {
  const it = s.items.find(q => q.id === itemId)!;
  it.claim = w.id; w.job = itemId; w.goal = 'item'; w.path = path; w.st = 'walk'; w.cd = 0.25;
}

function digTick(s: GameState, w: Worker, target: number, dt: number) {
  const m = s.mine;
  w.face = cellCX(target) > w.x ? 1 : cellCX(target) < w.x ? -1 : w.face;
  w.anim += dt * 6;
  if (s.setup.platform === 'stone') {
    // Blaster: plant a timed charge, then step back
    w.cd -= dt * mineMult(s);
    if (w.cd > 0) return;
    w.cd = 1.4;
    s.tnt.push({ id: s.nextId++, cell: target, x: cellCX(target), y: cellCY(target), t: 2.2, power: PLATFORMS.stone.workers.miner.power * mineMult(s) * lvlPower(w), from: w.id });
    s.ffx.push({ t: 'plant', x: cellCX(target), y: cellCY(target) });
    w.goal = 'retreat';
    const r = bfs(m, workerCell(w), c => dist(cellCX(c), cellCY(c), cellCX(target), cellCY(target)) >= 2.4, 8);
    w.path = r ? r.path : [];
    w.st = 'walk';
    return;
  }
  const def = PLATFORMS[s.setup.platform].workers.miner;
  const dmg = def.power * mineMult(s) * lvlPower(w) * dt;
  m.hp[target] -= dmg;
  w.cd -= dt;
  if (w.cd <= 0) { w.cd = 0.5; s.ffx.push({ t: 'dig', x: cellCX(target), y: cellCY(target), a: m.kind[target] }); }
  if (m.hp[target] <= 0) { breakBlock(s, target, 'dig'); gainXp(s, w, 1); w.goal = ''; w.cd = 0; w.st = 'deck'; }
}

export function tickTnt(s: GameState, dt: number) {
  for (let i = s.tnt.length - 1; i >= 0; i--) {
    const t = s.tnt[i];
    t.t -= dt;
    if (t.t <= 0) {
      s.tnt.splice(i, 1);
      if (s.mine.kind[t.cell] !== B.Empty) {
        s.mine.hp[t.cell] -= t.power;
        if (s.mine.hp[t.cell] <= 0) { breakBlock(s, t.cell, 'blast'); const bw = s.workers.find(q => q.id === t.from); if (bw) gainXp(s, bw, 1); }
      }
      explode(s, t.x, t.y, 1.5 * blastMult(s), t.power * 0.8, 0, 14, true);
      const w = s.workers.find(q => q.id === t.from);
      if (w && w.goal === 'retreat') { w.goal = ''; w.cd = 0; }
    }
  }
}

function thinkDeck(s: GameState, w: Worker, dt: number) {
  // heal aboard
  if (w.hp < w.maxHp) w.hp = Math.min(w.maxHp, w.hp + dt * (perk(s, 'w10') ? 1 : 0.5));
  if (w.route.length) return;
  if (mustHome(s)) { w.st = 'deck'; return; }
  if (w.hp < w.maxHp * 0.8 && w.cls !== 'guard') { w.st = 'deck'; return; } // rest until mostly healed
  w.cd -= dt;
  if (w.cd > 0) return;
  w.cd = 0.5 + rnd(s.rng) * 0.3;
  if (s.mine.kind[ENTRY] !== B.Empty) return;
  let want = false;
  if (w.cls === 'miner') want = !!findDigJob(s, w, ENTRY);
  else if (w.cls === 'hauler') want = !!findItem(s, w, ENTRY);
  else want = s.uenemies.length > 0 || s.workers.some(o => o.cls === 'miner' && o.below && o.hp > 0);
  if (want) startDescend(w);
  else w.st = 'deck';
}

export function tickWorkers(s: GameState, dt: number) {
  const danger = dangerCells(s);
  for (const w of s.workers) {
    if (w.hp <= 0) continue;
    if (w.hurtT > 0) w.hurtT -= dt;
    if (w.slowT > 0) w.slowT -= dt;
    if (w.incubate > 0) {
      w.incubate -= dt; w.st = 'cocoon';
      if (w.incubate <= 0) { w.st = 'deck'; s.ffx.push({ t: 'emerge', x: w.x, y: w.y }); }
      continue;
    }
    if (w.frozen > 0) { w.frozen -= dt; continue; }
    if (!w.below) {
      if (w.route.length) {
        const done = walk(s, w, dt);
        if (done && w.goal === 'descend') { w.below = true; w.goal = ''; w.cd = 0; w.st = 'walk'; }
        else if (done) w.st = 'deck';
      }
      if (!w.below) thinkDeck(s, w, dt);
      continue;
    }
    // below
    // telegraphed hazards: step out of a shaking jet's lane, a rift target or a swelling pod's reach
    if (danger.size && w.goal !== 'dodge') {
      const here = workerCell(w);
      if (danger.has(here)) {
        const safe = neighbours(here).find(n => s.mine.kind[n] === B.Empty && !danger.has(n));
        if (safe !== undefined) { w.path = [safe]; w.route = []; w.goal = 'dodge'; w.st = 'walk'; s.ffx.push({ t: 'dodge', x: w.x, y: w.y }); }
      }
    }
    if (w.goal === 'dodge') { if (w.path.length) { walk(s, w, dt); continue; } w.goal = ''; w.cd = 0.3; }
    if (mustHome(s) && w.goal !== 'ascend' && w.goal !== 'stuck') startAscend(s, w);
    // wounded non-guards drop their job and climb home to heal when something is hunting nearby
    if (w.cls !== 'guard' && w.goal !== 'ascend' && w.goal !== 'stuck' && w.hp < w.maxHp * 0.35 && s.uenemies.some(u => u.hp > 0 && dist(u.x, u.y, w.x, w.y) < 3.5)) { startAscend(s, w); s.ffx.push({ t: 'flee', x: w.x, y: w.y }); }
    if (w.goal === 'stuck') {
      w.cd -= dt;
      if (w.cd > 0) continue;
      w.cd = 1;
      startAscend(s, w);
      if (w.goal === 'stuck') continue;
    }
    if (w.goal === 'ascend' && !w.path.length && !w.route.length) {
      // at the landing: climb the ladder
      if (workerCell(w) === ENTRY) w.route = [{ x: LADDER_X, y: DECK_WALK_Y }];
      else startAscend(s, w);
    }
    if (w.goal === 'dig' && (w.job < 0 || !s.mine.tag[w.job] || s.mine.kind[w.job] === B.Empty)) { w.path = []; w.goal = ''; w.cd = 0; }
    if (w.route.length || w.path.length) {
      const done = walk(s, w, dt);
      if (done && w.goal === 'ascend' && w.y <= DECK_WALK_Y + 0.01) { arriveDeck(s, w); continue; }
      if (w.route.length || w.path.length) {
        if (w.goal === 'hunt') { w.cd -= dt; if (w.cd <= -0.6) { w.path = []; } }
        continue;
      }
    }
    thinkBelow(s, w, dt);
  }
  // remove the dead
  const before = s.workers.length;
  s.workers = s.workers.filter(w => w.hp > 0);
  if (s.workers.length !== before) for (const it of s.items) if (it.claim >= 0 && !s.workers.some(w => w.id === it.claim)) it.claim = -1;
}

/** Underground enemies: Rockmites path through open cells, Borers tunnel straight through rock. */
export function tickUnder(s: GameState, dt: number) {
  const below = s.workers.filter(w => w.below && w.hp > 0 && w.incubate <= 0);
  for (const u of s.uenemies) {
    if (u.hp <= 0) continue;
    if (u.hurtT > 0) u.hurtT -= dt;
    u.anim += dt * 6;
    u.cd -= dt;
    const def = UENEMIES[u.kind];
    let tgt: Worker | null = null, bd = 1e9;
    for (const w of below) { const d = dist(w.x, w.y, u.x, u.y); if (d < bd) { bd = d; tgt = w; } }
    if (!tgt) {
      u.path = [];
      if (u.kind === 'borer') { u.ttl -= dt; }
      continue;
    }
    u.ttl = 6;
    // workers swing back at anything next to them
    for (const w of below) if (w.cls !== 'guard' && dist(w.x, w.y, u.x, u.y) <= 1.0) { u.hp -= (u.kind === 'mite' ? 1.8 : 0.6) * dt; u.hurtT = Math.max(u.hurtT, 0.05); }
    if (bd <= 0.85) {
      if (u.cd <= 0) { u.cd = def.biteCd; hurtWorker(s, tgt.id, def.bite, u.kind); s.ffx.push({ t: 'bite', x: u.x, y: u.y, a: tgt.x, b: tgt.y }); }
      continue;
    }
    if (u.kind === 'borer') {
      const dx = tgt.x - u.x, dy = tgt.y - u.y, d = Math.hypot(dx, dy);
      const v = def.speed * dt;
      u.x += (dx / d) * Math.min(v, d); u.y += (dy / d) * Math.min(v, d);
    } else {
      if (!u.path.length || u.cd <= -0.5) {
        u.cd = Math.max(u.cd, 0);
        const from = worldCell(u.x, u.y);
        const goalCell = worldCell(tgt.x, tgt.y);
        const r = bfs(s.mine, from, c => c === goalCell, 80);
        u.path = r ? r.path : [];
      }
      if (u.path.length) {
        const c = u.path[0];
        const tx = cellCX(c), ty = cellCY(c);
        const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy);
        const v = def.speed * dt;
        if (d <= v) { u.x = tx; u.y = ty; u.path.shift(); } else { u.x += (dx / d) * v; u.y += (dy / d) * v; }
      } else {
        const dx = tgt.x - u.x, dy = tgt.y - u.y, d = Math.hypot(dx, dy);
        if (d < 1.6) { u.x += (dx / d) * def.speed * dt; u.y += (dy / d) * def.speed * dt; }
      }
    }
  }
  for (let i = s.uenemies.length - 1; i >= 0; i--) {
    const u = s.uenemies[i];
    if (u.hp <= 0) { s.ffx.push({ t: 'ukill', x: u.x, y: u.y, s: u.kind }); s.uenemies.splice(i, 1); s.stats.kills++; }
    else if (u.kind === 'borer' && u.ttl <= 0) { s.ffx.push({ t: 'burrow', x: u.x, y: u.y }); s.uenemies.splice(i, 1); }
  }
}

export function spawnBorer(s: GameState) {
  const d = UENEMIES.borer;
  const hp = Math.round(d.hp * (1 + 0.15 * (s.contract.tier - 1)) * (1 + 0.1 * (s.stratum - 1)));
  const side = rnd(s.rng) < 0.5 ? 0.5 : W - 0.5;
  const y = cellCY(Math.floor(rnd(s.rng) * 14) * W);
  s.uenemies.push({ id: s.nextId++, kind: 'borer', x: side, y, hp, maxHp: hp, cd: 1, target: -1, path: [], ttl: 6, anim: 0, hurtT: 0 });
  s.ffx.push({ t: 'borer', x: side, y });
}

export function winchAboard(s: GameState) {
  for (const w of s.workers) {
    if (!w.below) continue;
    for (const k of w.carry) deliver(s, k);
    w.carry = []; w.below = false; w.path = []; w.route = []; w.stranded = false; w.goal = 'idle';
    w.x = w.deckX; w.y = DECK_WALK_Y; w.st = 'deck';
  }
}

export const workerCellOf = workerCell;
export const cellCenterOf = (c: number) => ({ x: cellCX(c), y: cellCY(c) });
export const _unused = cellY;
