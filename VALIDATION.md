# Story Boss Rush — validation record

Validated September 5, 2026 in the available desktop Chromium browser.

## Combat and story

- All seven playable phases were completed through ordinary keyboard actions and a development input pilot using the same action path. The pilot never overrides health, positions, time, boss choices, or story outcomes.
- The final verification was split at checkpoints for browser-focus recovery and tuning reloads; it was not one uninterrupted wall-clock recording. Successful active phase timers were approximately: opening Kakashi 103 s, rescue Naruto 100 s, copied-water Kakashi 113 s, Sakura protection 65 s, Sasuke mirrors 93 s, awakened Naruto 112 s, final Kakashi 148 s. That is about 12 minutes 14 seconds of active combat, plus 2 minutes 16 seconds of unskipped cinematics and short hit-stop/transition time: approximately 15 minutes of play. First-play duration depends on proficiency, retries, and skipping.
- Both Haku phases were cleared without using an ultimate. Sasuke interrupts and exhausts Haku without breaking ice; awakened Naruto can damage and break mirrors with ordinary attacks and techniques. Full-meter ultimates were deliberately left unused during those tests.
- Tested melee strings, heavy charging, ranged tools, ground/air/slide dashes, timed parries, held guard, substitution, clones, character techniques, and combat-earned ultimates. Boss guard breaks provide a punish window instead of skipping story state.
- Observed water-clone pressure, delayed red attacks, mist silhouettes/cues, mirror formation/transfers, senbon patterns, recovery windows, and late-phase boss moves. The final 5,200 HP Zabuza duel cleared with 39 player HP and 23 parries.
- Natural story transitions reached water-prison capture, transformed-shuriken rescue, the hunter-nin deception, Sakura's defense objective, Naruto's arrival before Sasuke's sacrifice, awakening, Naruto's hesitation, Haku's interception, Gato's betrayal, Zabuza's mouth-kunai stand, snowy aftermath, and victory.
- Verified cinematic skipping, fresh-character resources, injured/captured actor staging, and checkpoint continuation. Actual HP depletion produces defeat; phase retry restores resources and removes transient entities. Earlier repeated retry testing uncovered a Phaser shutdown-order issue, which was fixed before final checks.

## Automated checks

64 tests pass across five test files (47 boss-rush checks plus 17 retained regression checks). TypeScript checking and lint pass.

Boss-rush checks cover parry boundaries/rearm, frontal versus rear defense, red attacks, guard breaks, resource gates/regeneration, dash limits/invulnerability, slide projectile clearance, safe substitution, event timing, duplicate-hit prevention, combo buffering, heavy charging, recovery cancels, boss selection/costs, mirror rules, canonical handoff/skip state, and legacy checkpoint migration.

Standard controller mappings, edge detection, trigger separation, disconnection, prompt switching, and focus-loss clearing/pause are tested with simulated input. A physical controller was not available.

## Artwork, audio, and presentation

- The asset verifier passes dimensions, alpha, frame bounds, foot anchors, at least six distinct frames per melee strike, and four-frame defensive sequences for all 432 core frames. Generated variants, scenery, props, and effects were inspected separately, including masked/unmasked Haku and the ending weapon correction.
- All 55 decoded MP3 assets load. File measurements show the highest recorded sample peak below -2.98 dBFS. Playback uses bounded decoded-buffer sources, a compressor, independent buses, music crossfades, and seam processing, with no continuous oscillator drone. Source attribution and edit/license manifests are available in Credits.
- Runtime audio checks found no missing buffers. Pausing returned music/effect/voice source counts to zero; retry and character transitions clean up previous playback. This is a technical audio check, not a claim of physical speaker/controller hardware verification.
- Checked the title, combat HUD, controls, credits, separate volume settings, pause/resume, native fullscreen and the fullscreen controls dialog. Temporary viewport checks included 1024 × 768 and 1280 × 800; the game also fit the available ultrawide fullscreen display. Player/boss HP share a baseline; ability tiles remain compact.
- Foreground gameplay generally reported approximately 164–165 fps on the available high-refresh display. A hidden preview was throttled to 1 fps; the timing test was paused and moved to a responsive preview instead of treating background throttling as a gameplay benchmark.
- Transient entities stayed bounded: two base fighters (plus story allies), at most two player clones, a single temporary water clone, and finite projectile/effect pools. Mirror combat snapshots stayed around 42–49 display objects; ordinary combat returned to its baseline. No console errors or warnings were recorded in the completed final-phase pass.
- The static release preview loaded the finished artwork and public WebMCP actions. Development input/pilot tools are absent from emitted production JavaScript.

## Delivery scope

Single-player desktop browsers. No mobile touch controls, multiplayer, accounts, or additional chapters. The original public game remained live throughout implementation and validation. Publication and the final public smoke test are performed after these checks.
