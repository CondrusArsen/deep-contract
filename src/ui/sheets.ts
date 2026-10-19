// Bottom sheets and modals for the contract screen.
import { abilityCooldown, abilityCount } from '../core/abilities';
import { BUILDINGS, type BuildingCat } from '../core/data/buildings';
import { ENEMIES } from '../core/data/enemies';
import { CORES, PLATFORMS } from '../core/data/platforms';
import { ALL_MODS, LAB_ROWS, LAB_TIERS, TRAIT_MODS } from '../core/data/techs';
import { MAX_IDENTICAL, TURRETS, UPGRADE_TRACKS } from '../core/data/turrets';
import { ban, pick, reroll } from '../core/draft';
import {
  build, buildingCost, canAfford, canBuild, canPlaceTurret, canRecruit, canResearch, cancelRecruit, labCount, openPad, padCost, placeTurret,
  recruit, recruitCost, sellBuilding, sellTurret, turretCost, upgradeCost, upgradeTurret, workforceCap,
} from '../core/economy';
import { coalQuota, identicalCap, sellFee } from '../core/mods';
import { turretStats } from '../core/night';
import { saveRun } from '../core/save';
import { research, researchCost, setTag } from '../core/economy';
import { abort } from '../core/sim';
import { digField } from '../core/tutorial';
import { B, type Costs, type WorkerClass } from '../core/types';
import { workforceUsed, LVL_XP, MAX_LVL, lvlPower, lvlSpeed, workerLvl } from '../core/workers';
import { storeysAvailable } from '../core/world';
import { audio } from '../audio/audio';
import { clear, costEl, h, holdButton, icon, stars } from './dom';
import type { GameView } from './game';
import { blockWiki, enemyWiki, FAMILY_NAME, FOCUS, qualityLine, techDesc, techDescShort, techKind, techName, techStats, techStatsShort, uenemyWiki } from './text';

type Render = () => HTMLElement[];

export class Sheets {
  g: GameView;
  back: HTMLElement | null = null; sheet: HTMLElement | null = null; body: HTMLElement | null = null; head: HTMLElement | null = null;
  render: Render | null = null; sig = ''; tickT = 0;
  modal: HTMLElement | null = null; draftOpen = false;
  retBar: HTMLElement | null = null;
  sel: string | null = null; labSel: string | null = null;
  kind = '';
  constructor(g: GameView) { this.g = g; }

  get s() { return this.g.s; }
  isOpen() { return !!this.sheet || !!this.modal; }
  closeAll() {
    this.sheet?.remove(); this.back?.remove(); this.sheet = this.back = this.body = this.head = null; this.render = null;
    this.g.view.selMount = this.g.view.selPad = this.g.view.selTurret = this.g.view.selBuilding = -1; this.g.view.previewTurret = null;
    this.kind = '';
    this.updatePause();
  }
  updatePause() { this.g.menuPause = (!!this.sheet && this.g.app.profile.settings.pauseMenus) || (!!this.modal && !this.draftOpen); }

  open(kind: string, title: string | HTMLElement, sub: string, render: Render) {
    this.closeAll();
    this.kind = kind;
    // the backdrop closes the sheet only for a tap that started on it (never for a click left over from the tap
    // that opened the sheet)
    let armed = false;
    this.back = h('div', { class: 'sheet-back', on: { pointerdown: () => { armed = true; }, click: () => { if (!armed) return; this.closeAll(); audio.play('close'); } } });
    this.head = h('div', { class: 'sheet-head' });
    const x = h('button', { class: 'iconbtn x', 'aria-label': 'Close', on: { click: () => { this.closeAll(); audio.play('close'); } } }, icon('x'));
    this.head.append(h('div', { class: 'col', style: 'gap:2px' }, typeof title === 'string' ? h('h2', null, title) : title, sub ? h('span', { class: 'muted small' }, sub) : null), x);
    this.body = h('div', { class: 'sheet-body' });
    this.sheet = h('div', { class: 'sheet frame grid-bg', role: 'dialog', 'aria-label': typeof title === 'string' ? title : kind }, h('span', { class: 'c2' }), this.head, this.body);
    this.render = render;
    this.g.root.append(this.back, this.sheet);
    this.refresh();
    this.updatePause();
    audio.play('open');
  }
  refresh() { if (!this.body || !this.render) return; const st = this.body.scrollTop; clear(this.body); for (const n of this.render()) this.body.appendChild(n); this.body.scrollTop = st; this.sig = this.signature(); }
  signature() { const s = this.s; return `${s.res.iron}|${s.res.crim}|${s.res.larva}|${s.res.coal}|${s.phase}|${s.recruitQ.length}|${s.workers.length}|${s.freeBuildings}|${s.freeTurrets}|${s.buildings.length}|${s.turrets.length}|${this.sel}|${this.labSel}|${s.charges}|${Math.floor(s.core.hp)}`; }
  tick() {
    this.tickT++;
    if (this.draftOpen && !this.s.draft) this.closeDraft();
    if (this.sheet && this.tickT % 10 === 0 && this.signature() !== this.sig) this.refresh();
    if (this.sheet) for (const el of this.sheet.querySelectorAll<HTMLElement>('[data-live]')) { const f = this.live[el.dataset.live!]; if (f) f(el); }
  }
  live: Record<string, (el: HTMLElement) => void> = {};

