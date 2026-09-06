# V14 — fully animated battles and in-engine story

Validated September 6, 2026, in desktop Edge through Playwright.

## Changes

- Generated and integrated 416 character frames across eight appearances: six-frame idle loops, eight-frame runs, landing poses, and two three-strike melee sets. Choreography selection remains fixed through a combo. Added 124 cinematic/ultimate frames and 96 animated effect frames. Generation prompts, source paths, normalization, anchors, and atlas metadata are retained under `art/v14` and `public/art-v14`.
- Removed runtime manga/portrait loads and panel gates. Dialogue is automatic, with camera-relative bubbles. Rebuilt transformation teamwork, contact-triggered prison release, Kakashi's winning Water Dragon, reactions, and coordinated carrying/lowering in the snow.
- Enlarged mirrors and reflections, cropped transparent ice padding, animated mirror formation, and placed the player body above the boss for close exchanges.
- Five 2,000 ms arena ultimate presentations; one damage event, animated mirror fracture, visible target descent, and camera restoration. Added thirteen animation/ultimate previews to public Scene Select.
- Existing four fights, combat numbers, input mappings, checkpoint behavior, and audio preferences were retained.

## Checks completed

- TypeScript, lint, production build, and **173 tests passed**. Tests include atlas frame/anchor bounds, combo-set stability, automatic scenes, effect phases, and existing combat/parry/barrage/checkpoint coverage.
- Completed all four fights and the natural ending using the development input pilot, which presses ordinary game actions without altering health, positions, time, or outcomes. No deaths were required. Final Naruto HP: 41; all story completion flags set. No browser errors; no missing audio assets; no live combat entities at victory. Steady observed scene snapshots were predominantly 99–144 fps, with a lower loading/startup sample; this is not a hardware benchmark.
- Inspected rescue contact, Water Dragon impact, carrying, character comparison frames, all five ultimate previews, and Haku's enlarged mirror formation.
- All thirteen story entries tested with pause/resume and skip; all thirteen animation/ultimate previews loaded. Simulated standard-controller pause/resume, held confirm, keyboard pause, resize/fullscreen, and focus-loss pause passed. Debug saves remained isolated.
- Four consecutive retries each restored two fighters, zero projectiles/effects/decoys, and thirteen display objects.
- All eight barrage auditions and seven sound auditions ran in the production build with no missing requests or browser errors. Production excludes automated combat/input-pilot tools.
- A focused live Unsealed Fury test earned charge through normal actions, then observed **one** damage event during a 1,997 ms frozen-combat presentation; mirror breaking stayed within the existing two-mirror limit.

## Coverage limits

No physical controller was available. Audio playback/loading and cleanup were exercised, but subjective listening was not verified in this environment. Body proportions and grounded anchors were visually compared; no claim of a complete anatomical measurement within five percent is made. Existing previously generated techniques/reactions remain for actions outside the new movement, melee, cinematic, and ultimate sequences.
