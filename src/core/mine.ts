// Mine generation per stratum, block breaking, drops and hazard behaviour.
import { BLOCKS, ORE_KINDS } from './data/blocks';
import { UENEMIES } from './data/enemies';
import { coalQuota, doubleDropChance, hasMod, perk, today } from './mods';
import { entryField, neighbours } from './path';
import { rchance, rint, rnd, rpick } from './rng';
import { B, type GameState, type ItemKind, type Mine } from './types';
import { cellCX, cellCY, cellIdx, cellX, cellY, dist, ENTRY, MINE_H, W } from './world';

const N = W * MINE_H;

export function emptyMine(): Mine {
  return { w: W, h: MINE_H, kind: new Array(N).fill(B.Rock), hp: new Array(N).fill(6), maxHp: new Array(N).fill(6), tag: new Array(N).fill(0), fx: {}, seen: new Array(N).fill(1) };
}

const softOf = (biome: string) => (biome === 'frost' ? B.Snow : biome === 'jungle' ? B.Vine : B.Dirt);
const protectedCell = (i: number) => {
  const x = cellX(i), y = cellY(i);
  return Math.abs(x - 8) <= 1 && y <= 1;
};
const plain = (k: number): boolean => k === B.Dirt || k === B.Rock || k === B.Hard || k === B.Snow || k === B.Vine || k === B.Ice || k === B.Mud;

