# Verification and Scope

On 19 October 2026, the default source test suite passed **36 tests**, with **4 optional scenarios skipped** by their environment flags. The tests cover 23 acceptance cases, 9 tutorial cases, 3 progression cases and an automated completion smoke test across two contract tiers.

The game was also opened in desktop Chrome and the first contract launched: the game world, workers, resource counters, objective card and pause menu were visible. This was a launch check, not a complete new manual playthrough or a mobile-device certification.

Run `npm test` to repeat the default checks. The repository preserves the existing optional balance/death investigations; skipped scenarios are not counted as passing checks.

`npm run build` checks TypeScript, runs Vite and packages the single-file release. The builder rejects remaining external HTML asset references. The current public edition uses local saves and has no publishing-platform SDK or external analytics connection.
