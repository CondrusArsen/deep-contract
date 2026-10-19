# Deep Contract — design notes

Original mobile-first web game reconstructing the *design* of Drill Core 1.0 as documented in
[Drill Core research report](research/Drill-Core-teardown.html) (Build layer is authoritative). No names, art, audio or text of the
original are used; evidence frames were used as rule/visual reference only.

Status legend used below: **V/D** = rule kept from the teardown (verified / developer source),
**U→** = design decision taken here for an unknown item, **A** = adaptation for touch/portrait.

## Renames (original → here)
| Original | Deep Contract |
|---|---|
| swarmlit (red advanced resource) | **crimsite** |
| orange / green / purple permanent minerals | **ochre / jade / void** |
| Earthcrusher (humans) | **MULE-class** platform — Miner, Hauler, Guard |
| Swarnid (larvae, 0.5 workforce) | **BROOD-class** platform — Chewer, Porter, Sentinel (Myrmids) |
| Dwarves (TNT miners, jetpack guards) | **STONEBEARD-class** platform — Blaster, Porter, Jetguard (Delvers) |
| Terrabor worm / Stoneling | **Borer** / **Rockmite** |
| Arachnor / Icewarden / Sporelord | **The Weaver** (cave) / **Rimeclad** (frost) / **Bloomrot** (jungle) |
| Resonant Laser / Distributor / Exploder / Oscillator / Solaris Lens | Bore Lance / Overclocker / Flak Burst / Stasis Field / Sun Lens |
| difficulty "Core Engineer", "Core Master" | corporate ladder: Intern, Shift Lead, Site Foreman, Deep Supervisor, Pit Boss, Regional Manager, Executive Driller, Board Member |

## Kept rules (V/D)
Day → dusk (alarm, red lights, forced camera, crew returns) → night (swarm descends shaft, turrets on wall mounts
auto-fire, abilities aimed with a reticle, building/selling/recruiting allowed) → night ends the moment the last
attacker dies (day +1 immediately) → dawn (queued drill descends 50 m, SAVING). Coal quota **6** per stratum;
order = coal spent immediately, button reads DRILLING NEXT MORNING, descent at dawn with crew aboard; first descent
at 0 m is immediate. First two buildings and first two turrets free per contract. Sell = 100% refund minus 1 iron.
Max 5 identical turrets. Barracks cap 4 → 7 (+3 per barracks). Lab tiers 2/3/4 need 2/3/4 labs and cost
8/1, 14/2, 20/3 iron/crimsite; Jawforce 3 = +75% mining speed. Draft: 2–3 cards, reroll counter, ban ✕,
quality stars, unlock "until the end of this contract". Verified turret cards: MG range 11 (1.8/s, 8 dmg);
Minigun spins up, range 12; Autocannon more damage above 60% HP, range 11, 5/1; Laser 0.7/s, 10 dmg, ×3 below
50% HP, radius 17.8; Railgun pierces, radius 21.1, ★★ +40% range (rate/damage use the developer's later patch, 0.2/s and 36, instead of 1.0's 0.1/s and 34 — D); Overclocker one turret +300% fire rate,
CD 15 s, +20% duration per extra building; Bore Lance CD 70 s, −10 s per extra building. Hatch block: cracks a
connected block within 4 while a worker is within 5.5. Eclipse announced a day ahead, disables day abilities,
max once per 5 days. Boss warned a day ahead, descends on a thread with escorts, withdraws after sustained damage.
Result: Depth / Days / Core %, XP lines summing to total, retrieved minerals + fixed contract reward,
qualifications green/red. Meta: three-mineral prices with division-level gates; purchase refused and short
amounts shown red.

## Design decisions for U items
(Values live in `src/core/data/*.ts`; this list is kept in sync with them.)

* **Day length (U→)** 180 s at ×1 (dusk = last 20 s), ×2/×3 speed, pause. Tier/conditions may change ±15%.
* **World (U→)** 17 blocks wide (walls at x=0 and x=16), mine 17×14 blocks per 50 m stratum with procedural caves
  connected to the entry under the platform ladder. Shaft above the platform: 16 rows + 4 per stratum (cap 40);
  wall mounts every 5 rows on both walls, so deeper strata literally add mounts.
* **Technology discovery (U→)** Tech caches (glowing crates) are blocks in the mine; a hauler must carry the crate
  home → CHOOSE ONE TECHNOLOGY (2 cards; 3 with an upgrade/department). 2 caches per stratum + 1 near the entry on
  stratum 1; bonus caches (gold) open a bonus-modifier draft (R-09). Rerolls 1 (+upgrades), bans 2 (+upgrades).
  Stars: 1★ 60%, 2★ 30%, 3★ 10% (meta shifts odds). Each star adds one quality line.
