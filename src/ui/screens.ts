// Out-of-contract screens: title, HQ, contract board & preset, upgrades, archive, settings, credits, result.
import { BIOME_NAME, TIERS } from '../core/data/contracts';
import { BOSS_OF, ENEMIES } from '../core/data/enemies';
import { BRANCHES, META, META_BY_ID, xpForLevel } from '../core/data/meta';
import { CORES, DEPTS, deptLevel, PLATFORMS } from '../core/data/platforms';
import { ALL_MODS, BLUEPRINTS, BONUS_MODS } from '../core/data/techs';
import { board as boardOf, buy, canBuy, coresOf, DEPT_IDS, deptsAvailable, divLevel, platformSlots, platformsOf, tierUnlocked, type ApplyOut } from '../core/profile';
import { hasRun, loadRun, storageOk, wipeSaves } from '../core/save';
import { flushSaves, track } from '../platform/bloomplay';
import type { CoreId, DeptId, GameState, PlatformId, Setup } from '../core/types';
import { audio } from '../audio/audio';
import { CREDITS_HTML } from './credits';
import { h, holdButton, icon, res, stars } from './dom';
import type { App } from './app';
import { techDesc, techKind, techName } from './text';
import { ACHIEVEMENTS, type AchDef } from '../core/data/achievements';

const scr = (...kids: (HTMLElement | null | false)[]) => h('div', { class: 'screen' }, h('div', { class: 'inner' }, ...kids));
const back = (fn: () => void, label = 'BACK') => h('button', { class: 'btn', on: { click: () => { audio.play('close'); fn(); } } }, `← ${label}`);
const minerals = (m: { ochre: number; jade: number; void: number }, need?: [number, number, number]) => h('span', { class: 'row', style: 'gap:10px' },
  res('ochre', need ? need[0] : m.ochre, need && m.ochre < need[0] ? 'red' : ''), res('jade', need ? need[1] : m.jade, need && m.jade < need[1] ? 'red' : ''), res('void', need ? need[2] : m.void, need && m.void < need[2] ? 'red' : ''));
/** price on an upgrade-tree node: only the minerals it actually costs, wrapped to fit the node */
const nodeCost = (m: { ochre: number; jade: number; void: number }, need: [number, number, number]) => h('span', { class: 'node-cost' },
  ...(['ochre', 'jade', 'void'] as const).map((k, i) => need[i] ? res(k, need[i], m[k] < need[i] ? 'red' : '') : null));

function divBar(app: App) {
  const p = app.profile, lvl = divLevel(p);
  const a = xpForLevel(lvl), b = xpForLevel(lvl + 1);
  return h('div', { class: 'frame card col', style: 'gap:6px' },
    h('div', { class: 'row between wrap' }, h('span', { class: 'row' }, h('span', { class: 'note', style: 'padding:2px 8px' }, String(lvl)), h('span', { class: 't', style: 'font-size:22px;color:var(--amber)' }, 'DIVISION LVL')), minerals(p.minerals)),
    h('div', { class: 'bar-xp' }, h('i', { style: `width:${Math.min(100, ((p.xp - a) / (b - a)) * 100)}%` })),
    h('span', { class: 'small muted' }, `${p.xp - a} / ${b - a} XP to level ${lvl + 1}`));
}

export function title(app: App) {
  const run = loadRun();
  return scr(
    h('div', { class: 'title-hero' }, h('div', { class: 'sub' }, 'CONTRACT DIVISION'), h('h1', null, 'DEEP CONTRACT'), h('div', { class: 'sub' }, 'PLATFORM MANAGER ONBOARDING')),
    h('p', { class: 'small', style: 'text-align:center;max-width:520px;margin:0 auto' }, 'Dig by day, defend by night. Push the crew deeper for coal, iron and crimsite — then get them home before the swarm comes down the shaft. Drill to target depth and blow up the planet\'s core. Corporate thanks you in advance.'),
    run ? h('button', { class: 'btn primary wide', on: { click: () => app.continueRun() } }, `CONTINUE · ${run.contract.planet} · DAY ${run.day} · ${run.depth} M`) : null,
    // a new player goes straight into the guided first contract
    !run && app.profile.tutorial === 'contract' ? h('button', { class: 'btn primary wide', style: 'min-height:64px;font-size:26px', on: { click: () => app.startTutorial() } }, 'START FIRST CONTRACT') : null,
    h('button', { class: `btn ${run || app.profile.tutorial === 'contract' ? '' : 'primary'} wide`, on: { click: () => app.toHq() } }, 'DIVISION HQ'),
    h('div', { class: 'row' }, h('button', { class: 'btn grow', on: { click: () => app.openSettings(() => app.toTitle()) } }, 'SETTINGS'), h('button', { class: 'btn grow', on: { click: () => app.toCredits(() => app.toTitle()) } }, 'CREDITS')),
    !storageOk ? h('div', { class: 'note red' }, 'Browser storage is blocked: progress will not survive a reload.') : null,
    h('p', { class: 'tap-note' }, 'Sound starts after the first tap or key press. Unofficial fan design study; original art, licensed assets credited in CREDITS.'),
  );
}