export function generateMine(s: GameState): Mine {
  const r = s.rng, biome = s.contract.biome, st = s.stratum, tier = s.contract.tier;
  const m = emptyMine();
  const K = m.kind;
  const soft = softOf(biome);
  for (let i = 0; i < N; i++) {
    const x = cellX(i), y = cellY(i);
    if (x === 0 || x === W - 1) { K[i] = B.Bedrock; continue; }
    const f = y / MINE_H;
    const hardP = Math.min(0.55, 0.04 + 0.07 * (st - 1) + 0.22 * f);
    const softP = Math.max(0.06, 0.46 - 0.07 * (st - 1) - 0.32 * f);
    const v = rnd(r);
    K[i] = v < softP ? soft : v < softP + hardP ? B.Hard : B.Rock;
  }
  // smooth ground layers a little
  for (let pass = 0; pass < 1; pass++) {
    const copy = K.slice();
    for (let i = 0; i < N; i++) {
      if (copy[i] === B.Bedrock) continue;
      const cnt: Record<number, number> = {};
      for (const n of neighbours(i)) if (copy[n] !== B.Bedrock) cnt[copy[n]] = (cnt[copy[n]] ?? 0) + 1;
      for (const k in cnt) if (cnt[k] >= 3) K[i] = +k;
    }
  }
  // caves: cellular automaton pockets
  let cave = new Array(N).fill(false);
  for (let i = 0; i < N; i++) {
    const x = cellX(i), y = cellY(i);
    if (x >= 1 && x <= W - 2 && y >= 1) cave[i] = rnd(r) < 0.45;
  }
  for (let it = 0; it < 4; it++) {
    const nx = cave.slice();
    for (let i = 0; i < N; i++) {
      const x = cellX(i), y = cellY(i);
      if (x < 1 || x > W - 2 || y < 1) { nx[i] = false; continue; }
      let c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || xx >= W || yy < 0 || yy >= MINE_H) continue;
        if (cave[cellIdx(xx, yy)]) c++;
      }
      nx[i] = c >= 5;
    }
    cave = nx;
  }
  for (let i = 0; i < N; i++) if (cave[i]) K[i] = B.Empty;
  // entry landing and a short starter tunnel
  for (const [x, y] of [[8, 0], [7, 0], [9, 0], [8, 1]]) K[cellIdx(x, y)] = B.Empty;
  let tx = 8, ty = 1;
  for (let k = 0; k < 3 + st; k++) {
    const dir = rint(r, 0, 3);
    if (dir <= 1) tx = Math.max(2, Math.min(W - 3, tx + (dir === 0 ? -1 : 1)));
    else ty = Math.min(MINE_H - 3, ty + 1);
    K[cellIdx(tx, ty)] = B.Empty;
  }

  const solidCells = (pred: (i: number) => boolean) => {
    const out: number[] = [];
    for (let i = 0; i < N; i++) if (plain(K[i]) && K[i] !== B.Empty && !protectedCell(i) && pred(i)) out.push(i);
    return out;
  };
  const vein = (kind: B, total: number, size: number, rowMin: number, rowMax: number) => {
    let placed = 0, guard = 0;
    while (placed < total && guard++ < 200) {
      const cands = solidCells(i => cellY(i) >= rowMin && cellY(i) <= rowMax);
      if (!cands.length) break;
      let c = rpick(r, cands);
      const n = Math.min(size, total - placed);
      for (let k = 0; k < n; k++) {
        if (plain(K[c]) && K[c] !== B.Empty && !protectedCell(c)) { K[c] = kind; placed++; }
        const ns = neighbours(c).filter(q => plain(K[q]) && K[q] !== B.Empty && !protectedCell(q));
        if (!ns.length) break;
        c = rpick(r, ns);
      }
    }
    return placed;
  };
  const single = (kind: B, count: number, rowMin: number, rowMax: number, minEntryDist = 3) => {
    for (let k = 0; k < count; k++) {
      const cands = solidCells(i => cellY(i) >= rowMin && cellY(i) <= rowMax && dist(cellX(i), cellY(i), 8, 0) >= minEntryDist);
      if (!cands.length) return;
      K[rpick(r, cands)] = kind;
    }
  };

  const tut = !!s.contract.tutorial;
  // open cells connected to the ladder (ore placement below never opens or closes cells)
  const reach = entryField({ ...m, kind: K });
  /** solid cells near the ladder that the crew can reach: what the player sees the moment the platform lands */
  const openNear = (maxD: number) => solidCells(i => {
    const x = cellX(i), y = cellY(i);
    if (dist(x, y, 8, 0) > maxD) return false;
    return neighbours(i).some(n => reach[n] >= 0);
  });
  /** a seam of `n` blocks grown from a start cell, staying within `maxD` of the entry */
  const seam = (kind: B, n: number, starts: number[], maxD: number) => {
    if (!starts.length) return 0;
    let c = rpick(r, starts), placed = 0;
    for (let k = 0; k < n * 3 && placed < n; k++) {
      if (plain(K[c]) && !protectedCell(c)) { K[c] = kind; placed++; }
      const ns = neighbours(c).filter(q => plain(K[q]) && !protectedCell(q) && dist(cellX(q), cellY(q), 8, 0) <= maxD);
      if (!ns.length) break;
      c = rpick(r, ns);
    }
    return placed;
  };
  if (tut && st === 1) seam(B.Iron, 2, openNear(2.6), 3);
  vein(B.Iron, 17 + rint(r, 0, 5), 4, 0, MINE_H - 1);
  vein(B.Crim, 5 + rint(r, 0, 3) + Math.min(3, st - 1), 2, 3, MINE_H - 1);
  // coal: a seam in plain sight near the ladder on every stratum, the rest in fewer, larger veins (easy to spot,
  // one drag tags a whole vein)
  const quota = coalQuota(s);
  const coal = quota + 3 + (perk(s, 'o7') ? 1 : 0) + (tut ? 2 : 0);
  const near = seam(B.Coal, tut ? 5 : 3, openNear(tut ? 4 : 4.5), tut ? 4.5 : 5.5);
  const rest = coal - near;
  const upper = Math.floor(rest * 0.45);
  vein(B.Coal, upper, 3, 1, 6);
  vein(B.Coal, rest - upper, 3, 6, MINE_H - 1);
  const perm = hasMod(s, 'perm') ? 0.5 : 1;
  const mins = s.contract.minerals;
  if (mins.includes('ochre')) vein(B.Ochre, Math.floor((4 + rint(r, 0, 2)) * perm), 2, 2, MINE_H - 1);
  if (mins.includes('jade')) vein(B.Jade, Math.floor((3 + rint(r, 0, 2)) * perm), 2, 3, MINE_H - 1);
  if (mins.includes('void') && tier >= 2 && rchance(r, 0.35 + 0.1 * st) && perm === 1) single(B.Void, 1, 8, MINE_H - 1);
  if (mins.includes('void') && tier >= 4) single(B.Void, 1, 9, MINE_H - 1);

  // crates
  const caches = 2 + (perk(s, 'r6') ? 1 : 0);
  if (st === 1) {
    const ring = solidCells(i => { const d = dist(cellX(i), cellY(i), 8, 0); return d >= 2 && d <= 3.2; });
    // the first cache sits by the ladder, where the crew can reach it
    const reachableRing = ring.filter(i => neighbours(i).some(n => reach[n] >= 0));
    const near = reachableRing.length ? reachableRing : ring;
    if (near.length) K[rpick(r, near)] = B.Cache;
    single(B.Cache, caches - 1, 3, MINE_H - 1);
  } else single(B.Cache, caches, 2, MINE_H - 1);
  if (st >= 2) single(B.Bonus, 1 + (perk(s, 'r8') ? 1 : 0), 4, MINE_H - 1, 4);
  if (st >= s.contract.targetStrata) {
    // the guided contract puts one charge crystal close to the ladder
    if (tut) seam(B.Charge, 1, openNear(4), 5);
    single(B.Charge, s.contract.charges + (tut ? 0 : 1), 6, MINE_H - 1, 5);
  }

  // hazards per biome (the guided contract keeps them away from the ladder)
  const hz = tut ? 6 : 3;
  if (biome === 'cave') {
    if (st >= 2 || tier >= 2) single(B.Hatch, 1 + (st >= 3 ? 1 : 0), 4, MINE_H - 2, 5);
    single(B.Volatile, 2 + Math.min(4, st), 2, MINE_H - 1, hz);
    single(B.Jet, 1 + (st >= 2 ? 1 : 0), 2, MINE_H - 1, hz);
    if (st >= 2) single(B.Hole, 1, 5, MINE_H - 2, 5);
  } else if (biome === 'frost') {
    for (let k = 0; k < 3 + st; k++) vein(B.Ice, 5, 5, 1, MINE_H - 1);
    single(B.IceHeart, 1 + (st >= 3 ? 1 : 0), 4, MINE_H - 2, 5);
    single(B.CryoJet, 1 + (st >= 2 ? 1 : 0), 2, MINE_H - 1, 3);
    single(B.Volatile, 1 + Math.floor(st / 2), 3, MINE_H - 1, 3);
    if (st >= 3) single(B.Hatch, 1, 4, MINE_H - 2, 4);
  } else {
    vein(B.Mud, 8 + rint(r, 0, 4), 3, 1, MINE_H - 1);
    single(B.Root, 1 + (st >= 3 ? 1 : 0), 3, MINE_H - 2, 4);
    single(B.Pod, 2 + Math.min(4, st), 2, MINE_H - 1, 3);
    if (st >= 2) single(B.Hatch, 1, 4, MINE_H - 2, 4);
  }

  for (let i = 0; i < N; i++) {
    const k = K[i];
    const hp = BLOCKS[k].hp;
    m.hp[i] = hp; m.maxHp[i] = hp;
    if (k === B.Jet || k === B.CryoJet) {
      const opens = [0, 1, 2, 3].filter(d => { const n = stepDir(i, d); return n >= 0 && K[n] === B.Empty; });
      m.fx[i] = { jetDir: opens.length ? rpick(r, opens) : rint(r, 0, 3), jetT: 5 + rnd(r) * 6 };
    } else if (k === B.Hole) m.fx[i] = { holeT: 12 + rnd(r) * 6, holeTarget: -1, holeCoal: 0 };
    else if (k === B.Hatch) m.fx[i] = { jetT: 6 + rnd(r) * 6 };
    else if (k === B.IceHeart) m.fx[i] = { heartT: 14 + rnd(r) * 8 };
    else if (k === B.Root) m.fx[i] = { rootT: 18 + rnd(r) * 8 };
    else if (k === B.Pod) m.fx[i] = { podT: -1 };
  }
  return m;
}

