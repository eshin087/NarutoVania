# Combat revision validation — September 6, 2026

## Combat and chapter

The revised seven-phase chapter was played through to victory in the desktop browser. Tests combined ordinary keyboard presses, manual input sequences, and a development-only input pilot. The pilot uses the real action scheduler and never edits health, positions, clocks, or story state. Its casual mode mistimes alternate guards, but it still attacks efficiently; it is not evidence of an average human player's completion time.

Observed phase completion times were approximately 31.5, 27.3, 40.2, 50.0, 36.2, 24.1, and 38.2 seconds. These are faster than the 45–75 second ordinary-play target. The tuning retains low boss HP and rewards strong counters instead of using the input pilot to justify longer health bars. Sakura's timed objective is 50 seconds. The copy duel and awakened Haku were both finished without an ultimate; the Haku clear retained a full ultimate meter.

Verified outcomes:

- Kakashi has Sharingan, Ninja Hounds, and Chidori in all three duels. His new melee strip uses palm/kunai, high kick, sweep, and heavy rising-kick sequences.
- Perfect parries remove at least 32 boss stamina, interrupt the attack, and reward chakra and ultimate charge. The browser registered successful parries and visible guard breaks.
- Guard break lasts 2.4 seconds and multiplies incoming boss damage by 1.75. Repeated hits cannot extend it. A committed boss windup retains armor; ordinary recovery can flinch without an infinite stun lock.
- Browser screenshots show actual player hit-stun and boss guard break with distinct poses, overhead recovery rings/bars, and HUD status timers.
- Shurikens cost 4 chakra, techniques have meaningful costs, and spending delays passive regeneration. Sasuke's repeated casting reached 6 chakra during combat. Melee stays available at empty chakra. Full costs and insufficient-resource rejection are covered by tests.
- Chidori, Clone Barrage, Resolve Counter, Sharingan Focus, and Unsealed Fury all started through normal actions. Character cut-ins, names, charge effects, rushes, and impact beats were inspected. The 1.7-second presentation pauses incoming combat, applies its final damage once, and restores control. Pausing during a burst and returning to the title during a burst both worked.
- Haku's mirrors, Naruto's arrival, Sharingan awakening, protective sacrifice, awakened handoff, final Kakashi duel, Haku interception, ending state, and victory remained reachable. Skipping applies the resulting story state.
- An intentional HP-depletion test reached the defeat menu. Retry Phase restored full HP, chakra, and stamina at the final checkpoint, retained prior story outcomes, and cleared previous clones/effects. Returning to title and continuing a checkpoint also restored the phase correctly.

## Automated checks

70 tests pass across five files, including 17 retained platformer regression checks. TypeScript checking and lint pass.

Coverage includes parry boundaries/rearm, frontal/rear defense, red attacks, guard breaks, resource gates and recovery, dash invulnerability and air-dash limits, slide projectile clearance, safe substitution, event timing, duplicate-hit prevention, combo buffering, heavy charging, recovery cancels, boss selection/costs, mirror rules, story handoffs/skips, and legacy save migration.

Controller mappings, triggers, press/release edges, prompt switching, disconnection, and focus-loss clearing/pause are checked with simulated input. Logical-key fallback was also tested after an ordinary browser key event exposed a missing physical key code. A physical controller was not available.

## Artwork and interface

The new asset verifier passes 16 icons, 24 Kakashi melee frames, 12 water frames, four ultimate cut-ins, and the active 67-recording audio manifest. No clipped frame edges or baked backgrounds remain. The retained 432-frame core animation verifier also passes.

Generation prompts, frame rectangles, anchors, event timing, and inspection notes are retained in the project. New artwork was generated before gameplay integration. Zabuza's animated blue water jets were inspected in combat, including a projectile impact and the player's hit-stun cue. Water dragons and waves use their own four-frame strips. Haku retains narrow water needles.

Technique cards show generated icons, names, costs, cooldowns, and ultimate readiness. Selecting a card pauses play and opens the readable kit description. Player/boss HP share a baseline. The game fits 1280×720 and 1024×768 browser sizes without document overflow; viewport overrides were reset afterward. Fullscreen entry/exit, volume adjustment, reduced-shake toggling, controls, pause/resume, and retry menus worked.

## Audio and runtime

27 combat effects were replaced with edited Taira Komori fighting, sword, water, and magic recordings. The active manifest retains source URLs, attribution, license terms, trim/filter/normalization notes, and measured peaks. Voices use lower gain and longer cooldowns; impacts rotate variants. No continuous oscillator is used.

All 67 recordings decoded without missing buffers. Runtime loaded-buffer counts additionally include up to three cached loop buffers. The largest recorded sample peak is below −1.21 dBFS. Effects are capped at eight, voices at two, and music at one plus one temporary crossfade source. Pausing and defeat returned active music/effect/voice counts to zero. Retries did not accumulate prior sources. The available audio-preview tool did not expose audible playback to the agent; this is a decoding, peak, and lifecycle check, not a claim of listening verification on speakers.

Foreground play generally reported around 164–165 fps on the available high-refresh browser. No console errors were recorded during the completed chapter or subsequent retry/layout checks. Ordinary encounters returned to two base fighters plus appropriate story allies; clones, projectiles, effects, and cinematic objects remained bounded. Development input tools are excluded from production by the build-time DEV guard.

## Release

The previous public game stays live until the replacement passes its production build. Publication uses the existing Sites URL, followed by a public loading/start/pause smoke test. This remains a single-player desktop browser game with no touch controls, accounts, multiplayer, or additional chapter.
