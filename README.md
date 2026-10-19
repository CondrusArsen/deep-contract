# Deep Contract

A mining-management and tower-defence game by **Arseni Atrokhov**. Mine resources and develop your crew by day, defend the platform at night, and decide when to evacuate with your rewards.

**[Play](https://condrusarsen.github.io/deep-contract/) · [Downloads](https://github.com/CondrusArsen/deep-contract/releases/tag/v1.0.0) · [Drill Core teardown](https://condrusarsen.github.io/deep-contract/research.html)**

![Deep Contract](media/cover.jpg)

## Gameplay

- Day/night cycle with mining, hauling, construction and defence.
- Autonomous miners, haulers and guards, with navigation and progression.
- Resource trade-offs, coal-gated descent, turrets, active abilities, enemy waves and bosses.
- Contract objectives, evacuation, results and permanent upgrades.
- Three platform types, planet biomes, technology choices and a division upgrade tree.
- Guided first contract, mouse/touch controls, pause, speed settings and local saves.

| Mining | Night defence |
|---|---|
| ![Mining and platform](media/mine.png) | ![Night defence](media/night.png) |

## Project work

I developed the game from a gameplay-research brief through implementation, iteration and testing. This repository includes the complete TypeScript project, playable build, design decisions, research report and tests.

- [Design notes](DESIGN.md): rules, economy, progression and onboarding.
- [Game simulation](src/core): contracts, workers, resources and combat.
- [Acceptance tests](tests/acceptance.test.ts): checks for gameplay rules.
- [Research](research/README.md): the Drill Core analysis used as a design reference.

## Run from source

Node.js 18+.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
```

The build produces **release/DeepContract.html**, a self-contained game with embedded graphics, fonts and audio. Open it directly in a browser. Progress is saved on the player's device.

The current checks passed **36 tests**, with 4 optional scenarios skipped. Type checking and the production build passed. See [verification notes](docs/TESTING.md).

## Downloads

The [release](https://github.com/CondrusArsen/deep-contract/releases/tag/v1.0.0) includes the offline game, illustrated teardown and three presentation packages with different cover/screenshot arrangements. The packages use the same game build. [Package notes](docs/VERSIONS.md).

## Credits

Drill Core is the reference game analysed in the accompanying independent study. The browser game is a separate project. Third-party graphics, sounds and fonts retain their licences and credits in [ASSETS.md](ASSETS.md) and the in-game Credits screen.

[Arseni Atrokhov](https://www.linkedin.com/in/arseni-atrokhov/) · [More projects](https://github.com/CondrusArsen)
