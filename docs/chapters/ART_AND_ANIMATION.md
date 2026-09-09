# Art and animation production

## References and inventory

Read the installed imagegen skill at generation time. Use the available built-in image generator; the project does not control its underlying model name. Never silently substitute procedural stand-ins for required generated character art.

Start with an era-accurate reference sheet per new character/form: front/side silhouette, costume, face, weapon, neutral grounded pose and palette. Reuse existing approved references for returning characters. The user previously authorized code cleanup of baked backgrounds; preserve the character art and inspect alpha afterward. This does not replace the generator for new anatomy.

Inventory every required asset before generation. Include:
- Character locomotion, neutral stance, jump/fall/land, dash/airdash/slide.
- Light combo variations, heavy, aerial, block/parry, guard break, hurt, defeat.
- Techniques and ultimate anticipation/execution/impact/recovery.
- Boss windups, follow-through, casting, weaponless/catch states and signature mechanic states.
- Scene-specific interception, kneeling, lifting/carrying/lowering, restrained or fallen poses.
- Terrain layers, props, full effect sequences, projectiles, trails and impacts.
- UI ability icons that clearly distinguish techniques, with concise text in the interface.

Reuse accepted animation where appropriate. Do not regenerate good runs just to increase frame count.

## Asset contract

For each asset retain its exact prompt, reference paths/IDs, generated candidate, accepted runtime path, frame rectangles, timing and edits. Metadata should express:
- Character/form and animation state; stable sequence scale.
- Body reference measurements: head, torso and limbs, independent of weapons/effects.
- Planted-foot/root, head, left/right hand and other contact anchors.
- Transparent padding, complete visible/effect bounds and measured mirror interior where relevant.
- Frame durations, anticipation/contact/recovery and release/landing/attachment events.
- Facing convention and mirrored attachments.
- Collision core or reference to gameplay geometry, distinct from visual bounds.

Existing manifests are examples, not one universal schema. Inspect renderer compatibility; avoid version-prefix fallbacks silently ignoring new metadata.

## Scale rules

Approximate current visual reference heights: Naruto125, Sasuke128, Sakura135, Haku146, Kakashi157, Zabuza167 logical pixels. These are proportions for returning characters, not identical heights for everyone or collision dimensions.

Measure anatomy against approved idle/run, not a crouched pose's total height or an attack's sword/flame rectangle. Use uniform sequence correction where anatomy permits; regenerate inconsistent anatomy where it does not. Never stretch head and torso independently to hide a bad frame.

Aim for body measurements within 5% and planted feet within two logical pixels, but record what was actually measured. A stated tolerance is not proof of meeting it. Coordinated carrying art must match each person's normal body separately. Kneeling and fallen actors remain naturally lower/shorter.

## Animation readability

- Hold a stable neutral stance; occasional subtle breath/blink, staggered between actors. Avoid whole-body rocking/stretching.
- Preserve accepted running cycles and timing unless a specific defect requires replacement.
- Attack anticipation must look like attacking, not a guard pose. Show shoulder/hip turn, contact and recovery.
- Select a choreography variant at combo start and retain it through the string.
- Align active frames and hit events. Visual extra strikes add no damage by themselves.
- Actual stun uses directional hurt; armored hits show contact without falsely stopping the attack.
- Hounds and other companions need approach, contact, braced motion, release and exit, not static translation.
- Fire/water/ice need formation, looping travel, impact and dissipation. Large effects have their own padded frames, not enlarged body sprites.
- Complete trails/tails must fit the source atlas and runtime camera at both arena edges.

## Art acceptance gate

Inspect every used frame at useful zoom, then contact sheets against references in both facings. Check anatomy, palette, consistent equipment, alpha/checkerboard, padding, unclipped limbs/effects, planted roots and mirrored hands.

Inspect actual runtime animation: idle-to-attack, contact-to-hurt, fall-to-land and carry-to-separate. Save concise measurements and reasons for rejection. A technically valid atlas can still fail style or animation.

Store generation records with the chapter, runtime assets under public, and preparation utilities under scripts when reusable. Temporary captures/candidates may be ignored, but keep accepted prompts, manifests and reproducible processing notes tracked. Never delete older runtime art without tracing live references.
