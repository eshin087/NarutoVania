# V22 presentation and validation

Generated art is in public/art-v22. Exact prompts and selected source records are retained here. The source PNG paths describe local generation provenance; the checked-in WebP atlases are sufficient to build and play.

Character sequences use fixed row scales and padded frames. Naruto and Sasuke retain their established visual reductions, while gameplay dimensions remain unchanged. Haku's kneeling strip uses one scale across all six frames, preserving natural lower pose height. Every imported frame includes body bounds, root/head/hand attachments and source rectangles. Chakra tails use a common source scale and ground anchor; the first pinwheel-style candidate is superseded by chakra.webp. Run scripts/import-v22.py with the source images available to reproduce ingestion, including scripts/import-v22-chakra.py.

Implemented mechanics: queued effect ownership and bounded lifetimes; distinct-volley mirror-return counting; transfer locks; full recoil/fall/landing; common prison renderer; contact-driven single Naruto shuriken; three offscreen senbon followed by Haku's reveal; automatic bubble staging; new Sharingan, fire, chakra and hound sequences. Damage, projectile speed, collision cores, stamina/parry windows and ultimate charging retain V21 tuning.

Validation on 2026-09-07:
- 211 automated tests, TypeScript and lint passed before production build.
- Full browser chapter used ordinary shared input actions through mist, rescue, mirrors and seal, then the natural snowy ending. No deaths or page errors in that run.
- Timed keyboard parries returned volley 4:0, then 4:1 to the real Haku; the second return produced one exposure objective and a complete grounded knockdown. A later pair repeated successfully. Duplicate needles and stale formations are covered by unit regression tests.
- Focused browser checks passed for pause, full-body prison continuity, exactly one rescue shuriken, hidden hunter arrival, empty mirrors during sacrifice, replay during a fade, interception/hound dismissal, Fury at the arena edge, resizing, and simulated controller movement/dash.
- Actual defeat/retry restored full HP and an ultimate; debug progress left normal local storage unchanged.
- Generated assets and repaired scenes were inspected in browser screenshots. Haku kneeling, Sasuke collapse, prison containment, bubble occlusion and complete flame tails were checked. Existing quieter water audio retained.

Physical-controller hardware and subjective listening verification were not performed. Browser input simulation is separate from hardware coverage.
