# Current implementation map

Source inspected 2026-09-11 at `fc8687a`. Recheck current code for each task. [STATUS](../project/STATUS.md) owns active work and release pointers; [DECISIONS](../project/DECISIONS.md) owns scoped product choices. This file maps implementation, not historical plans.

## Product and chapter boundaries

Desktop single-player 2D boss rush, TypeScript/React/Phaser 3.90.0 with Vinext. Logical viewport 1280x720; static client output `dist/client`. Preserve keyboard/controller parity, pause/retry, fullscreen, sound sliders, reduced motion/shake, and public Scene Select. No extra platforming levels, filler waves, multiplayer, accounts, or touch controls are implied.

Chapter 1 has four playable fights: `mist` (Kakashi), `rescue` (Naruto with Sasuke), `mirrors` (Sasuke), `seal` (awakened Naruto). `copy`, `protect`, and `lightning` compatibility IDs do not imply additional playable fights. Story routing is not inferred solely from chapter.ts.

Chapter 2 is one Lee/Gaara encounter in three phases: `shield`, `speed`, `gates`. Lee uses physical stamina-based techniques. The canonical outcome is a brief ending after successful gameplay. Both chapters use in-engine story and automatic dialogue; manga/portrait panels were removed.

## Shared entry, persistence, and boundaries

| Area | Active files / behavior |
| --- | --- |
| App entry | [app/page.tsx](../../app/page.tsx) to [game/chapters.tsx](../../game/chapters.tsx); lazy mounts one chapter page |
| Registry/save validation | [chapter-registry.ts](../../game/chapter-registry.ts); `land-of-waves`, `lee-gaara`; v3 independent checkpoints/seen/completed |
| Legacy compatibility | Imports valid `narutovania.checkpoint.v2` into v3; original key retained, Chapter 1 bridge preserves compatibility writes |
| Shared combat | [combat-core.ts](../../game/combat-core.ts); generic Combatant ID, existing Chapter 1 character union stays scoped |
| Shared actions | [battle-input.ts](../../game/battle-input.ts); injectable input bridge, modal ownership and held-input handling |
| Shared settings/audio | [boss-bridge.ts](../../game/boss-bridge.ts), [recorded-audio.ts](../../game/recorded-audio.ts); Chapter 2 reuses settings and recorded buffers |
| Effect ownership | [presentation-lifecycle.ts](../../game/presentation-lifecycle.ts); queued effects and interruption cleanup |

Adding a third chapter still requires explicit registry/save-parser/selector wiring: several lists and branches name the current two chapters. The registry is implemented, but it is not a generic plugin loader. Follow current code instead of widening every old character union or assuming a descriptor alone mounts a new runtime.

## Chapter 1 implementation

| Area | Files |
| --- | --- |
| UI/runtime | game/boss-page.tsx, game/boss-runtime.ts, game/boss-gameplay.ts |
| Kits/story route | game/chapter.ts, game/story-director.ts |
| Bosses/barrages | game/boss-ai.ts, game/barrages.ts, game/mirror-volley-v23.ts |
| Story staging | game/story-v22.ts, game/ending-v23.ts, game/ending-timing-v23.ts plus referenced older cinematic controllers |
| Art/normalization | game/battle-art.ts, game/presentation-v16.ts, game/art-v22.ts, game/art-v23.ts and cumulative adapters |
| Mirrors/prison | game/mirror-v15.ts, game/water-prison.ts |
| Weapons/projectiles | game/returning-sword.ts, game/projectile-rules.ts |
| Previews | game/scene-catalog.ts, game/preview-catalog.ts, game/animation-preview.ts |
| Public tools | game/boss-webmcp.ts |

Legacy `game/gameplay.ts` and `game/runtime.ts` are not the current app entry. Old versioned assets/code may still be active. Texture-prefix checks and layered scale adapters require care before introducing new metadata or removing a pack.

## Chapter 2 implementation

| Area | Files / notes |
| --- | --- |
| Page/HUD/controls | game/chunin/page.tsx, game/chunin/style.css |
| Deterministic fight | game/chunin/combat.ts; phase tuning, selector, emissions, contact/resource events |
| Phaser/story/presentation | game/chunin/runtime.ts; stage ownership, cinematics, ultimates, tool registration |
| State/persistence | game/chunin/bridge.ts; own snapshot/commands, debug isolation, shared settings |
| Generated sheets | game/chunin/art.ts + public/art-chunin/manifest.json; scale currently in adapter, frame/root data in manifest |
| Validation | game/chunin/combat.test.ts, game/chunin/boundaries.test.ts; tools/playtest-chunin.cjs, tools/smoke-chapters.cjs |

## Extension and evidence rules

- Preserve both current runtimes and save records; test switching away destroys chapter-owned canvas/input/audio/tool registrations.
- Namespace new events, texture keys, and scene/fight IDs. Keep debug sessions out of normal progress.
- Keep production status/start/pause/retry tools distinct from development pilots/state overrides.
- Use [asset index](../project/ASSET_INDEX.md) and [regression map](../project/TEST_MATRIX.md) for focused work; avoid speculative engine rewrites.
- Read active chapter logs and dated QA receipts. Root VALIDATION.md/VALIDATION-V14.md describe superseded experiments and cannot override current balance or panel behavior.