  // ---- helpers ---------------------------------------------------------------------------------
  statGrid(rows: [string, string][]) { const g = h('div', { class: 'stat-grid' }); for (const [a, b] of rows) g.append(h('span', null, a), h('b', null, b)); return g; }
  techCard(id: string, cost: Costs, selected: boolean, onTap: () => void, badge?: string) {
    const u = this.s.unlocked[id];
    const afford = canAfford(this.s, cost);
    return h('button', { class: `opt ${selected ? 'sel' : ''} ${afford ? '' : 'dis'}`, on: { click: onTap } },
      this.g.app.techCanvas(id, 48), h('span', { class: 'nm' }, techName(id)), u?.stars ? stars(u.stars) : null,
      badge ? h('span', { class: 'tag good' }, badge) : costEl(cost, this.s.res));
  }
  sellButton(label: string, spent: Costs, onSell: () => string | null) {
    const fee = sellFee(this.s);
    const btn = h('button', { class: 'btn danger wide' }, icon('sell'), `HOLD TO ${label}`);
    holdButton(btn, 800, () => { const w = onSell(); if (w) { this.g.toast(w, true); audio.play('error'); } else this.closeAll(); }, () => true);
    return h('div', { class: 'col', style: 'gap:6px' },
      h('div', { class: 'row wrap small' }, h('span', { class: 'muted' }, '100% of resources returned:'), costEl(spent), h('span', { class: 'red' }, fee ? `fee −${fee} iron` : 'no fee')),
      btn);
  }

  // ---- pads & buildings -----------------------------------------------------------------------------
  openPad(padId: number) {
    const s = this.s;
    const pad = s.pads.find(p => p.id === padId)!;
    this.sel = null;
    if (!pad.open) {
      const avail = pad.storey + 1 <= storeysAvailable(s);
      this.open('pad', `Storey ${pad.storey + 1} pad`, 'Unassembled build pad', () => {
        const btn = h('button', { class: 'btn primary wide', disabled: !avail || s.res.iron < padCost(s, pad.storey), on: { click: () => { const w = openPad(s, padId); if (w) { this.g.toast(w, true); audio.play('error'); } else { audio.play('build'); this.openPad(padId); } } } }, `SCAFFOLD PAD · ${padCost(s, pad.storey)} IRON`);
        return [h('p', { class: 'small' }, avail ? 'Extra storeys stack more build pads above the deck. Scaffolding a pad costs iron once.' : `Storey ${pad.storey + 1} becomes available at ${pad.storey === 1 ? 100 : 150} m.`), btn];
      });
      this.g.view.selPad = padId;
      return;
    }
    this.open('pad', 'Build', s.freeBuildings > 0 ? `First ${s.freeBuildings === 2 ? 'two buildings are' : 'building is'} free` : 'Deck build pad', () => {
      const cats: [BuildingCat, string][] = [['general', 'General buildings'], ['util', 'Utility buildings'], ['day', 'Active daytime ability buildings'], ['night', 'Active nighttime ability buildings']];
      const out: HTMLElement[] = [];
      if (s.freeBuildings > 0) out.push(h('div', { class: 'note' }, s.freeBuildings === 2 ? 'First two buildings are free' : 'Next building is free'));
      const ids = Object.keys(s.unlocked).filter(t => BUILDINGS[t]);
      if (!this.sel && ids.length) this.sel = ids[0];
      for (const [cat, name] of cats) {
        const list = ids.filter(t => BUILDINGS[t].cat === cat);
        if (!list.length) continue;
        out.push(h('span', { class: 'muted small' }, name));
        const grid = h('div', { class: 'cat' });
        for (const t of list) grid.appendChild(this.techCard(t, buildingCost(s, t), this.sel === t, () => { this.sel = t; this.refresh(); audio.play('click'); }, s.freeBuildings > 0 ? 'FREE' : undefined));
        out.push(grid);
      }
      out.push(h('span', { class: 'muted small' }, 'Find more technologies in tech caches (glowing crates) down in the mine.'));
      if (this.sel) out.push(this.techDetail(this.sel, buildingCost(s, this.sel), canBuild(s, this.sel, padId), 'BUILD', () => build(s, this.sel!, padId)));
      return out;
    });
    this.g.view.selPad = padId; // after open(): it starts by closing the previous sheet, which clears the selection
  }

  techDetail(id: string, cost: Costs, why: string | null, verb: string, act: () => string | null) {
    const u = this.s.unlocked[id];
    const q = u && u.stars ? qualityLine(u.lines[0], u.stars, id) : '';
    const d = BUILDINGS[id];
    const n = d ? abilityCount(this.s, id) : 0;
    const btn = h('button', { class: 'btn primary wide', disabled: !!why, on: { click: () => { const w = act(); if (w) { this.g.toast(w, true); audio.play('error'); } else this.closeAll(); } } }, why ?? verb);
    return h('div', { class: 'frame card col tech-detail', style: 'gap:8px' },
      h('div', { class: 'row' }, this.g.app.techCanvas(id, 64), h('div', { class: 'col', style: 'gap:2px' }, h('span', { class: 'muted small' }, techKind(id)), h('h3', null, techName(id)), u?.stars ? stars(u.stars) : null)),
      h('p', { class: 'small', style: 'margin:0' }, techDesc(id)),
      techStats(id, this.s).length ? this.statGrid(techStats(id, this.s)) : null,
      d && (d.cat === 'day' || d.cat === 'night') && n ? h('span', { class: 'small muted' }, `You own ${n}. Another one stacks: ${d.stack}`) : null,
      q ? h('div', { class: 'note' }, q) : null,
      h('div', { class: 'row between' }, h('span', { class: 'muted small' }, 'Cost'), costEl(cost, this.s.res)),
      btn);
  }

