// Night: wave generation, swarm movement, bosses, turrets, projectiles and damage.
import { BOSS_OF, BOSS_WITHDRAW, ENEMIES } from './data/enemies';
import { TIERS } from './data/contracts';
import { BUILDINGS } from './data/buildings';
import { TURRETS, UPGRADE_TRACKS } from './data/turrets';
import { blastMult, hasMod, modCount, swarmDamageMult, swarmHpMult, today, turretRadiusMult } from './mods';
import { rnd, rpick, rweighted } from './rng';
import type { DmgType, Enemy, GameState, Projectile, Turret } from './types';
import { CORE_X, CORE_Y, dist, mountX, shaftTop, W } from './world';

const LINE_PER: Record<string, number> = { dmg: 0.1, rate: 0.08, range: 0.2, splash: 0.12, dur: 0.15 };

export function lineBonus(lines: string[], stars: number, key: string) {
  let b = 0;
  for (const l of lines) if (l === key) b += LINE_PER[key] * stars;
  return b;
}

export interface TStats { rate: number; dmg: number; range: number; splash: number; dur: number }

export function turretStats(s: GameState, t: Turret): TStats {
  const d = TURRETS[t.type];
  const up = (k: number) => 1 + UPGRADE_TRACKS[k].per * t.upg[k];
  let rate = d.rate * up(1) * (1 + lineBonus(t.lines, t.stars, 'rate'));
  let dmg = d.dmg * up(0) * (1 + lineBonus(t.lines, t.stars, 'dmg'));
  let range = d.range * up(2) * (1 + lineBonus(t.lines, t.stars, 'range')) * turretRadiusMult(s);
  let splash = (d.splash ?? 0) * (1 + lineBonus(t.lines, t.stars, 'splash')) * blastMult(s);
  const dur = 1 + lineBonus(t.lines, t.stars, 'dur');
  // utility amplifiers: up to 3 count; each building's bonus scales with its quality stars (+10% per star)
  const nb = (type: string) => s.buildings.filter(b => b.type === type).slice(0, 3).reduce((a, b) => a + 1 + 0.1 * b.stars, 0);
  if (d.family === 'kin') rate *= 1 + 0.12 * nb('kinamp') + 0.1 * modCount(s, 'tracer');
  if (d.family === 'exp') dmg *= 1 + 0.15 * nb('expamp') + 0.12 * modCount(s, 'shaped');
  if (d.family === 'nrg') dmg *= 1 + 0.12 * nb('nrgcap') + 0.12 * modCount(s, 'caps');
  if (s.setup.core === 'ion') {
    const m = s.mounts.find(q => q.id === t.mount);
    if (m && dist(mountX(m.side), m.y, CORE_X, CORE_Y) <= 9) rate *= 1.15;
  }
  if (t.overclock > 0) rate *= 4;
  return { rate, dmg, range, splash, dur };
}

// ---- waves ----------------------------------------------------------------------------------------
export function nightBudget(s: GameState) {
  const tier = s.contract.tier;
  let b = (6 + 1.6 * s.day + 10 * (s.stratum - 1)) * (1 + 0.25 * (tier - 1));
  if (today(s, 'surge')) b *= 1.3;
  if (s.contract.tutorial && s.day <= 1) b *= 0.5; // the guided contract's first night is a gentle one
  return b;
}

export function planWaves(s: GameState) {
  const r = s.rng;
  const budget = nightBudget(s);
  const roster = Object.values(ENEMIES).filter(e => e.weight > 0 && e.minStratum <= s.stratum && (!e.biome || e.biome === s.contract.biome));
  const groups = Math.min(4, 2 + Math.floor(s.stratum / 2));
  const out: { t: number; kind: string; x: number }[] = [];
  let spent = 0;
  let g = 0;
  const quiet = 4; // quiet seconds before the first group, time to place the free turrets
  while (spent < budget && out.length < 160) {
    const e = rweighted(r, roster, q => (q.weight > 1 ? 0.55 + 0.1 * s.stratum : 1.6) / Math.sqrt(q.weight));
    if (!e) break;
    const gi = g % groups;
    const t = quiet + gi * (9 + 3 * rnd(r)) + rnd(r) * 5;
    const x = 2 + rnd(r) * (W - 4);
    out.push({ t, kind: e.id, x });
    spent += e.weight;
    g++;
  }
  // boss
  if (s.boss && !s.boss.done && s.boss.night === s.day) {
    out.push({ t: quiet + 6, kind: s.boss.kind, x: W / 2 });
    s.ffx.push({ t: 'bossarrive', s: s.boss.kind });
  }
  out.sort((a, b) => a.t - b.t);
  s.waves = out;
  s.waveTotal = out.length;
}

