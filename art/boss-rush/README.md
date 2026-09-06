# Land of Waves boss-rush art

Generated with the built-in image_gen tool. All prompts and correction prompts are in prompts/. Original generator outputs have the -raw suffix. Use final filenames without -raw in the runtime.

## Core character atlases

Six characters: kakashi, sasuke, sakura, naruto, zabuza, haku.
Each has {character}-locomotion.png, {character}-melee.png, {character}-techniques.png and matching JSON files.
All contain 24 chronological poses in a 6-column by 4-row grid. There are 432 core frames.

- Kakashi, Sasuke, Sakura, Naruto, Haku: 1536 x 1536; cells 256 x 384; anchor (128,307).
- Zabuza: 2304 x 1536; cells 384 x 384; anchor (192,307).
- Naruto awakened: naruto-awakened.png, 1024 x 768; 4 x 2 cells of 256 x 384, eight additional generated poses with red chakra and feral eyes.
- Haku combat sheets wear the white/red mask fully over the face. haku-unmasked-{sheet}.png preserves the prior exposed-face art for cinematics.

animation-map.json lists zero-based animation indices. The slide combines locomotion 22,23 and techniques 4,5.
One uniform scale across each character's three sheets preserves crouch and airborne pose proportions. Complete connected sprites and detached effects were extracted before repacking. Grounded body feet use the shared anchor; low effects can extend below that anchor within padding.

## Scenes

- lakeside-background.png and bridge-background.png: 1672 x 941, full opaque wide backgrounds. Crop or scale for 1280 x 720.
- lakeside-ground.png: 1536 x 124 RGBA strip, walkable surface y=7.
- bridge-ground.png: 1536 x 139 RGBA strip, walkable surface y=0.
- scenery.json and each ground's JSON include actual sizes and anchors.

## Props and effects

props.png is 1536 x 1920 with 17 items: tazuna, hound, hound-2, hound-3, gato, henchman, henchman-2, henchman-3, log, water-prison, ice-mirror, windmill-shuriken, snowflakes, water-ripple, shuriken, senbon, haku-mask.

effects.png is 2048 x 1024 with eight items: water-dragon, waterfall, fireball, lightning, smoke, parry, ice-shards, chakra-aura.

props.json and effects.json expose a name-keyed items map plus a frames array. Each item contains rect [x,y,width,height] and an anchor relative to that tight rectangle. Actors use bottom-center anchors; objects and effects use center anchors. cellRect is included for sheet inspection, while rect is the recommended runtime crop.

## Verification and provenance

All final cutouts have real RGBA alpha. The generated magenta background and remaining pure-key edge pixels were removed without drawing replacement character art. Zabuza's two failed sheets received layout corrections, followed by two generated sword corrections. Haku received full-face-mask corrections on all three sheets.

Every generated image was inspected. Final validation checked frame counts, non-empty frames, padding, exact rectangles, consistent per-character scales, metadata/image sizes and all required prop/effect names. Results are in qa/asset-validation.json. Review contacts are qa/{character}-contact.png, qa/props-contact.png and qa/effects-contact.png.

art-manifest.json is the complete loader/provenance manifest. No Site checkout files were edited in this asset task.

## Zabuza ending cinematic

ending-zabuza.png and ending-zabuza.json contain 12 generated final-stand poses: six wounded advance/run frames followed by six mouth-kunai lunge and recovery frames. Both arms remain unusable; the weapon is held in his teeth and no sword appears. The sheet is 2304 x 768, six columns by two rows, cells 384 x 384, anchor (192,307). Standing body height matches the core Zabuza technique recovery sprite. Review: qa/ending-zabuza-contact.png. Prompt: prompts/ending-zabuza.txt.

zabuza-sword.png and zabuza-sword.json provide the separate horizontal Kubikiribocho thrown projectile, handle on the left and blade on the right, with true-alpha cutouts, tight bounds, center anchor and blade-tip coordinate. Prompt: prompts/zabuza-sword.txt.