  openBuilding(id: number) {
    const s = this.s;
    const b = s.buildings.find(q => q.id === id);
    if (!b) return;
    this.g.view.selBuilding = id;
    const pad = s.pads.find(p => p.id === b.pad);
    if (pad) this.g.view.selPad = pad.id;
    const d = BUILDINGS[b.type];
    const pl = PLATFORMS[s.setup.platform];
    this.open('building', h('div', { class: 'row' }, h('h2', null, d.name), b.stars ? stars(b.stars) : null), techKind(b.type), () => {
      const out: HTMLElement[] = [h('p', { class: 'small', style: 'margin:0' }, d.desc)];
      if (b.stars) out.push(h('div', { class: 'note' }, qualityLine(b.lines[0], b.stars, b.type)));
      if (b.type === pl.recruit) out.push(this.recruitPanel());
      if (b.type === 'lab') out.push(this.labPanel());
      if (b.type === 'factory') {
        const bar = h('div', { class: 'bar-xp', 'data-live': 'fac' }, h('i', { style: 'width:0' }));
        this.live.fac = el => { (el.firstChild as HTMLElement).style.width = `${(100 * b.t) / 35}%`; };
        out.push(h('span', { class: 'small muted' }, `Produced ${b.stock} so far. Next output:`), bar);
      }
      if (b.type === 'hatchery') out.push(h('span', { class: 'small' }, `Larvae in stock: ${s.res.larva} (cap ${3 * s.buildings.filter(q => q.type === 'hatchery').length}).`));
      if (d.cat === 'day' || d.cat === 'night') {
        out.push(this.statGrid([['Cooldown now', `${Math.round(abilityCooldown(s, b.type))} s`], ['Buildings of this type', String(abilityCount(s, b.type))], ['Stacking', d.stack ?? '—']]));
        out.push(h('span', { class: 'small muted' }, `Use it from the ${d.cat === 'day' ? 'left (daytime)' : 'right (nighttime)'} ability slots at the bottom of the screen.`));
      }
      out.push(this.sellButton('DESTROY', b.spent, () => sellBuilding(s, id)));
      return out;
    });
    this.g.view.selBuilding = id; // after open(), which clears the selection
  }

  recruitPanel() {
    const s = this.s;
    const pl = PLATFORMS[s.setup.platform];
    const wrap = h('div', { class: 'col' });
    const used = workforceUsed(s), cap = workforceCap(s);
    wrap.append(h('div', { class: 'row between' }, h('h3', null, s.setup.platform === 'brood' ? 'Hatch' : 'Recruit'), h('span', { class: `num ${used >= cap ? 'red' : ''}` }, `${s.setup.platform === 'brood' ? used.toFixed(1) : used}/${cap}`)));
    for (const c of ['miner', 'hauler', 'guard'] as WorkerClass[]) {
      const d = pl.workers[c];
      const why = canRecruit(s, c);
      const n = s.workers.filter(w => w.cls === c).length;
      wrap.appendChild(h('div', { class: 'row frame card', style: 'padding:6px 8px' },
        this.g.app.workerCanvas(c, 36),
        h('div', { class: 'col grow', style: 'gap:2px' }, h('span', { class: 't', style: 'font-size:18px;color:var(--amber)' }, `${d.name} · ${n}`), h('span', { class: 'small muted' }, `${d.desc}${d.slot !== 1 ? ` ${d.slot} workforce.` : ''}`), costEl(recruitCost(s, c), s.res)),
        h('button', { class: 'btn', disabled: !!why, title: why ?? '', 'aria-label': `Recruit ${d.name}`, on: { click: () => { const w = recruit(s, c); if (w) { this.g.toast(w, true); audio.play('error'); } this.refresh(); } } }, '+')));
    }
    if (s.recruitQ.length) {
      const q = h('div', { class: 'col', style: 'gap:4px' }, h('span', { class: 'small muted' }, 'Queue'));
      s.recruitQ.forEach((r, i) => {
        const bar = h('div', { class: 'bar-xp grow', 'data-live': i === 0 ? 'rq' : '' }, h('i', { style: 'width:0' }));
        q.appendChild(h('div', { class: 'row' }, h('span', { class: 'small', style: 'min-width:80px' }, pl.workers[r.cls].name), bar, h('button', { class: 'btn sm', 'aria-label': 'Cancel', on: { click: () => { cancelRecruit(s, i); this.refresh(); } } }, '×')));
      });
      this.live.rq = el => { const r = s.recruitQ[0]; if (r) (el.firstChild as HTMLElement).style.width = `${100 * (1 - r.t / (s.setup.platform === 'brood' ? 10 : 8))}%`; };
      wrap.appendChild(q);
    }
    wrap.appendChild(h('span', { class: 'small muted' }, `Each ${pl.recruit === 'hatchery' ? 'Hatchery' : pl.recruit === 'meadhall' ? 'Mead Hall' : 'Barracks'} raises the limit by 3 and speeds up hiring.`));
    return wrap;
  }

