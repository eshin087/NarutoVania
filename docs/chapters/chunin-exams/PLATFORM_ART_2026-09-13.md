# Directional combat artwork — 2026-09-13

Generated with the available built-in image tool using the approved original-series Lee/Gaara reference. Model-version selection was unavailable. [Exact prompts](../../../art/chunin-platform-prompts.json), [reproducible packing script](../../../tools/ingest-platform-art.py), [runtime metadata](../../../public/art-chunin/manifest.json).

Accepted sheets: `lee-directional.webp` (24 frames: rising heel kick, low sweep, backward aerial kick, downward axe kick); `gaara-airborne.webp` (18 frames: recoil/tumble/fall, jump, braced landing/recovery). New sequences are additional poses; quiet idle and restored running art are retained.

Lee source was 1536×1024 with a baked checker background; Gaara used a solid magenta background. User-authorized code cleanup removed connected background and isolated each actor component, avoiding neighboring-pose fragments. Transparent atlas cells are 384×448 with generous padding. Inspect composited PNGs/browser output: direct WebP preview may display hidden RGB streaks in zero-alpha pixels; these pixels are transparent in the game.

Stable sequence scales: Lee .56 and Gaara .44, based on head/torso comparison with the existing .66 Lee idle and approved Gaara actions. Grounded roots follow supporting feet; aerial roots use head-referenced virtual body roots so folded legs do not shrink the character. Body scale is never recomputed from a posed opaque bounding box at runtime. New Lee contact is frame2, while the retained Lee action sheets use frame3; each contact mapper follows its actual damage event.

Head/root/source rectangles are retained per frame. Hand entries in these two sheets are unused fallback anchors, not independently measured attachments; no projectile or weapon is attached through them. Generated sources are retained in the local image-generation output; accepted transparent sheets and exact prompts are versioned.

Inspection: dark-background contact sheets and both-facing rendered attacks/tumbles showed complete silhouettes, consistent costume and no clipped anatomy. Independent review is recorded in the revision QA report. Zero-alpha background and isolated components must remain intact if reprocessing.
