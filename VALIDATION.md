# V11 validation � faster combat and signature barrages

The V11 checks below supersede older revision results retained later in this file.

- TypeScript, lint, production build and 126 automated tests cover defense timing, contact frames, movement, single-hit behavior, returning sword ownership, story progression, saved preferences, barrage schedules and transparent-asset metadata.
- The full browser chapter completed all four fights through acknowledgment of the snowy ending using the development pilot's ordinary input actions, without resource overrides. The first complete pass finished with 30 HP and no retries, with 153 active combat seconds. A second confirmation run finished with 53 HP, no retries and 145 active combat seconds. The final movement-gap build also completed the acknowledged snowy ending: 38 HP, no retries, 148 active combat seconds, and no console errors.
- Every original Scene Select entry initializes; debug use leaves the normal checkpoint unchanged. All four new barrage auditions ran. Auditions isolate the selected pattern between repeats.
- Three repetitions of each pattern exercised left, right and central starting areas with ground movement only. Final spirit runs ended at 100 HP; floor eruptions and needle curtains at 100 HP; crossfire at 86 HP with a needle and red-lunge hit. The route harness used movement only; normal combat also provides ground dash and parry/block for the needles. Physical collision with the boss can limit movement to the far edge in the lakeside arena.
- Hostile projectiles are capped at 48 and pooled for barrages. Completed auditions leave zero live projectiles. Emission cancellation, scene changes, retry and guard-break paths restore camera/gravity and dispose hazards. Repeated ordinary retries kept two fighters and 13 display objects.
- Simulated controller confirmation, held-input quarantine, pause, fullscreen and resize pass. One desktop sample measured median 165 FPS, minimum 159 across 399 samples. Hardware controller testing remains unavailable.
- Generated sword and hurt strips were compared with idle references. The art manifest contains 52 normalized reaction/sword frames, plus 34 barrage/casting frames. Body scaling is calibrated visually; exact 5% anatomical similarity is not certified. The weaponless Zabuza torso remains somewhat broader than the idle drawing.
- 29 fresh primary effects use single recordings, including three punch, kick, swing, sword-swish and parry variants. Source/license/edit records are in `/audio-v11/manifest.json`. Decoded replacement peaks remain below -3 dBFS, with zero clipped samples. An actual 45.6-second browser mix capture across combat, Sharingan and mirror volleys peaked at -1.55 dBFS, RMS -24.69 dBFS, with no invalid samples. Subjective listening is not claimed; placeholder voices are muted by default.
- The initial spirit ground-route test exposed crossing trajectories; trajectories were corrected to pass below ground before entering the reserved corridor and the three-run test then finished without damage. An earlier route harness died while ignoring ordinary attacks; isolated auditions were added so pattern practice is useful and repeatable.

The production-format local smoke test passed all six public tools, four barrage auditions with replay/pause, seven sound previews, and original scene transitions, with no missing requests or console errors. Public deployment is checked after publication. Local raw test captures are excluded from the deployment.

---

# Returning sword, natural reactions, and cinematic polish - September 6, 2026

## V10 validation

-112 tests pass across9 files; TypeScript, lint, and production build pass.
- Full fresh Edge browser run completed all four fights and the full story through manual-style panel confirmations to snowy victory. The development pilot uses normal input actions, never writes health, positions, clocks, or outcomes. Active combat152seconds; final health61. No browser errors. This is automated browser coverage, not a human difficulty judgment.
- All14 public Scene Select entries initialized; normal save restored byte-for-byte. Panels held at3500/10800ms with held simulated controller A; release and new press were required. Pause/resume tested during both180ms panel exit and250/350ms scene fade.
- Actual sword flight captured outbound,120ms turnaround, return, and catch. Timed keyboard parry caused harmless return and catch; maximum one sword. Pure rules cover moving-hand catch, speed, per-pass reset, harmless deflection,700ms windup and unchanged damage. Existing receive/hurtbox tests cover block, parry, damage immunity, dash, and swept projectile intersections.
- Four replays each returned to2fighters,0projectiles,0effects,0decoys,13display objects. Sampled399 combat frames: median165fps, minimum160fps. Fullscreen and resize passed; no missing assets or console errors in the production smoke test. Production exposes six public WebMCP controls and excludes input pilots.
- Generated art includes18 sword frames,24 combat guard-break frames,24 unique cinematic reaction frames (plus restrained Kakashi alias), and30 ending frames. Reviewed transparent atlases and idle comparisons; runtime uses manifest anchors and body scale. Haku retains an unmasked weary variant after mask removal. Mercenary/Gato falls use animation frames, not rotated standing images.
- Actual rendered audio capture45.66seconds: peak-2.04dBFS, no clipping, NaNs, or infinities; missing audio list empty. Sword release/catch reuse licensed recordings, now triggered at their visual contacts with the duplicate ice cue removed. Source/license/reference limitations are retained in art-v10/sword-audio-mapping.json and audio-v9/manifest.json. No YouTube soundtrack extracted, timestamps invented, or subjective listening claimed.
- Physical-controller and subjective listening verification remain unavailable. Exact per-landmark five-percent anatomy certification is not claimed for all legacy artwork.

