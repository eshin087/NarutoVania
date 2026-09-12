# Regression and evidence map

Verified paths: 2026-09-11, continuous-duel revision based on `fc8687a`. The revised candidate passes 264 tests / 31 files; this map does not expand what any individual test establishes. Read test contents before assuming coverage.

| Changed area | Existing automated entry points | Required rendered / behavioral checks |
| --- | --- | --- |
| Shared melee, defense, stamina | [combat-core.test.ts](../../game/combat-core.test.ts), [combat-v8.test.ts](../../game/combat-v8.test.ts) | Stationary strings, exact contact, heavy/air attack, frontal block, fresh-press parry, break and recovery in both chapters |
| Inputs and modals | [battle-input.test.ts](../../game/battle-input.test.ts), [input.test.ts](../../game/input.test.ts), [Chunin boundaries](../../game/chunin/boundaries.test.ts) | Held confirm through menus, Escape/Start, focus loss, reconnect, pause during story; simulated vs physical coverage recorded separately |
| Double jump / airborne parry | [jump-state.test.ts](../../game/jump-state.test.ts), [sand-flight.test.ts](../../game/chunin/sand-flight.test.ts) | Second jump, rejected third boost, landing/coyote reset, independent dash, airborne guard in both chapters; successful collision parry separately from visible guard |
| Continuous duel / threshold saves | [continuous-duel.test.ts](../../game/chunin/continuous-duel.test.ts) | One boss object/max/HP across scenes, exact fractional checkpoint health, retry/continue/skip, legacy migration and debug isolation |
| Saves / chapter ownership | [Chunin boundaries](../../game/chunin/boundaries.test.ts), [production smoke](../../tools/smoke-chapters.cjs) | Valid/malformed/legacy saves, independent reset/continue, debug exact-save comparison, chapter unmount and next chapter startup |
| Gaara selector/barrages/damage | [Chunin combat](../../game/chunin/combat.test.ts), [sand fairness](../../game/chunin/sand-fairness.test.ts) | Major alternation, ground routes center/edges, action-lock and discrete receiver clearance, grouped parries, imperfect defense, guard-break cancellation |
| Ricochet trajectories / routes | [sand-flight.test.ts](../../game/chunin/sand-flight.test.ts), [bounce-route.test.ts](../../game/chunin/bounce-route.test.ts) | Exact floor contact, harmless hold, rebound parry, finite lifetime; 162 real-resolver route cases across phases/edges/locks/frame steps |
| Lee Lotus presentation | [Lotus choreography](../../game/chunin/lotus-choreography.test.ts), [Chunin combat](../../game/chunin/combat.test.ts) | Continuous bind/inversion/orbit/pull/descent, visible bandage contact, exactly-once ultimate damage, skip restores actors and reused textures |
| Zabuza/Haku patterns and returns | [barrages.test.ts](../../game/barrages.test.ts), [revision-v23.test.ts](../../game/revision-v23.test.ts), [presentation-v16.test.ts](../../game/presentation-v16.test.ts) | Aim from hands, sword two passes/catch, water lifecycle, distinct mirror volleys, reflection cleanup and cadence |
| Temporary effects | [presentation-lifecycle.test.ts](../../game/presentation-lifecycle.test.ts) | Nested effect spawning, pause, guard break, repeated retry and scene change; no persistent sparks or sources |
| Body/art/camera changes | [zabuza-presentation.test.ts](../../game/zabuza-presentation.test.ts), [v15-assets.test.ts](../../game/v15-assets.test.ts), [Chunin boundaries](../../game/chunin/boundaries.test.ts) | Measured idle/run/attack/reaction in both facings, true kneeling/fallen size, full tails and mirror interiors at camera edges |
| Story / canonical outcomes | [story-boss.test.ts](../../game/story-boss.test.ts), revision tests, chapter runtime | Natural combat entry and Scene Select, contacts in order, skip equivalence, pause, one-time dialogue, continuity of bodies/camera |
| Audio | [audio-v9.test.ts](../../game/audio-v9.test.ts), [audio-v11.test.ts](../../game/audio-v11.test.ts) | Actual active-manifest cues, source counts, mix under repetition and slider behavior. Old file names do not imply full V23 listening coverage. |
| Chapter 2 audio profile | [audio-profile.test.ts](../../game/chunin/audio-profile.test.ts), [audio smoke](../../tools/smoke-chunin-audio.cjs) | Exact exported hashes, PCM/sample boundaries, pools/licensing, all 21 browser decodes, public auditions, actual output peak and cleanup. Analyser data is not listening. |

## Commands and scope

Read [package.json](../../package.json) before use. Standard code validation: `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`. Static client output is `dist/client`. Use installed dependencies; do not reinstall merely to check Markdown.

- [tools/playtest-chunin.cjs](../../tools/playtest-chunin.cjs): development ordinary-input pilot, no HP/position/time/outcome overrides. Writes ignored `outputs/` receipts. Efficient automated behavior cannot certify human feel.
- [tools/smoke-chapters.cjs](../../tools/smoke-chapters.cjs): static/public UI smoke, Chapter 2 scenes/resources/modal/controller/focus/resize/debug-save checks, and four Chapter 1 fight initializations. This is **not a full Chapter 1 playthrough**.
- Browser scripts accept `NARUTO_TEST_URL`, optional `NARUTO_BROWSER`, and `NARUTO_PLAYWRIGHT_MODULE` if Playwright is outside module resolution. Discover paths on the current machine rather than embedding a previous user's cache path in instructions.
- Public status/start/pause/retry tools are separate from development pilots. Test production exclusion of pilots; do not deploy direct-state overrides.

For documentation/skill-only changes, validate links, source paths, frontmatter, invocation boundaries, and realistic workflow decisions. Do not claim new gameplay validation from a docs check. For gameplay/shared-system edits, freeze source during final playback and run affected prior-chapter regressions. Record candidate hash, inputs, scene list, results, and unavailable coverage in the chapter QA report.