* **Launch condition "charges 1×" (U→)** Charge veins (bright cyan blocks) appear in every stratum at or below the
  target depth; a delivered vein = one core charge. Launch button (hold 1.5 s) shows only by day, at/below target,
  with charges ≥ required (tiers 1–4: 1×, 5–7: 2×, 8: 3×). The UI states the missing condition.
* **Workers left below at night (U→)** Borers spawn in the mine at night while anyone is below and hunt them
  (30 HP, 4-damage bite, no instant kill); guards fight them; a worker without a path home shows a red ! marker and a HUD
  alert. The crew auto-recalls at dusk (20 s warning at ×1 is enough to climb home from the stratum's far corner).
  A manual "Recall" toggle also exists. At a dawn descent, survivors below are winched aboard.
* **Wave tables (U→)** Night budget = (6 + 1.6·day + 10·(stratum−1)) × (1 + 0.25·(tier−1)) × conditions; swarm HP × (1 + 0.3·(stratum−1)) × tier factor (1.0 … 2.65), speed +4% per stratum;
  roster unlocks by stratum (1: Skitter, Darter · 2: +Carapace (armour 5), Shieldbug (40-point shield, regenerates after 2.5 s) ·
  3: +Broodsac (splits), Detonator (suicide) · 4+: +Spitter (disables turrets), biome special). Spawned in 2–4
  groups. Night time-limit fallback: after 150 s survivors enrage (+60% speed) so nights always end.
* **Damage types (U→)** kinetic (armour applies fully, ×0.5 vs shields), explosive (splash, armour halved,
  ×1.5 vs shields), energy (ignores armour, ×2 vs shields). Designed so a single-family defence leaks by stratum 3.
* **Core (I→)** 100 durability (cores modify), shown as 10 segments; % on long-press. Zero = contract failed.
* **Defeat & retry (U→)** CONTRACT TERMINATED: 50% of minerals retrieved so far, no contract reward, 40% XP;
  Quick restart (same seed) or back to HQ. Never more than success at equal depth (tested).
* **Stars & XP (U→)** Evacuation XP = 10 × evacuated workers + core %; Difficulty XP =
  tierFactor × (40 × strata reached + 8 × days) (depth and duration dominate, as in both recorded results); + qualifications 150 each. ★ launched, ★ core ≥ 50%,
  ★ every qualification met or ≥1 stratum past target.
* **Recruit costs (R→U)** Miner 2 iron, Hauler 1 iron, Guard 2 iron + 1 crimsite (MULE); Myrmids 1 larva + 1 iron;
  Delvers +1 iron each. Hiring 8 s (faster per extra barracks).
* **Factory (U→)** 1 iron per 35 s (day and night). Fusion Module (meta, 30/15/7): every third output is crimsite.
* **Storeys (U→)** Deck has 6 pads. From stratum 2 a second storey opens (6 pads, 2 iron to scaffold each),
  from stratum 3 a third (3 iron each). Buildings only on pads, turrets only on wall mounts.
* **Crew autonomy (U→)** Workers step out of telegraphed danger (a shaking jet's lane, a rift target, a swelling pod's
  reach); wounded non-guards (<35% HP) with an enemy nearby climb home and rest aboard until 80% HP; miners and
  haulers swing back at adjacent underground enemies. Hatch blocks keep one open crack at a time.
* **Hazards per biome (U→)** Cave: hatch block (Rockmites), black hole (rifts a neighbour after a 3 s telegraph,
  swallows it, ore becomes stored coal, heavy damage to a worker on the tile, digging it out releases the coal),
  jet block (shakes 1.5 s, then fires a 4-block jet), volatile block (fuse 1.2 s explosion, chain reactions).
  Frost: ice hearts regrow ice into adjacent open cells (can strand workers), cryo jets freeze (slow + damage),
  brittle ice (fast to dig). Jungle: spore pods (swell when a worker is within 2.5, burst poison cloud; guards pop
  them from range), creeping vines (grow onto neighbouring blocks, +HP), mud (dug mud leaves a slowing puddle).
* **Bosses (U→)** First visit on the 2nd night at stratum max(2, target−1), then every 2 strata; none on tier 1.
  Weaver: thread descent, lays escort eggs, withdraws at 50% HP (can still be killed while climbing for a void
  bonus). Rimeclad: crystal shield (kinetic ×0.25), freezes turrets within 5 blocks every 8 s, withdraws at 50%.
  Bloomrot: splits off two Sporelings at 75% and 50%, withdraws at 40%.
* **Events (U→)** Daily roll at dawn; forecast events (eclipse / polar night / boss) are announced the day before.
  Tiers 1–3 roll negative events at half weight. Cave: Borer Activity, Eclipse, Day Off, Rich Seam, Supply Drop,
  Swarm Surge. Frost adds Polar Night (eclipse twin), Blizzard, Thaw. Jungle adds Spore Bloom, Overgrowth, Monsoon.
* **Meta (U→)** 48 upgrade nodes in 5 branches (Operations, Workforce, R&D, Defence, Expansion), priced in
  ochre/jade/void with division-level gates; void is the brake (tier ≥3 rewards, rare blocks).
  6 departments (Security, Mining Ops, Logistics, Human Resources, R&D, Accounting), one chosen per contract,
  level with division level. Platform levels unlock 2 start-technology and 2 bonus slots. Cores: Standard, Titan,
  Plasma, Ion, Phoenix. Biomes Frost/Jungle and the BROOD/STONEBEARD platforms are unlocked in the tree.
  Qualifications (2 per contract) unlock blueprints (new cards in future draft pools) + 150 XP.
* **Saving (U→)** Profile always saved. Contract: full snapshot at landing, at every dawn (SAVING shown on
  descents), when the pause menu opens and when the page is hidden; Continue resumes that snapshot.
* **Onboarding: the guided first contract (U→, playtest revision 2026-09-30)** "The tutorial is the loop"
  A new
  profile's title screen starts the first contract directly. One objective at a time on a card under the HUD, one
  target: a pulsing HUD/sheet button or a world arrow with an outline (edge arrow when off screen; tapping the card
  re-frames the view). Every target carries an arrow and a caption: buttons say HOLD / TAP / SPEED UP, world targets
  name the thing (IRON, COAL, CRATE, CHARGE, BUILD, TURRET, DIG HERE). The speed button asks only while time runs
  at ×1; a world target counts as visible only when wholly clear of the HUD (the view re-frames otherwise). Ten steps — drill, tag iron, build a free Barracks, place a free turret, tag coal, open the
  cache (its draft is one sure card), fill the coal quota and hold DRILL, survive the night, haul the charge, hold
  LAUNCH — then at HQ the first upgrade purchase ends it. Steps completed early count; a missing turret jumps the
  queue at dusk. SKIP (two taps) ends it and the hints return. The guided contract: iron, a 5-block coal seam, the
  cache and (at the target) a charge crystal next to reachable passages by the ladder; hazards kept 6+ blocks away;
  first night half as heavy; no random events; Welcome Bonus +50% digging. Measured: the bot finishes it in ~4 game
  minutes, first delivery ~20 s, first worker level-up ~27 s; a touch-only run needs 18 taps and 3 holds.
* **Coal findability (U→)** Coal is black lumps with pale glints on a lighter tile (it was purple, like void), twinkles
  now and then; carried coal and the HUD icon match. Every stratum has a 3-block seam in plain sight of the ladder,
  the rest in fewer, larger veins of 3. DRILL tapped without coal flashes every coal block and brings the nearest
  into view; 45 s without coal progress puts an arrow on the nearest seam. The guide never points at a block the crew
  cannot reach: buried coal gets an arrow on the block in the way ("DIG TO COAL"), and tagged coal behind untagged
  rock does not count towards the quota until a way to it is tagged.
* **Early rewards (U→)** Delivered iron/crimsite/coal fly into their HUD counters, which bump; delivery sound up.
  Workers gain XP from work (block dug, load hauled, borer killed) and level up at 5/14/30/55 XP (max 5): +8% speed and
  +12% digging (+10% guard damage) per level, with a LVL flash. Twelve achievements pay
  minerals the first time and show a medal; the Archive lists them. The result screen lists the achievements from the
  launch and what the next division level unlocks, with an XP bar.
* **Touch input (A)** World taps, long-presses and drags run on pointer events; the browser's follow-up click
  after a touch is suppressed (canvas `touchend` cancelled, a guard after long-press/hold, sheet backdrops only
  close for a tap that started on them), so a tap never also hits the sheet it just opened. Two fingers are
  always a pinch, never a tap. HUD layout boxes pass touches through; only visible widgets catch them. Event
  banners collapse to their title after 8 s, and start collapsed on small portrait phones (tap to expand). On landscape phones the camera button sits beside
  the ability column, outside the shaft; wide screens use the SHAFT/DECK/MINE column instead.
* **Menus pause the game (A, U→)** Full-screen panels (draft, lab, pause, wiki) pause; build/recruit sheets pause
  by default (setting), so touch players are not punished for reading.