export function stepDir(i: number, d: number): number {
  const x = cellX(i), y = cellY(i);
  const nx = x + (d === 0 ? 1 : d === 2 ? -1 : 0), ny = y + (d === 1 ? 1 : d === 3 ? -1 : 0);
  if (nx < 0 || nx >= W || ny < 0 || ny >= MINE_H) return -1;
  return cellIdx(nx, ny);
}

export function refreshField(s: GameState) { s.entryDist = entryField(s.mine); }

export function spawnItem(s: GameState, kind: ItemKind, cell: number) {
  const x = cellCX(cell) + (rnd(s.rng) - 0.5) * 0.5, y = cellCY(cell) + 0.25;
  s.items.push({ id: s.nextId++, kind, x, y, claim: -1, cell });
}

export function spawnMite(s: GameState, cell: number) {
  const d = UENEMIES.mite;
  const hp = Math.round(d.hp * (1 + 0.15 * (s.contract.tier - 1)));
  s.uenemies.push({ id: s.nextId++, kind: 'mite', x: cellCX(cell), y: cellCY(cell), hp, maxHp: hp, cd: 0.5, target: -1, path: [], ttl: 999, anim: 0, hurtT: 0 });
  s.ffx.push({ t: 'hatch', x: cellCX(cell), y: cellCY(cell) });
}