export function spawnEnemy(s: GameState, kind: string, x: number, y?: number) {
  const d = ENEMIES[kind];
  const tier = TIERS[s.contract.tier - 1];
  const boss = !!d.mover && ['weaver', 'rimeclad', 'bloomrot'].includes(kind);
  const hpMult = (boss ? 1 + 0.35 * (s.stratum - 1) : 1 + 0.3 * (s.stratum - 1)) * tier.hp * swarmHpMult(s);
  const hp = Math.round(d.hp * hpMult);
  const sh = Math.round((d.shield ?? 0) * (boss ? hpMult : 1 + 0.15 * (s.stratum - 1)));
  const top = shaftTop(s);
  const wall = d.mover === 'crawl' ? (rnd(s.rng) < 0.5 ? -1 : 1) : 0;
  const e: Enemy = {
    id: s.nextId++, kind, x: wall ? (wall < 0 ? 1.35 : W - 1.35) : x, y: y ?? top - 1.5 - rnd(s.rng) * 2,
    vx: 0, vy: 0, hp, maxHp: hp, shield: sh, maxShield: sh, shieldCd: 0, armor: d.armor ?? 0, speed: d.speed * (0.9 + 0.2 * rnd(s.rng)) * (1 + 0.04 * (s.stratum - 1)),
    dmg: d.core, slowT: 0, slowF: 0, weakT: 0, burnT: 0, burnDps: 0, anim: rnd(s.rng) * 10, hurtT: 0, wall, state: 'descend', t: 0, boss, phase: 0, ex: 0, latched: 0, tc: 0,
  };
  s.enemies.push(e);
  return e;
}

// ---- damage ---------------------------------------------------------------------------------------
export function damageEnemy(s: GameState, e: Enemy, amount: number, dt: DmgType, src = -1) {
  if (e.hp <= 0 || e.state === 'gone') return 0;
  let a = amount * swarmDamageMult(s) * (e.weakT > 0 ? 1.6 : 1);
  if (e.shield > 0) {
    const m = dt === 'nrg' ? 2 : dt === 'exp' ? 1.5 : e.kind === 'rimeclad' ? 0.25 : 0.5;
    const eff = a * m;
    if (eff <= e.shield) { e.shield -= eff; e.shieldCd = 2.5; e.hurtT = 0.12; return eff; }
    a = (eff - e.shield) / m; e.shield = 0; e.shieldCd = 2.5;
    s.ffx.push({ t: 'shieldbreak', x: e.x, y: e.y });
  }
  if (e.armor > 0) {
    if (dt === 'kin') a = Math.max(a * 0.25, a - e.armor);
    else if (dt === 'exp') a = Math.max(a * 0.5, a - e.armor / 2);
  }
  e.hp -= a; e.hurtT = 0.12; e.shieldCd = 2.5;
  if (src >= 0) { const t = s.turrets.find(q => q.id === src); if (t) t.dmgDone += a; }
  if (e.hp <= 0) killEnemy(s, e, src);
  return a;
}