  labPanel() {
    const s = this.s;
    const labs = labCount(s);
    const grid = h('div', { class: 'lab-grid' });
    grid.appendChild(h('span', { class: 'small muted' }, `Labs: ${labs}`));
    for (let t = 0; t < 4; t++) grid.appendChild(h('span', { class: `small ${labs < LAB_TIERS[t].labs ? 'red' : 'muted'}`, style: 'text-align:center' }, `${LAB_TIERS[t].labs} lab${t ? 's' : ''}`));
    for (const row of LAB_ROWS) {
      const tier = s.lab[row.id] ?? 0;
      grid.appendChild(h('span', { class: 'small', style: 'align-self:center' }, row.name));
      for (let t = 0; t < 4; t++) {
        const done = tier > t, next = tier === t, locked = labs < LAB_TIERS[t].labs;
        const key = `${row.id}:${t}`;
        grid.appendChild(h('button', { class: `lab-cell ${done ? 'done' : ''} ${next ? 'next' : ''} ${locked && !done ? 'locked' : ''} ${this.labSel === key ? 'sel' : ''}`, on: { click: () => { this.labSel = key; this.refresh(); audio.play('click'); } } },
          done ? icon('check') : h('span', { class: 'row', style: 'gap:2px' }, h('span', { style: 'color:var(--iron)' }, String(LAB_TIERS[t].cost[0])), '·', h('span', { style: 'color:var(--crim)' }, String(LAB_TIERS[t].cost[1]))),
          h('span', null, ['I', 'II', 'III', 'IV'][t])));
      }
    }
    const out = h('div', { class: 'col' }, h('h3', null, 'Research'), grid);
    if (this.labSel) {
      const [rid, ts] = this.labSel.split(':'); const t = +ts;
      const row = LAB_ROWS.find(r => r.id === rid)!;
      const tier = s.lab[rid] ?? 0;
      const why = tier > t ? 'Researched' : tier < t ? 'Research the previous tier first' : canResearch(s, rid);
      out.appendChild(h('div', { class: 'frame card col' },
        h('h3', null, `${row.name} ${['I', 'II', 'III', 'IV'][t]}`), h('span', { class: 'small' }, row.per),
        h('div', { class: 'row between' }, h('span', { class: 'small muted' }, `Needs ${LAB_TIERS[t].labs} laboratories`), costEl(tier === t ? { iron: researchCost(s, rid)[0], crim: researchCost(s, rid)[1], larva: 0 } : { iron: LAB_TIERS[t].cost[0], crim: LAB_TIERS[t].cost[1], larva: 0 }, s.res)),
        why === 'Build more laboratories' ? h('div', { class: 'note red' }, 'Build more laboratories') : null,
        h('button', { class: 'btn primary wide', disabled: !!why, on: { click: () => { const w = canResearch(s, rid); if (w) { this.g.toast(w, true); return; } research(s, rid); this.refresh(); } } }, why ?? 'RESEARCH')));
    }
    return out;
  }

  // ---- mounts & turrets --------------------------------------------------------------------------------
  openMount(mountId: number) {
    const s = this.s;
    const ids = Object.keys(s.unlocked).filter(t => TURRETS[t]);
    this.sel = ids[0] ?? null;
    this.open('mount', 'Wall mount', 'Turrets fire automatically at enemies inside their radius', () => {
      const out: HTMLElement[] = [];
      if (s.freeTurrets > 0) out.push(h('div', { class: 'note' }, s.freeTurrets >= 2 ? `First ${s.freeTurrets === 3 ? 'three' : 'two'} turrets are free` : 'Next turret is free'));
      for (const fam of ['kin', 'exp', 'nrg'] as const) {
        const list = ids.filter(t => TURRETS[t].family === fam);
        if (!list.length) continue;
        out.push(h('span', { class: 'muted small' }, `${FAMILY_NAME[fam]} turrets`));
        const grid = h('div', { class: 'cat' });
        for (const t of list) grid.appendChild(this.techCard(t, turretCost(s, t), this.sel === t, () => { this.sel = t; this.g.view.previewTurret = t; this.refresh(); audio.play('click'); }, s.freeTurrets > 0 ? 'FREE' : undefined));
        out.push(grid);
      }
      if (this.sel) {
        const n = s.turrets.filter(t => t.type === this.sel).length;
        out.push(this.techDetail(this.sel, turretCost(s, this.sel), canPlaceTurret(s, this.sel, mountId), 'BUILD', () => placeTurret(s, this.sel!, mountId)));
        out.push(h('span', { class: 'small muted' }, `${n}/${identicalCap(s)} of this type built (max ${identicalCap(s)} identical).`));
      }
      return out;
    });
    // after open(): it starts by closing the previous sheet, which clears the selection and the preview
    this.g.view.selMount = mountId; this.g.view.previewTurret = this.sel;
  }

