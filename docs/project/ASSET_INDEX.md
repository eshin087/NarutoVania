# Asset ownership and reference index

Inspected 2026-09-11 at `fc8687a`. This is a navigation index, not an exhaustive liveness report or permission to delete anything. Exact frame data belongs in manifests and active adapters.

| Pack / purpose | Runtime consumer and metadata | Provenance / notes |
| --- | --- | --- |
| Chapter 1 base bodies, variants, arena | [battle-art.ts](../../game/battle-art.ts), [V2 manifest](../../public/art-v2/manifest.json) | Base art remains active beside later revisions; inspect texture keys and per-state overrides. |
| Chapter 1 body corrections | [presentation-v16.ts](../../game/presentation-v16.ts), [body frames](../../public/art-v16/body-frames.json), [visible bounds](../../public/art-v16/visible-bounds.json) | Head/hand/foot anchors and visual ratio; newer V22/V23 frame data has its own path. |
| Chapter 1 later cinematic and effect art | [art-v22.ts](../../game/art-v22.ts), [art-v23.ts](../../game/art-v23.ts), their manifests under public | [V22 audit](../../art/v22/validation.md), [V23 audit](../../art/v23/validation.md); older V9–V15 adapters are also loaded by battle-art. |
| Chapter 2 Lee, Gaara, Guy/Hayate, arena, sand, Gates/Lotus | [art.ts](../../game/chunin/art.ts), [manifest](../../public/art-chunin/manifest.json) | [Prompts](../chapters/chunin-exams/ART_PROMPTS.md), [ingestion tool](../../tools/ingest-chunin-art.py), [production measurements](../chapters/chunin-exams/PRODUCTION_LOG.md). |
| Shared recorded sound | [recorded-audio.ts](../../game/recorded-audio.ts), [V23 audio manifest](../../public/audio-v23/manifest.json) | Manifest record URLs can point to earlier audio folders. Retain source/license records. [V23 processing](../../scripts/soften-audio-v23.cjs). |
| Chapter 2 recorded effects | [audio profile](../../public/audio-chunin/manifest.json), [edit notes](../chapters/chunin-exams/audio/README.md) | 21 Audacity-edited recordings; optional profile overrides Chapter 2 cues only. Source licenses/hashes/recipes retained. No anime soundtrack extraction; subjective listening unverified. |
| README screenshots | [docs/readme-assets](../readme-assets) | Public documentation consumes these even though gameplay does not. |

## Reference proportions

Chapter 1 targets: Naruto ~125px, Sasuke ~128px, Sakura ~135px, Haku ~146px, Kakashi ~157px, Zabuza ~167px. These are visual body references, not collision dimensions and not mandatory opaque heights for every pose.

Chapter 2's accepted adapter uses Lee idle `.66`, run `.62`, combo `.59`; Gaara `.55`; Guy/Hayate support `.39`. The production log records the idle/combo crown and torso comparison that motivated these values. They are specific to these authored sheets; **do not copy them to newly generated sheets**. The current scales reside in the adapter, while frame rectangles/roots reside in the manifest. A future schema consolidation is not already implemented.

## Adding or replacing an asset

The2026-09-11 Chapter2 revision now stores new sequence/frame scales in its manifest: Lee actions.56; weights.48, Gates.56, paired Lotus.59, ending.65; Gaara.58; Guy.46. These replace the older Gaara/Guy adapter values where the new sheets are active. See [art record](../chapters/chunin-exams/REVISION_2026-09-11_ART.md) and [ingestion](../../tools/ingest-chunin-revision.py). Do not copy these constants to another generated sheet.

Record character/form/state, approved body reference, source/prompt, generated candidate, runtime path, texture key/consumer, body/root/head/hands, facing, padding/effect bounds, frame timing and contact events. Use stable sequence scale. Both-facing contact sheets and runtime inspection are required for acceptance; do not claim a tolerance was measured if it was only a target.

Keep accepted compiled assets and prompts tracked. External original-generation paths may not exist on another computer; label that limitation and use the tracked accepted reference instead of assuming raw files can be recovered. Avoid duplicating large originals just to populate an index.

Before cleanup, inspect preload chains, computed names, manifests, scene selectors, README references, and network requests. A missing literal import or older version number does not prove non-use. Document confirmed consumers and retained provenance before deletion.