Evidence lives in ignored outputs/: chapter-v10-progress.log, visual-v10.log, sword-parry-v10.log, transition-pause-v10.log, lifecycle-final-v10.log, debug-final-v10.log, smoke-static-v10.log, build-final-v10.log, rendered-mix-v10.webm and mix-v10-analysis.txt. Earlier interrupted development runs were discarded after hot reload; the final run above used the frozen implementation.

---

# Animation, combat clarity, and manga transitions - September 6, 2026

## Current revision

108 automated tests, TypeScript checking, and lint pass. New coverage includes panel waiting/entrance gates, single-scene skipping, all fourteen scene-selector entries, final snowy acknowledgment, debug save/history/stat isolation, held keyboard/controller confirmations, boss stance timing and eligibility, shared attack polygons, aerial contact timing, audio pool completeness, and cancellation of pending auditions.

A fresh headless Edge browser completed all four fights and the full story chain to acknowledged snowy victory. The development-only pilot uses normal input actions and never overrides resources, positions, clocks, or outcomes. Active combat time was166 seconds; final Naruto health69, chakra9. This precise automated defense is not a human difficulty benchmark. No page/console errors or missing audio appeared. Victory cleared fighters/projectiles/effects/decoys; one music source remained. HP, hostile damage, ultimate charge, and four-fight scope are unchanged.

Public-menu local validation opened all four fights and ten transitions, including separately initialized interception, Gato, and snowy-rest scenes. Normal save remained byte-for-byte unchanged. Snow held across pause/resume until fresh Enter. Simulated gamepad A held through the first shuriken panel did not advance it; release/repress advanced exactly one panel, and held A did not dismiss the second. Replays restored identical initial entity counts four times (two fighters, zero projectiles/effects/decoys,13 display objects). Fullscreen and resize were exercised. A normal-input idle defeat reached0HP; retry restored100 health/chakra/stamina and the opening phase. Physical-controller hardware was unavailable.

A separate20-second combat observation captured real PERFECT PARRY feedback at the defender, with400 performance samples (median165FPS, minimum162FPS on this desktop). These measurements are specific to available hardware. Sharingan and aerial screenshots were inspected. Reduced-motion settings suppress afterimages and reduce flashes.

The actual browser audio output was captured for45.42 seconds across Kakashi combat, Sharingan, parries, and Haku mirror volleys. Decoded rendered-mix peak was-3.50dBFS, with no NaN/infinite samples or clipped peaks; RMS-25.12dBFS. The78 replacement clips use documented reusable recordings and nine three-variant pools. Audio sources are bounded and priority-aware; important cues duck music. Existing licensed music remains. Subjective listening and official-reference timestamps could not be verified with the available tools; no original Naruto audio was extracted, and no unverified timestamps are asserted. Public menu auditions provide direct sound checks.

All12 generated manga panels,36 aerial frames, and48 regenerated Kakashi/Zabuza grounded-melee frames were visually inspected before integration. Sprite normalization now uses texture/frame body scale and anchors, excluding weapons and effects. Grounded metadata was visually calibrated; exact per-limb5% tolerance across every legacy frame is not certified. Generation prompts, frame metadata, and source licenses are retained in public/art-v9 and public/audio-v9.

The final static production build was smoke-tested locally after the replacement melee sheets and final Zabuza body correction. Six public WebMCP actions registered; development input-pilot tools were absent. Normal keyboard melee/aerial input, hunter panel advancement, and single-scene skip worked, with no missing assets or browser errors.

## Historical validation below

# Sword, support, and story revision — September 6, 2026

## Current revision

83 automated tests, TypeScript checking, and lint pass. Added sword contact/anticipation alignment, three-strike parry rewards, support decision/resource tests, one-second glamour stun expiry, four-phase progression, and legacy copy-checkpoint migration.

A fresh headless Edge browser completed all four playable phases and the natural ending using the existing development input pilot. The pilot presses ordinary game actions without overriding HP, position, time, resources, or outcomes. Total active combat time was 164 seconds with accurate automated defense; this is not an average-human difficulty benchmark. Final Naruto health was 72, chakra 22. The removed copy duel was never entered. No browser console/page errors or missing audio were reported. Victory cleaned up all fighters, projectiles, effects and decoys; one music track remained.