function killEnemy(s: GameState, e: Enemy, src: number) {
  e.hp = 0;
  s.stats.kills++;
  if (src >= 0) { const t = s.turrets.find(q => q.id === src); if (t) t.kills++; }
  s.ffx.push({ t: e.boss ? 'bossdie' : 'kill', x: e.x, y: e.y, s: e.kind });
  if (e.kind === 'broodsac') for (let i = 0; i < 4; i++) spawnEnemy(s, 'skitterling', e.x + (rnd(s.rng) - 0.5) * 1.2, e.y + (rnd(s.rng) - 0.5) * 1.2);
  if (today(s, 'surge') && !e.boss && rnd(s.rng) < 0.25) { s.res.iron++; s.ffx.push({ t: 'bounty', x: e.x, y: e.y }); }
  if (e.boss && s.boss) { s.boss.done = true; s.boss.killed = true; s.stats.bossKills++; s.retrieved.void += 2; }
}

function splash(s: GameState, x: number, y: number, r: number, dmg: number, src: number, dt: DmgType = 'exp') {
  for (const e of s.enemies) if (e.hp > 0 && dist(e.x, e.y, x, y) <= r + ENEMIES[e.kind].radius * 0.6) damageEnemy(s, e, dmg, dt, src);
  s.ffx.push({ t: 'blast', x, y, a: r });
}

// ---- turrets ---------------------------------------------------------------------------------------
function pickTarget(s: GameState, t: Turret, tx: number, ty: number, range: number, minRange = 0): Enemy | null {
  let best: Enemy | null = null, bv = Infinity;
  for (const e of s.enemies) {
    if (e.hp <= 0 || e.state === 'gone') continue;
    const d = dist(e.x, e.y, tx, ty);
    if (d > range + ENEMIES[e.kind].radius * 0.5 || d < minRange) continue;
    let v: number;
    switch (t.focus) {
      case 'core': v = dist(e.x, e.y, CORE_X, CORE_Y); break;
      case 'far': v = -dist(e.x, e.y, CORE_X, CORE_Y); break;
      case 'strong': v = -e.hp; break;
      case 'weak': v = e.hp; break;
      case 'near': v = d; break;
      default: v = -d;
    }
    if (v < bv) { bv = v; best = e; }
  }
  return best;
}

function fireProj(s: GameState, p: Partial<Projectile> & { kind: string; x: number; y: number }) {
  s.projectiles.push({ id: s.nextId++, vx: 0, vy: 0, dmg: 0, dt: 'kin', splash: 0, pierce: 0, target: -1, life: 3, from: -1, hit: [], tx: 0, ty: 0, arc: 0, ...p });
}

