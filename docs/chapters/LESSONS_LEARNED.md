# Lessons from Land of Waves

These rules summarize repeated user feedback and inspected fixes through V23. Latest explicit user instructions supersede them. The source links in [context](PROJECT_CONTEXT.md) provide evidence; historical "passed" reports do not guarantee a future build.

## Character presentation

| Failure | Prevention and verification |
| --- | --- |
| Zabuza's attacks shrink; Naruto grows during attacks | Normalize head, torso and limbs to approved idle/run references. Use fixed sequence scale/root metadata. Compare anticipation/contact/recovery side by side in both facings; never fit a pose to opaque height. |
| Kneeling, fallen and carrying figures grow | A kneeling pose should be shorter, with unchanged head/torso size. Measure each person independently inside coordinated carrying art. Check lift/lower handoffs against adjacent standing models. |
| "Improved" running and constant idle sway look worse | Preserve approved runs and quiet idle. More frames are not automatically better; subtle blinking/breathing should not stretch or rock the whole body. |
| Flames/tails clip | Separate effects from the body, preserve transparent gutters and full frame bounds, and frame the effect at both arena edges. Do not shrink the character to fit the fire. |
| Player disappears behind boss | Stable body depth: boss then player, foreground weapon/contact effects. Keep both silhouettes legible without changing collision. |
| Attack looks like blocking; hit stun is invisible | Review state-specific poses. Real stun gets recoil; armor gets brief contact feedback without cancelling or hiding its committed attack. Weaponless poses must preserve sword ownership. |

## Combat and effects

| Failure | Prevention and verification |
| --- | --- |
| Default punches slide the player into danger | Keep ordinary light strings stationary. Movement belongs to explicit techniques; validate root motion independently of animation. |
| Stars remain forever | Queue effects created during an update. Give each effect an owner, expiry and interruption cleanup. Test effects spawning other effects. |
| Sword duplicates or disappears | Explicit held → outbound → returning → catch ownership, swept collision and per-pass hit tracking. Test moving-hand catch, parry return, death and retry. |
| Dragons spawn inside Zabuza or miss a stationary player | Hand anchors mirrored with facing; sample the player's torso at volley release, then straight locked flight. Validate center, edges and moving/airborne targets. |
| Water vanishes midair or flies above the floor | Travel → impact → dissipate, or complete offscreen exit. Ground foam anchors. No timer deletion during ordinary visible flight or extra splash damage. |
| Safe-route code erases visible threats | Validate existing and prepared trajectories before release. Delay/omit unsafe new shots; never delete already-visible projectiles to fabricate a route. |
| Boss stops attacking in mirrors | Review cooldown/history eligibility and fairness rejection together. Provide fallback when the only eligible move was used last; record deferred/omitted emissions. |
| Projectiles/effects become noisy clutter | Telegraph origins, bound emissions and particles, preserve visible cores, foreground readability and a reachable ground route. More projectiles alone is not a better attack. |
| UI markers obscure combat | Prefer readable weapon/water/frost anticipation and standalone red !. No yellow arcs/circles or giant floor blocks. Genuine parry feedback belongs to the defender and actual success event. |

## Mirrors and story

| Failure | Prevention and verification |
| --- | --- |
| Haku or mirror tops clip | Measure actual visible ice interior, not padded cell dimensions. Fit full reflection poses first, then lay out complete mirrors below HUD through zoom/resize. |
| Mirror appearance is abrupt or gives away Haku | Stagger formation and entry; identical reflections until a brief tell. No persistent occupied halo. Use stable layout, not per-frame resizing. |
| Haku teleports out; clones remain while he falls | Begin at actual reflection root/scale. Recoil → emerge → gravity fall → landing → recovery. Hide all reflections and cancel pending shots until explicit re-entry. |
| Multiple needles from one volley instantly solve the mechanic | Track formation and volley IDs. Count distinct successful returns; lock transfer until return contact/expiry and clear stale identities. |
| Scenes warp, twitch or face away | One animation owner per actor. Carry outgoing transforms/facing/camera/weapon state. Animate relocation and settle before idle; do not overlap independent timed movement. |
| Projectiles hit before/after the story reaction | One owned projectile without baked duplicates. Release/contact/landing completion drives recoil, prison release, sacrifice and collapse exactly once. |
| Haku intercepts after Zabuza is already hit | Compute interception point and chronology. Rush contacts Haku first; dismiss hounds at that contact. Reserve Chidori for its intended story beat. |
| Dogs, fleeing NPCs or corpses look like sliding cutouts | Use real approach/leap/bite/brace/release, forward run and contact/fall frames. Do not rotate a standing sprite to fake defeat. |
| Bubbles point at the wrong person | Project measured head anchor into fixed UI once; clamp box and retain speaker-directed tail. Dialogue occurs once at the relevant action. |
| Ending warps everyone to preset coordinates | Preserve actors and fallen bodies between ending segments. Lift before carry, lower before separation, hold the final tableau. |

## Scope, audio and validation