  openTurret(id: number) {
    const s = this.s;
    const t = s.turrets.find(q => q.id === id);
    if (!t) return;
    this.g.view.selTurret = id;
    const d = TURRETS[t.type];
    this.open('turret', h('div', { class: 'row' }, h('h2', null, d.name), t.stars ? stars(t.stars) : null), `${FAMILY_NAME[d.family]} turret`, () => {
      const st = turretStats(s, t);
      const rows: [string, string][] = [];
      if (d.proj === 'wall' || d.proj === 'flame' || t.type === 'cryo') rows.push(['Damage per second', (st.dmg * st.rate).toFixed(1)]);
      else if (d.proj !== 'drone') { rows.push(['Shooting speed (shots/s)', st.rate.toFixed(2)]); rows.push(['Damage', st.dmg.toFixed(1)]); }
      else rows.push(['Drone bite', st.dmg.toFixed(1)]);
      if (st.splash) rows.push(['Blast radius', st.splash.toFixed(1)]);
      rows.push(['Attack radius (blocks)', st.range.toFixed(1)]);
      rows.push(['Kills / damage dealt', `${t.kills} / ${Math.round(t.dmgDone)}`]);
      const out: HTMLElement[] = [h('p', { class: 'small', style: 'margin:0' }, d.desc), this.statGrid(rows)];
      if (t.stars) out.push(h('div', { class: 'note' }, qualityLine(t.lines[0], t.stars)));
      if (t.disabled > 0) out.push(h('div', { class: 'note red' }, `Disabled for ${Math.ceil(t.disabled)} s`));
      // focus
      const fwrap = h('div', { class: 'tabs' });
      for (const [k, lbl] of Object.entries(FOCUS)) fwrap.appendChild(h('button', { class: `tab ${t.focus === k ? 'on' : ''}`, style: 'font-size:15px', on: { click: () => { t.focus = k as typeof t.focus; this.refresh(); audio.play('toggle'); } } }, lbl));
      if (d.proj !== 'wall' && d.proj !== 'drone') out.push(h('span', { class: 'muted small' }, 'Focus priority'), fwrap);
      // upgrades
      const up = h('div', { class: 'col', style: 'gap:6px' }, h('span', { class: 'muted small' }, 'Upgrades'));
      UPGRADE_TRACKS.forEach((tr, i) => {
        const lvl = t.upg[i];
        const c = lvl < 2 ? upgradeCost(s, lvl) : null;
        const segs = h('span', { class: 'segs' }, h('i', { class: lvl > 0 ? 'on' : '' }), h('i', { class: lvl > 1 ? 'on' : '' }));
        up.appendChild(h('div', { class: 'row frame card', style: 'padding:6px 8px' },
          h('div', { class: 'col grow', style: 'gap:2px' }, h('span', { class: 't', style: 'font-size:18px;color:var(--amber)' }, tr.name), h('span', { class: 'small muted' }, tr.text), segs),
          c ? costEl(c, s.res) : h('span', { class: 'tag good' }, 'MAX'),
          c ? h('button', { class: 'btn', disabled: !canAfford(s, c), 'aria-label': `Upgrade ${tr.name}`, on: { click: () => { const w = upgradeTurret(s, id, i); if (w) this.g.toast(w, true); this.refresh(); } } }, '+') : null));
      });
      out.push(up);
      out.push(this.sellButton('SELL', t.spent, () => sellTurret(s, id)));
      return out;
    });
    this.g.view.selTurret = id; // after open(), which clears the selection
  }