export function hq(app: App) {
  const p = app.profile;
  const run = hasRun();
  const last = p.history[0];
  return scr(
    h('div', { class: 'row between' }, h('h2', null, 'DIVISION HQ'), back(() => app.toTitle(), 'TITLE')),
    divBar(app),
    run ? h('button', { class: 'btn primary wide', on: { click: () => app.continueRun() } }, 'CONTINUE CONTRACT') : null,
    h('button', { class: `btn ${run ? '' : 'primary'} wide`, style: 'min-height:64px;font-size:28px', on: { click: () => app.toBoard() } }, 'PLAY'),
    // after the guided contract: one last step — spend the minerals on a first upgrade
    p.tutorial === 'upgrade' ? h('div', { class: 'note' }, 'You earned minerals! Open UPGRADES and buy your first upgrade.') : null,
    h('div', { class: 'row' },
      h('button', { class: `btn grow ${p.tutorial === 'upgrade' ? 'tut-pulse' : ''}`, on: { click: () => app.toUpgrades() } }, icon('gear'), 'UPGRADES'),
      h('button', { class: 'btn grow', on: { click: () => app.toArchive() } }, 'ARCHIVE')),
    h('div', { class: 'row' }, h('button', { class: 'btn grow', on: { click: () => app.openSettings(() => app.toHq()) } }, 'SETTINGS'), h('button', { class: 'btn grow', on: { click: () => app.toCredits(() => app.toHq()) } }, 'CREDITS')),
    last ? h('div', { class: 'frame card small' }, h('b', null, 'Last contract: '), `${last.planet} (tier ${last.tier}) — ${last.success ? 'SUCCESS' : 'TERMINATED'} at ${last.depth} m on day ${last.days}, core ${last.core}%, +${last.xp} XP`) : h('div', { class: 'frame card small' }, 'Welcome, Platform Manager. Start with a tier 1 contract: two strata to target depth, no boss.'),
    h('div', { class: 'frame card small col' }, h('b', null, 'Division memo'),
      h('span', null, `Contracts: ${p.contracts} · Successes: ${p.wins} · Deepest: ${p.deepest} m · Swarm eliminated: ${p.kills}`),
      h('span', null, `Blueprints unlocked: ${p.blueprints.length}/${BLUEPRINTS.length} (earned from qualifications)`)),
  );
}

