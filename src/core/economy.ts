// Costs, building, selling, recruiting, research, tagging and the coal gate.
import { BUILDINGS } from './data/buildings';
import { PLATFORMS } from './data/platforms';
import { LAB_TIERS } from './data/techs';
import { MAX_IDENTICAL, TURRETS, UPGRADE_COST } from './data/turrets';
import { coalQuota, hasMod, identicalCap, orderCap, perk, sellFee, today } from './mods';
import { B, type Costs, type GameState, type ItemKind, type WorkerClass } from './types';
import { makeWorker, workforceUsed } from './workers';
import { storeysAvailable } from './world';
import { rnd } from './rng';

export type Why = string | null;

export const zero = (): Costs => ({ iron: 0, crim: 0, larva: 0 });
export const canAfford = (s: GameState, c: Costs) => s.res.iron >= c.iron && s.res.crim >= c.crim && s.res.larva >= c.larva;
const pay = (s: GameState, c: Costs) => { s.res.iron -= c.iron; s.res.crim -= c.crim; s.res.larva -= c.larva; };
export const costText = (c: Costs) => [c.iron ? `${c.iron} iron` : '', c.crim ? `${c.crim} crimsite` : '', c.larva ? `${c.larva} larva` : ''].filter(Boolean).join(', ') || 'free';

export function deliver(s: GameState, k: ItemKind) {
  s.stats.delivered++;
  switch (k) {
    case 'iron': s.res.iron++; break;
    case 'crim': s.res.crim++; break;
    case 'coal': s.res.coal++; break;
    case 'ochre': case 'jade': case 'void': s.retrieved[k]++; break;
    case 'tech': s.draftQ.push('tech'); break;
    case 'bonus': s.draftQ.push('bonus'); break;
    case 'charge': s.charges++; s.ffx.push({ t: 'charge' }); break;
  }
}

// ---- buildings --------------------------------------------------------------------------------
export function buildingCost(s: GameState, type: string): Costs {
  const d = BUILDINGS[type];
  if (!d) return zero();
  if (s.freeBuildings > 0) return zero();
  const brood = s.setup.platform === 'brood';
  const larva = brood && (d.cat === 'day' || d.cat === 'night') ? Math.max(1, d.cost[2]) : brood ? d.cost[2] : 0;
  return { iron: d.cost[0], crim: d.cost[1], larva };
}

export function canBuild(s: GameState, type: string, padId: number): Why {
  const pad = s.pads.find(p => p.id === padId);
  if (!pad) return 'No pad';
  if (!pad.open) return 'Scaffold this pad first';
  if (pad.building >= 0) return 'Pad occupied';
  if (!s.unlocked[type]) return 'Technology not found yet';
  if (s.phase === 'launch' || s.phase === 'over') return 'Not now';
  const d = BUILDINGS[type];
  if (d.cat === 'day' || d.cat === 'night') {
    const slots = s.abilities[d.cat];
    if (!slots.some(a => a.type === type) && slots.length >= 3) return `All three ${d.cat === 'day' ? 'daytime' : 'nighttime'} ability slots are taken`;
  }
  if ((type === 'kinamp' || type === 'expamp' || type === 'nrgcap') && s.buildings.filter(b => b.type === type).length >= 3) return 'Maximum 3';
  if (!canAfford(s, buildingCost(s, type))) return 'Not enough resources';
  return null;
}

export function build(s: GameState, type: string, padId: number): Why {
  const why = canBuild(s, type, padId);
  if (why) return why;
  const cost = buildingCost(s, type);
  const wasFree = s.freeBuildings > 0;
  pay(s, cost);
  if (wasFree) s.freeBuildings--;
  const pad = s.pads.find(p => p.id === padId)!;
  const u = s.unlocked[type];
  const b = { id: s.nextId++, pad: padId, type, stars: u?.stars ?? 0, lines: u?.lines ?? [], t: 0, spent: cost, stock: 0 };
  s.buildings.push(b);
  pad.building = b.id;
  const d = BUILDINGS[type];
  if (d.cat === 'day' || d.cat === 'night') {
    const slots = s.abilities[d.cat];
    if (!slots.some(a => a.type === type)) slots.push({ type, cd: 0, active: 0 });
  }
  if (type === 'lab') s.stats.labs = Math.max(s.stats.labs, s.buildings.filter(q => q.type === 'lab').length);
  s.stats.built++;
  s.ffx.push({ t: 'build', x: pad.x, y: pad.y - 1, s: type });
  return null;
}

