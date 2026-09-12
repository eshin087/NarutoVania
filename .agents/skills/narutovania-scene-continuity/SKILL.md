---
name: narutovania-scene-continuity
description: Repair or storyboard Narutovania in-engine cutscenes, combat-to-scene transitions, actor positioning, projectile contacts, dialogue anchors, and scene skipping. Use for abrupt, duplicated, mistimed, or unnatural story animation.
---

# Preserve the causal scene

Read the chapter spec, [story guide](../../../docs/chapters/CANON_AND_STORY.md), and the Mirrors and story section of [lessons](../../../docs/chapters/LESSONS_LEARNED.md). Resolve active scene ownership through the source map. Keep existing canonical outcomes and labeled gameplay adaptations unless the user changes them.

Build a short event ledger for the affected scene:

| Entry | Action owner | Completion/contact | Result | Exit/skip result |
| --- | --- | --- | --- | --- |
| Actual actor roots, facing, camera, weapon and fallen-body state | One controller per actor/effect | The event that allows the next action | Recoil, release, restraint, fall, dialogue, or handoff | Equivalent resulting story/checkpoint state |

Do not substitute another set of independent timers for a broken dependency. Release starts the owned projectile; contact triggers recoil once; landing precedes approach/grief; lift precedes carry; lowering precedes separation. Count projectiles explicitly and inspect baked art for duplicate weapons. Interception must happen before the protected target is hit.

Carry actual transforms between same-location segments, including defeated bodies. Finish movement before quiet idle. Use location/time fades intentionally; a fade does not establish continuity. Project measured speaker heads into the UI camera once and keep the tail pointed toward the correct actor.

Use automatic concise speech bubbles and in-engine staging. Do not reintroduce manga cards or portrait ultimates. Required story techniques must appear even if the player completed the objective with an ordinary attack.

When new anatomy/choreography is required, apply the sprite audit and installed imagegen workflow before integration. Coordinated sprites must preserve each person's anatomy, including kneeling and fallen height.

Validate natural entry from varied combat positions as well as Scene Select; pause during each dependency, replay, skip only this scene, and hold confirmation through handoff. Compare resulting actors/camera/checkpoint state and clear input/effect ownership. Record each assigned transition separately; a good screenshot does not establish smooth motion. Honor review-only scope when no fix was requested.