export function tickTurrets(s: GameState, dt: number) {
  const night = s.phase === 'night';
  for (const t of s.turrets) {
    if (t.overclock > 0) t.overclock -= dt;
    if (t.disabled > 0) { t.disabled -= dt; t.beamT = 0; continue; }
    if (t.overheat > 0) { t.overheat -= dt; t.spin = 0; continue; }
    const d = TURRETS[t.type];
    const m = s.mounts.find(q => q.id === t.mount);
    if (!m) continue;
    const tx = mountX(m.side), ty = m.y;
    const st = turretStats(s, t);
    t.cd -= dt;
    t.beamT = Math.max(0, t.beamT - dt);
    if (!night) { t.spin = Math.max(0, t.spin - dt); continue; }
    if (d.proj === 'wall') {
      // horizontal beam across the shaft at mount height
      t.beamT = 0.2;
      for (const e of s.enemies) if (e.hp > 0 && Math.abs(e.y - ty) < 0.55 + ENEMIES[e.kind].radius * 0.5) damageEnemy(s, e, st.dmg * st.rate * dt, 'nrg', t.id);
      if (t.cd <= 0) { t.cd = 0.5; s.ffx.push({ t: 'hum', id: t.id }); }
      continue;
    }
    if (d.proj === 'drone') continue; // drones are spawned at nightfall
    const e = pickTarget(s, t, tx, ty, st.range, d.minRange ?? 0);
    if (!e) { t.spin = Math.max(0, t.spin - dt * 0.5); t.target = -1; t.heat = Math.max(0, t.heat - dt); continue; }
    const want = Math.atan2(e.y - ty, e.x - tx);
    t.ang = want;
    if (t.type === 'minigun') {
      if (t.target === e.id) t.spin = Math.min(1, t.spin + dt / 4); else t.spin *= 0.6;
      t.heat += dt;
      if (t.heat >= 8) { t.overheat = 3; t.heat = 0; s.ffx.push({ t: 'overheat', x: tx, y: ty }); continue; }
    }
    t.target = e.id;
    if (d.proj === 'flame' || d.proj === 'beam' && (t.type === 'cryo')) {
      // continuous
      t.beamT = 0.12;
      if (d.proj === 'flame') {
        for (const q of s.enemies) {
          if (q.hp <= 0) continue;
          const dd = dist(q.x, q.y, tx, ty);
          if (dd > st.range) continue;
          const a = Math.atan2(q.y - ty, q.x - tx);
          let da = Math.abs(a - want); if (da > Math.PI) da = 2 * Math.PI - da;
          if (da < 0.38) { damageEnemy(s, q, st.dmg * st.rate * dt, 'exp', t.id); q.burnT = 3; q.burnDps = 4; }
        }
      } else {
        damageEnemy(s, e, st.dmg * st.rate * dt, 'nrg', t.id);
        if (e.kind !== 'rimeback') { e.slowT = 0.3; e.slowF = 0.5; }
      }
      if (t.cd <= 0) { t.cd = 0.25; s.ffx.push({ t: d.proj === 'flame' ? 'flame' : 'cryo', id: t.id }); }
      continue;
    }
    if (t.cd > 0) continue;
    const rate = t.type === 'minigun' ? st.rate * (1 + 4 * t.spin) : st.rate;
    t.cd = 1 / Math.max(0.05, rate);
    const lead = (sp: number) => { const tt = dist(e.x, e.y, tx, ty) / sp; return { x: e.x + e.vx * tt, y: e.y + e.vy * tt }; };
    switch (d.proj) {
      case 'bullet': {
        let dmg = st.dmg;
        if (t.type === 'auto' && e.hp > 0.6 * e.maxHp) dmg *= 2.5;
        const p = lead(d.speed!);
        const a = Math.atan2(p.y - ty, p.x - tx) + (rnd(s.rng) - 0.5) * 0.04;
        fireProj(s, { kind: 'bullet', x: tx, y: ty, vx: Math.cos(a) * d.speed!, vy: Math.sin(a) * d.speed!, dmg, dt: 'kin', from: t.id, life: st.range / d.speed! + 0.2, target: e.id });
        s.ffx.push({ t: t.type === 'minigun' ? 'mini' : t.type === 'auto' ? 'auto' : 'mg', id: t.id, x: tx, y: ty, a });
        break;
      }
      case 'pellet': {
        const base = Math.atan2(e.y - ty, e.x - tx);
        for (let k = 0; k < (d.pellets ?? 6); k++) {
          const a = base + (rnd(s.rng) - 0.5) * (d.spread ?? 0.4);
          fireProj(s, { kind: 'bullet', x: tx, y: ty, vx: Math.cos(a) * d.speed!, vy: Math.sin(a) * d.speed!, dmg: st.dmg, dt: 'kin', from: t.id, life: st.range / d.speed! });
        }
        s.ffx.push({ t: 'shotgun', id: t.id, x: tx, y: ty, a: base });
        break;
      }
      case 'rail': {
        const a = Math.atan2(e.y - ty, e.x - tx);
        const L = st.range;
        const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L;
        for (const q of s.enemies) {
          if (q.hp <= 0) continue;
          // distance from segment
          const vx = ex - tx, vy = ey - ty, wx = q.x - tx, wy = q.y - ty;
          const c = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
          if (dist(q.x, q.y, tx + vx * c, ty + vy * c) <= 0.45 + ENEMIES[q.kind].radius * 0.5) damageEnemy(s, q, st.dmg, 'kin', t.id);
        }
        s.ffx.push({ t: 'rail', id: t.id, x: tx, y: ty, a: ex, b: ey });
        break;
      }
      case 'rocket':
        fireProj(s, { kind: 'rocket', x: tx, y: ty, vx: Math.cos(want) * 4, vy: Math.sin(want) * 4, dmg: st.dmg, dt: 'exp', splash: st.splash, from: t.id, life: 4, target: e.id });
        s.ffx.push({ t: 'rocket', id: t.id, x: tx, y: ty });
        break;
      case 'shell': {
        const p = lead(d.speed!);
        const flight = Math.max(0.6, dist(p.x, p.y, tx, ty) / d.speed!);
        fireProj(s, { kind: 'shell', x: tx, y: ty, vx: tx, vy: ty, tx: p.x, ty: p.y, dmg: st.dmg, dt: 'exp', splash: st.splash, from: t.id, life: flight, arc: flight });
        s.ffx.push({ t: 'mortar', id: t.id, x: tx, y: ty });
        break;
      }
      case 'flak': {
        const p = lead(d.speed!);
        const a = Math.atan2(p.y - ty, p.x - tx);
        fireProj(s, { kind: 'flak', x: tx, y: ty, vx: Math.cos(a) * d.speed!, vy: Math.sin(a) * d.speed!, dmg: st.dmg, dt: 'exp', splash: st.splash, from: t.id, life: dist(p.x, p.y, tx, ty) / d.speed!, target: e.id });
        s.ffx.push({ t: 'flakfire', id: t.id, x: tx, y: ty });
        break;
      }
      case 'beam': {
        let dmg = st.dmg;
        if (t.type === 'laser' && e.hp < 0.5 * e.maxHp) dmg *= 3;
        damageEnemy(s, e, dmg, 'nrg', t.id);
        if (t.type === 'weak') e.weakT = 4 * st.dur;
        t.beamT = 0.18;
        s.ffx.push({ t: t.type === 'weak' ? 'weak' : 'laser', id: t.id, x: tx, y: ty, a: e.x, b: e.y });
        break;
      }
      case 'chain': {
        const hit: Enemy[] = [e];
        let cur = e;
        while (hit.length < 4) {
          let nx: Enemy | null = null, nd = 3.2;
          for (const q of s.enemies) if (q.hp > 0 && !hit.includes(q)) { const dd = dist(q.x, q.y, cur.x, cur.y); if (dd < nd) { nd = dd; nx = q; } }
          if (!nx) break;
          hit.push(nx); cur = nx;
        }
        const pts: number[] = [tx, ty];
        for (const q of hit) { damageEnemy(s, q, st.dmg, 'nrg', t.id); pts.push(q.x, q.y); }
        s.ffx.push({ t: 'chain', id: t.id, s: pts.map(v => v.toFixed(2)).join(',') });
        break;
      }
      case 'fly':
        fireProj(s, { kind: 'fly', x: tx, y: ty, vx: Math.cos(want) * 5, vy: Math.sin(want) * 5, dmg: st.dmg, dt: 'kin', from: t.id, life: 5, target: e.id });
        s.ffx.push({ t: 'flies', id: t.id, x: tx, y: ty });
        break;
    }
  }
}