export function sellBuilding(s: GameState, id: number): Why {
  const b = s.buildings.find(q => q.id === id);
  if (!b) return 'Gone';
  const fee = sellFee(s);
  if (s.res.iron + b.spent.iron < fee) return `Need ${fee} iron for the fee`;
  s.res.iron += b.spent.iron - fee; s.res.crim += b.spent.crim; s.res.larva += b.spent.larva;
  s.buildings.splice(s.buildings.indexOf(b), 1);
  const pad = s.pads.find(p => p.building === id);
  if (pad) pad.building = -1;
  const d = BUILDINGS[b.type];
  if ((d.cat === 'day' || d.cat === 'night') && !s.buildings.some(q => q.type === b.type)) {
    s.abilities[d.cat] = s.abilities[d.cat].filter(a => a.type !== b.type);
  }
  s.stats.sold++;
  s.ffx.push({ t: 'sell', x: pad?.x ?? 8, y: (pad?.y ?? 0) - 1, a: b.spent.iron, b: b.spent.crim, s: `-${fee}` });
  return null;
}

export function refundOf(s: GameState, spent: Costs) {
  return { iron: spent.iron, crim: spent.crim, larva: spent.larva, fee: sellFee(s) };
}

export function padCost(s: GameState, storey: number) { return storey === 1 ? 2 : storey === 2 ? 3 : 0; }
export function openPad(s: GameState, padId: number): Why {
  const pad = s.pads.find(p => p.id === padId);
  if (!pad || pad.open) return 'Already open';
  if (pad.storey + 1 > storeysAvailable(s)) return `Storey ${pad.storey + 1} opens at ${pad.storey === 1 ? 100 : 150} m`;
  const c = padCost(s, pad.storey);
  if (s.res.iron < c) return 'Not enough iron';
  s.res.iron -= c; pad.open = true;
  s.ffx.push({ t: 'build', x: pad.x, y: pad.y - 1, s: 'scaffold' });
  return null;
}

// ---- turrets ----------------------------------------------------------------------------------
export function turretCost(s: GameState, type: string): Costs {
  const d = TURRETS[type];
  if (s.freeTurrets > 0) return zero();
  let iron = d.cost[0] - (hasMod(s, 'tprice') ? 1 : 0) + (hasMod(s, 'tax') ? 1 : 0);
  iron = Math.max(1, iron);
  const larva = s.setup.platform === 'brood' ? Math.max(1, d.cost[2]) : 0;
  return { iron, crim: d.cost[1], larva };
}

export function canPlaceTurret(s: GameState, type: string, mountId: number): Why {
  const m = s.mounts.find(q => q.id === mountId);
  if (!m) return 'No mount';
  if (m.turret >= 0) return 'Mount occupied';
  if (!s.unlocked[type]) return 'Technology not found yet';
  if (s.phase === 'launch' || s.phase === 'over') return 'Not now';
  const cap = identicalCap(s);
  if (s.turrets.filter(t => t.type === type).length >= cap) return `Limit reached: at most ${cap} identical turrets`;
  if (!canAfford(s, turretCost(s, type))) return 'Not enough resources';
  return null;
}

export function placeTurret(s: GameState, type: string, mountId: number): Why {
  const why = canPlaceTurret(s, type, mountId);
  if (why) return why;
  const cost = turretCost(s, type);
  const free = s.freeTurrets > 0;
  pay(s, cost);
  if (free) s.freeTurrets--;
  const m = s.mounts.find(q => q.id === mountId)!;
  const u = s.unlocked[type];
  const t = {
    id: s.nextId++, mount: mountId, type, stars: u?.stars ?? 0, lines: u?.lines ?? [], focus: 'core' as const, upg: [0, 0, 0] as [number, number, number],
    cd: 0.3, spin: 0, heat: 0, overheat: 0, ang: m.side < 0 ? 0 : Math.PI, target: -1, disabled: 0, overclock: 0, spent: cost, beamT: 0, kills: 0, dmgDone: 0,
  };
  s.turrets.push(t);
  m.turret = t.id;
  const counts: Record<string, number> = {};
  for (const q of s.turrets) counts[q.type] = (counts[q.type] ?? 0) + 1;
  s.stats.maxIdentical = Math.max(s.stats.maxIdentical, ...Object.values(counts));
  s.stats.built++;
  s.ffx.push({ t: 'build', x: m.side < 0 ? 1 : 16, y: m.y, s: type });
  return null;
}

export function upgradeCost(s: GameState, level: number): Costs {
  const [i, c] = UPGRADE_COST[level];
  if (perk(s, 'd6')) return { iron: Math.max(1, Math.floor(i * 0.75)), crim: Math.floor(c * 0.75), larva: 0 };
  return { iron: i, crim: c, larva: 0 };
}