A separate normal saved-checkpoint test verified the rescue scene and new technique: 24 chakra consumed, boss stunned, one generated adult clothed illusion, no damage or ultimate charge granted by casting. The complete ending was replayed naturally and captured at interception, betrayal, final stand and snow; it reached victory with no page errors. Stable idle/pose settling, staged crowd entry, camera bounds, normal-scale prison rendering, and the new icon were visually inspected. A final small refinement corrected rescue landings, prisoner framing, and Kakashi's interception attack pose; automated checks were rerun afterward.

The generated 24-frame Zabuza sword atlas and four-frame glamour atlas were inspected on a contrasting backdrop and checked for transparent cell borders, consistent anchors, complete swords, and scale. Prompts, per-frame rectangles/anchors, source bounds and QA are in public/art-v8. Senbon use a thin procedural silver needle and straight velocity-aligned trail instead of a spinning/diagonal bundle.

Physical-controller hardware and listening evaluation were unavailable. Existing simulated input/controller tests pass. The headless run is a functional browser playtest, not a physical-input or subjective difficulty assessment.

---

## Previous-release evidence (historical)

# Story and combat revision validation — September 6, 2026

## Latest ultimate adjustment

Doubled charge from damaging attacks, projectiles, perfect parries, mirror interrupts/breaks, and interceptions. Updated the parry reward regression. Meter cap and ultimate self-charge exclusion are unchanged. This focused tuning change is validated with automated checks; no new browser playthrough was performed.

## Latest difficulty adjustment

Playable boss HP: 1250 / 850 / 1200 / 1200 / 1200. Hostile damage multiplier: 0.70, down from 0.95. Sasuke objective: 45 seconds and one mirror guard break. Automated boundary tests updated. The browser timing observations below describe the preceding harder release, not this easier tuning.

## Current checks

75 automated tests pass. Type checking and lint pass. Coverage includes defensive timing, stamina gates, boss guard recovery resilience, preserved multi-hit strings after deflection, five-phase progression, legacy cinematic checkpoint migration, natural/skip state parity, the new Sasuke objective, and normal-jump reachability of upper mirrors. Existing simulated-controller and input tests remain passing. Physical controller hardware was unavailable.

## Browser evidence

The local browser was played through the first four playable phases using ordinary game actions and a development-only input pilot. No HP, position, phase, or outcome overrides were used. The opening combined deliberately early guards with accurate defense; later phases used more accurate defense. These are tuning observations, not average-human benchmarks.

- Opening Kakashi: 55.97 seconds, 11 HP remaining after several missed defenses.
- Naruto rescue: 55.53 seconds, 90 HP remaining; chakra became constrained during techniques. New launcher kit was exercised.
- Copy duel: 47.27 seconds, 41 HP remaining; water/mist attacks and Chidori used. Efficient finish was below the 60–90 second target.
- Sasuke: 60.00 seconds, two mirror guard breaks, 38 HP remaining; no ultimate. The 38-second mirror formation remained active through breaks, then expired normally. The objective transitioned to the protective-sacrifice cinematic.
- Awakened Naruto: reached 32.71 seconds, 91 HP, six mirrors remaining, without ultimate. Final-phase completion was NOT verified in this revision.

Checkpoint continuation and handoffs to Naruto, Kakashi, Sasuke, and awakened Naruto worked. The hunter-nin/Sakura cinematic chain entered Sasuke directly. Browser screenshots verified the water-prison manga panel, readable speech bubbles, Sharingan feedback, grounded characters, and enclosing mirrors. Haku facing after retreat and upper-mirror reach were refined afterward and covered by source review/tests.

Browser access then failed with a Windows sandbox ACL initialization error, including after reconnection. Consequently, a full final-phase/ending replay, new death/retry exercise, final visual pass, and deployed-browser smoke test could not be completed. Unit tests verify the five-phase ending and skip parity; the ending renderer reconstructs the same final tableau for skip/natural completion. This is not a substitute for final visual review.

## Assets and remaining limits

Built-in imagegen produced the four-frame grounded tidal-wave strip, six story panels, and Naruto launcher icon. The asset agent inspected frame bounds, transparency, alignment, and scene content; user-authorized code cleanup/normalization retained the generated art. Prompts and QA are in public/art-v5. The wave has a 900 ms presentation, delayed impact at 360 ms, and a fixed foot anchor. No original anime voice/music recordings were added.

The browser reported high desktop frame rates during the observed fights and no asset-load error. Formal sustained performance, audio listening, physical-controller testing, and a completed final no-ultimate Haku clear remain unverified for this revision. Prior validation must not be read as verification of those updated behaviors.

Final focused browser pass: Sasuke cast three techniques over roughly 20 seconds, including Great Fireball and Windmill Shuriken, used a dash, and moved between x=105 and x=461 while preserving spacing. The final ending replay confirmed Kakashi uses an attack pose at interception and reaches victory with no page errors after the last cinematic edits. Build completed successfully; final typecheck/lint/83 tests passed.