export function spawnDrones(s: GameState) {
  for (const t of s.turrets) {
    if (t.type !== 'incub') continue;
    const m = s.mounts.find(q => q.id === t.mount);
    if (!m) continue;
    const st = turretStats(s, t);
    for (let k = 0; k < 2; k++) fireProj(s, { kind: 'drone', x: mountX(m.side), y: m.y, dmg: st.dmg, dt: 'kin', from: t.id, life: 999, tx: mountX(m.side), ty: m.y });
  }
}

export function tickProjectiles(s: GameState, dt: number) {
  for (let i = s.projectiles.length - 1; i >= 0; i--) {
    const p = s.projectiles[i];
    p.life -= dt;
    let dead = p.life <= 0;
    if (p.kind === 'bullet') {
      p.x += p.vx * dt; p.y += p.vy * dt;
      for (const e of s.enemies) {
        if (e.hp <= 0) continue;
        if (dist(e.x, e.y, p.x, p.y) <= ENEMIES[e.kind].radius + 0.15) { damageEnemy(s, e, p.dmg, p.dt, p.from); s.ffx.push({ t: 'hit', x: p.x, y: p.y }); dead = true; break; }
      }
    } else if (p.kind === 'rocket') {
      const e = s.enemies.find(q => q.id === p.target && q.hp > 0);
      if (e) { p.tx = e.x; p.ty = e.y; }
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy) || 1;
      const sp = Math.min(13, Math.hypot(p.vx, p.vy) + 18 * dt);
      p.vx += ((dx / d) * sp - p.vx) * Math.min(1, dt * 5); p.vy += ((dy / d) * sp - p.vy) * Math.min(1, dt * 5);
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (d < 0.5 || (e && dist(e.x, e.y, p.x, p.y) < ENEMIES[e.kind].radius + 0.2) || (!e && d < 0.8)) { splash(s, p.x, p.y, p.splash, p.dmg, p.from); dead = true; }
      else if (p.life <= 0) splash(s, p.x, p.y, p.splash, p.dmg, p.from);
    } else if (p.kind === 'shell') {
      const k = Math.min(1, Math.max(0, 1 - p.life / p.arc));
      p.x = p.vx + (p.tx - p.vx) * k;
      p.y = p.vy + (p.ty - p.vy) * k - 3 * Math.sin(Math.PI * k);
      if (p.life <= 0) { splash(s, p.tx, p.ty, p.splash, p.dmg, p.from); dead = true; }
    } else if (p.kind === 'flak') {
      p.x += p.vx * dt; p.y += p.vy * dt;
      const e = s.enemies.find(q => q.id === p.target && q.hp > 0);
      if ((e && dist(e.x, e.y, p.x, p.y) < 1) || p.life <= 0) {
        if (e) damageEnemy(s, e, p.dmg, 'exp', p.from);
        const near = s.enemies.filter(q => q.hp > 0 && dist(q.x, q.y, p.x, p.y) <= p.splash);
        for (let f = 0; f < 6 && near.length; f++) damageEnemy(s, rpick(s.rng, near), 4, 'exp', p.from);
        s.ffx.push({ t: 'flak', x: p.x, y: p.y, a: p.splash });
        dead = true;
      }
    } else if (p.kind === 'fly') {
      const e = s.enemies.find(q => q.id === p.target && q.hp > 0);
      if (!e) { dead = true; }
      else {
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
        p.x += (dx / d) * 7 * dt; p.y += (dy / d) * 7 * dt;
        if (d < 0.4) { if (e.latched < 3) e.latched++; e.ex = Math.max(e.ex, p.dmg); dead = true; }
      }
    } else if (p.kind === 'drone') {
      if (s.phase !== 'night') dead = true;
      else {
        let e = s.enemies.find(q => q.id === p.target && q.hp > 0);
        if (!e) {
          let bd = 12; e = undefined;
          for (const q of s.enemies) if (q.hp > 0) { const d = dist(q.x, q.y, CORE_X, CORE_Y); if (d < bd) { bd = d; e = q; } }
          p.target = e ? e.id : -1;
        }
        const gx = e ? e.x : p.tx, gy = e ? e.y : p.ty;
        const dx = gx - p.x, dy = gy - p.y, d = Math.hypot(dx, dy) || 1;
        p.x += (dx / d) * Math.min(d, 6 * dt); p.y += (dy / d) * Math.min(d, 6 * dt);
        p.arc -= dt;
        if (e && d < 0.6 && p.arc <= 0) { damageEnemy(s, e, p.dmg, 'kin', p.from); p.arc = 1; s.ffx.push({ t: 'hit', x: e.x, y: e.y }); }
      }
    }
    if (dead) s.projectiles.splice(i, 1);
  }
}

