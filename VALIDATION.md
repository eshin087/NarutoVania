# Story and combat revision validation — September 6, 2026

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