/** Destroy a block, dropping its contents. */
export function breakBlock(s: GameState, i: number, cause: 'dig' | 'blast' | 'lance' | 'hole' = 'dig') {
  const m = s.mine, k = m.kind[i];
  if (k === B.Empty || k === B.Bedrock) return;
  const def = BLOCKS[k];
  const fx = m.fx[i];
  if (def.drop && cause !== 'hole') {
    let n = rint(s.rng, def.dropN[0], def.dropN[1]);
    if (ORE_KINDS.has(k) && rchance(s.rng, doubleDropChance(s))) n += 1;
    for (let q = 0; q < n; q++) spawnItem(s, def.drop, i);
  }
  if (k === B.Hole && fx?.holeCoal) for (let q = 0; q < fx.holeCoal; q++) spawnItem(s, 'coal', i);
  m.kind[i] = B.Empty; m.hp[i] = 0; m.maxHp[i] = 0; m.tag[i] = 0;
  delete m.fx[i];
  if (k === B.Volatile) m.fx[i] = { fuse: 1.2 };
  if (k === B.Pod) burstPod(s, i);
  if (k === B.Mud) m.fx[i] = { puddle: 1 };
  s.stats.blocks++;
  s.ffx.push({ t: 'break', x: cellCX(i), y: cellCY(i), a: k, s: cause });
  refreshField(s);
}

export function damageBlock(s: GameState, i: number, dmg: number, cause: 'dig' | 'blast' | 'lance' = 'dig'): boolean {
  const m = s.mine;
  if (i < 0 || m.kind[i] === B.Empty || m.kind[i] === B.Bedrock) return false;
  if (m.kind[i] === B.Volatile && cause === 'blast') { breakBlock(s, i, cause); return true; }
  m.hp[i] -= dmg;
  if (m.hp[i] <= 0) { breakBlock(s, i, cause); return true; }
  return false;
}

export function explode(s: GameState, x: number, y: number, r: number, blockDmg: number, workerDmg: number, ueDmg: number, tagOnly = false) {
  const m = s.mine;
  s.ffx.push({ t: 'boom', x, y, a: r });
  for (let i = 0; i < N; i++) {
    if (m.kind[i] === B.Empty || m.kind[i] === B.Bedrock) continue;
    if (tagOnly && !m.tag[i] && m.kind[i] !== B.Volatile) continue;
    const d = dist(cellCX(i), cellCY(i), x, y);
    if (d <= r + 0.2) damageBlock(s, i, blockDmg, 'blast');
  }
  if (workerDmg > 0) for (const w of s.workers) if (w.below && dist(w.x, w.y, x, y) <= r) hurtWorker(s, w.id, workerDmg, 'blast');
  if (ueDmg > 0) for (const u of s.uenemies) if (dist(u.x, u.y, x, y) <= r + 0.3) { u.hp -= ueDmg; u.hurtT = 0.2; }
}