// ---- swarm movement ----------------------------------------------------------------------------------
export function tickEnemies(s: GameState, dt: number) {
  const top = shaftTop(s);
  for (const e of s.enemies) {
    if (e.hp <= 0) continue;
    const d = ENEMIES[e.kind];
    e.anim += dt * 10; e.t += dt;
    if (e.hurtT > 0) e.hurtT -= dt;
    if (e.weakT > 0) e.weakT -= dt;
    if (e.shieldCd > 0) e.shieldCd -= dt; else if (e.shield < e.maxShield) e.shield = Math.min(e.maxShield, e.shield + 8 * dt);
    if (e.burnT > 0) { e.burnT -= dt; damageEnemy(s, e, e.burnDps * dt, 'exp'); if (e.hp <= 0) continue; }
    if (e.latched > 0) { damageEnemy(s, e, e.latched * (e.ex || 3) * dt, 'kin'); if (e.hp <= 0) continue; }
    let slow = 1;
    if (e.slowT > 0) { e.slowT -= dt; slow = 1 - e.slowF; }
    for (const z of s.zones) if (z.kind === 'stasis' && dist(z.x, z.y, e.x, e.y) <= z.r && e.kind !== 'rimeback') slow = Math.min(slow, 0.4);
    let sp = e.speed * slow * (s.enrage ? 1.6 : 1);
    if (e.kind === 'mender') for (const q of s.enemies) if (q !== e && q.hp > 0 && dist(q.x, q.y, e.x, e.y) < 2.5) q.hp = Math.min(q.maxHp, q.hp + 6 * dt);
    let gx = CORE_X, gy = CORE_Y;
    if (e.boss) { bossTick(s, e, dt, sp, top); continue; }
    if (e.kind === 'spitter' && e.state === 'descend') {
      const near = s.turrets.find(t => { const m = s.mounts.find(q => q.id === t.mount); return m && Math.abs(m.y - e.y) < 0.8 && t.disabled <= 0; });
      if (near && e.phase < 2 && e.y > top + 1) { e.state = 'spit'; e.t = 0; e.ex = near.id; }
    }
    if (e.state === 'spit') {
      e.vx *= 0.9; e.vy *= 0.9;
      if (e.t > 1.2) {
        const t = s.turrets.find(q => q.id === e.ex);
        if (t) { t.disabled = 4; const m = s.mounts.find(q => q.id === t.mount); s.ffx.push({ t: 'spit', x: e.x, y: e.y, a: m ? mountX(m.side) : e.x, b: m?.y ?? e.y }); }
        e.phase++; e.t = 0;
        if (e.phase >= 2) { e.state = 'descend'; e.y += 0.8; }
      }
      continue;
    }
    if (d.mover === 'crawl' && e.wall !== 0 && e.y < CORE_Y - 2.5) {
      gx = e.wall < 0 ? 1.35 : W - 1.35; gy = e.y + 3;
      e.vx = 0; e.vy = sp;
      e.x += (gx - e.x) * Math.min(1, dt * 4); e.y += e.vy * dt;
    } else {
      const dx = gx - e.x, dy = gy - e.y, dd = Math.hypot(dx, dy) || 1;
      const wob = d.mover === 'float' ? 1.2 : d.mover === 'fly' ? 0.8 : 0;
      const lat = Math.sin(e.anim * 0.23 + e.id) * wob;
      e.vx = (dx / dd) * sp + lat * (dy / dd) * 0.8 * (dd > 3 ? 1 : 0.2);
      e.vy = (dy / dd) * sp;
      e.x += e.vx * dt; e.y += e.vy * dt;
      e.x = Math.max(1.3, Math.min(W - 1.3, e.x));
    }
    if (dist(e.x, e.y, CORE_X, CORE_Y) <= 1.3 + d.radius * 0.5) coreHit(s, e);
  }
  for (let i = s.enemies.length - 1; i >= 0; i--) if (s.enemies[i].hp <= 0 || s.enemies[i].state === 'gone') s.enemies.splice(i, 1);
}

