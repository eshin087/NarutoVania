# Chapter 2 platform-fighter combat revision — 2026-09-13

User confirmed health bars: no percentages, stocks or ring-outs. On Continue, coordinator stated defaults for the unanswered optional questions: Chapter 2 first; keep fresh F/LB parry and held block. These are stated implementation defaults, not fabricated user answers. This was the initial Chapter 2-only scope. The user subsequently approved applying it to Chapter 1; see [Land of Waves spec](../land-of-waves/CHAPTER_SPEC.md). No new story scenes, enemy waves or multiplayer.

## Target

Smash Ultimate-inspired movement and directional attacks adapted to the existing HP boss duel. Preserve 6000 continuous Gaara HP, 70%/35% power-ups, latest-threshold retries, damage economy, Naruto identity and two-second Lotus presentations. Exact Nintendo engine/frame parity is not claimed.

## Controls and behavior

- A/D or stick move; W/up/D-pad up selects upward attacks. Space/A jump, short hop on release, double jump; down while descending fast-falls. Air steering remains available during aerial recovery.
- J/X selects neutral jab, forward/up/down tilt, running attack, or neutral/forward/back/up/down aerial by direction and grounded state. Facing is locked during an attack; backward aerials do not silently turn around.
- K/Y holds a directional charged smash; release attacks. Direction is sampled when charging begins. Down+J becomes a low tilt.
- Q/RB Hurricane and E/RT Lotus Launcher retain recognizable taijutsu. Launcher also provides a rising aerial recovery/chase. L/LT remains the physical backstep for this first adaptation.
- F/LB retains timed parry and held block. Shift/B becomes evasive ground movement or one directional air dodge. No free infinite defensive chaining. Grounded down+dash keeps the low slide.
- Ordinary attacks use recovery/landing commitment rather than stamina costs. Techniques, dodges and guarding keep their stamina limits. Ultimate economy remains.

## Contact and motion

Per-move hitboxes, strike direction, launch vector and hitstun; hits occur once at animation contact. HP determines victory, not distance. Launches use move strength/weight, bounded air steering and explicit landing recovery. Both Lee and Gaara can leave the floor; no standing boss sprite sliding vertically. No hidden enlargement of attack range to match decorative trails.

Gaara has readable armor during committed major patterns; recovery/ordinary attacks can be interrupted and launched. A bounded aerial escape after repeated hits prevents permanent juggling. Existing projectile parries and visible ground routes remain. Pending emissions cancel on genuine launch interruption, not on every armored hit.

## Art and validation

Generate/inspect missing Lee directional kicks and Gaara airborne/tumble/landing frames before integration; retain approved body scales, quiet idle and runs. Keep effects independently scaled. Test both facings, directional selection, short/full/double jump, fast-fall, drift, landing lag, launch contact, combo escape, parry/block, checkpoint handoffs and ultimate restoration. Recheck Chapter 1 input compatibility. Independent rendered critique required before release; user publication authorization remains GitHub/Vercel after QA.