// ---- contract board ----------------------------------------------------------------------------------
export function board(app: App) {
  const p = app.profile;
  let tier = Math.min(p.tierMax, TIERS.length);
  while (tier > 1 && !tierUnlocked(p, tier)) tier--;
  let idx = 0;
  const setup: Setup = { ...p.lastSetup, startTechs: [...p.lastSetup.startTechs], bonuses: [...p.lastSetup.bonuses] };
  if (!platformsOf(p).includes(setup.platform)) setup.platform = 'mule';
  if (!coresOf(p).includes(setup.core)) setup.core = 'standard';
  if (!deptsAvailable(p)) setup.dept = null;
  const root = scr();
  const inner = root.firstChild as HTMLElement;
  let view: 'card' | 'preset' | 'dept' | 'quals' = 'card';
  const render = () => {
    inner.replaceChildren();
    const list = boardOf(p, tier);
    idx = Math.min(idx, list.length - 1);
    const c = list[idx];
    const t = TIERS[tier - 1];
    inner.append(h('div', { class: 'row between' }, h('h2', null, view === 'card' ? 'PLAY' : view === 'preset' ? 'PLATFORM PRESET' : view === 'dept' ? 'DEPARTMENT' : 'QUALIFICATIONS'), back(() => { if (view !== 'card') { view = 'card'; render(); } else app.toHq(); })));
    if (view === 'card') {
      const locked = !tierUnlocked(p, tier + 1);
      inner.append(
        h('span', { class: 'muted small', style: 'text-align:center' }, 'DIFFICULTY'),
        h('div', { class: 'row' },
          h('button', { class: 'btn', 'aria-label': 'Easier', disabled: tier <= 1, on: { click: () => { tier--; idx = 0; render(); audio.play('click'); } } }, '◀'),
          h('div', { class: 'note grow', style: 'text-align:center;font-size:24px;min-width:0' }, `${tier}. ${t.name.toUpperCase()}`),
          h('button', { class: 'btn', 'aria-label': 'Harder', disabled: tier >= TIERS.length || locked, title: locked ? (tier + 1 > p.tierMax ? `Complete a tier ${tier} contract` : `Division level ${TIERS[tier].divLvl} required`) : '', on: { click: () => { tier++; idx = 0; render(); audio.play('click'); } } }, locked ? icon('lock') : '▶')),
        ...(tier < TIERS.length && locked ? [h('span', { class: 'small muted', style: 'text-align:center' }, tier + 1 > p.tierMax ? `Tier ${tier + 1} unlocks after a successful tier ${tier} contract.` : `Tier ${tier + 1} needs division level ${TIERS[tier].divLvl}.`)] : []));
      const card = h('div', { class: 'frame card col grid-bg', style: 'gap:8px' },
        h('span', { class: 'c2' }),
        h('div', { class: 'row between' },
          h('button', { class: 'btn sm', 'aria-label': 'Previous planet', on: { click: () => { idx = (idx + list.length - 1) % list.length; render(); audio.play('click'); } } }, '◀'),
          h('div', { class: 'col', style: 'gap:0;text-align:center;min-width:0' }, h('h2', { style: 'overflow-wrap:anywhere' }, c.planet), h('span', { class: 'small muted' }, `${idx + 1} / ${list.length}`)),
          h('button', { class: 'btn sm', 'aria-label': 'Next planet', on: { click: () => { idx = (idx + 1) % list.length; render(); audio.play('click'); } } }, '▶')),
        h('span', { class: 'small muted' }, 'Objective:'), h('span', { class: 't', style: 'font-size:18px;color:var(--amber)' }, c.objective),
        h('p', { class: 'small', style: 'margin:0' }, c.blurb),
        h('div', { class: 'kv small' },
          h('span', { class: 'muted' }, 'Planet type'), h('b', null, BIOME_NAME[c.biome]),
          h('span', { class: 'muted' }, 'Target depth'), h('b', null, `${c.targetStrata}×50m`),
          h('span', { class: 'muted' }, 'Charges required'), h('b', null, `${c.charges}×`),
          h('span', { class: 'muted' }, 'Boss'), h('b', null, t.bossFrom ? ENEMIES[BOSS_OF[c.biome]].name : 'none'),
          h('span', { class: 'muted' }, 'Reward'), minerals(c.reward),
          h('span', { class: 'muted' }, 'Minerals'), h('span', { class: 'row' }, ...c.minerals.map(m => icon(m)))),
        c.bonus || c.malus ? h('div', { class: 'col', style: 'gap:4px' }, h('span', { class: 'small muted' }, 'Conditions:'),
          c.bonus ? h('div', { class: 'small' }, h('b', { class: 'amber' }, `↑ ${ALL_MODS[c.bonus].name}`), ` — ${ALL_MODS[c.bonus].text}`) : null,
          c.malus ? h('div', { class: 'small' }, h('b', { class: 'red' }, `↓ ${ALL_MODS[c.malus].name}`), ` — ${ALL_MODS[c.malus].text}`) : null) : h('span', { class: 'small muted' }, 'Conditions: none on this tier.'));
      inner.append(card,
        h('button', { class: 'btn wide', on: { click: () => { view = 'quals'; render(); } } }, `QUALIFICATIONS (0/${c.quals.length})`),
        h('button', { class: 'btn wide', on: { click: () => { view = 'preset'; render(); } } }, `PLATFORM PRESET · ${PLATFORMS[setup.platform].name.split(' ')[0]}`),
        deptsAvailable(p) ? h('button', { class: 'btn wide', on: { click: () => { view = 'dept'; render(); } } }, `DEPARTMENT · ${setup.dept ? DEPTS[setup.dept].name.toUpperCase() : 'NONE'}`) : h('span', { class: 'small muted' }, 'Oversight departments unlock in the Upgrades tree (Department Access).'),
        h('button', { class: 'btn primary wide', style: 'min-height:56px', on: { click: () => { audio.play('confirm'); app.startContract(c, { ...setup }); } } }, 'START CONTRACT'));
    } else if (view === 'quals') {
      inner.append(h('p', { class: 'small' }, 'Optional side goals for this contract, checked at the end. Each one met pays 150 XP and unlocks a blueprint: a new card in future technology drafts.'));
      for (const q of c.quals) inner.append(h('div', { class: 'frame card col' }, h('span', { class: 't', style: 'font-size:20px;color:var(--amber)' }, q.text), q.blueprint ? h('span', { class: 'small muted' }, `Blueprint reward: ${techName(q.blueprint)} — ${techKind(q.blueprint)}`) : h('span', { class: 'small muted' }, 'All blueprints already unlocked')));
    } else if (view === 'preset') {
      inner.append(presetPanel(app, setup, render));
    } else {
      const lvl = deptLevel(divLevel(p));
      inner.append(h('p', { class: 'small' }, `Departments level with the division (currently level ${lvl}/3). Pick one oversight department per contract.`));
      inner.append(h('button', { class: `btn wide ${setup.dept === null ? 'primary' : ''}`, on: { click: () => { setup.dept = null; render(); } } }, 'NO DEPARTMENT'));
      for (const d of DEPT_IDS) inner.append(h('button', { class: `frame card col ${setup.dept === d ? 'note' : ''}`, style: 'text-align:left;cursor:pointer', on: { click: () => { setup.dept = d as DeptId; audio.play('click'); render(); } } }, h('span', { class: 't', style: 'font-size:20px' }, DEPTS[d].name), h('span', { class: 'small' }, DEPTS[d].perk(lvl))));
    }
  };
  render();
  return root;
}

