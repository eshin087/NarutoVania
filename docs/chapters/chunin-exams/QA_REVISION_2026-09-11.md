# Chapter 2 revision QA — 2026-09-11

Historical art/combat revision receipt based on `fc8687a`. The later continuous-health, double-jump, ricochet and Audacity work is recorded in [continuous revision QA](QA_CONTINUOUS_2026-09-11.md), which supersedes the pending-audio and separate-phase tuning below. Preserve this receipt as evidence of the accepted generated artwork and prior fixes.

## User choices and scope

- Two to three minutes total combat across three phases; preserve canonical brief loss and Chapter 1.
- Every travelling sand projectile is parryable. Ground grabs/eruptions retain the existing dodge-only behavior as the stated default pending optional clarification.
- Recognizable Hurricane, Lotus Launcher, bound Primary Lotus, bandage-assisted Reverse Lotus, persistent fiery Gates aura, animated sand and better cutscene causality.
- New audio editor proposed: Audacity3.7.9 with mod-script-pipe. No audio files changed, no soundtrack extracted, and no listening sign-off claimed.

## Combat evidence

Read-only independent audit reproduced Hurricane overshoot at50/80/88px, frozen immunity rejecting ultimate damage, and one parry followed by a same-volley guard break. Focused regressions now verify contact in both directions and at edges, cinematic damage after a recent hit, grouped deflection without repeated rewards, separate-volley defense, overhead/large-shot parries, and cleanup.

The independent route sweep found499 collisions among8181 continuously planned routes because the actual resolver uses the receiver's current frame position. Including a40ms walking clearance margin eliminated those reproduced failures in the audit. Integration tests replay diagonal proposals through the actual swept resolver at8/16/40ms. This is bounded evidence, not a proof that arbitrary human movement is safe.

Frozen ordinary-input browser run completed all three phases and the ending with **125.23seconds combat**, **no retries**, **55HP**, **6perfect parries**, and **9ultimates**. No health/position/time/outcome overrides. Final0shots/0effects, no page errors, no missing decoded audio. Report: ignored `outputs/ch2-final-playthrough.json`. Efficient input automation does not establish every human player's difficulty or duration. A later route-clearance correction is covered by focused regression and does not change HP/damage.

## Independent rendered critique

Reviewer inspected ordinary UI/Scene Select and keyboard actions, recorded footage and screenshots in temporary QA directories. Exact full-video timestamps or frame-perfect anime reproduction are not claimed.

| ID | Finding | Revision / current result |
| --- | --- | --- |
| CH2-R01 | Primary Lotus remained upright | Combined generated bind/rotation/inversion sequence; sampled retest passed in both facings. |
| CH2-R02 | Reverse Lotus lacked tether and pull | Wider continuous orbit, hand-to-torso bandage, distinct downward contact; sampled retest improved/passed. |
| CH2-R03 | Gates identity vanished during combat | Persistent owned animated aura; sampled gameplay retest passed. |
| CH2-R04 | Weights disconnected from hands | Generated removal/hold/release, small floor impacts; sampled retest passed after sequence scale correction. |
| CH2-R05 | Speed reveal only narrated | Lee outruns sand and contacts Gaara's armor; sampled retest passed. |
| CH2-R06 | Guy never clearly intercepted | Run, plant, palm contact, dispersed sand, then Lee's rise; timing/spacing passed. |
| CH2-R07 | Cleanup erased Guy's wrists and misplaced hands | Original-pixel preservation masks; targeted two-facing ending retest passed. |
| CH2-R08 | Gaara loose wisps shifted roots; cleanup then removed disconnected shoes | All 48 sandals reconnected with source-pixel ankle preservation; ten enclosed background holes cleared. Both-facing rendered retest passed. Final root follows the measured sandal midpoint instead of arm extent; both-facing cast/idle and ending retests passed without the lateral snap. |
| CH2-R09 | Fixed-grid sand crops sliced adjacent effects | Repacked whole components using inspected uneven row bands; final atlas review passed. |

Visibility after paired-Lotus skip, reset of reused shield texture/origin, canceled projectile-sprite cleanup at ultimate entry, and exactly-once310-damage ultimate contact passed independent source-level/in-memory retests.

All six integrated atlases passed independent raster acceptance: 108 complete frames, at least 40 source pixels of padding, no orphaned hands, missing sandals or sliced effect tops. Reviewer also verified normal/casting Gaara and both-facing endings in the local browser without page errors. Evidence directory: temporary `narutovania-qa-r5-20260911`; durable findings are recorded above.

Final code checks: 251 tests / 26 files, typecheck and lint pass. Final production build and static browser smoke passed after the last anchor correction, with no errors or missing assets. The smoke covers Chapter 2 intro/ultimate/ending, modal/controller/focus/resize, debug-save isolation, Chapter 1's four fight initializations and development-pilot exclusion. Final anchor review passed independently in both directions. Temporary evidence: narutovania-qa-r6-20260911.

## Remaining gates

- Gameplay/art local validation is complete. No remaining blocking findings in the inspected slices; this does not certify representative human difficulty.
- Replace and audition audio after the user confirms installation; preserve separate sliders and Chapter 1 audio unless explicitly changed.
- Physical controller and subjective listening remain unverified. Simulated controller checks passed in the static smoke; a full physical-pad playthrough was not performed.
- GitHub/Vercel publication remains pending the complete revision. The current public game remains available. No legacy Sites publication is implied.