export function upgradeTurret(s: GameState, id: number, track: number): Why {
  const t = s.turrets.find(q => q.id === id);
  if (!t) return 'Gone';
  const lvl = t.upg[track];
  if (lvl >= 2) return 'Maxed';
  const c = upgradeCost(s, lvl);
  if (!canAfford(s, c)) return 'Not enough resources';
  pay(s, c);
  t.upg[track]++;
  t.spent = { iron: t.spent.iron + c.iron, crim: t.spent.crim + c.crim, larva: t.spent.larva };
  const m = s.mounts.find(q => q.id === t.mount);
  s.ffx.push({ t: 'upgrade', x: m ? (m.side < 0 ? 1 : 16) : 8, y: m?.y ?? 0 });
  return null;
}

export function sellTurret(s: GameState, id: number): Why {
  const t = s.turrets.find(q => q.id === id);
  if (!t) return 'Gone';
  const fee = sellFee(s);
  if (s.res.iron + t.spent.iron < fee) return `Need ${fee} iron for the fee`;
  s.res.iron += t.spent.iron - fee; s.res.crim += t.spent.crim; s.res.larva += t.spent.larva;
  s.turrets.splice(s.turrets.indexOf(t), 1);
  const m = s.mounts.find(q => q.turret === id);
  if (m) m.turret = -1;
  s.stats.sold++;
  s.ffx.push({ t: 'sell', x: m ? (m.side < 0 ? 1.2 : 15.8) : 8, y: m?.y ?? 0, a: t.spent.iron, b: t.spent.crim, s: `-${fee}` });
  return null;
}

// ---- workforce ----------------------------------------------------------------------------------
export const recruitBuildings = (s: GameState) => s.buildings.filter(b => b.type === PLATFORMS[s.setup.platform].recruit).length;
export const workforceCap = (s: GameState) => PLATFORMS[s.setup.platform].baseCap + 3 * recruitBuildings(s);

export function recruitCost(s: GameState, cls: WorkerClass): Costs {
  const d = PLATFORMS[s.setup.platform].workers[cls];
  let iron = d.cost[0];
  if (perk(s, 'w8')) iron -= 1;
  if (s.setup.dept === 'hr') iron -= 1;
  if (hasMod(s, 'cheaprecruit')) iron -= 1;
  return { iron: Math.max(1, iron), crim: d.cost[1], larva: d.cost[2] };
}

export function canRecruit(s: GameState, cls: WorkerClass): Why {
  if (recruitBuildings(s) === 0) return `Build a ${PLATFORMS[s.setup.platform].recruit === 'hatchery' ? 'Hatchery' : PLATFORMS[s.setup.platform].recruit === 'meadhall' ? 'Mead Hall' : 'Barracks'} first`;
  const slot = PLATFORMS[s.setup.platform].workers[cls].slot;
  if (workforceUsed(s) + slot > workforceCap(s) + 1e-6) return 'Workforce limit reached';
  if (!canAfford(s, recruitCost(s, cls))) return 'Not enough resources';
  return null;
}

export function recruit(s: GameState, cls: WorkerClass): Why {
  const why = canRecruit(s, cls);
  if (why) return why;
  const c = recruitCost(s, cls);
  pay(s, c);
  s.recruitQ.push({ cls, t: s.setup.platform === 'brood' ? 10 : 8, paid: c });
  s.ffx.push({ t: 'queue' });
  return null;
}

export function cancelRecruit(s: GameState, index: number) {
  const q = s.recruitQ[index];
  if (!q) return;
  s.res.iron += q.paid.iron; s.res.crim += q.paid.crim; s.res.larva += q.paid.larva;
  s.recruitQ.splice(index, 1);
}

// ---- research -----------------------------------------------------------------------------------
export function labCount(s: GameState) { return s.buildings.filter(b => b.type === 'lab').length; }
/** Tier cost; a drafted laboratory's stars cut the iron price by 10% per star (rounded down, min 1). */
export function researchCost(s: GameState, row: string): [number, number] {
  const t = LAB_TIERS[Math.min(3, s.lab[row] ?? 0)];
  const stars = s.unlocked.lab?.stars ?? 0;
  return [Math.max(1, Math.floor(t.cost[0] * (1 - 0.1 * stars))), t.cost[1]];
}
export function canResearch(s: GameState, row: string): Why {
  const tier = s.lab[row] ?? 0;
  if (tier >= 4) return 'Complete';
  const t = LAB_TIERS[tier];
  if (labCount(s) < t.labs) return 'Build more laboratories';
  const [ci, cc] = researchCost(s, row);
  if (s.res.iron < ci || s.res.crim < cc) return 'Not enough resources';
  return null;
}
export function research(s: GameState, row: string): Why {
  const why = canResearch(s, row);
  if (why) return why;
  const [ci, cc] = researchCost(s, row);
  s.res.iron -= ci; s.res.crim -= cc;
  s.lab[row] = (s.lab[row] ?? 0) + 1;
  if (row === 'plate') for (const w of s.workers) { const r = w.hp / w.maxHp; w.maxHp = Math.round(w.maxHp * (1 + 0.25 * s.lab[row]) / (1 + 0.25 * (s.lab[row] - 1))); w.hp = Math.round(w.maxHp * r); }
  s.ffx.push({ t: 'research', s: row });
  return null;
}