function presetPanel(app: App, setup: Setup, rerender: () => void) {
  const p = app.profile;
  const wrap = h('div', { class: 'col' });
  const pls = platformsOf(p);
  const tabs = h('div', { class: 'tabs' });
  for (const id of ['mule', 'brood', 'stone'] as PlatformId[]) {
    const ok = pls.includes(id);
    tabs.appendChild(h('button', { class: `tab ${setup.platform === id ? 'on' : ''}`, disabled: !ok, title: ok ? '' : 'Unlock in the Upgrades tree', on: { click: () => { setup.platform = id; setup.startTechs = []; setup.bonuses = []; rerender(); } } }, ok ? PLATFORMS[id].name.split(' ')[0] : h('span', { class: 'row' }, icon('lock'), PLATFORMS[id].name.split(' ')[0])));
  }
  const pl = PLATFORMS[setup.platform];
  const slots = platformSlots(p, setup.platform);
  wrap.append(tabs, h('div', { class: 'frame card col' },
    h('div', { class: 'row between' }, h('h3', null, pl.name), h('span', { class: 'note', style: 'padding:2px 8px' }, `LVL ${slots.lvl}`)),
    h('p', { class: 'small', style: 'margin:0' }, pl.blurb),
    h('div', { class: 'row wrap', style: 'gap:6px' }, ...(['miner', 'hauler', 'guard'] as const).map(c => h('span', { class: 'tag' }, `${pl.workers[c].name}${pl.workers[c].slot !== 1 ? ' ×0.5' : ''}`))),
    h('span', { class: 'small muted' }, 'Traits and starting structures:'),
    h('div', { class: 'row wrap', style: 'gap:6px' }, ...pl.traits.map(t => h('span', { class: 'tag good' }, t)), ...[...pl.starting, ...pl.startTurrets].map(t => h('span', { class: 'tag' }, techName(t)))),
    h('span', { class: 'small muted' }, `Starting crew: ${pl.startCrew.map(c => pl.workers[c].name).join(', ')} · workforce limit ${pl.baseCap} · order cap ${pl.orderCap}.`)));
  // core
  const cores = coresOf(p);
  const coreTabs = h('div', { class: 'tabs' });
  for (const id of Object.keys(CORES) as CoreId[]) {
    const ok = cores.includes(id);
    coreTabs.appendChild(h('button', { class: `tab ${setup.core === id ? 'on' : ''}`, disabled: !ok, on: { click: () => { setup.core = id; rerender(); } } }, ok ? CORES[id].name.replace(' Core', '') : h('span', { class: 'row' }, icon('lock'), CORES[id].name.replace(' Core', ''))));
  }
  wrap.append(h('span', { class: 'muted small' }, 'Core'), coreTabs, h('span', { class: 'small' }, CORES[setup.core].desc));
  // start technologies
  const mastered = p.mastered.filter(t => !pl.starting.includes(t) && !pl.startTurrets.includes(t) && !(t === 'tower' || t === 'incub') || setup.platform === 'brood');
  wrap.append(h('span', { class: 'muted small' }, `Start technologies (${slots.start}/2 slots — platform levels 2 and 5)`));
  if (!slots.start) wrap.append(h('span', { class: 'small muted' }, 'Level this platform to unlock start-technology slots. Technologies you draft in contracts become available here.'));
  else {
    const row = h('div', { class: 'row wrap', style: 'gap:6px' });
    for (const t of mastered) {
      const on = setup.startTechs.includes(t);
      row.appendChild(h('button', { class: `tab ${on ? 'on' : ''}`, on: { click: () => { if (on) setup.startTechs = setup.startTechs.filter(x => x !== t); else if (setup.startTechs.length < slots.start) setup.startTechs.push(t); rerender(); } } }, techName(t)));
    }
    if (!mastered.length) row.appendChild(h('span', { class: 'small muted' }, 'No drafted technologies yet.'));
    wrap.append(row);
  }
  wrap.append(h('span', { class: 'muted small' }, `Bonuses (${slots.bonus}/2 slots — platform levels 3 and 7)`));
  if (!slots.bonus) wrap.append(h('span', { class: 'small muted' }, 'Level this platform to unlock bonus slots. Bonus technologies found in gold caches become available here.'));
  else {
    const row = h('div', { class: 'row wrap', style: 'gap:6px' });
    for (const b of p.bonusesFound.filter(x => BONUS_MODS[x])) {
      const on = setup.bonuses.includes(b);
      row.appendChild(h('button', { class: `tab ${on ? 'on' : ''}`, title: BONUS_MODS[b].text, on: { click: () => { if (on) setup.bonuses = setup.bonuses.filter(x => x !== b); else if (setup.bonuses.length < slots.bonus) setup.bonuses.push(b); rerender(); } } }, BONUS_MODS[b].name));
    }
    if (!row.children.length) row.appendChild(h('span', { class: 'small muted' }, 'No bonuses found yet.'));
    wrap.append(row);
  }
  wrap.append(h('button', { class: 'btn primary wide', on: { click: () => { (wrap.closest('.screen')?.querySelector('.btn') as HTMLElement)?.click(); } } }, 'CONFIRM'));
  return wrap;
}

