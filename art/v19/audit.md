Zabuza final presentation audit

Inspected runtime contact comparisons in both directions: idle/run/jump/landing/dash, block/parry, hurt/defeat, heavy/aerial/casting, both melee sets, throw/wait/catch, water casting, guard break, ending charge, shuriken teamwork, kneeling/resting and active carrying pair.

Replaced V14 melee with the existing V11 sword family, whose anatomy and palette match the approved V2 idle better. Removed V14 landing and V15 guarding outliers; retained original locomotion/technique family. Routed all 24 boss sword frames directly without modulo-three row aliasing. Newly generated throw atlas corrects mismatched chest harness and leg wraps; every frame normalized to the same source body scale and planted boot baseline. Rejected missing-sword recovery cell15. Updated hand points for release/catch. Reduced oversized ending poses to 85 percent of their former scale. Fixed mixed-row identity metadata: reactions18-20 are Kakashi,21-23 Zabuza. Natural snow already selected21/23, so no claim of an observed wrong-character natural scene.

Regression checks exercise all36 melee entries in both directions, all18 sword frames, mirrored hand points, and stationary player melee. Runtime comparisons are visual estimates, not a certified per-limb 5 percent tolerance. Injured ending poses intentionally differ from combat stance.
