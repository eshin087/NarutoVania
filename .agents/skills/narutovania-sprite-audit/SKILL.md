---
name: narutovania-sprite-audit
description: Audit or fix Narutovania sprite scale, body proportions, foot/hand anchors, clipping, and animation consistency across combat and cutscenes. Also use when accepting generated character or effect sheets.
---

# Audit sprite presentation

Read [asset ownership](../../../docs/project/ASSET_INDEX.md) and [art contracts](../../../docs/chapters/ART_AND_ANIMATION.md). Find the active renderer and manifest from [the source map](../../../docs/chapters/PROJECT_CONTEXT.md); version numbers do not identify unused assets.

## Diagnose before regenerating

- Identify the exact character/form/state/frame and a trusted idle/run reference. Follow the texture from preload through atlas rectangle, root, scale, facing, camera, and layer. Include clones, reflections, ultimates, and cinematic actors only where that asset is reused.
- Compare head, torso, and limb measurements separately from sword, hair, flames, crouching, and pose height. A kneeling body must remain lower; fitting it to standing height creates a scale jump.
- Distinguish incomplete source art, wrong atlas crop, incorrect root/scale, and camera clipping. Transparent padding cannot restore a missing flame tail. Whole-sheet or opaque-bounds fitting cannot repair inconsistent anatomy.
- Inspect idle → anticipation → contact → recovery and hurt/guard in both directions. Check planted feet, hand-bound projectiles, sword ownership, and player/boss overlap.

## Apply the smallest valid correction

For a fix request, correct metadata when uniform scaling and stable anchors suffice. Generate replacement anatomy or missing frames with the available imagegen tool after reading its installed skill. Previously authorized code cleanup covers baked backgrounds; it does not make procedural character redraws a replacement for requested generated art.

Preserve fixed sequence scale, approved runs, and quiet idle. Separate large effect bounds from body bounds. Target the guide's 5% body/2px foot tolerances, but report actual measurements and any unmeasured criterion. Visual corrections do not change collision bodies, reach, or damage without a separate balance request.

Return accepted runtime paths, prompt/reference provenance, measurements, and before/after rendered evidence. Inspect both arena edges and affected camera zooms. Track remaining findings in ISSUES and the chapter QA report. For audit-only requests, report corrections without editing assets.
