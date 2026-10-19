# ASSETS

Every non-code asset shipped inside `release/DeepContract.html`, with its licence and what was done to it.
Nothing from Drill Core (art, audio, fonts, text) is shipped. The teardown's evidence frames were used only as
rule and mood reference and are kept outside the build in `docs/reference/`.

Licence evidence was checked per pack at the source (OpenGameArt "License(s)" field, licence files inside archives,
itch.io asset-licence field, Freesound licence link); the raw page captures are kept next to each download in
`_sources/art/<pack>/_source_page_meta.json` and `_sources/audio/<pack>/_meta.json`. Research records:
`_sources/art/REPORT.md`, `_sources/audio/REPORT.md`.

In-game credits: **Title → CREDITS** or **HQ → CREDITS** (generated from the same data by `tools/make_credits.py`),
including the full SIL Open Font License text.

## Licence summary

| Pack | Author | Licence | Source | Used for |
|---|---|---|---|---|
| 16x16 Block Texture Set | ARoachIFoundOnMyPillow | CC0 | https://opengameart.org/content/16x16-block-texture-set | sprites: blk.cave, blk.frost, blk.ice, blk.jungle, blk.mud, decor.amethyst_crystal, decor.fern, decor.limestone_stromatolite, decor.mushroom_brown, decor.mushroom_red, decor.spiderweb, wall.cave, wall.frost, wall.jungle |
| 16x16 Ant Enemies / 16x16 Flies | ARoachIFoundOnMyPillow | CC0 | https://opengameart.org/content/16x16-ant-enemies ; https://opengameart.org/content/16x16-flies | sprites: e.darter, e.skitter, u.mite |
| Platformer Bugs from Last Escape | Stephen Challener (Redshrike) and Poss | CC-BY 3.0 | https://opengameart.org/content/platformer-bugs-from-last-escape | sprites: e.broodsac, e.carapace, e.mender, e.rimeback, e.shieldbug, u.borer |
| [LPC] Spider | Stephen "Redshrike" Challener (artist), William.Thompsonj (contributor) | CC-BY 3.0 | https://opengameart.org/content/lpc-spider | sprites: e.weaver |
| Walking Ice Golem | tautomer | CC0 | https://opengameart.org/content/walking-ice-golem | sprites: e.rimeclad |
| Mushroom Mob | percival49 | CC0 | https://opengameart.org/content/mushroom-mob | sprites: e.bloomrot |
| Explosion Animation | den_yes | CC0 | https://opengameart.org/content/explosion-animation-1 | sprites: fx.expl32 |
| Mini Pixel Pack 3 | GrafxKid | CC0 | https://grafxkid.itch.io/mini-pixel-pack-3 | sprites: fx.expl16, fx.sparkle |
| Sideview Sci-Fi - Patreon Collection (explosion) | ansimuz | CC0 | https://opengameart.org/content/sideview-sci-fi-patreon-collection | sprites: fx.explbig |
| Smoke Puff | Aidan_Walker | CC0 | https://opengameart.org/content/smoke-puff | sprites: fx.smoke |
| Core Reactor Machines | Reactorcore | CC0 | https://opengameart.org/content/core-reactor-machines | sprites: core.glow |
| Sci-Fi Sounds | Kenney (kenney.nl) | CC0 | https://kenney.nl/assets/sci-fi-sounds | audio: drill, eggs, emerge, explode, explode_big, flame, fuse, laser, nightfall, overheat, stasis, steam, swallow, swell |
| Impact Sounds | Kenney (kenney.nl) | CC0 | https://kenney.nl/assets/impact-sounds | audio: dig, hit, shieldbreak, supply |
| Interface Sounds | Kenney (kenney.nl) | CC0 | https://kenney.nl/assets/interface-sounds | audio: ban, click, close, confirm, deliver, error, event, open, produce, recruit, tag, toggle, untag, upgrade |
| Casino Audio | Kenney (kenney.nl) | CC0 | https://kenney.nl/assets/casino-audio | audio: draft, pick, pickup, reroll |
| RPG Audio | Kenney (kenney.nl) | CC0 | https://kenney.nl/assets/rpg-audio | audio: purchase |
| Digital Audio | Kenney (kenney.nl) | CC0 | https://kenney.nl/assets/digital-audio | audio: tesla, weld |
| 30 CC0 SFX loops | rubberduck | CC0 | https://opengameart.org/content/30-cc0-sfx-loops | audio: alarm |
| 75 CC0 breaking / falling / hit sfx | rubberduck | CC0 | https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx | audio: break, crack, crumble, sell |
| 80 CC0 creature SFX | rubberduck | CC0 | https://opengameart.org/content/80-cc0-creature-sfx | audio: bite, hatch, spit, spore |
| 80 CC0 creture SFX #2 | rubberduck | CC0 | https://opengameart.org/content/80-cc0-creture-sfx-2 | audio: borer, death |
| 100 CC0 metal and wood SFX | rubberduck | CC0 | https://opengameart.org/content/100-cc0-metal-and-wood-sfx | audio: build |
| 50 CC0 Sci-Fi SFX | rubberduck | CC0 | https://opengameart.org/content/50-cc0-sci-fi-sfx | audio: gshot |
| Dark Stinger 1 | Kresiek The Furry | CC0 | https://opengameart.org/content/dark-stinger-1 | audio: nightfall |
| Daylight Stinger | SterlingRay | CC0 | https://opengameart.org/content/daylight-stinger | audio: dawn |
| Success Stinger | SterlingRay | CC0 | https://opengameart.org/content/success-stinger | audio: victory |
| Earthquake and Open sesame | mieki256 | CC0 | https://opengameart.org/content/earthquake-and-open-sesame | audio: drill_start |
| Metal Impact Sounds | BMacZero (Brian MacIntosh) | CC0 | https://opengameart.org/content/metal-impact-sounds | audio: oredrop |
| Light Machine Gun | KuraiWolf | CC-BY 4.0 | https://opengameart.org/content/light-machine-gun | audio: mg |
| JC Sounds - Sci-Fi Pack Vol 1 | JC Sounds | CC-BY 4.0 | https://opengameart.org/content/jc-sounds-sci-fi-pack-vol-1 | audio: lance, overclock, rail |
| JC Sounds - Mechanical Pack Vol 1 | JC Sounds | CC-BY 4.0 | https://opengameart.org/content/jc-sounds-mechanical-pack-vol-1 | audio: drill, drill_stop |
| 4 projectile launches | Michel Baradari (apollo-music.de), uploaded by qubodup | CC-BY 3.0 | https://opengameart.org/content/4-projectile-launches | audio: flakcall, flakfire, mortar |
| Laser Beam | frosty ham | CC0 | https://opengameart.org/content/laser-beam | audio: cryo, hum, sun |
| 8 wet squish, slurp impacts | qubodup | CC0 | https://opengameart.org/content/8-wet-squish-slurp-impacts | audio: bugdie |
| Fly Swatter Squish sound | qubodup | CC0 | https://opengameart.org/content/fly-swatter-squish-sound | audio: squish |
| 27 Metal Audio Samples (SFX) | blacklodgegames | CC0 | https://opengameart.org/content/27-metal-audio-samples-sfx | audio: corehit |
| 15 vocal male strain/hurt/pain/jump sounds | qubodup | CC0 | https://opengameart.org/content/15-vocal-male-strainhurtpainjump-sounds | audio: hurt |
| CC0 Deep Monster Roar | trazzz123 | CC0 | https://opengameart.org/content/cc0-deep-monster-roar | audio: boss, bosswarn |
| Insect or alien scream | qubodup | CC0 | https://opengameart.org/content/insect-or-alien-scream | audio: bosswithdraw |
| Freeze Spell | artisticdude | CC0 | https://opengameart.org/content/freeze-spell-0 | audio: freeze |
| Warp Engine Engage Sound | bart | CC0 | https://opengameart.org/content/warp-engine-engage-sound | audio: rift |
| 7 Assorted Sound Effects (Menu, Level Up) | Joth | CC0 | https://opengameart.org/content/7-assorted-sound-effects-menu-level-up | audio: charge, heal, phoenix |
| Sci-Fi Sound Effects Library | Little Robot Sound Factory (www.littlerobotsoundfactory.com) | CC-BY 3.0 | https://opengameart.org/content/sci-fi-sound-effects-library | audio: defeat |
| Minigun (Freesound #557595, preview MP3) | Breviceps | CC0 | https://freesound.org/people/Breviceps/sounds/557595/ | audio: minigun |
| Rocket Launch (Freesound #521377, preview MP3) | Jarusca | CC0 | https://freesound.org/people/Jarusca/sounds/521377/ | audio: drone, rocket |
| Rocket Launch (Freesound #182794, preview MP3) | qubodup | CC0 | https://freesound.org/people/qubodup/sounds/182794/ | audio: launch |
| Astronomical Explosion (Freesound #760509, preview MP3) | SamsterBirdies | CC0 | https://freesound.org/people/SamsterBirdies/sounds/760509/ | audio: detonate |
| Factory ambiance | yd | CC0 | https://opengameart.org/content/factory-ambiance | audio: music:day |
| T & T Free Cyberpunk Pack 2 | Alexander Ehlers (tricksntraps) | CC0 | https://opengameart.org/content/t-t-free-cyberpunk-pack-2 | audio: music:boss, music:menu, music:night |
| VT323 | Peter Hull / The VT323 Project Authors | SIL OFL 1.1 (no Reserved Font Name) | https://github.com/google/fonts/tree/main/ofl/vt323 | display font (subset) |
| JetBrains Mono | JetBrains, Philipp Nurullin, Konstantin Bulenkov | SIL OFL 1.1 (no Reserved Font Name) | https://github.com/google/fonts/tree/main/ofl/jetbrainsmono | body font (subset, variable weight) |

### Attribution required (CC-BY / OGA-BY)

- "Platformer Bugs from Last Escape" by Stephen Challener (Redshrike) and Poss — CC-BY 3.0 — https://opengameart.org/content/platformer-bugs-from-last-escape
- "[LPC] Spider" by Stephen "Redshrike" Challener (artist), William.Thompsonj (contributor) — CC-BY 3.0 — https://opengameart.org/content/lpc-spider
- "Light Machine Gun" by KuraiWolf — CC-BY 4.0 — https://opengameart.org/content/light-machine-gun
- "JC Sounds - Sci-Fi Pack Vol 1" by JC Sounds — CC-BY 4.0 — https://opengameart.org/content/jc-sounds-sci-fi-pack-vol-1
- "JC Sounds - Mechanical Pack Vol 1" by JC Sounds — CC-BY 4.0 — https://opengameart.org/content/jc-sounds-mechanical-pack-vol-1
- "4 projectile launches" by Michel Baradari (apollo-music.de), uploaded by qubodup — CC-BY 3.0 — https://opengameart.org/content/4-projectile-launches
- "Sci-Fi Sound Effects Library" by Little Robot Sound Factory (www.littlerobotsoundfactory.com) — CC-BY 3.0 — https://opengameart.org/content/sci-fi-sound-effects-library

Licence texts: CC BY 3.0 https://creativecommons.org/licenses/by/3.0/ · CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ · CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/

### Evidence per pack

| Pack | Evidence |
|---|---|
| 16x16 Block Texture Set | OGA field "License(s): CC0" |
| 16x16 Ant Enemies / 16x16 Flies | OGA field "License(s): CC0" on both pages |
| Platformer Bugs from Last Escape | OGA field "License(s): CC-BY 3.0 CC-BY-SA 3.0 OGA-BY 3.0" (CC-BY 3.0 used); notice "Stephen Challener (Redshrike) and Poss, hosted by OpenGameArt.org" |
| [LPC] Spider | OGA field "CC-BY 4.0 CC-BY 3.0 GPL 3.0 GPL 2.0 OGA-BY 3.0" (CC-BY 3.0 used) |
| Walking Ice Golem | OGA field "License(s): CC0" |
| Mushroom Mob | OGA field "License(s): CC0" |
| Explosion Animation | OGA field "License(s): CC0" |
| Mini Pixel Pack 3 | itch field "Asset license: Creative Commons Zero v1.0 Universal"; LICENSE.txt "CC0 1.0 Universal" |
| Sideview Sci-Fi - Patreon Collection (explosion) | OGA field "License(s): CC0"; public-license.txt |
| Smoke Puff | OGA field "License(s): CC0" |
| Core Reactor Machines | OGA field "License(s): CC0" |
| Sci-Fi Sounds | License.txt in the zip: "License: (Creative Commons Zero, CC0)" |
| Impact Sounds | License.txt: "License: (Creative Commons Zero, CC0)" |
| Interface Sounds | License.txt: "License: (Creative Commons Zero, CC0)" |
| Casino Audio | License.txt: "License (Creative Commons Zero, CC0)" |
| RPG Audio | License.txt: "License (Creative Commons Zero, CC0)" |
| Digital Audio | License.txt: "License (Creative Commons Zero, CC0)" |
| 30 CC0 SFX loops | OGA field "License(s): CC0" |
| 75 CC0 breaking / falling / hit sfx | OGA field "License(s): CC0" |
| 80 CC0 creature SFX | OGA field "License(s): CC0" |
| 80 CC0 creture SFX #2 | OGA field "License(s): CC0" |
| 100 CC0 metal and wood SFX | OGA field "License(s): CC0" |
| 50 CC0 Sci-Fi SFX | OGA field "License(s): CC0" |
| Dark Stinger 1 | OGA field "License(s): CC0" |
| Daylight Stinger | OGA field "License(s): CC0" |
| Success Stinger | OGA field "License(s): CC0" |
| Earthquake and Open sesame | OGA field "License(s): CC0" |
| Metal Impact Sounds | OGA field "License(s): CC0" |
| Light Machine Gun | OGA field "License(s): CC-BY 4.0" |
| JC Sounds - Sci-Fi Pack Vol 1 | OGA field "License(s): CC-BY 4.0"; notice "CC BY 4.0 - Credit: JC Sounds" |
| JC Sounds - Mechanical Pack Vol 1 | OGA field "License(s): CC-BY 4.0"; notice "CC BY 4.0 - Credit: JC Sounds" |
| 4 projectile launches | OGA field "License(s): CC-BY 3.0" |
| Laser Beam | OGA field "License(s): CC0" |
| 8 wet squish, slurp impacts | OGA field "License(s): CC0" |
| Fly Swatter Squish sound | OGA field "License(s): CC0" |
| 27 Metal Audio Samples (SFX) | OGA field "License(s): CC0" |
| 15 vocal male strain/hurt/pain/jump sounds | OGA field "License(s): CC0" |
| CC0 Deep Monster Roar | OGA field "License(s): CC0" |
| Insect or alien scream | OGA field "License(s): CC0" |
| Freeze Spell | OGA field "License(s): CC0" |
| Warp Engine Engage Sound | OGA field "License(s): CC0" |
| 7 Assorted Sound Effects (Menu, Level Up) | OGA field "License(s): CC0" |
| Sci-Fi Sound Effects Library | OGA field "License(s): CC-BY 3.0" |
| Minigun (Freesound #557595, preview MP3) | Freesound licence link "Creative Commons 0" |
| Rocket Launch (Freesound #521377, preview MP3) | Freesound licence link "Creative Commons 0" |
| Rocket Launch (Freesound #182794, preview MP3) | Freesound licence link "Creative Commons 0" |
| Astronomical Explosion (Freesound #760509, preview MP3) | Freesound licence link "Creative Commons 0" |
| Factory ambiance | OGA field "License(s): CC0" |
| T & T Free Cyberpunk Pack 2 | OGA field "License(s): CC0" |

## Sprites (`public/assets/sprites/licensed.png`, built by `tools/build_art.py`)

All frames are packed into one 1024-px atlas. Pixel scale is 1:1 with the original files; only integer scaling is used at runtime.

| Sprite key | Pack | Source file(s) | Processing |
|---|---|---|---|
| `blk.cave.10` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/amethyst` | slightly darkened |
| `blk.cave.2` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic, cobblestone, gabbro, stone_generic` | value/saturation graded to the soot palette |
| `blk.cave.3` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/basalt, slate, basalt` | graded, cooled |
| `blk.cave.4` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/obsidian, basalt_flow` | darkened |
| `blk.cave.5` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_nuggets` | ore pixels recoloured to hue 205°, then tinted for the biome |
| `blk.cave.6` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_crystalline` | ore pixels recoloured to hue 350°, then tinted for the biome |
| `blk.cave.7` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_nuggets` | ore pixels recoloured to hue 268°, then tinted for the biome |
| `blk.cave.8` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_nuggets` | ore pixels recoloured to hue 30°, then tinted for the biome |
| `blk.cave.9` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_crystalline` | ore pixels recoloured to hue 158°, then tinted for the biome |
| `blk.cave.back` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic` | heavily darkened as tunnel back wall; flipped variants |
| `blk.cave.soft` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/dirt, gravel, dirt` | graded |
| `blk.frost.10` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/amethyst` | slightly darkened |
| `blk.frost.2` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/diorite_dirty, stone_generic, diorite_dirty, limestone` | value/saturation graded to the soot palette |
| `blk.frost.3` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/slate, basalt, slate` | graded, cooled |
| `blk.frost.4` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/obsidian, basalt_flow` | darkened |
| `blk.frost.5` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_nuggets` | ore pixels recoloured to hue 205°, then tinted for the biome |
| `blk.frost.6` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_crystalline` | ore pixels recoloured to hue 350°, then tinted for the biome |
| `blk.frost.7` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_nuggets` | ore pixels recoloured to hue 268°, then tinted for the biome |
| `blk.frost.8` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_nuggets` | ore pixels recoloured to hue 30°, then tinted for the biome |
| `blk.frost.9` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_crystalline` | ore pixels recoloured to hue 158°, then tinted for the biome |
| `blk.frost.back` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic` | heavily darkened as tunnel back wall; flipped variants |
| `blk.frost.soft` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/snow, snow, snow` | graded |
| `blk.ice` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/ice_glacier, ice_icicles` | darkened |
| `blk.jungle.10` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/amethyst` | slightly darkened |
| `blk.jungle.2` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/cobblestone_mossy, cobblestone_mossy, serpentine, cobblestone_mossy` | value/saturation graded to the soot palette |
| `blk.jungle.3` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/serpentine, schist, serpentine` | graded, cooled |
| `blk.jungle.4` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/obsidian, basalt_flow` | darkened |
| `blk.jungle.5` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_nuggets` | ore pixels recoloured to hue 205°, then tinted for the biome |
| `blk.jungle.6` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_crystalline` | ore pixels recoloured to hue 350°, then tinted for the biome |
| `blk.jungle.7` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_nuggets` | ore pixels recoloured to hue 268°, then tinted for the biome |
| `blk.jungle.8` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_nuggets` | ore pixels recoloured to hue 30°, then tinted for the biome |
| `blk.jungle.9` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/stone_generic_ore_crystalline` | ore pixels recoloured to hue 158°, then tinted for the biome |
| `blk.jungle.back` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/cobblestone_mossy` | heavily darkened as tunnel back wall; flipped variants |
| `blk.jungle.soft` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/beech_leaves, oak_leaves, beech_leaves` | graded |
| `blk.mud` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/mud, mud_cracked` | darkened |
| `core.glow` | Core Reactor Machines | `oga-reactorcore-core-machines/extracted/RC Art - Core Machines/Sprites/Cores ABC Anim Frames/Core_A_1..11.png` | eleven frames; green glow recoloured amber |
| `decor.amethyst_crystal` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/plants/amethyst_crystal.png` | darkened |
| `decor.fern` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/plants/fern.png` | darkened |
| `decor.limestone_stromatolite` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/plants/limestone_stromatolite.png` | darkened |
| `decor.mushroom_brown` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/plants/mushroom_brown.png` | darkened |
| `decor.mushroom_red` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/plants/mushroom_red.png` | darkened |
| `decor.spiderweb` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/plants/spiderweb.png` | darkened |
| `e.bloomrot` | Mushroom Mob | `oga-percival49-mushroom-mob/MushroomMan.png` | idle frames 1-4; red cap recoloured violet-rot |
| `e.bloomrot.hit` | Mushroom Mob | `oga-percival49-mushroom-mob/MushroomMan.png` | attack frames 8-12 (used while at the platform) |
| `e.broodsac` | Platformer Bugs from Last Escape | `oga-redshrike-platformer-bugs/flyer_0.png` | three wing frames, abdomen recoloured pink-red |
| `e.carapace` | Platformer Bugs from Last Escape | `oga-redshrike-platformer-bugs/crawler_0.png` | two walk frames, shell recoloured rust-red, rotated 90° to crawl down walls |
| `e.darter` | 16x16 Ant Enemies / 16x16 Flies | `oga-aroach-ants-flies-16/greenfly_spritesheet.png` | recoloured orange |
| `e.mender` | Platformer Bugs from Last Escape | `oga-redshrike-platformer-bugs/meh4.png` | green background keyed out; two flap frames; wings recoloured green |
| `e.rimeback` | Platformer Bugs from Last Escape | `oga-redshrike-platformer-bugs/crawler_0.png` | recoloured ice-blue, rotated 90° |
| `e.rimeclad` | Walking Ice Golem | `oga-ice-golems/walking-ice-golem-48px.png` | four walk frames, unmodified |
| `e.shieldbug` | Platformer Bugs from Last Escape | `oga-redshrike-platformer-bugs/meh4.png` | green background keyed out; three frames; shell recoloured violet |
| `e.skitter` | 16x16 Ant Enemies / 16x16 Flies | `oga-aroach-ants-flies-16/greyfly_spritesheet.png` | body recoloured crimson (wings kept pale) |
| `e.weaver` | [LPC] Spider | `oga-redshrike-lpc-spiders/extracted/LPC_Spiders/spider01.png` | front-facing walk row (6 frames); recoloured blood-red; drawn at 1× (64 px) |
| `fx.expl16` | Mini Pixel Pack 3 | `grafxkid-mini-pixel-pack-3/extracted/Mini Pixel Pack 3/Effects/Explosion (16 x 16).png` | 6 frames, unmodified |
| `fx.expl32` | Explosion Animation | `oga-misc-cc0-explosions/EXPLOSION_ANIMATION_1.png` | six frames, unmodified |
| `fx.explbig` | Sideview Sci-Fi - Patreon Collection (explosion) | `oga-ansimuz-sideview-scifi/extracted/Sideview Sci-Fi - Patreon Collection/Sprites/Explosion/sprites/explosion-animation1..N.png` | 9 frames, unmodified |
| `fx.smoke` | Smoke Puff | `oga-smoke-puffs/smoke_5.png` | darkened to grey dust |
| `fx.sparkle` | Mini Pixel Pack 3 | `grafxkid-mini-pixel-pack-3/extracted/Mini Pixel Pack 3/Effects/Sparkle (16 x 16).png` | recoloured amber |
| `u.borer` | Platformer Bugs from Last Escape | `oga-redshrike-platformer-bugs/centipede_0.png` | four grub frames, recoloured flesh-red |
| `u.mite` | 16x16 Ant Enemies / 16x16 Flies | `oga-aroach-ants-flies-16/antenemy_grey_spritesheet.png` | darkened; two walk frames |
| `wall.cave` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/slate_tiles, granite_bricks` | darkened |
| `wall.frost` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/slate_tiles, limestone_bricks` | darkened, cooled |
| `wall.jungle` | 16x16 Block Texture Set | `oga-aroach-16x16-block-textures/extracted/blocks/cobblestone_bricks_mossy, serpentine_bricks` | darkened |

### Original art made for this project (procedural pixel art in code)

Drawn at runtime by `src/render/art/*.ts` on the same 16-px block grid: all three worker crews (MULE humans, BROOD Myrmids,
STONEBEARD Delvers) with idle/walk/climb/dig or shoot cycles; the Skitter, Skitterling, Detonator, Spitter, Sporeling
swarm sprites; every deck building (barracks, mead hall, hatchery, foundry, laboratory, welder, damper, amplifiers,
capacitors, ability buildings); all wall turrets with procedural pixel barrels; the rail platform chassis, wheels,
drill, storeys, ladder, lamps and the core housing; mine hazards and crates drawn over the licensed rock (hatch sacs,
black hole, vents, volatile veins, ice heart, roots, spore pods, tech/bonus crates, charge veins), crack overlays,
loose-item icons, UI pixel icons, particles, beams, the launch shuttle and the orbit planet. Sounds for hold-to-confirm,
the Rally Horn and the core-integrity alarm are synthesised in Web Audio (`src/audio/audio.ts`).

## Audio (`public/assets/audio`, built by `tools/process_audio.py`)

Processing for every file: decode, trim leading silence, fades, loudness-normalise to a per-category momentary-max
target (clips shorter than 0.3 s are peak-normalised instead), soft limit at −1 dBFS, MP3 (mono 96 kbps, stereo 128 kbps,
music 160 kbps) so iOS Safari can decode everything. Music loops are cut on bar-aligned points with a 20 ms seam crossfade
and normalised with two-pass loudnorm. Measurements: `tools/audio-log.tsv`. Freesound items are the public preview MP3s
(the originals require an account); they are marked below.

| Shipped file | Cue | Pack | Source | Processing |
|---|---|---|---|---|
| `audio/music/boss.mp3` | music:boss | T & T Free Cyberpunk Pack 2 | `oga-t-t-free-cyberpunk-pack-2/system_overload_154bpm.ogg [0.0-174.545 s]` | bar-aligned loop region, 20 ms seam crossfade, loudnorm linear to -16.5 LUFS (result -16.9 LUFS, peak -8.1 dBFS), MP3 160 kbps stereo |
| `audio/music/day.mp3` | music:day | Factory ambiance | `oga-factory-ambiance/Factory.ogg [0.7-102.7 s]` | bar-aligned loop region, 20 ms seam crossfade, loudnorm linear to -19.5 LUFS (result -19.8 LUFS, peak -4.5 dBFS), MP3 160 kbps stereo |
| `audio/music/menu.mp3` | music:menu | T & T Free Cyberpunk Pack 2 | `oga-t-t-free-cyberpunk-pack-2/night_club_chill_100bpm.ogg [0.0-213.605 s]` | bar-aligned loop region, 20 ms seam crossfade, loudnorm linear to -19.0 LUFS (result -19.4 LUFS, peak -10.3 dBFS), MP3 160 kbps stereo |
| `audio/music/night.mp3` | music:night | T & T Free Cyberpunk Pack 2 | `oga-t-t-free-cyberpunk-pack-2/new_factory_129bpm.ogg [0.0-78.14 s]` | bar-aligned loop region, 20 ms seam crossfade, loudnorm linear to -17.0 LUFS (result -17.4 LUFS, peak -7.6 dBFS), MP3 160 kbps stereo |
| `audio/sfx/alarm_0.mp3` | alarm | 30 CC0 SFX loops | `oga-30-cc0-sfx-loops/extracted/alarm_03.ogg [0s +1.05s]` | mono/stereo 44.1 kHz; trim; x3 repeat; fades; M-max -15.0 -> -12.5 LUFS; peak -4.4 dBFS; MP3 128 kbps |
| `audio/sfx/ban_0.mp3` | ban | Interface Sounds | `kenney-interface-sounds/extracted/Audio/scratch_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -14.0 -> -22.1 LUFS; peak -8.8 dBFS; MP3 96 kbps |
| `audio/sfx/ban_1.mp3` | ban | Interface Sounds | `kenney-interface-sounds/extracted/Audio/scratch_002.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -13.1 -> -21.1 LUFS; peak -8.9 dBFS; MP3 96 kbps |
| `audio/sfx/bite_0.mp3` | bite | 80 CC0 creature SFX | `oga-80-cc0-creature-sfx/extracted/bug_01.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -20.6 -> -21.0 LUFS; peak -2.3 dBFS; MP3 96 kbps |
| `audio/sfx/bite_1.mp3` | bite | 80 CC0 creature SFX | `oga-80-cc0-creature-sfx/extracted/bug_02.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -19.1 -> -20.7 LUFS; peak -1.8 dBFS; MP3 96 kbps |
| `audio/sfx/borer_0.mp3` | borer | 80 CC0 creture SFX #2 | `oga-80-cc0-creture-sfx-2/extracted/slime_01.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -20.8 -> -17.9 LUFS; peak -0.8 dBFS; MP3 96 kbps |
| `audio/sfx/borer_1.mp3` | borer | 80 CC0 creture SFX #2 | `oga-80-cc0-creture-sfx-2/extracted/slime_02.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -16.3 -> -17.5 LUFS; peak -2.0 dBFS; MP3 96 kbps |
| `audio/sfx/boss_0.mp3` | boss | CC0 Deep Monster Roar | `oga-cc0-deep-monster-roar/monster_roar.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -12.0 -> -12.5 LUFS; peak -1.4 dBFS; MP3 128 kbps |
| `audio/sfx/bosswarn_0.mp3` | bosswarn | CC0 Deep Monster Roar | `oga-cc0-deep-monster-roar/monster_roar.wav [0s +3.2s]` | mono/stereo 44.1 kHz; trim; fades; M-max -12.0 -> -12.5 LUFS; peak -1.4 dBFS; MP3 128 kbps |
| `audio/sfx/bosswithdraw_0.mp3` | bosswithdraw | Insect or alien scream | `oga-insect-or-alien-scream/insectoralien.flac` | mono/stereo 44.1 kHz; trim; fades; M-max -10.2 -> -16.5 LUFS; peak -6.7 dBFS; MP3 128 kbps |
| `audio/sfx/break_0.mp3` | break | 75 CC0 breaking / falling / hit sfx | `oga-75-cc0-breaking-falling-hit-sfx/extracted/bfh1_rock_breaking_01.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -24.8 -> -19.2 LUFS; peak 0.1 dBFS; MP3 96 kbps |
| `audio/sfx/break_1.mp3` | break | 75 CC0 breaking / falling / hit sfx | `oga-75-cc0-breaking-falling-hit-sfx/extracted/bfh1_rock_breaking_02.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -22.4 -> -18.7 LUFS; peak -0.6 dBFS; MP3 96 kbps |
| `audio/sfx/break_2.mp3` | break | 75 CC0 breaking / falling / hit sfx | `oga-75-cc0-breaking-falling-hit-sfx/extracted/bfh1_rock_breaking_03.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -25.3 -> -18.9 LUFS; peak 0.2 dBFS; MP3 96 kbps |
| `audio/sfx/bugdie_0.mp3` | bugdie | 8 wet squish, slurp impacts | `oga-8-wet-squish-slurp-impacts/extracted/impsplat/impactsplat01.mp3.flac` | mono/stereo 44.1 kHz; trim; fades; M-max -6.5 -> -16.3 LUFS; peak -7.0 dBFS; MP3 96 kbps |
| `audio/sfx/bugdie_1.mp3` | bugdie | 8 wet squish, slurp impacts | `oga-8-wet-squish-slurp-impacts/extracted/impsplat/impactsplat02.mp3.flac` | mono/stereo 44.1 kHz; trim; fades; M-max -9.7 -> -16.5 LUFS; peak -4.9 dBFS; MP3 96 kbps |
| `audio/sfx/bugdie_2.mp3` | bugdie | 8 wet squish, slurp impacts | `oga-8-wet-squish-slurp-impacts/extracted/impsplat/impactsplat03.mp3.flac` | mono/stereo 44.1 kHz; trim; fades; M-max -11.5 -> -16.4 LUFS; peak -3.2 dBFS; MP3 96 kbps |
| `audio/sfx/bugdie_3.mp3` | bugdie | 8 wet squish, slurp impacts | `oga-8-wet-squish-slurp-impacts/extracted/impsplat/impactsplat04.mp3.flac` | mono/stereo 44.1 kHz; trim; fades; M-max -13.5 -> -16.5 LUFS; peak -2.5 dBFS; MP3 96 kbps |
| `audio/sfx/bugdie_4.mp3` | bugdie | 8 wet squish, slurp impacts | `oga-8-wet-squish-slurp-impacts/extracted/impsplat/impactsplat05.mp3.flac` | mono/stereo 44.1 kHz; trim; fades; M-max -11.8 -> -16.5 LUFS; peak -3.6 dBFS; MP3 96 kbps |
| `audio/sfx/bugdie_5.mp3` | bugdie | 8 wet squish, slurp impacts | `oga-8-wet-squish-slurp-impacts/extracted/impsplat/impactsplat06.mp3.flac` | mono/stereo 44.1 kHz; trim; fades; M-max -13.6 -> -16.5 LUFS; peak -1.9 dBFS; MP3 96 kbps |
| `audio/sfx/build_0.mp3` | build | 100 CC0 metal and wood SFX | `oga-100-cc0-metal-and-wood-sfx/extracted/hammer_01.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -15.5 -> -17.3 LUFS; peak -1.9 dBFS; MP3 96 kbps |
| `audio/sfx/build_1.mp3` | build | 100 CC0 metal and wood SFX | `oga-100-cc0-metal-and-wood-sfx/extracted/hammer_02.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -19.7 -> -27.4 LUFS; peak -4.2 dBFS; MP3 96 kbps |
| `audio/sfx/build_2.mp3` | build | 100 CC0 metal and wood SFX | `oga-100-cc0-metal-and-wood-sfx/extracted/hammer_03.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -20.9 -> -28.2 LUFS; peak -4.3 dBFS; MP3 96 kbps |
| `audio/sfx/build_3.mp3` | build | 100 CC0 metal and wood SFX | `oga-100-cc0-metal-and-wood-sfx/extracted/hammer_04.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -20.2 -> -27.9 LUFS; peak -4.8 dBFS; MP3 96 kbps |
| `audio/sfx/charge_0.mp3` | charge | 7 Assorted Sound Effects (Menu, Level Up) | `oga-7-assorted-sound-effects-menu-level-up/extracted/Level Up.mp3 [0s +2.4s]` | mono/stereo 44.1 kHz; trim; fades; M-max -10.0 -> -14.0 LUFS; peak -5.2 dBFS; MP3 128 kbps |
| `audio/sfx/click_0.mp3` | click | Interface Sounds | `kenney-interface-sounds/extracted/Audio/click_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -39.5 -> -36.2 LUFS; peak -8.9 dBFS; MP3 96 kbps |
| `audio/sfx/click_1.mp3` | click | Interface Sounds | `kenney-interface-sounds/extracted/Audio/click_002.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -42.6 -> -33.4 LUFS; peak -9.0 dBFS; MP3 96 kbps |
| `audio/sfx/click_2.mp3` | click | Interface Sounds | `kenney-interface-sounds/extracted/Audio/click_003.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -44.4 -> -33.3 LUFS; peak -9.0 dBFS; MP3 96 kbps |
| `audio/sfx/close_0.mp3` | close | Interface Sounds | `kenney-interface-sounds/extracted/Audio/close_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -16.2 -> -22.3 LUFS; peak -9.0 dBFS; MP3 96 kbps |
| `audio/sfx/close_1.mp3` | close | Interface Sounds | `kenney-interface-sounds/extracted/Audio/close_002.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -14.4 -> -21.0 LUFS; peak -8.4 dBFS; MP3 96 kbps |
| `audio/sfx/confirm_0.mp3` | confirm | Interface Sounds | `kenney-interface-sounds/extracted/Audio/confirmation_002.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -12.2 -> -21.0 LUFS; peak -10.2 dBFS; MP3 96 kbps |
| `audio/sfx/corehit_0.mp3` | corehit | 27 Metal Audio Samples (SFX) | `oga-27-metal-audio-samples-sfx/extracted/27-Metal-Audio-Samples-blacklodgegames.com/dull_metal_collision_10_44k_32bit_stereo.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -13.9 -> -13.1 LUFS; peak -2.1 dBFS; MP3 96 kbps |
| `audio/sfx/corehit_1.mp3` | corehit | 27 Metal Audio Samples (SFX) | `oga-27-metal-audio-samples-sfx/extracted/27-Metal-Audio-Samples-blacklodgegames.com/dull_metal_collision_11_44k_32bit_stereo.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -9.9 -> -13.2 LUFS; peak -2.7 dBFS; MP3 96 kbps |
| `audio/sfx/corehit_2.mp3` | corehit | 27 Metal Audio Samples (SFX) | `oga-27-metal-audio-samples-sfx/extracted/27-Metal-Audio-Samples-blacklodgegames.com/dull_metal_collision_12_44k_32bit_stereo.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -16.0 -> -13.2 LUFS; peak -0.9 dBFS; MP3 96 kbps |
| `audio/sfx/crack_0.mp3` | crack | 75 CC0 breaking / falling / hit sfx | `oga-75-cc0-breaking-falling-hit-sfx/extracted/bfh1_rock_breaking_02.ogg [0s +0.5s]` | mono/stereo 44.1 kHz; trim; fades; M-max -22.5 -> -21.4 LUFS; peak -1.5 dBFS; MP3 96 kbps |
| `audio/sfx/crumble_0.mp3` | crumble | 75 CC0 breaking / falling / hit sfx | `oga-75-cc0-breaking-falling-hit-sfx/extracted/bfh1_rock_falling_01.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -21.5 -> -18.7 LUFS; peak -1.1 dBFS; MP3 96 kbps |
| `audio/sfx/crumble_1.mp3` | crumble | 75 CC0 breaking / falling / hit sfx | `oga-75-cc0-breaking-falling-hit-sfx/extracted/bfh1_rock_falling_02.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -27.1 -> -19.2 LUFS; peak -1.1 dBFS; MP3 96 kbps |
| `audio/sfx/crumble_2.mp3` | crumble | 75 CC0 breaking / falling / hit sfx | `oga-75-cc0-breaking-falling-hit-sfx/extracted/bfh1_rock_falling_03.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -26.2 -> -19.2 LUFS; peak 0.3 dBFS; MP3 96 kbps |
| `audio/sfx/cryo_0.mp3` | cryo | Laser Beam | `oga-laser-beam/laserbeam.wav [1.4s +0.35s]` | mono/stereo 44.1 kHz; trim; fades; M-max -16.8 -> -20.0 LUFS; peak -9.0 dBFS; MP3 96 kbps |
| `audio/sfx/dawn_0.mp3` | dawn | Daylight Stinger | `oga-daylight-stinger/daylight_stinger.mp3 [0s +6.5s]` | mono/stereo 44.1 kHz; trim; fades; M-max -11.8 -> -14.0 LUFS; peak -4.2 dBFS; MP3 128 kbps |
| `audio/sfx/death_0.mp3` | death | 80 CC0 creture SFX #2 | `oga-80-cc0-creture-sfx-2/extracted/human_01.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -14.1 -> -16.6 LUFS; peak -3.0 dBFS; MP3 96 kbps |
| `audio/sfx/death_1.mp3` | death | 80 CC0 creture SFX #2 | `oga-80-cc0-creture-sfx-2/extracted/human_02.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -14.4 -> -16.7 LUFS; peak -2.7 dBFS; MP3 96 kbps |
| `audio/sfx/death_2.mp3` | death | 80 CC0 creture SFX #2 | `oga-80-cc0-creture-sfx-2/extracted/human_03.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -10.5 -> -16.0 LUFS; peak -2.6 dBFS; MP3 96 kbps |
| `audio/sfx/defeat_0.mp3` | defeat | Sci-Fi Sound Effects Library | `oga-sci-fi-sound-effects-library/extracted/Sci-Fi Sound Library/Wav/Jingle_Lose_00.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -8.9 -> -14.0 LUFS; peak -6.4 dBFS; MP3 128 kbps |
| `audio/sfx/deliver_0.mp3` | deliver | Interface Sounds | `kenney-interface-sounds/extracted/Audio/confirmation_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -13.5 -> -20.3 LUFS; peak -8.0 dBFS; MP3 96 kbps |
| `audio/sfx/deliver_1.mp3` | deliver | Interface Sounds | `kenney-interface-sounds/extracted/Audio/confirmation_003.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -13.8 -> -20.0 LUFS; peak -7.7 dBFS; MP3 96 kbps |
| `audio/sfx/deliver_2.mp3` | deliver | Interface Sounds | `kenney-interface-sounds/extracted/Audio/confirmation_004.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -10.3 -> -20.0 LUFS; peak -10.6 dBFS; MP3 96 kbps |
| `audio/sfx/detonate_0.mp3` | detonate | Astronomical Explosion (Freesound #760509, preview MP3) | `freesound-cc0-previews/fs760509_SamsterBirdies_Astronomical_Explosion.mp3 [0s +7.5s]` | mono/stereo 44.1 kHz; trim; fades; M-max -6.5 -> -12.5 LUFS; peak -5.8 dBFS; MP3 128 kbps |
| `audio/sfx/dig_0.mp3` | dig | Impact Sounds | `kenney-impact-sounds/extracted/Audio/impactMining_000.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -16.6 -> -20.0 LUFS; peak -1.4 dBFS; MP3 96 kbps |
| `audio/sfx/dig_1.mp3` | dig | Impact Sounds | `kenney-impact-sounds/extracted/Audio/impactMining_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -17.0 -> -20.7 LUFS; peak -3.3 dBFS; MP3 96 kbps |
| `audio/sfx/dig_2.mp3` | dig | Impact Sounds | `kenney-impact-sounds/extracted/Audio/impactMining_002.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -21.0 -> -21.0 LUFS; peak -1.8 dBFS; MP3 96 kbps |
| `audio/sfx/dig_3.mp3` | dig | Impact Sounds | `kenney-impact-sounds/extracted/Audio/impactMining_003.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -19.0 -> -20.9 LUFS; peak -2.4 dBFS; MP3 96 kbps |
| `audio/sfx/dig_4.mp3` | dig | Impact Sounds | `kenney-impact-sounds/extracted/Audio/impactMining_004.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -17.4 -> -20.7 LUFS; peak -3.1 dBFS; MP3 96 kbps |
| `audio/sfx/draft_0.mp3` | draft | Casino Audio | `kenney-casino-audio/extracted/Audio/card-shuffle.ogg [0s +1.1s]` | mono/stereo 44.1 kHz; trim; fades; M-max -25.2 -> -17.7 LUFS; peak -0.4 dBFS; MP3 96 kbps |
| `audio/sfx/drill_0.mp3` | drill | JC Sounds - Mechanical Pack Vol 1 | `Kenney Sci-Fi spaceEngineLow_004.ogg (bed) + JC Mechanical "Large Mechanical Press Hit_01..04" every 1.25 s` | periodic 5.0 s loop assembled offline, normalised to -15 LUFS M-max, MP3 128 kbps |
| `audio/sfx/drill_start_0.mp3` | drill_start | Earthquake and Open sesame | `oga-earthquake-and-open-sesame/shake.flac` | mono/stereo 44.1 kHz; trim; fades; M-max -7.7 -> -12.5 LUFS; peak -7.3 dBFS; MP3 128 kbps |
| `audio/sfx/drill_stop_0.mp3` | drill_stop | JC Sounds - Mechanical Pack Vol 1 | `oga-jc-sounds-mechanical-pack-vol-1/extracted/Mechanical Pack Vol 1/Singles/Single_Mechanical Pack Vol 1_Large Mechanism Retract_01.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -20.4 -> -16.5 LUFS; peak -4.6 dBFS; MP3 96 kbps |
| `audio/sfx/drone_0.mp3` | drone | Rocket Launch (Freesound #521377, preview MP3) | `freesound-cc0-previews/fs521377_Jarusca_Rocket_Launch.mp3 [0.1s +0.9s]` | mono/stereo 44.1 kHz; trim; fades; M-max -15.7 -> -16.5 LUFS; peak -4.6 dBFS; MP3 96 kbps |
| `audio/sfx/eggs_0.mp3` | eggs | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/slime_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -21.6 -> -20.0 LUFS; peak -1.0 dBFS; MP3 96 kbps |
| `audio/sfx/emerge_0.mp3` | emerge | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/slime_000.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -24.2 -> -20.0 LUFS; peak -1.0 dBFS; MP3 96 kbps |
| `audio/sfx/error_0.mp3` | error | Interface Sounds | `kenney-interface-sounds/extracted/Audio/error_004.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -20.0 -> -29.2 LUFS; peak -9.0 dBFS; MP3 96 kbps |
| `audio/sfx/error_1.mp3` | error | Interface Sounds | `kenney-interface-sounds/extracted/Audio/error_006.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -18.4 -> -26.6 LUFS; peak -9.0 dBFS; MP3 96 kbps |
| `audio/sfx/event_0.mp3` | event | Interface Sounds | `kenney-interface-sounds/extracted/Audio/bong_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -24.0 -> -24.2 LUFS; peak -5.0 dBFS; MP3 96 kbps |
| `audio/sfx/explode_0.mp3` | explode | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/explosionCrunch_000.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -15.0 -> -15.0 LUFS; peak -1.6 dBFS; MP3 96 kbps |
| `audio/sfx/explode_1.mp3` | explode | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/explosionCrunch_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -13.1 -> -15.0 LUFS; peak -3.0 dBFS; MP3 96 kbps |
| `audio/sfx/explode_2.mp3` | explode | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/explosionCrunch_002.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -13.9 -> -15.0 LUFS; peak -2.8 dBFS; MP3 96 kbps |
| `audio/sfx/explode_3.mp3` | explode | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/explosionCrunch_003.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -15.5 -> -15.0 LUFS; peak -1.7 dBFS; MP3 96 kbps |
| `audio/sfx/explode_4.mp3` | explode | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/explosionCrunch_004.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -17.7 -> -16.5 LUFS; peak -1.4 dBFS; MP3 96 kbps |
| `audio/sfx/explode_big_0.mp3` | explode_big | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/lowFrequency_explosion_000.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -12.0 -> -13.6 LUFS; peak -2.2 dBFS; MP3 96 kbps |
| `audio/sfx/explode_big_1.mp3` | explode_big | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/lowFrequency_explosion_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -11.4 -> -13.7 LUFS; peak -2.4 dBFS; MP3 96 kbps |
| `audio/sfx/flakcall_0.mp3` | flakcall | 4 projectile launches | `oga-4-projectile-launches/extracted/launches/flaunch.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -10.1 -> -16.3 LUFS; peak -3.7 dBFS; MP3 96 kbps |
| `audio/sfx/flakfire_0.mp3` | flakfire | 4 projectile launches | `oga-4-projectile-launches/extracted/launches/flaunch.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -10.1 -> -16.3 LUFS; peak -3.7 dBFS; MP3 96 kbps |
| `audio/sfx/flame_0.mp3` | flame | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/thrusterFire_000.ogg [0.5s +0.4s]` | mono/stereo 44.1 kHz; trim; fades; M-max -21.2 -> -20.0 LUFS; peak -5.5 dBFS; MP3 96 kbps |
| `audio/sfx/freeze_0.mp3` | freeze | Freeze Spell | `oga-freeze-spell-0/freeze.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -12.3 -> -16.5 LUFS; peak -1.8 dBFS; MP3 96 kbps |
| `audio/sfx/fuse_0.mp3` | fuse | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/forceField_000.ogg [0s +0.6s]` | mono/stereo 44.1 kHz; trim; fades; M-max -8.8 -> -20.0 LUFS; peak -12.1 dBFS; MP3 96 kbps |
| `audio/sfx/gshot_0.mp3` | gshot | 50 CC0 Sci-Fi SFX | `oga-50-cc0-sci-fi-sfx/extracted/shoot_01.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -23.5 -> -33.2 LUFS; peak -7.6 dBFS; MP3 96 kbps |
| `audio/sfx/gshot_1.mp3` | gshot | 50 CC0 Sci-Fi SFX | `oga-50-cc0-sci-fi-sfx/extracted/shoot_02.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -26.9 -> -27.0 LUFS; peak -8.0 dBFS; MP3 96 kbps |
| `audio/sfx/hatch_0.mp3` | hatch | 80 CC0 creature SFX | `oga-80-cc0-creature-sfx/extracted/bug_03.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -16.1 -> -17.4 LUFS; peak -1.7 dBFS; MP3 96 kbps |
| `audio/sfx/hatch_1.mp3` | hatch | 80 CC0 creature SFX | `oga-80-cc0-creature-sfx/extracted/bug_04.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -11.4 -> -16.7 LUFS; peak -2.1 dBFS; MP3 96 kbps |
| `audio/sfx/heal_0.mp3` | heal | 7 Assorted Sound Effects (Menu, Level Up) | `oga-7-assorted-sound-effects-menu-level-up/extracted/Ability Learn.mp3 [0s +1.6s]` | mono/stereo 44.1 kHz; trim; fades; M-max -13.4 -> -16.5 LUFS; peak -5.1 dBFS; MP3 96 kbps |
| `audio/sfx/hit_0.mp3` | hit | Impact Sounds | `kenney-impact-sounds/extracted/Audio/impactPlate_light_000.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -22.5 -> -22.3 LUFS; peak -2.1 dBFS; MP3 96 kbps |
| `audio/sfx/hit_1.mp3` | hit | Impact Sounds | `kenney-impact-sounds/extracted/Audio/impactPlate_light_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -23.1 -> -22.1 LUFS; peak -2.0 dBFS; MP3 96 kbps |
| `audio/sfx/hit_2.mp3` | hit | Impact Sounds | `kenney-impact-sounds/extracted/Audio/impactPlate_light_002.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -22.2 -> -22.3 LUFS; peak -2.1 dBFS; MP3 96 kbps |
| `audio/sfx/hit_3.mp3` | hit | Impact Sounds | `kenney-impact-sounds/extracted/Audio/impactPlate_light_003.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -21.1 -> -22.1 LUFS; peak -2.2 dBFS; MP3 96 kbps |
| `audio/sfx/hit_4.mp3` | hit | Impact Sounds | `kenney-impact-sounds/extracted/Audio/impactPlate_light_004.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -21.8 -> -22.2 LUFS; peak -1.9 dBFS; MP3 96 kbps |
| `audio/sfx/hum_0.mp3` | hum | Laser Beam | `oga-laser-beam/laserbeam.wav [0.3s +0.55s]` | mono/stereo 44.1 kHz; trim; fades; M-max -14.8 -> -20.0 LUFS; peak -10.9 dBFS; MP3 96 kbps |
| `audio/sfx/hurt_0.mp3` | hurt | 15 vocal male strain/hurt/pain/jump sounds | `oga-15-vocal-male-strainhurtpainjump-sounds/extracted/slightscream-01.flac` | mono/stereo 44.1 kHz; trim; fades; M-max -12.1 -> -16.6 LUFS; peak -3.3 dBFS; MP3 96 kbps |
| `audio/sfx/hurt_1.mp3` | hurt | 15 vocal male strain/hurt/pain/jump sounds | `oga-15-vocal-male-strainhurtpainjump-sounds/extracted/slightscream-02.flac` | mono/stereo 44.1 kHz; trim; fades; M-max -15.1 -> -17.0 LUFS; peak -2.0 dBFS; MP3 96 kbps |
| `audio/sfx/hurt_2.mp3` | hurt | 15 vocal male strain/hurt/pain/jump sounds | `oga-15-vocal-male-strainhurtpainjump-sounds/extracted/slightscream-03.flac` | mono/stereo 44.1 kHz; trim; fades; M-max -11.0 -> -15.7 LUFS; peak -2.1 dBFS; MP3 96 kbps |
| `audio/sfx/hurt_3.mp3` | hurt | 15 vocal male strain/hurt/pain/jump sounds | `oga-15-vocal-male-strainhurtpainjump-sounds/extracted/slightscream-04.flac` | mono/stereo 44.1 kHz; trim; fades; M-max -11.7 -> -15.9 LUFS; peak -1.3 dBFS; MP3 96 kbps |
| `audio/sfx/hurt_4.mp3` | hurt | 15 vocal male strain/hurt/pain/jump sounds | `oga-15-vocal-male-strainhurtpainjump-sounds/extracted/slightscream-05.flac` | mono/stereo 44.1 kHz; trim; fades; M-max -11.4 -> -16.0 LUFS; peak -1.5 dBFS; MP3 96 kbps |
| `audio/sfx/hurt_5.mp3` | hurt | 15 vocal male strain/hurt/pain/jump sounds | `oga-15-vocal-male-strainhurtpainjump-sounds/extracted/slightscream-06.flac` | mono/stereo 44.1 kHz; trim; fades; M-max -9.5 -> -15.8 LUFS; peak -3.6 dBFS; MP3 96 kbps |
| `audio/sfx/lance_0.mp3` | lance | JC Sounds - Sci-Fi Pack Vol 1 | `oga-jc-sounds-sci-fi-pack-vol-1/extracted/SciFi Pack Vol 1/Single_SciFi Pack Vol 1_Heavy Plasma Shot_01.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -13.8 -> -13.4 LUFS; peak -2.2 dBFS; MP3 96 kbps |
| `audio/sfx/laser_0.mp3` | laser | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/laserSmall_000.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -21.7 -> -20.0 LUFS; peak -5.0 dBFS; MP3 96 kbps |
| `audio/sfx/laser_1.mp3` | laser | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/laserSmall_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -18.7 -> -22.8 LUFS; peak -4.2 dBFS; MP3 96 kbps |
| `audio/sfx/laser_2.mp3` | laser | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/laserSmall_002.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -18.3 -> -16.5 LUFS; peak -1.8 dBFS; MP3 96 kbps |
| `audio/sfx/laser_3.mp3` | laser | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/laserSmall_003.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -19.7 -> -19.2 LUFS; peak -5.0 dBFS; MP3 96 kbps |
| `audio/sfx/laser_4.mp3` | laser | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/laserSmall_004.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -21.1 -> -19.5 LUFS; peak -1.4 dBFS; MP3 96 kbps |
| `audio/sfx/launch_0.mp3` | launch | Rocket Launch (Freesound #182794, preview MP3) | `freesound-cc0-previews/fs182794_qubodup_Rocket_Launch.flac.mp3 [0s +8.5s]` | mono/stereo 44.1 kHz; trim; fades; M-max -13.1 -> -12.5 LUFS; peak -2.1 dBFS; MP3 128 kbps |
| `audio/sfx/mg_0.mp3` | mg | Light Machine Gun | `oga-light-machine-gun/lmg_fire01.mp3 [0s +0.45s]` | mono/stereo 44.1 kHz; trim; fades; M-max -11.7 -> -15.0 LUFS; peak -2.9 dBFS; MP3 96 kbps |
| `audio/sfx/minigun_0.mp3` | minigun | Minigun (Freesound #557595, preview MP3) | `freesound-cc0-previews/fs557595_Breviceps_Minigun.mp3 [0.6s +0.32s]` | mono/stereo 44.1 kHz; trim; fades; M-max -15.6 -> -15.5 LUFS; peak -2.0 dBFS; MP3 96 kbps |
| `audio/sfx/minigun_1.mp3` | minigun | Minigun (Freesound #557595, preview MP3) | `freesound-cc0-previews/fs557595_Breviceps_Minigun.mp3 [1.1s +0.32s]` | mono/stereo 44.1 kHz; trim; fades; M-max -13.4 -> -15.5 LUFS; peak -3.3 dBFS; MP3 96 kbps |
| `audio/sfx/minigun_2.mp3` | minigun | Minigun (Freesound #557595, preview MP3) | `freesound-cc0-previews/fs557595_Breviceps_Minigun.mp3 [1.6s +0.32s]` | mono/stereo 44.1 kHz; trim; fades; M-max -13.4 -> -15.0 LUFS; peak -1.5 dBFS; MP3 96 kbps |
| `audio/sfx/mortar_0.mp3` | mortar | 4 projectile launches | `oga-4-projectile-launches/extracted/launches/flaunch.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -10.1 -> -14.8 LUFS; peak -2.2 dBFS; MP3 96 kbps |
| `audio/sfx/nightfall_0.mp3` | nightfall | Dark Stinger 1 | `oga-dark-stinger-1/dark_stinger_0.ogg [0-8 s] + Kenney Sci-Fi lowFrequency_explosion_000.ogg` | mixed (stinger +9.5 dB, sub boom), 2.5 s fade, normalised, MP3 128 kbps |
| `audio/sfx/open_0.mp3` | open | Interface Sounds | `kenney-interface-sounds/extracted/Audio/open_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -16.6 -> -20.5 LUFS; peak -8.5 dBFS; MP3 96 kbps |
| `audio/sfx/open_1.mp3` | open | Interface Sounds | `kenney-interface-sounds/extracted/Audio/open_002.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -14.6 -> -21.0 LUFS; peak -10.5 dBFS; MP3 96 kbps |
| `audio/sfx/oredrop_0.mp3` | oredrop | Metal Impact Sounds | `oga-metal-impact-sounds/clink1.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -20.3 -> -20.0 LUFS; peak -2.2 dBFS; MP3 96 kbps |
| `audio/sfx/oredrop_1.mp3` | oredrop | Metal Impact Sounds | `oga-metal-impact-sounds/clink2.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -16.9 -> -23.3 LUFS; peak -7.8 dBFS; MP3 96 kbps |
| `audio/sfx/oredrop_2.mp3` | oredrop | Metal Impact Sounds | `oga-metal-impact-sounds/clink3.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -15.1 -> -21.5 LUFS; peak -7.6 dBFS; MP3 96 kbps |
| `audio/sfx/overclock_0.mp3` | overclock | JC Sounds - Sci-Fi Pack Vol 1 | `oga-jc-sounds-sci-fi-pack-vol-1/extracted/SciFi Pack Vol 1/Single_SciFi Pack Vol 1_Boost PowerUp_v1.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -14.6 -> -16.5 LUFS; peak -4.4 dBFS; MP3 96 kbps |
| `audio/sfx/overheat_0.mp3` | overheat | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/thrusterFire_000.ogg [1.0s +0.8s]` | mono/stereo 44.1 kHz; trim; fades; M-max -19.5 -> -20.0 LUFS; peak -0.7 dBFS; MP3 96 kbps |
| `audio/sfx/phoenix_0.mp3` | phoenix | 7 Assorted Sound Effects (Menu, Level Up) | `oga-7-assorted-sound-effects-menu-level-up/extracted/Ability Learn.mp3 [0s +3.2s]` | mono/stereo 44.1 kHz; trim; fades; M-max -10.6 -> -14.0 LUFS; peak -4.7 dBFS; MP3 128 kbps |
| `audio/sfx/pick_0.mp3` | pick | Casino Audio | `kenney-casino-audio/extracted/Audio/card-place-1.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -22.4 -> -19.8 LUFS; peak -1.0 dBFS; MP3 96 kbps |
| `audio/sfx/pick_1.mp3` | pick | Casino Audio | `kenney-casino-audio/extracted/Audio/card-place-2.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -26.3 -> -20.6 LUFS; peak 2.2 dBFS; MP3 96 kbps |
| `audio/sfx/pick_2.mp3` | pick | Casino Audio | `kenney-casino-audio/extracted/Audio/card-place-3.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -24.7 -> -20.0 LUFS; peak 0.3 dBFS; MP3 96 kbps |
| `audio/sfx/pickup_0.mp3` | pickup | Casino Audio | `kenney-casino-audio/extracted/Audio/chip-lay-1.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -23.7 -> -32.2 LUFS; peak -7.4 dBFS; MP3 96 kbps |
| `audio/sfx/pickup_1.mp3` | pickup | Casino Audio | `kenney-casino-audio/extracted/Audio/chip-lay-2.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -28.0 -> -35.7 LUFS; peak -6.5 dBFS; MP3 96 kbps |
| `audio/sfx/pickup_2.mp3` | pickup | Casino Audio | `kenney-casino-audio/extracted/Audio/chip-lay-3.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -25.4 -> -33.7 LUFS; peak -8.0 dBFS; MP3 96 kbps |
| `audio/sfx/produce_0.mp3` | produce | Interface Sounds | `kenney-interface-sounds/extracted/Audio/drop_002.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -22.1 -> -28.7 LUFS; peak -9.0 dBFS; MP3 96 kbps |
| `audio/sfx/purchase_0.mp3` | purchase | RPG Audio | `kenney-rpg-audio/extracted/Audio/handleCoins.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -19.9 -> -18.2 LUFS; peak -0.6 dBFS; MP3 96 kbps |
| `audio/sfx/purchase_1.mp3` | purchase | RPG Audio | `kenney-rpg-audio/extracted/Audio/handleCoins2.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -28.9 -> -17.4 LUFS; peak -1.2 dBFS; MP3 96 kbps |
| `audio/sfx/rail_0.mp3` | rail | JC Sounds - Sci-Fi Pack Vol 1 | `oga-jc-sounds-sci-fi-pack-vol-1/extracted/SciFi Pack Vol 1/Single_SciFi Pack Vol 1_Energy Shot Charged_v1_01.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -15.0 -> -15.5 LUFS; peak -1.9 dBFS; MP3 96 kbps |
| `audio/sfx/rail_1.mp3` | rail | JC Sounds - Sci-Fi Pack Vol 1 | `oga-jc-sounds-sci-fi-pack-vol-1/extracted/SciFi Pack Vol 1/Single_SciFi Pack Vol 1_Energy Shot Charged_v1_02.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -16.3 -> -15.6 LUFS; peak -1.0 dBFS; MP3 96 kbps |
| `audio/sfx/rail_2.mp3` | rail | JC Sounds - Sci-Fi Pack Vol 1 | `oga-jc-sounds-sci-fi-pack-vol-1/extracted/SciFi Pack Vol 1/Single_SciFi Pack Vol 1_Energy Shot Charged_v2_02.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -16.9 -> -15.7 LUFS; peak -1.4 dBFS; MP3 96 kbps |
| `audio/sfx/recruit_0.mp3` | recruit | Interface Sounds | `kenney-interface-sounds/extracted/Audio/maximize_002.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -9.4 -> -12.7 LUFS; peak -5.0 dBFS; MP3 96 kbps |
| `audio/sfx/recruit_1.mp3` | recruit | Interface Sounds | `kenney-interface-sounds/extracted/Audio/maximize_006.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -15.2 -> -16.5 LUFS; peak -2.2 dBFS; MP3 96 kbps |
| `audio/sfx/reroll_0.mp3` | reroll | Casino Audio | `kenney-casino-audio/extracted/Audio/card-shuffle.ogg [0.4s +1.4s]` | mono/stereo 44.1 kHz; trim; fades; M-max -25.9 -> -21.6 LUFS; peak -2.2 dBFS; MP3 96 kbps |
| `audio/sfx/rift_0.mp3` | rift | Warp Engine Engage Sound | `oga-warp-engine-engage-sound/warp engine engage_0-16bit.wav [0s +3.0s]` | mono/stereo 44.1 kHz; trim; fades; M-max -24.6 -> -20.0 LUFS; peak -7.1 dBFS; MP3 96 kbps |
| `audio/sfx/rocket_0.mp3` | rocket | Rocket Launch (Freesound #521377, preview MP3) | `freesound-cc0-previews/fs521377_Jarusca_Rocket_Launch.mp3 [0s +1.2s]` | mono/stereo 44.1 kHz; trim; fades; M-max -14.3 -> -15.0 LUFS; peak -4.5 dBFS; MP3 96 kbps |
| `audio/sfx/sell_0.mp3` | sell | 75 CC0 breaking / falling / hit sfx | `oga-75-cc0-breaking-falling-hit-sfx/extracted/bfh1_metal_falling_01.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -18.4 -> -16.9 LUFS; peak -2.3 dBFS; MP3 96 kbps |
| `audio/sfx/sell_1.mp3` | sell | 75 CC0 breaking / falling / hit sfx | `oga-75-cc0-breaking-falling-hit-sfx/extracted/bfh1_metal_falling_02.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -12.4 -> -16.5 LUFS; peak -3.2 dBFS; MP3 96 kbps |
| `audio/sfx/sell_2.mp3` | sell | 75 CC0 breaking / falling / hit sfx | `oga-75-cc0-breaking-falling-hit-sfx/extracted/bfh1_metal_falling_03.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -15.1 -> -22.8 LUFS; peak -5.0 dBFS; MP3 96 kbps |
| `audio/sfx/shieldbreak_0.mp3` | shieldbreak | Impact Sounds | `kenney-impact-sounds/extracted/Audio/impactGlass_heavy_000.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -27.7 -> -29.2 LUFS; peak -5.0 dBFS; MP3 96 kbps |
| `audio/sfx/shieldbreak_1.mp3` | shieldbreak | Impact Sounds | `kenney-impact-sounds/extracted/Audio/impactGlass_heavy_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -28.2 -> -18.4 LUFS; peak -1.1 dBFS; MP3 96 kbps |
| `audio/sfx/spit_0.mp3` | spit | 80 CC0 creature SFX | `oga-80-cc0-creature-sfx/extracted/spit_02.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -14.2 -> -19.9 LUFS; peak -3.9 dBFS; MP3 96 kbps |
| `audio/sfx/spore_0.mp3` | spore | 80 CC0 creature SFX | `oga-80-cc0-creature-sfx/extracted/spit_01.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -19.1 -> -17.1 LUFS; peak -1.0 dBFS; MP3 96 kbps |
| `audio/sfx/spore_1.mp3` | spore | 80 CC0 creature SFX | `oga-80-cc0-creature-sfx/extracted/spit_02.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -14.2 -> -16.9 LUFS; peak -3.1 dBFS; MP3 96 kbps |
| `audio/sfx/spore_2.mp3` | spore | 80 CC0 creature SFX | `oga-80-cc0-creature-sfx/extracted/spit_03.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -22.3 -> -17.6 LUFS; peak -1.7 dBFS; MP3 96 kbps |
| `audio/sfx/squish_0.mp3` | squish | Fly Swatter Squish sound | `oga-fly-swatter-squish-sound/extracted/qubodup-flyswatter/flyswatter.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -17.2 -> -24.5 LUFS; peak -4.9 dBFS; MP3 96 kbps |
| `audio/sfx/squish_1.mp3` | squish | Fly Swatter Squish sound | `oga-fly-swatter-squish-sound/extracted/qubodup-flyswatter/flyswatter2.wav` | mono/stereo 44.1 kHz; trim; fades; M-max -12.0 -> -16.4 LUFS; peak -1.4 dBFS; MP3 96 kbps |
| `audio/sfx/stasis_0.mp3` | stasis | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/forceField_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -9.1 -> -16.5 LUFS; peak -8.3 dBFS; MP3 96 kbps |
| `audio/sfx/steam_0.mp3` | steam | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/thrusterFire_001.ogg [0.2s +1.1s]` | mono/stereo 44.1 kHz; trim; fades; M-max -18.8 -> -17.1 LUFS; peak -2.9 dBFS; MP3 96 kbps |
| `audio/sfx/sun_0.mp3` | sun | Laser Beam | `oga-laser-beam/laserbeam.wav [0s +2.8s]` | mono/stereo 44.1 kHz; trim; fades; M-max -14.3 -> -16.5 LUFS; peak -7.4 dBFS; MP3 96 kbps |
| `audio/sfx/supply_0.mp3` | supply | Impact Sounds | `kenney-impact-sounds/extracted/Audio/impactPlate_heavy_000.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -21.8 -> -18.6 LUFS; peak -1.1 dBFS; MP3 96 kbps |
| `audio/sfx/supply_1.mp3` | supply | Impact Sounds | `kenney-impact-sounds/extracted/Audio/impactPlate_heavy_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -20.4 -> -18.5 LUFS; peak -1.3 dBFS; MP3 96 kbps |
| `audio/sfx/swallow_0.mp3` | swallow | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/forceField_002.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -8.7 -> -16.5 LUFS; peak -8.7 dBFS; MP3 96 kbps |
| `audio/sfx/swell_0.mp3` | swell | Sci-Fi Sounds | `kenney-sci-fi-sounds/extracted/Audio/slime_000.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -25.0 -> -20.9 LUFS; peak -3.1 dBFS; MP3 96 kbps |
| `audio/sfx/tag_0.mp3` | tag | Interface Sounds | `kenney-interface-sounds/extracted/Audio/tick_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -39.1 -> -34.7 LUFS; peak -9.0 dBFS; MP3 96 kbps |
| `audio/sfx/tag_1.mp3` | tag | Interface Sounds | `kenney-interface-sounds/extracted/Audio/tick_002.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -33.2 -> -32.0 LUFS; peak -8.8 dBFS; MP3 96 kbps |
| `audio/sfx/tesla_0.mp3` | tesla | Digital Audio | `kenney-digital-audio/extracted/Audio/zap1.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -8.9 -> -16.5 LUFS; peak -7.5 dBFS; MP3 96 kbps |
| `audio/sfx/tesla_1.mp3` | tesla | Digital Audio | `kenney-digital-audio/extracted/Audio/zap2.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -8.1 -> -16.5 LUFS; peak -8.9 dBFS; MP3 96 kbps |
| `audio/sfx/toggle_0.mp3` | toggle | Interface Sounds | `kenney-interface-sounds/extracted/Audio/switch_001.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -20.0 -> -30.9 LUFS; peak -9.0 dBFS; MP3 96 kbps |
| `audio/sfx/toggle_1.mp3` | toggle | Interface Sounds | `kenney-interface-sounds/extracted/Audio/switch_002.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -21.6 -> -31.4 LUFS; peak -8.9 dBFS; MP3 96 kbps |
| `audio/sfx/untag_0.mp3` | untag | Interface Sounds | `kenney-interface-sounds/extracted/Audio/tick_004.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -23.4 -> -29.3 LUFS; peak -8.9 dBFS; MP3 96 kbps |
| `audio/sfx/upgrade_0.mp3` | upgrade | Interface Sounds | `kenney-interface-sounds/extracted/Audio/maximize_008.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -15.9 -> -20.0 LUFS; peak -5.0 dBFS; MP3 96 kbps |
| `audio/sfx/victory_0.mp3` | victory | Success Stinger | `oga-success-stinger/success_stinger.mp3 [0s +7.0s]` | mono/stereo 44.1 kHz; trim; fades; M-max -10.1 -> -14.0 LUFS; peak -5.9 dBFS; MP3 128 kbps |
| `audio/sfx/weld_0.mp3` | weld | Digital Audio | `kenney-digital-audio/extracted/Audio/zap2.ogg` | mono/stereo 44.1 kHz; trim; fades; M-max -8.1 -> -20.0 LUFS; peak -12.4 dBFS; MP3 96 kbps |

## Fonts (`public/assets/fonts`)

| Shipped file | Source | Processing |
|---|---|---|
| `VT323-subset.woff2` | google/fonts `ofl/vt323/VT323-Regular.ttf` | fontTools subset (Basic Latin, Latin-1, punctuation), WOFF2 |
| `JetBrainsMono-subset.woff2` | google/fonts `ofl/jetbrainsmono/JetBrainsMono[wght].ttf` | fontTools subset (Basic Latin, Latin-1, arrows, box drawing), WOFF2, variable weight kept |

The OFL licence files are shipped as `public/assets/fonts/*-OFL.txt` in the project and their text is embedded in the in-game credits.