  // ---- info sheets ---------------------------------------------------------------------------------
  openCore() {
    const s = this.s;
    this.open('core', 'Core', CORES[s.setup.core].name, () => {
      const pct = Math.round((100 * s.core.hp) / s.core.max);
      const target = s.contract.targetStrata * 50;
      return [
        this.statGrid([['Durability', `${Math.ceil(s.core.hp)} / ${s.core.max} (${pct}%)`], ['Depth', `${s.depth} / ${target} m`], ['Core charges', `${s.charges} / ${s.contract.charges}`], ['Coal quota', `${s.res.coal} / ${coalQuota(s)}`]]),
        h('p', { class: 'small' }, CORES[s.setup.core].desc + ' Attackers that reach the core destroy segments; at zero the contract is terminated.'),
        h('div', { class: 'note' }, s.depth < target ? `Reach ${target} m (${(target - s.depth) / 50} more descent${target - s.depth > 50 ? 's' : ''}).` : s.charges < s.contract.charges ? 'At target depth: dig out a cyan charge vein, haul it home, then hold LAUNCH by day.' : 'Ready: hold LAUNCH by day to detonate the core — or keep drilling for more reward.'),
        h('span', { class: 'muted small' }, 'Modifications'),
        this.modsList(),
      ];
    });
  }
  modsList() {
    const s = this.s;
    const list = h('div', { class: 'list' });
    const seen = new Map<string, number>();
    for (const m of s.mods) seen.set(m, (seen.get(m) ?? 0) + 1);
    for (const [m, n] of seen) {
      const d = ALL_MODS[m] ?? Object.values(TRAIT_MODS).find(t => t.id === m);
      if (!d) continue;
      list.appendChild(h('div', { class: 'frame card', style: 'padding:6px 8px' }, h('span', { class: `t ${d.bad ? 'red' : ''}`, style: 'font-size:18px;color:' + (d.bad ? 'var(--red)' : 'var(--amber)') }, `${d.bad ? '↓' : '↑'} ${d.name}${n > 1 ? ` ×${n}` : ''}`), h('div', { class: 'small' }, d.text)));
    }
    if (!list.children.length) list.appendChild(h('span', { class: 'small muted' }, 'No modifications.'));
    return list;
  }
  openCrew() {
    const s = this.s;
    const pl = PLATFORMS[s.setup.platform];
    this.open('crew', 'Crew', pl.name, () => {
      const below = s.workers.filter(w => w.below).length, stranded = s.workers.filter(w => w.stranded).length;
      const rows: [string, string][] = (['miner', 'hauler', 'guard'] as WorkerClass[]).map(c => [pl.workers[c].name, `${s.workers.filter(w => w.cls === c).length}`]);
      rows.push(['Workforce', `${workforceUsed(s)} / ${workforceCap(s)}`], ['Below ground', String(below)], ['Stranded', String(stranded)], ['Lost this contract', String(s.stats.workersLost)]);
      const out: HTMLElement[] = [this.statGrid(rows)];
      const haul = h('div', { class: 'tabs' });
      for (const [k, lbl] of [['auto', 'Auto'], ['coal', 'Coal'], ['iron', 'Iron'], ['crim', 'Crimsite'], ['min', 'Minerals']] as const) haul.appendChild(h('button', { class: `tab ${s.haul === k ? 'on' : ''}`, on: { click: () => { s.haul = k; this.g.cycleHaulLabel(); this.refresh(); audio.play('toggle'); } } }, lbl));
      out.push(h('span', { class: 'muted small' }, 'Hauling priority (Auto: crates and charges first, then coal until the quota is full)'), haul);
      const rb = s.buildings.find(b => b.type === pl.recruit);
      out.push(rb ? h('button', { class: 'btn primary wide', on: { click: () => this.openBuilding(rb.id) } }, pl.recruit === 'hatchery' ? 'OPEN HATCHERY' : pl.recruit === 'meadhall' ? 'OPEN MEAD HALL' : 'OPEN BARRACKS') : h('div', { class: 'note' }, `Build a ${pl.recruit === 'hatchery' ? 'Hatchery' : pl.recruit === 'meadhall' ? 'Mead Hall' : 'Barracks'} to recruit.`));
      out.push(h('p', { class: 'small muted' }, 'Workers are autonomous: miners dig tagged blocks, haulers carry loose ore home (counters rise on delivery), guards fight underground enemies and escort miners. At dusk everyone climbs home; anyone still below at night is hunted by Borers.'));
      return out;
    });
  }
  openWorker(id: number) {
    const w = this.s.workers.find(q => q.id === id);
    if (!w) return;
    const d = PLATFORMS[this.s.setup.platform].workers[w.cls];
    this.open('worker', d.name, w.stranded ? 'STRANDED — no path home' : w.below ? 'below ground' : 'aboard the platform', () => [
      this.statGrid([['HP', `${Math.ceil(w.hp)} / ${w.maxHp}`], ['Level', workerLvl(w) >= MAX_LVL ? `${MAX_LVL} (max)` : `${workerLvl(w)} · ${w.xp ?? 0}/${LVL_XP[workerLvl(w) + 1]} XP`],
        ['Level bonus', `+${Math.round((lvlSpeed(w) - 1) * 100)}% speed · +${Math.round((lvlPower(w) - 1) * 100)}% ${w.cls === 'guard' ? 'damage' : 'digging'}`],
        ['Task', w.goal || 'idle'], ['Carrying', w.carry.join(', ') || '—']]),
      h('p', { class: 'small' }, d.desc),
      h('p', { class: 'small muted' }, 'Workers level up from their work: blocks dug, loads hauled, enemies defeated.')]);
  }
  openEnemy(kind: string) {
    const d = enemyWiki(kind);
    if (!d) return;
    this.open('enemy', d.name, 'Swarm', () => [this.g.app.enemyCanvasEl(kind), this.statGrid([['Base HP', String(d.hp)], ['Speed (blocks/s)', String(d.speed)], ['Core damage', String(d.core)], ...(ENEMIES[kind].armor ? [['Armour', String(ENEMIES[kind].armor)] as [string, string]] : []), ...(ENEMIES[kind].shield ? [['Shield', String(ENEMIES[kind].shield)] as [string, string]] : [])]), h('p', { class: 'small' }, d.text), h('span', { class: 'small muted' }, 'HP grows with depth and difficulty tier.')]);
  }
  openUEnemy(kind: string) {
    const d = uenemyWiki(kind);
    if (!d) return;
    this.open('enemy', d.name, 'Underground', () => [this.statGrid([['Base HP', String(d.hp)], ['Bite', String(d.bite)]]), h('p', { class: 'small' }, d.text)]);
  }
  openBlock(cell: number) {
    const s = this.s;
    const k = s.mine.kind[cell];
    const d = blockWiki(k);
    if (!d) return;
    const fx = s.mine.fx[cell];
    this.open('block', d.name, k === B.Empty ? '' : `Durability ${Math.max(0, Math.ceil(s.mine.hp[cell]))} / ${s.mine.maxHp[cell]}`, () => [
      h('p', { class: 'small' }, d.text),
      fx?.crack !== undefined ? h('div', { class: 'note red' }, `Cracked: a Rockmite hatches in ${Math.ceil(fx.crack)} s unless this block is dug out.`) : null,
      fx?.over ? h('span', { class: 'small' }, `Overgrown ×${fx.over}: +${fx.over * 4} durability.`) : null,
      s.mine.tag[cell] && k !== B.Empty && digField(s).d[cell] > 0 ? h('div', { class: 'note' }, `The crew cannot get here yet: tag the ${digField(s).d[cell] === 1 ? 'block' : `${digField(s).d[cell]} blocks`} in the way too.`) : null,
      k !== B.Empty && k !== B.Bedrock ? h('button', { class: 'btn wide', on: { click: () => { const w = setTag(s, cell, !s.mine.tag[cell]); if (w) this.g.toast(w, true); this.closeAll(); } } }, s.mine.tag[cell] ? 'REMOVE DIG ORDER' : 'TAG FOR DIGGING') : null,
    ].filter(Boolean) as HTMLElement[]);
  }
  openTech(id: string) {
    this.open('tech', techName(id), techKind(id), () => [this.g.app.techCanvas(id, 64), h('p', { class: 'small' }, techDesc(id)), this.statGrid(techStats(id, this.s))]);
  }

  // ---- reticle -------------------------------------------------------------------------------------
  reticleBar(type: string) {
    this.closeReticle();
    const fire = h('button', { class: 'btn primary', on: { click: () => this.g.fireReticle() } }, type === 'overclock' ? 'TAP A TURRET' : 'FIRE');
    const cancel = h('button', { class: 'btn', on: { click: () => { this.g.view.reticle = null; this.closeReticle(); audio.play('close'); } } }, icon('x'), 'CANCEL');
    this.retBar = h('div', { class: 'reticle-bar' }, h('span', { class: 'tag', style: 'align-self:center;background:var(--panel)' }, BUILDINGS[type].name), fire, cancel);
    this.g.root.appendChild(this.retBar);
  }
  closeReticle() { this.retBar?.remove(); this.retBar = null; }

