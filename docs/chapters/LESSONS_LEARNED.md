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