// ---- tagging & drilling ---------------------------------------------------------------------------
export const tagCount = (s: GameState) => { let n = 0; for (let i = 0; i < s.mine.tag.length; i++) if (s.mine.tag[i] && s.mine.kind[i] !== B.Empty) n++; return n; };

export function setTag(s: GameState, cell: number, on: boolean): Why {
  const m = s.mine;
  if (cell < 0 || cell >= m.kind.length) return 'Out of bounds';
  const k = m.kind[cell];
  if (k === B.Empty || k === B.Bedrock) return 'Nothing to dig';
  if (on && !m.tag[cell]) {
    if (tagCount(s) >= orderCap(s)) return `Order limit: ${orderCap(s)} tagged blocks`;
    m.tag[cell] = 1;
  } else if (!on) m.tag[cell] = 0;
  return null;
}

export function canOrderDrill(s: GameState): Why {
  if (s.phase === 'landing') return s.res.coal >= coalQuota(s) ? null : 'Not enough coal';
  if (s.drillQueued) return 'Drilling next morning';
  if (s.phase !== 'day' && s.phase !== 'night') return 'Not now';
  if (s.res.coal < coalQuota(s)) return `Coal ${s.res.coal}/${coalQuota(s)}`;
  return null;
}

/** Order the drill. At 0 m (landing) the descent is immediate; afterwards it is queued for dawn and coal is spent now. */
export function orderDrill(s: GameState): Why {
  const why = canOrderDrill(s);
  if (why) return why;
  s.res.coal -= coalQuota(s);
  if (s.phase === 'landing') { s.phase = 'descent'; s.descentT = 0; s.ffx.push({ t: 'drill' }); return null; }
  s.drillQueued = true;
  s.ffx.push({ t: 'drillqueued' });
  return null;
}

export function tickEconomy(s: GameState, dt: number) {
  // recruitment
  const nRec = recruitBuildings(s);
  if (s.recruitQ.length && nRec > 0) {
    const q = s.recruitQ[0];
    const speed = (1 + 0.5 * (nRec - 1)) * hireSpeed(s);
    q.t -= dt * speed;
    if (q.t <= 0) {
      s.recruitQ.shift();
      const recB = s.buildings.find(b => b.type === PLATFORMS[s.setup.platform].recruit);
      const pad = recB ? s.pads.find(p => p.id === recB.pad) : null;
      const w = makeWorker(s, q.cls, pad ? pad.x : 8);
      if (s.setup.platform === 'brood') { w.incubate = 0.01; }
      s.workers.push(w);
      s.stats.recruits++;
      s.stats.maxWorkers = Math.max(s.stats.maxWorkers, s.workers.length);
      s.ffx.push({ t: 'recruit', x: w.x, y: w.y, s: q.cls });
    }
  }
  // production
  for (const b of s.buildings) {
    if (b.type === 'factory') {
      b.t += dt * (perk(s, 'o3') ? 1.2 : 1) * (1 + 0.1 * b.stars);
      if (b.t >= 35) {
        b.t -= 35; b.stock++;
        const crim = perk(s, 'o5') && b.stock % 3 === 0;
        if (crim) s.res.crim++; else s.res.iron++;
        const pad = s.pads.find(p => p.id === b.pad);
        s.ffx.push({ t: 'produce', x: pad?.x ?? 8, y: (pad?.y ?? 0) - 1.5, s: crim ? 'crim' : 'iron' });
      }
    } else if (b.type === 'hatchery') {
      const cap = 3 * s.buildings.filter(q => q.type === 'hatchery').length;
      if (s.res.larva < cap) {
        b.t += dt;
        if (b.t >= 20) { b.t -= 20; s.res.larva++; const pad = s.pads.find(p => p.id === b.pad); s.ffx.push({ t: 'produce', x: pad?.x ?? 8, y: (pad?.y ?? 0) - 1.5, s: 'larva' }); }
      } else b.t = 0;
    }
  }
}

export function hireSpeed(s: GameState) {
  let m = 1 + 0.4 * (s.mods.filter(x => x === 'shift').length) + 0.15 * (s.setup.dept === 'hr' ? s.deptLvl : 0) + (perk(s, 'w4') ? 0.25 : 0);
  m /= Math.pow(0.85, s.lab.hire ?? 0);
  return m;
}

export const supplyDrop = (s: GameState) => { s.res.iron += 5; s.ffx.push({ t: 'supply' }); };
export const _r = rnd; export const _t = today; export const _m = MAX_IDENTICAL; export const _q = coalQuota;