- More HP and redundant fights made the chapter tedious. Current four-fight structure and deliberately short rescue override old duration plans. Measure imperfect play as well as efficient play.
- Ready ultimates and fast charging are accepted. Extra visual strikes must not silently multiply damage or self-charge another ultimate.
- Static portraits/manga panels were removed by request; preserve story through in-engine choreography and automatic bubbles.
- Continuous oscillators, rough noise and heavily layered effects repeatedly disappointed. Use clean decoded recordings, modest envelopes, bounded voice counts and one primary cue. Keep quieter water and muted placeholder voices. **Decode and peak analysis are not listening.**
- Test results cannot establish anatomy, satisfying timing, human difficulty, manga fidelity or pleasant sound. The independent reviewer must inspect rendered evidence and disclose what was not observed.
- Source changes/HMR during a final run invalidate its claim as a continuous test of one build. Freeze the candidate; run focused regressions after later edits and broaden when shared systems change.
- Ignored outputs may disappear on restart or a fresh clone. Track manifests, prompts, concise evidence reports and reusable tests; captures and archives can remain disposable.
- Version age does not mean an asset is unused. Trace live references before cleanup. Keep source/license records and never commit credentials.

## Chapter 2 implementation findings (2026-09-08)

### Revision findings (2026-09-11)
- Continuous power-ups must advance the existing combatant instead of resetting it. Persist exact threshold-entry HP and a stable maximum; regress damage past thresholds, Retry, Continue, skips and debug isolation.
- Bouncing projectiles require piecewise collision, including harmless rebound preparation. The fairness planner and renderer/resolver must share the same floor/lifetime behavior; replay both legs through actual collision at varied frame steps and action locks.
- Close-range combat handoffs need visible separation before authored cinematics, and facing must come from the final staged actors. Preview target phase is not the current story power state: regress Gates aura order in direct Scene Select as well as natural progression.
- An 80ms launch guard prevents stale grounded physics from immediately restoring an extra jump. Keep double-jump and air-dash budgets independent; test fresh presses, third-press rejection, coyote/landing reset and both active runtimes.
- Audacity short fades can collapse when project beat snapping is enabled. Verify the actual selection and exported endpoints; normalize/DC removal before final fades. Standard bundled filters recovered this task after a ClassicFilters crash. Preserve user projects and distinguish signal measurements from listening.
- An advancing technique can cross a close opponent before its contact event and fail the facing check. Hurricane now stops at a66px contact distance; test50/88/140/200px in both facings and at edges.
- Cinematic and combat time differ. A95ms immunity deadline froze through an ultimate and rejected its only hit. Give owned ultimate contact an explicit immunity policy, retain exactly-once ownership, and test after recent normal damage.
- Simultaneous pellets can turn a successful parry into several block costs. Group inseparable shots from one emission; reward one deflection and one returned hit. Different volley IDs must not inherit protection.
- Continuous route planning can disagree with a discrete receiver collision. Include the entire remaining action duration and one40ms walking displacement of clearance; replay accepted routes through the real swept resolver.
- Neutral-background cleanup can erase white wrist wraps and detach hands, even with exterior flood when ink outlines are open. Preserve source wrist pixels and inspect every packed frame.
- Sprite bounds are not body anchors. Gaara's outstretched arm shifted the packed silhouette center by more than 20 logical pixels between cast and idle. Use measured foot midpoints, retain a stable sequence scale, and mirror noncentral origins with the actual renderer's flip transform. Regress against source sandal landmarks in every frame.
- Component filtering must follow anatomy restoration. Removing Gaara's detached shoes as "small effects" hid damaged ankle wraps. Preserve original ankle pixels first, reconnect both sandals, then discard disconnected sand grains; verify every expected foot survives.
- Combined-actor sprites hide their components. Skip/retry/exit must restore visibility and reset reused texture/origin/flip, not only alpha and position.
- Track the last major boss pattern separately from the last ordinary move. Requiring intervening ordinary attacks otherwise makes an intended alternating major unreachable. Regression: natural selection alternates storm/walls across five major opportunities.
- Canceling an effect/projectile array during iteration does not cancel the iterator's old entries. Use a generation boundary and abort the current update after guard-break cleanup. Regression: two overlapping pellets, first parry breaks guard, second must not drain stamina.
- Guaranteed canonical aftermaths require guaranteed setup even when a player ends a phase with an ordinary attack. Chapter 2 explicitly stages the Primary/Reverse Lotus before the sand-shell/cushion reveals.
- Image tool previews can obscure genuine alpha. Check RGBA channels before assuming backgrounds are baked. Preserve generated alpha; chroma-key only genuine RGB chroma sheets. Compare idle/attack crowns and torso before choosing a stable sequence scale.
- A modal must own gameplay input independently of DOM focus. Checking whether the key event target is inside a dialog misses a still-focused header button and all gamepad input. Chapter2 exposes modalOpen through its input bridge; keyboard and pad polling both honor it and held confirmations remain consumed. Regression covers Escape, Start/A, and close while held.