  // ---- draft -----------------------------------------------------------------------------------------
  openDraft() {
    const s = this.s;
    if (!s.draft) return;
    this.closeAll();
    this.draftOpen = true;
    const box = h('div', { class: 'box frame grid-bg draft-box', role: 'dialog', 'aria-label': 'Choose one technology' });
    const render = () => {
      clear(box);
      if (!s.draft) { this.closeDraft(); return; }
      const tech = s.draft.kind === 'tech';
      const cards = s.draft.cards;
      // every card has the same rows (header, quality, description, stats, pick) so the cards line up;
      // a row that no card in this draft uses is left out entirely
      const quals = cards.map(c => c.stars ? qualityLine(c.lines[0], c.stars, c.tech) : '');
      const stats = cards.map(c => techStatsShort(c.tech, s));
      const hasQ = quals.some(Boolean), hasStats = stats.some(r => r.length > 0);
      box.appendChild(h('span', { class: 'c2' }));
      box.appendChild(h('h2', null, tech ? 'CHOOSE ONE TECHNOLOGY' : 'CHOOSE ONE BONUS'));
      box.appendChild(h('p', { class: 'draft-lead' }, tech ? 'Unlocks a building or turret until the end of this contract.' : 'Changes the rules for the rest of this contract.'));
      const grid = h('div', { class: 'draft-cards', style: `--n:${cards.length};--rows:${3 + (hasQ ? 1 : 0) + (hasStats ? 1 : 0)}` });
      cards.forEach((c, i) => {
        const banBtn = tech ? h('button', { class: 'btn danger ban', disabled: s.bans <= 0, 'aria-label': `Ban ${techName(c.tech)}`, title: 'Ban: remove this technology from the pool for this contract', on: { click: () => { const w = ban(s, i, this.g.app.profile.blueprints); if (w) this.g.toast(w, true); render(); } } }, icon('ban')) : null;
        const statList = h('dl', { class: 'dstats' });
        for (const [a, b] of stats[i]) statList.appendChild(h('div', null, h('dt', null, a), h('dd', null, b)));
        grid.appendChild(h('div', { class: 'dcard' },
          h('div', { class: 'dhead' }, h('div', { class: 'dhead-in' }, tech ? this.g.app.techCanvas(c.tech, 48) : icon('gear', 'icon lg'),
            h('div', { class: 'dname' }, h('span', { class: 'kind' }, tech ? techKind(c.tech) : 'Bonus technology'), h('div', { class: 'dtitle' }, h('h3', null, techName(c.tech)), c.stars ? stars(c.stars) : null)),
            banBtn)),
          hasQ ? h('div', { class: `dq ${quals[i] ? '' : 'none'}` }, quals[i] || 'No quality bonus') : null,
          h('p', { class: 'ddesc' }, tech ? techDescShort(c.tech) : techDesc(c.tech)),
          hasStats ? statList : null,
          h('button', { class: 'btn primary dpick', 'aria-label': `Pick ${techName(c.tech)}`, on: { click: () => { pick(s, i); this.closeDraft(); } } }, 'PICK')));
      });
      box.appendChild(grid);
      box.appendChild(h('div', { class: 'row center wrap draft-foot' },
        h('button', { class: 'btn', disabled: s.rerolls <= 0, on: { click: () => { const w = reroll(s, this.g.app.profile.blueprints); if (w) this.g.toast(w, true); render(); } } }, icon('reroll'), `REROLL · LEFT: ${s.rerolls}`),
        tech ? h('span', { class: 'small muted' }, `Bans left: ${s.bans}`) : null));
    };
    render();
    this.modal = h('div', { class: 'modal' }, box);
    this.g.root.appendChild(this.modal);
    audio.play('draft');
  }
  closeDraft() { this.modal?.remove(); this.modal = null; this.draftOpen = false; this.updatePause(); }

  // ---- pause & manual ---------------------------------------------------------------------------------
  openPause() {
    this.closeAll();
    const s = this.s;
    saveRun(s);
    const box = h('div', { class: 'box frame grid-bg', role: 'dialog', 'aria-label': 'Paused' });
    const close = () => { this.modal?.remove(); this.modal = null; this.updatePause(); audio.play('close'); };
    const restart = h('button', { class: 'btn wide' }, 'HOLD: QUICK RESTART');
    holdButton(restart, 900, () => { close(); this.g.app.quickRestart(s); });
    const abortB = h('button', { class: 'btn danger wide' }, 'HOLD: ABORT MISSION');
    holdButton(abortB, 1200, () => { close(); abort(s); });
    box.append(h('span', { class: 'c2' }), h('h2', null, 'PAUSED'),
      h('span', { class: 'small muted' }, `${s.contract.planet} · Tier ${s.contract.tier} · Day ${s.day} · ${s.depth}/${s.contract.targetStrata * 50} m`),
      h('button', { class: 'btn primary wide', on: { click: close } }, 'RESUME'),
      h('button', { class: 'btn wide', on: { click: () => { close(); this.openManual('mods'); } } }, 'MODIFICATIONS'),
      h('button', { class: 'btn wide', on: { click: () => { close(); this.openManual(); } } }, 'MANUAL & WIKI'),
      h('button', { class: 'btn wide', on: { click: () => { close(); this.g.app.openSettings(() => this.openPause()); } } }, 'SETTINGS'),
      restart, abortB,
      h('button', { class: 'btn wide', on: { click: () => { saveRun(s); close(); this.g.app.toHq(); } } }, 'SAVE & QUIT TO HQ'),
      h('span', { class: 'small muted' }, 'The contract is saved at every dawn, when you pause and when the app goes to the background.'));
    this.modal = h('div', { class: 'modal' }, box);
    this.g.root.appendChild(this.modal);
    this.g.menuPause = true;
    audio.play('open');
  }

