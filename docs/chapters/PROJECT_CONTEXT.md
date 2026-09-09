> Chapter 2 update, 2026-09-08: app/page.tsx now enters game/chapters.tsx. The selector mounts either the preserved boss-page/boss-runtime (Land of Waves) or game/chunin/page.tsx + runtime.ts (Lee versus Gaara). game/chapter-registry.ts validates v3 progress and imports the v2 Land of Waves checkpoint. Combatant has a generic ID without widening old character unions; BattleInput accepts an optional bridge port. See chunin-exams/PRODUCTION_LOG.md for current validation/release status. The single-chapter inventory below documents the prior baseline.
# Current project context

Baseline inspected: 2026-09-08, commit 0f54bd3 (V23). Recheck source before a future task; this is a navigation map, not a substitute for reading current code.

## Product and accepted direction

Desktop single-player 2D story boss rush, TypeScript/React/Phaser 3.90.0 with Vinext. The logical viewport is 1280x720. The client-only export is dist/client. Keep keyboard/controller parity, pause, retry, fullscreen, audio controls, reduced motion/shake support, and public Scene Select. No mobile controls, accounts, multiplayer, traversal levels, or filler waves are implied.

Land of Waves has four playable phases: mist (Kakashi), rescue (Naruto with Sasuke ally), mirrors (Sasuke), seal (awakened Naruto). Later Kakashi clashes and Sakura protection are cinematic. Fully in-engine story uses automatic speech bubbles: manga panels and ultimate portrait cards were deliberately removed.

Current balance is a preservation baseline, not a mandate for every future boss. All fights start with one ultimate ready; combat can earn another. The rescue clone has 550 HP and the user accepted its very short duration, superseding the old 30-40 second target. Do not restore longer redundant fights by reading historical plans.

## Source map

All paths below are relative to the repository root.

| Area | Current files and constraints |
| --- | --- |
| Entry and menus | app/page.tsx, game/boss-page.tsx, game/boss-runtime.ts; Start currently selects mist |
| Chapter and kits | game/chapter.ts; seven legacy phase IDs but only four playable IDs |
| Actual story route | game/story-director.ts; switch-based routing, not merely chapter.ts nextPhase() |
| Main integration | game/boss-gameplay.ts; many phase/character-specific branches |
| Combat and input | game/combat-core.ts, game/battle-input.ts; closed character union and event-based attacks |
| Bosses and barrages | game/boss-ai.ts, game/barrages.ts, game/mirror-volley-v23.ts; Zabuza/Haku-specific families |
| Story staging | game/story-v22.ts, game/ending-v23.ts, game/ending-timing-v23.ts plus active older cinematic controllers |
| Presentation | game/battle-art.ts, game/presentation-v16.ts, game/art-v23.ts; cumulative art adapters |
| Mirrors and prison | game/mirror-v15.ts, game/water-prison.ts |
| Ownership and collisions | game/presentation-lifecycle.ts, game/returning-sword.ts, game/projectile-rules.ts |
| UI/save bridge | game/boss-bridge.ts; one chapter's checkpoint and debug snapshot |
| Previews | game/scene-catalog.ts, game/preview-catalog.ts, game/animation-preview.ts |
| Browser actions | game/boss-webmcp.ts; developer pilot hooks must remain development-only |
| Audio | game/recorded-audio.ts, public/audio-v23/manifest.json |
| Production | package.json, vite.config.ts, vercel.json, .openai/hosting.json |

Legacy game/gameplay.ts and game/runtime.ts are not the current app entry. Versioned source/art files can still be active. The renderer currently recognizes some metadata through asset-prefix checks; new prefixes must not silently fall back to incorrect anchors.

## First additional chapter: required migration

This migration is NOT implemented by these documents. Perform it when adding the first chapter:

1. Introduce a chapter ID and registry with scene/fight graph, arenas, asset packs, initial state and completion state. Wrap Land of Waves rather than replacing its behavior.
2. Namespace new fight, scene, asset and event IDs. Keep old compatibility IDs functional.
3. Add chapter selection and route Start, Continue, Scene Select and public status/actions through the selected chapter.
4. Migrate narutovania.checkpoint.v2's single {version, phase, seen} record into chapter-aware progress. Existing valid saves belong to Land of Waves. Preserve settings, viewed scenes and completion data; test absent and malformed saves.
5. Extend debug isolation to chapter identity and all progress/statistics. A debug session must not overwrite a user's normal chapter.
6. Load shared assets plus the selected chapter pack; define ownership and unloading. Do not preload every future chapter indefinitely.
7. Extend closed character/boss/arena unions, kit/render/audio maps, AI and previews deliberately. Search for old phase-specific branches before declaring an extension complete.
8. Regression-test Land of Waves as well as the new chapter.

Avoid a speculative engine rewrite. Extract the minimum reusable interfaces needed for the requested chapter and preserve observable behavior.

## Evidence authority

[Current V23 receipt](../../art/v23/validation.md) records the prior run's 218 passing tests and its coverage limits. It is historical evidence for that build, not proof the current checkout passes. [V22](../../art/v22/validation.md), [V19](../../art/v19/audit.md), [V16](../../art/v16/validation.md), and [V15](../../art/v15/validation.md) explain specific fixes. Root VALIDATION.md and VALIDATION-V14.md contain superseded experiments; never infer current balance or panel behavior from them.