export function hurtWorker(s: GameState, id: number, dmg: number, cause: string) {
  const w = s.workers.find(q => q.id === id);
  if (!w || w.hp <= 0) return;
  w.hp -= dmg; w.hurtT = 0.3;
  s.ffx.push({ t: 'hurt', x: w.x, y: w.y, a: dmg, s: cause });
  if (w.hp <= 0) {
    s.ffx.push({ t: 'death', x: w.x, y: w.y, s: w.cls });
    for (const it of s.items) if (it.claim === w.id) it.claim = -1;
    // carried items drop where the worker fell
    const c = Math.max(0, Math.min(W * MINE_H - 1, Math.floor(w.x) + W * Math.floor(w.y - 2)));
    if (w.below) for (const k of w.carry) s.items.push({ id: s.nextId++, kind: k, x: w.x, y: w.y, claim: -1, cell: c });
    s.stats.workersLost++;
  }
}

function burstPod(s: GameState, i: number) {
  const x = cellCX(i), y = cellCY(i);
  s.clouds.push({ x, y, r: 2, t: 4, dps: 2 });
  s.ffx.push({ t: 'spore', x, y });
}

/** Per-tick hazard behaviour. */
export function tickHazards(s: GameState, dt: number) {
  const m = s.mine;
  const workersBelow = s.workers.filter(w => w.below && w.hp > 0);
  const tier = s.contract.tier;
  for (const key in m.fx) {
    const i = +key;
    const fx = m.fx[i];
    if (!fx) continue;
    const k = m.kind[i];
    if (fx.fuse !== undefined) {
      fx.fuse -= dt;
      if (fx.fuse <= 0) { delete m.fx[i]; explode(s, cellCX(i), cellCY(i), 1.6, 8, 7, 12); }
      continue;
    }
    if (fx.crack !== undefined) {
      fx.crack -= dt;
      if (fx.crack <= 0) {
        delete fx.crack;
        if (m.kind[i] !== B.Empty) { m.kind[i] = B.Empty; m.hp[i] = 0; m.tag[i] = 0; delete m.fx[i]; refreshField(s); }
        spawnMite(s, i);
      }
    }
    if (k === B.Hatch) {
      fx.jetT = (fx.jetT ?? 10) - dt;
      if (fx.jetT <= 0) {
        fx.jetT = 28 / (1 + 0.12 * (tier - 1));
        const near = workersBelow.some(w => dist(w.x, w.y, cellCX(i), cellCY(i)) <= 5.5);
        // one open crack per hatch at a time (two on tier 4+ occasionally)
        const open = Object.values(m.fx).filter(f => f.crack !== undefined && f.from === i).length;
        if (near && open === 0) {
          const n = tier >= 4 && rchance(s.rng, 0.3) ? 2 : 1;
          for (let q = 0; q < n; q++) crackFrom(s, i);
        }
      }
    } else if (k === B.Jet || k === B.CryoJet) {
      fx.jetT = (fx.jetT ?? 8) - dt;
      if (fx.jetT <= 0) {
        fx.jetT = 10 + rnd(s.rng) * 4;
        let c = i;
        const cells: number[] = [];
        for (let q = 0; q < 4; q++) { c = stepDir(c, fx.jetDir ?? 0); if (c < 0 || m.kind[c] !== B.Empty) break; cells.push(c); }
        s.ffx.push({ t: k === B.Jet ? 'jet' : 'cryojet', x: cellCX(i), y: cellCY(i), a: fx.jetDir, b: cells.length });
        for (const w of workersBelow) {
          const wc = cellIdxOfWorker(w.x, w.y);
          if (cells.includes(wc)) {
            if (k === B.Jet) hurtWorker(s, w.id, 6, 'jet');
            else { hurtWorker(s, w.id, 3, 'cryo'); w.frozen = 3; }
          }
        }
      }
    } else if (k === B.Hole) {
      fx.holeT = (fx.holeT ?? 18) - dt;
      if ((fx.holeTarget ?? -1) < 0 && fx.holeT <= 3) {
        const cands: number[] = [];
        for (let q = 0; q < N; q++) {
          if (q === i || m.kind[q] === B.Bedrock || protectedCell(q)) continue;
          if (m.kind[q] === B.Cache || m.kind[q] === B.Bonus || m.kind[q] === B.Charge || m.kind[q] === B.Hole) continue;
          const md = Math.abs(cellX(q) - cellX(i)) + Math.abs(cellY(q) - cellY(i));
          if (md >= 1 && md <= 2) cands.push(q);
        }
        const solids = cands.filter(q => m.kind[q] !== B.Empty);
        const pick = solids.length ? rpick(s.rng, solids) : cands.length ? rpick(s.rng, cands) : -1;
        fx.holeTarget = pick;
        if (pick >= 0) s.ffx.push({ t: 'rift', x: cellCX(i), y: cellCY(i), a: pick });
      }
      if (fx.holeT <= 0) {
        const q = fx.holeTarget ?? -1;
        fx.holeT = 18; fx.holeTarget = -1;
        if (q >= 0) {
          const qk = m.kind[q];
          if (ORE_KINDS.has(qk)) fx.holeCoal = (fx.holeCoal ?? 0) + 1;
          if (qk !== B.Empty) { m.kind[q] = B.Empty; m.hp[q] = 0; m.tag[q] = 0; delete m.fx[q]; refreshField(s); }
          for (let n = s.items.length - 1; n >= 0; n--) if (s.items[n].cell === q && s.items[n].claim < 0) { fx.holeCoal = (fx.holeCoal ?? 0) + 1; s.items.splice(n, 1); }
          for (const w of workersBelow) if (cellIdxOfWorker(w.x, w.y) === q) hurtWorker(s, w.id, 8, 'hole');
          s.ffx.push({ t: 'swallow', x: cellCX(q), y: cellCY(q) });
        }
      }
    } else if (k === B.IceHeart) {
      fx.heartT = (fx.heartT ?? 20) - dt;
      if (fx.heartT <= 0) {
        fx.heartT = 20;
        if (!today(s, 'thaw')) regrowIce(s, i);
      }
    } else if (k === B.Root) {
      fx.rootT = (fx.rootT ?? 25) - dt * (today(s, 'overgrowth') ? 2 : 1);
      if (fx.rootT <= 0) {
        fx.rootT = 25;
        const cands: number[] = [];
        for (let q = 0; q < N; q++) {
          if (!plain(m.kind[q]) || m.kind[q] === B.Empty) continue;
          if (dist(cellX(q), cellY(q), cellX(i), cellY(i)) > 2.3) continue;
          if ((m.fx[q]?.over ?? 0) >= 2) continue;
          cands.push(q);
        }
        if (cands.length) {
          const q = rpick(s.rng, cands);
          m.fx[q] = { ...(m.fx[q] ?? {}), over: (m.fx[q]?.over ?? 0) + 1 };
          m.hp[q] += 4; m.maxHp[q] += 4;
          s.ffx.push({ t: 'vine', x: cellCX(q), y: cellCY(q) });
        }
      }
    } else if (k === B.Pod) {
      if ((fx.podT ?? -1) < 0) {
        if (workersBelow.some(w => dist(w.x, w.y, cellCX(i), cellCY(i)) <= 2.5)) { fx.podT = today(s, 'bloom') ? 1 : 2; s.ffx.push({ t: 'swell', x: cellCX(i), y: cellCY(i) }); }
      } else {
        fx.podT = (fx.podT ?? 0) - dt;
        if (fx.podT <= 0) breakBlock(s, i, 'blast');
      }
    }
  }
  // spore clouds
  for (let c = s.clouds.length - 1; c >= 0; c--) {
    const cl = s.clouds[c];
    cl.t -= dt;
    for (const w of workersBelow) if (dist(w.x, w.y, cl.x, cl.y) <= cl.r) hurtWorkerQuiet(s, w.id, cl.dps * dt);
    if (cl.t <= 0) s.clouds.splice(c, 1);
  }
}

