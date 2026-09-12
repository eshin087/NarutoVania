# Continuous Lee/Gaara duel — validation, 2026-09-11

Candidate: local revision based on `fc8687a`, following the [art/combat revision](QA_REVISION_2026-09-11.md). Final commit/deployment receipt belongs in the production log. This report supersedes the earlier three-independent-HP-pools timing, not its retained artwork evidence.

## Accepted mechanics

- One 6000-HP boss; weight/Gates transitions at 4200/2100 preserve exact remaining HP, including damage past the threshold. Same combatant object and accumulated combat clock across both power-ups.
- User selected latest-power-up Retry. Retry/Continue use exact checkpoint-entry boss HP, full player resources and the same maximum. Legacy saves fall back to the appropriate threshold. Debug never writes normal progress.
- One extra airborne jump in both active chapters by recommended default. Coyote time, input buffer, variable height, independent air dash and existing parry/rearm windows retained.
- Floor-bouncing sand has one bounce, 180ms harmless contact preparation, finite lifetime and parryable rebound. Full trajectories and action locks feed the pre-emission route planner. No visible shots deleted to manufacture gaps.
- Ordinary release glints and soft preparation sound; complete ground footprints with bright boundaries. Ground spells remain dodge-only.

## Automated and behavioral evidence

264 tests / 31 files pass; typecheck, lint and production build pass. Existing large-Phaser-chunk warning remains nonblocking.

Independent real-resolver audit: 1944 single-route cases plus 324 seven-wave scenarios across phases, center/edges, remaining action locks, both drift directions and 8/16/40ms frames. The multi-wave audit accepted 2268 emissions with two safe delays, no omissions and no damage on the accepted paths. A persistent 162-case subset is in `game/chunin/bounce-route.test.ts`; partitioning, rebound parry, lifetime and cancellation have focused tests. This is bounded route evidence, not a guarantee for arbitrary player movement.

Independent runtime harness verified fractional checkpoint HP 4183.2/2079.4 through natural handoff, skip, retry and reload/continue; max remains 6000, elapsed is preserved, no boss replacement. Legacy/completed saves and debug isolation pass. Airborne rebound deflection passes the actual combat resolver and preserves air-dash ownership.

Two frozen ordinary-input browser playthroughs completed the entire duel and canonical ending without state/resource/time/outcome overrides:

| Run | Combat time | Retries | Final HP | Parries | Ultimates |
| --- | --- | --- | --- | --- | --- |
| Efficient 20ms decisions | 97.91s | 0 | 95 | 5 | 9 |
| Less precise 125ms decisions, slower attacks and early parries | 109.79s | 0 | 70 | 5 | 9 |

Both had no page errors, no missing decoded assets, and zero final shots/effects. Max Gaara health stayed 6000; observed threshold overkill persisted. Available desktop loop was usually near 165fps. These runs are faster than the 2–3-minute human target; HP was not inflated again without user feedback. They do not certify representative human difficulty. Reports are disposable `outputs/ch2-final-playthrough.json` and `outputs/ch2-imperfect-playthrough.json`.

## Independent rendered critique

These IDs use the **continuous revision** namespace (earlier art-revision IDs remain in their original receipt).

| ID | Finding | Retested correction |
| --- | --- | --- |
| CONT-R09 | Close-range weight/Gates/ending overlap | 700ms visible separation/landing, post-strike weight retreat and wider shell reveal; both facings pass. |
| CONT-R10 | Handoff makes Lee face away | Preserve actual staged facing before control return; both handoffs pass. |
| CONT-R11 | Ground warning too faint | Full footprint, dark backing/bright border and buildup; rendered close-range check passes. |
| CONT-R12 | Ending aura detached during recoil | Render aura from the final actor position; pass. |
| CONT-R13 | Point-blank hand preparation hidden | Short cyan-white cast glint above fighter depth; pass. |
| CONT-R14 | Direct Gates preview aura appears before activation | Entry aura keyed to story state; both-facing preview lacks early aura and reveals it during Gates charge; pass. |

Reviewer accepted scene spacing, handoffs, aura behavior and cue visibility after r8/r9 captures. Both chapters visibly perform a second jump and reject a third boost; airborne guard activates. Successful airborne projectile deflection was tested in the resolver, not established by the isolated rendered input trial. Accepted six-atlas/108-frame anatomy and source-pixel cleanup review remains in the preceding receipt. Root inspected the final Gates staging as well.

## Audio integration

21 short mono PCM16/44.1kHz recordings, 473358 bytes, edited/exported in the installed Audacity 3.7.9 task project. New Chapter 2 profile uses Kenney/Fantozzi CC0 recordings and Taira Komori project-use swishes/tell. Sources, licenses, hashes, recipes and credit links are in `public/audio-chunin/manifest.json`. No anime soundtrack extraction, added noise, pitch shifts or stacked source layers.

Exports are 0.14–0.41s, maximum measured peak -7.4995dBFS, zero clipped samples and quiet boundary samples. Static production browser decoded all 21, auditioned eight public Sound check cues, exercised an ultimate/combos/sand pattern, paused and changed chapters. Actual monitored mix peak was 0.333184, with no HTTP/page errors or missing sounds. Pause left zero effect/music sources; chapter exit closed its AudioContext. Existing sliders/music and Chapter 1's profile remain. The analyser test is `tools/smoke-chunin-audio.cjs`.

**Subjective listening remains unperformed.** Measurements, successful playback and low peaks do not establish pleasant sound. Public Sound check enables user feedback. Physical-controller play and representative human difficulty remain unverified.

## Production browser gate

`tools/smoke-chapters.cjs` passed against the final static build on port3002: Chapter 2 intro/ultimate, controls modal ownership, simulated controller connection/prompts, focus pause, resize, all power-level initializations, ending, debug save isolation and unmount; Chapter 1's four fight initializations; production pilot exclusion. Zero page errors or missing HTTP assets. This is not a new full Chapter 1 playthrough.

Publication is authorized to GitHub/Vercel after these gates. The legacy ChatGPT Site is outside this Chapter 2 release scope. Record public smoke and commit parity in the production log after deployment.