function coreHit(s: GameState, e: Enemy) {
  s.core.hp -= e.dmg;
  s.stats.coreHits++;
  s.ffx.push({ t: 'corehit', x: e.x, y: e.y, a: e.dmg, s: e.kind });
  if (s.setup.core === 'plasma') for (const q of s.enemies) if (q !== e && q.hp > 0 && dist(q.x, q.y, CORE_X, CORE_Y) < 3) damageEnemy(s, q, 15, 'nrg');
  e.hp = 0; e.state = 'gone';
  checkCore(s);
}

export function checkCore(s: GameState) {
  if (s.core.hp > 0) return;
  if (s.setup.core === 'phoenix' && !s.core.phoenixUsed) {
    s.core.phoenixUsed = true; s.core.hp = Math.round(s.core.max * 0.35);
    s.ffx.push({ t: 'phoenix' });
    return;
  }
  s.core.hp = 0;
}

function bossTick(s: GameState, e: Enemy, dt: number, sp: number, top: number) {
  const b = s.boss!;
  const frac = e.hp / e.maxHp;
  if (e.state !== 'withdraw' && frac <= BOSS_WITHDRAW[e.kind]) {
    e.state = 'withdraw'; b.withdrew = true; s.stats.bossRepels++;
    s.ffx.push({ t: 'bosswithdraw', x: e.x, y: e.y, s: e.kind });
  }
  if (e.state === 'withdraw') {
    e.y -= 1.4 * dt * (s.enrage ? 1.5 : 1);
    if (e.y < top - 3) { e.state = 'gone'; e.hp = 0; b.done = true; }
    return;
  }
  const hover = top + (CORE_Y - top) * 0.55;
  if (e.kind === 'weaver') {
    e.x += (W / 2 - e.x) * Math.min(1, dt);
    e.y += (e.y < hover ? sp * 1.4 : sp * 0.35) * dt;
    e.ex -= dt;
    if (e.ex <= 0) { e.ex = 6; for (let k = 0; k < 2; k++) spawnEnemy(s, 'skitter', e.x + (k ? 1 : -1), e.y + 1); s.ffx.push({ t: 'eggs', x: e.x, y: e.y }); }
  } else if (e.kind === 'rimeclad') {
    e.x += (W - 2.6 - e.x) * Math.min(1, dt);
    e.y += (e.y < hover ? sp * 1.3 : sp * 0.4) * dt;
    e.ex -= dt;
    if (e.ex <= 0) {
      e.ex = 8;
      for (const t of s.turrets) { const m = s.mounts.find(q => q.id === t.mount); if (m && dist(mountX(m.side), m.y, e.x, e.y) <= 5) t.disabled = Math.max(t.disabled, 3); }
      s.ffx.push({ t: 'frostnova', x: e.x, y: e.y, a: 5 });
    }
  } else {
    e.x += (W / 2 + Math.sin(e.t * 0.5) * 3 - e.x) * Math.min(1, dt);
    e.y += (e.y < hover ? sp * 1.3 : sp * 0.35) * dt;
    const splits = [0.75, 0.5];
    if (e.phase < splits.length && frac <= splits[e.phase]) {
      e.phase++;
      for (let k = 0; k < 2; k++) spawnEnemy(s, 'sporeling', e.x + (k ? 1.5 : -1.5), e.y + 0.5);
      s.ffx.push({ t: 'split', x: e.x, y: e.y });
    }
  }
  if (e.y >= CORE_Y - 3.2) {
    e.y = CORE_Y - 3.2;
    s.core.hp -= e.dmg * dt;
    if (Math.floor(e.tc * 2) !== Math.floor((e.tc + dt) * 2)) s.ffx.push({ t: 'corehit', x: CORE_X, y: CORE_Y - 1, a: e.dmg, s: e.kind });
    e.tc += dt;
    checkCore(s);
    if (e.tc > 6) { e.state = 'withdraw'; b.withdrew = true; s.ffx.push({ t: 'bosswithdraw', x: e.x, y: e.y, s: e.kind }); }
  }
}

export function scheduleBoss(s: GameState) {
  const tier = TIERS[s.contract.tier - 1];
  if (!tier.bossFrom) return;
  const first = Math.max(2, s.contract.targetStrata - 1);
  if (s.stratum >= first && (s.stratum - first) % 2 === 0 && !s.bossSchedule.includes(s.stratum)) {
    s.bossSchedule.push(s.stratum);
    s.boss = { kind: BOSS_OF[s.contract.biome], night: s.day + 1, warned: false, done: false, killed: false, withdrew: false };
  }
}

export const buildingIsAbility = (t: string) => BUILDINGS[t]?.cat === 'day' || BUILDINGS[t]?.cat === 'night';
export const _h = hasMod;