function hurtWorkerQuiet(s: GameState, id: number, dmg: number) {
  const w = s.workers.find(q => q.id === id);
  if (!w || w.hp <= 0) return;
  if (w.hp - dmg <= 0) { hurtWorker(s, id, dmg, 'spore'); return; }
  w.hp -= dmg; w.hurtT = Math.max(w.hurtT, 0.1);
}

export const cellIdxOfWorker = (x: number, y: number) => {
  const cx = Math.floor(x), cy = Math.floor(y - 2);
  if (cx < 0 || cx >= W || cy < 0 || cy >= MINE_H) return -1;
  return cy * W + cx;
};

function crackFrom(s: GameState, hatch: number) {
  const m = s.mine;
  // connected solid cells within radius 4 (flood through solid blocks)
  const seen = new Set<number>([hatch]);
  const q = [hatch];
  const cands: number[] = [];
  while (q.length) {
    const c = q.shift()!;
    for (const n of neighbours(c)) {
      if (seen.has(n)) continue;
      seen.add(n);
      if (m.kind[n] === B.Empty || m.kind[n] === B.Bedrock) continue;
      if (dist(cellX(n), cellY(n), cellX(hatch), cellY(hatch)) > 4) continue;
      q.push(n);
      if (plain(m.kind[n]) && m.fx[n]?.crack === undefined && !protectedCell(n)) cands.push(n);
    }
  }
  if (!cands.length) return;
  const c = rpick(s.rng, cands);
  m.fx[c] = { ...(m.fx[c] ?? {}), crack: 18, from: hatch };
  s.ffx.push({ t: 'crack', x: cellCX(c), y: cellCY(c) });
}