// ---- upgrades -----------------------------------------------------------------------------------------
export function upgrades(app: App) {
  const p = app.profile;
  let sel: string | null = null, done = false;
  const root = scr();
  const inner = root.firstChild as HTMLElement;
  const render = () => {
    inner.replaceChildren();
    inner.append(h('div', { class: 'row between' }, h('h2', null, 'UPGRADES'), back(() => app.toHq())), divBar(app));
    if (p.tutorial === 'upgrade') inner.append(h('div', { class: 'note' }, 'Tap the glowing upgrade, then PURCHASE.'));
    if (done) inner.append(h('div', { class: 'note tut-done' }, 'TUTORIAL COMPLETE — your division is ready. Back to HQ and PLAY your next contract.'));
    const tree = h('div', { class: 'tree frame', style: 'padding:8px' });
    const grid = h('div', { class: 'tree-grid', style: `grid-template-columns: 90px repeat(6, 108px)` });
    // the guide's last step: point at the first upgrade the player can afford
    const guided = p.tutorial === 'upgrade' ? (sel ?? META.find(n => !p.owned.includes(n.id) && !canBuy(p, n.id))?.id ?? null) : null;
    BRANCHES.forEach((bn, bi) => {
      grid.appendChild(h('span', { class: 't', style: 'font-size:17px;color:var(--amber-dim);align-self:center' }, bn));
      for (let col = 0; col < 6; col++) {
        const nodes = META.filter(n => n.branch === bi && n.col === col);
        const cell = h('div', { class: 'col', style: 'gap:6px' });
        for (const n of nodes) {
          const owned = p.owned.includes(n.id);
          const why = canBuy(p, n.id);
          const lockLvl = divLevel(p) < n.lvl;
          cell.appendChild(h('button', { class: `node ${owned ? 'owned' : !why ? 'avail' : lockLvl || (n.req && !p.owned.includes(n.req)) ? 'lock' : ''} ${sel === n.id ? 'sel' : ''} ${guided === n.id && !sel ? 'tut-pulse tut-side' : ''}`, on: { click: () => { sel = n.id; render(); audio.play('click'); } } },
            h('span', { class: 'nm' }, n.name), owned ? icon('check') : lockLvl ? h('span', { class: 'small red' }, `LVL ${n.lvl}`) : nodeCost(p.minerals, n.cost)));
        }
        grid.appendChild(cell);
      }
    });
    tree.appendChild(grid);
    inner.append(tree);
    if (sel) {
      const n = META_BY_ID[sel];
      const owned = p.owned.includes(n.id);
      const why = canBuy(p, n.id);
      inner.append(h('div', { class: 'frame card col' },
        h('span', { class: 'muted small' }, `${BRANCHES[n.branch]} · division level ${n.lvl}${n.req ? ` · requires ${META_BY_ID[n.req].name}` : ''}`),
        h('h3', null, n.name), h('p', { class: 'small', style: 'margin:0' }, n.text),
        h('div', { class: 'row between' }, h('span', { class: 'small muted' }, 'Cost'), minerals(p.minerals, n.cost)),
        owned ? h('div', { class: 'note' }, 'Purchased') : h('button', { class: `btn primary wide ${p.tutorial === 'upgrade' && !why ? 'tut-pulse' : ''}`, disabled: !!why, on: { click: () => { const w = buy(p, n.id); if (!w) { if (p.tutorial === 'upgrade') { p.tutorial = 'done'; done = true; track('tutorial_complete', {}); } app.saveProfile(); audio.play('purchase'); } else audio.play('error'); render(); } } }, why ?? 'PURCHASE')));
    } else inner.append(h('p', { class: 'small muted' }, 'Tap a node. Prices are in ochre, jade and void — void comes from tier 3+ contracts and rare deep deposits.'));
  };
  render();
  return root;
}

