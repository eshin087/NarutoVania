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