  openManual(tab = 'play') {
    const s = this.s;
    const tabs: [string, string][] = [['play', 'How to play'], ['mods', 'Modifications'], ['blocks', 'Blocks'], ['enemies', 'Enemies'], ['turrets', 'Turrets'], ['buildings', 'Buildings'], ['controls', 'Controls']];
    let cur = tab;
    this.open('manual', 'Manual', 'Long-press anything in the world for its entry', () => {
      const bar = h('div', { class: 'tabs' });
      for (const [id, n] of tabs) bar.appendChild(h('button', { class: `tab ${cur === id ? 'on' : ''}`, on: { click: () => { cur = id; this.refresh(); } } }, n));
      const out: HTMLElement[] = [bar];
      const entry = (title: string, text: string, extra?: HTMLElement | null) => h('div', { class: 'wiki-entry' }, h('h3', null, title), h('div', { class: 'small' }, text), extra ?? null);
      if (cur === 'play') {
        out.push(
          entry('The loop', 'By day, tag blocks (DIG) for miners; haulers carry what they dig to the platform. Build on deck pads, recruit, research. At dusk the crew climbs home. At night the swarm descends the shaft toward the core; turrets on the wall mounts fire automatically. The night ends the moment the last attacker dies.'),
          entry('The coal gate', `Every 50 m descent costs ${coalQuota(s)} coal from the current stratum. Hold DRILL when the quota is full: the coal is spent at once and the platform descends at the next dawn (the game saves).`),
          entry('Technologies', 'Tech caches (glowing crates) found in the mine open a draft: pick one of the cards; it unlocks that structure for this contract. Reroll and ban (✕) are limited. Stars add a quality bonus. Gold caches offer bonus modifiers.'),
          entry('Launch', 'At the target depth, charge veins (cyan crystals) appear. Haul the required number home, then hold LAUNCH by day to detonate the core and finish the contract. You can keep drilling deeper for more XP and minerals — at the price of harder nights.'),
          entry('Defeat', 'If the core reaches zero the contract is terminated: you keep half of the minerals retrieved so far and 40% of the difficulty XP.'),
          entry('Refunds', 'Anything can be sold for a full refund minus a 1-iron fee, so rebuild the defence around each night\'s threat. At most 5 identical turrets.'));
      } else if (cur === 'mods') out.push(this.modsList());
      else if (cur === 'blocks') {
        for (const k of [B.Dirt, B.Rock, B.Hard, B.Iron, B.Crim, B.Coal, B.Ochre, B.Jade, B.Void, B.Cache, B.Bonus, B.Charge, B.Hatch, B.Hole, B.Jet, B.Volatile, B.Ice, B.IceHeart, B.CryoJet, B.Root, B.Pod, B.Mud, B.Bedrock]) {
          const d = blockWiki(k); if (d) out.push(entry(d.name, `${d.text}${d.hp && d.hp < 999 ? ` Durability ${d.hp}.` : ''}`));
        }
      } else if (cur === 'enemies') {
        for (const k of Object.keys(ENEMIES)) { const d = enemyWiki(k)!; out.push(entry(d.name, `${d.text} Base HP ${d.hp}, speed ${d.speed}, core damage ${d.core}.`)); }
        for (const k of ['mite', 'borer']) { const d = uenemyWiki(k)!; out.push(entry(d.name, `${d.text} HP ${d.hp}, bite ${d.bite}.`)); }
      } else if (cur === 'turrets') {
        for (const k of Object.keys(TURRETS)) out.push(entry(`${TURRETS[k].name} — ${FAMILY_NAME[TURRETS[k].family]}${s.unlocked[k] ? ' (available)' : ''}`, TURRETS[k].desc, this.statGrid(techStats(k, s))));
        out.push(h('span', { class: 'small muted' }, `Max ${MAX_IDENTICAL} identical turrets. Kinetic damage is reduced by armour and halved against shields; explosives splash and halve armour; energy ignores armour and doubles against shields.`));
      } else if (cur === 'buildings') {
        for (const k of Object.keys(BUILDINGS)) out.push(entry(`${BUILDINGS[k].name}${s.unlocked[k] ? ' (available)' : ''}`, BUILDINGS[k].desc + (BUILDINGS[k].stack ? ` ${BUILDINGS[k].stack}` : '')));
      } else {
        out.push(entry('Touch', 'Tap to select · long-press anything for details · drag to pan · pinch to zoom · in DIG mode tap or drag over blocks to tag/untag · commits (drill, launch, sell) need a hold.'),
          entry('Keyboard & mouse', 'Mouse wheel zooms, right-click inspects, drag pans. Space pause · X speed · D dig mode · Q recall · H haul priority · Enter (hold) drill · G (hold) launch · 1-3 day / 4-6 night abilities · Z/C/V shaft/deck/mine · WASD/arrows pan · +/− zoom · Esc back/pause.'));
      }
      return out;
    });
  }
}