function regrowIce(s: GameState, heart: number) {
  const m = s.mine;
  const cands: number[] = [];
  for (let q = 0; q < N; q++) {
    if (m.kind[q] !== B.Empty || protectedCell(q) || m.fx[q]?.fuse !== undefined) continue;
    if (dist(cellX(q), cellY(q), cellX(heart), cellY(heart)) > 3.2) continue;
    if (!neighbours(q).some(n => m.kind[n] === B.Ice || n === heart)) continue;
    if (s.workers.some(w => w.below && w.hp > 0 && cellIdxOfWorker(w.x, w.y) === q)) continue;
    if (s.items.some(it => it.cell === q)) continue;
    if (s.uenemies.some(u => cellIdxOfWorker(u.x, u.y) === q)) continue;
    cands.push(q);
  }
  if (!cands.length) return;
  const q = rpick(s.rng, cands);
  m.kind[q] = B.Ice; m.hp[q] = 3; m.maxHp[q] = 3; delete m.fx[q];
  s.ffx.push({ t: 'freeze', x: cellCX(q), y: cellCY(q) });
  refreshField(s);
}

/** Cells covered by jets that are about to fire (shaking): workers step out of them. */
export function dangerCells(s: GameState): Set<number> {
  const out = new Set<number>();
  const m = s.mine;
  for (const key in m.fx) {
    const i = +key, fx = m.fx[i], k = m.kind[i];
    if ((k === B.Jet || k === B.CryoJet) && (fx.jetT ?? 9) < 1.6) {
      let c = i;
      for (let q = 0; q < 4; q++) { c = stepDir(c, fx.jetDir ?? 0); if (c < 0 || m.kind[c] !== B.Empty) break; out.add(c); }
    }
    if (fx.holeTarget !== undefined && fx.holeTarget >= 0 && (fx.holeT ?? 9) < 3) out.add(fx.holeTarget);
    if (k === B.Pod && (fx.podT ?? -1) >= 0) for (const n of neighbours(i)) out.add(n);
  }
  return out;
}

export const ENTRY_CELL = ENTRY;