// ---- archive --------------------------------------------------------------------------------------------
export function archive(app: App) {
  const p = app.profile;
  const hist = h('div', { class: 'list' });
  for (const r of p.history) hist.appendChild(h('div', { class: 'frame card small row between' }, h('span', null, `${r.planet} · T${r.tier} · ${PLATFORMS[r.platform].name.split(' ')[0]}`), h('span', { class: r.success ? 'green' : 'red' }, `${r.success ? 'OK' : 'LOST'} ${r.depth}m d${r.days} ${r.core}%`), stars(r.stars)));
  if (!p.history.length) hist.appendChild(h('span', { class: 'small muted' }, 'No contracts yet.'));
  const quals = h('div', { class: 'list' });
  for (const q of p.qualLog) quals.appendChild(h('div', { class: `frame card small ${q.met ? 'green' : 'red'}` }, icon(q.met ? 'check' : 'x'), ` ${q.text} — ${q.planet}${q.met && q.blueprint ? ` · blueprint: ${techName(q.blueprint)}` : ''}`));
  if (!p.qualLog.length) quals.appendChild(h('span', { class: 'small muted' }, 'No qualifications attempted yet.'));
  const bps = h('div', { class: 'list' });
  for (const b of BLUEPRINTS) bps.appendChild(h('div', { class: `frame card small ${p.blueprints.includes(b) ? '' : 'muted'}` }, h('b', null, `${p.blueprints.includes(b) ? '' : '[locked] '}${techName(b)}`), ` — ${techKind(b)}. ${p.blueprints.includes(b) ? techDesc(b) : 'Earn it by meeting a contract qualification.'}`));
  const ach = h('div', { class: 'list' });
  const got = p.achievements ?? {};
  for (const d of ACHIEVEMENTS) ach.appendChild(h('div', { class: `frame card small ${got[d.key] ? 'green' : 'muted'}`, style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap' },
    icon(got[d.key] ? 'star' : 'x'), h('b', null, d.name), h('span', { class: 'muted' }, d.text),
    ...(['ochre', 'jade', 'void'] as const).filter(k => d.reward[k] > 0).map(k => res(k, `+${d.reward[k]}`))));
  return scr(h('div', { class: 'row between' }, h('h2', null, 'ARCHIVE'), back(() => app.toHq())),
    h('h3', null, `Achievements ${Object.keys(got).length}/${ACHIEVEMENTS.length}`), ach,
    h('h3', null, 'Contract history'), hist, h('h3', null, 'Qualifications'), quals, h('h3', null, 'Blueprints'), bps);
}

// ---- settings ---------------------------------------------------------------------------------------------
function settingsBody(app: App) {
  const st = app.profile.settings;
  const slider = (label: string, key: 'master' | 'music' | 'sfx') => {
    const inp = h('input', { type: 'range', min: '0', max: '1', step: '0.05', value: String(st[key]), 'aria-label': label });
    inp.addEventListener('input', () => { st[key] = +inp.value; app.applySettings(); });
    inp.addEventListener('change', () => { app.saveProfile(); audio.play('click'); });
    return h('label', { class: 'col', style: 'gap:2px' }, h('span', { class: 'small' }, label), inp);
  };
  const sw = (label: string, key: 'shake' | 'crt' | 'pauseMenus' | 'hints') => {
    const inp = h('input', { type: 'checkbox', checked: st[key] });
    inp.addEventListener('change', () => { st[key] = inp.checked; app.applySettings(); app.saveProfile(); if (app.game) app.game.r.fx.shakeOn = st.shake; });
    return h('label', { class: 'switch small' }, label, inp);
  };
  const resetHints = h('button', { class: 'btn wide', on: { click: () => { app.profile.seen = {}; app.saveProfile(); audio.play('click'); } } }, 'SHOW TUTORIAL HINTS AGAIN');
  // hold to confirm (browser dialogs may be disabled inside the platform's iframe)
  const wipe = h('button', { class: 'btn danger wide' }, 'HOLD: ERASE ALL PROGRESS');
  holdButton(wipe, 1500, async () => { wipeSaves(); await flushSaves(); location.reload(); });
  return [slider('Master volume', 'master'), slider('Music', 'music'), slider('Sound effects', 'sfx'), sw('Screen shake', 'shake'), sw('CRT scanlines', 'crt'), sw('Pause while build menus are open', 'pauseMenus'), sw('Tutorial hints', 'hints'), resetHints, wipe];
}
export function settings(app: App, backFn: () => void) {
  return scr(h('div', { class: 'row between' }, h('h2', null, 'SETTINGS'), back(backFn)), h('div', { class: 'frame card col' }, ...settingsBody(app)));
}
export function settingsModal(app: App, close: () => void) {
  return h('div', { class: 'modal' }, h('div', { class: 'box frame grid-bg' }, h('div', { class: 'row between' }, h('h2', null, 'SETTINGS'), h('button', { class: 'btn', on: { click: close } }, 'DONE')), ...settingsBody(app)));
}

export function credits(_app: App, backFn: () => void) {
  const body = h('div', { class: 'frame card credits', html: CREDITS_HTML });
  return scr(h('div', { class: 'row between' }, h('h2', null, 'CREDITS'), back(backFn)), body);
}

// ---- result -------------------------------------------------------------------------------------------------
/** What the next division level brings — the reason to play one more contract. */
export function nextUnlock(app: App): { lvl: number; text: string; xp: number; need: number } | null {
  const p = app.profile, lvl = divLevel(p);
  for (let L = lvl + 1; L <= 30; L++) {
    const tiers = TIERS.filter(t => t.divLvl === L && t.n > 1).map(t => `${t.name} contracts`);
    const nodes = META.filter(n => n.lvl === L).length;
    if (!tiers.length && !nodes) continue;
    const parts = [...tiers, ...(nodes ? [`${nodes} new upgrade${nodes > 1 ? 's' : ''}`] : [])];
    return { lvl: L, text: parts.join(' · '), xp: p.xp - xpForLevel(lvl), need: xpForLevel(L) - xpForLevel(lvl) };
  }
  return null;
}

export function result(app: App, s: GameState, out: ApplyOut, earned: AchDef[] = []) {
  const r = s.result!;
  const next = nextUnlock(app);
  const panel = h('div', { class: 'frame result-panel grid-bg' },
    h('span', { class: 'c2' }),
    h('span', { class: 'small muted' }, `DIFFICULTY: ${s.contract.tier}. ${TIERS[s.contract.tier - 1].name.toUpperCase()}`),
    stars(r.stars, 3, true),
    h('h1', { style: `font-size:44px;color:${r.success ? 'var(--amber)' : 'var(--red)'}` }, r.success ? 'MISSION SUCCESS' : 'CONTRACT TERMINATED'),
    h('div', { class: 'grid3' },
      h('span', { class: 'small muted' }, 'Depth:'), h('span', { class: 'small muted' }, 'Days:'), h('span', { class: 'small muted' }, 'Core:'),
      h('span', { class: 'num' }, `${r.depth}m`), h('span', { class: 'num' }, String(r.days)), h('span', { class: 'num' }, `${r.corePct}%`)),
    h('div', { class: 'hr' }),
    ...r.xpLines.map(l => h('div', { class: 'xp-line' }, h('span', null, `${l.label}:`), h('span', null, `+${l.xp}xp`))),
    h('div', { class: 'xp-line' }, h('span', null, 'TOTAL XP:'), h('span', { class: 'xp-total' }, `+${r.xp}xp`)),
    h('span', { class: 't', style: 'font-size:20px;color:var(--amber)' }, r.success ? 'RETRIEVED' : 'RETRIEVED (50% salvage)'),
    h('div', { class: 'row center' }, res('ochre', `+${r.retrieved.ochre}`), res('jade', `+${r.retrieved.jade}`), res('void', `+${r.retrieved.void}`)),
    r.success ? h('span', { class: 't', style: 'font-size:20px;color:var(--amber)' }, 'CONTRACT REWARD') : null,
    r.success ? h('div', { class: 'row center' }, res('ochre', `+${r.reward.ochre}`), res('jade', `+${r.reward.jade}`), ...(r.reward.void ? [res('void', `+${r.reward.void}`)] : [])) : null,
    h('span', { class: 't', style: 'font-size:20px;color:var(--amber)' }, 'QUALIFICATIONS'),
    ...r.quals.map(q => h('div', { class: `frame card small ${q.met ? 'green' : 'red'}`, style: 'text-align:left' }, icon(q.met ? 'check' : 'x'), ` ${q.text}${q.met && q.blueprint ? ` — blueprint unlocked: ${techName(q.blueprint)}` : ''}`)),
    out.levelAfter > out.levelBefore ? h('div', { class: 'note' }, `Division level ${out.levelAfter}!`) : null,
    out.platLvlAfter > out.platLvlBefore ? h('div', { class: 'note' }, `${PLATFORMS[s.setup.platform].name} reached level ${out.platLvlAfter}`) : null,
    out.tierUnlocked ? h('div', { class: 'note' }, `Tier ${out.tierUnlocked} (${TIERS[out.tierUnlocked - 1].name}) unlocked${divLevel(app.profile) < TIERS[out.tierUnlocked - 1].divLvl ? ` at division level ${TIERS[out.tierUnlocked - 1].divLvl}` : ''}`) : null,
    earned.length ? h('span', { class: 't', style: 'font-size:20px;color:var(--amber)' }, 'ACHIEVEMENTS') : null,
    ...earned.map(d => h('div', { class: 'frame card small green', style: 'text-align:left;display:flex;gap:8px;align-items:center;flex-wrap:wrap' }, icon('star'), h('b', null, d.name),
      ...(['ochre', 'jade', 'void'] as const).filter(k => d.reward[k] > 0).map(k => res(k, `+${d.reward[k]}`)))),
    next ? h('div', { class: 'frame card small next-unlock' }, h('span', { class: 'muted' }, `Next · division level ${next.lvl}: `), h('b', null, next.text),
      h('div', { class: 'bar-xp', style: 'margin-top:6px' }, h('i', { style: `width:${Math.min(100, (next.xp / next.need) * 100)}%` })),
      h('span', { class: 'small muted' }, `${next.xp} / ${next.need} XP`)) : null,
    h('span', { class: 'small muted' }, `Workers evacuated: ${r.evacuated} · lost: ${s.stats.workersLost} · swarm killed: ${s.stats.kills} · blocks dug: ${s.stats.blocks}`),
    h('div', { class: 'row' },
      h('button', { class: `btn primary grow ${app.profile.tutorial === 'upgrade' ? 'tut-pulse' : ''}`, on: { click: () => app.toHq() } }, app.profile.tutorial === 'upgrade' ? 'CONTINUE · SPEND MINERALS' : 'CONTINUE'),
      !r.success ? h('button', { class: 'btn grow', on: { click: () => app.startContract(s.contract, s.setup) } }, 'RETRY') : null),
  );
  return scr(panel);
}
