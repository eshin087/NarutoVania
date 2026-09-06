# V15 presentation repairs

## Accepted art

- Eight puddle frames and eight splash/decay frames, with transparent backgrounds and a shared floor anchor.
- Replacement Zabuza sword guard and coordinated adult carry/lowering frames. The first guard and undersized carry were rejected and replaced.
- Sasuke interception/recoil/fall and padded Fury frames from the first character sheet.
- Runtime registration uses the combined accepted atlas; prompts, measurements, normalization scripts, and replacement metadata are retained here.

## Verification

- 184 unit tests pass; TypeScript and lint pass; production build succeeds.
- Full browser chapter completed using the development pilot's ordinary game input actions, with no HP/position overrides. Four fights, rescue, sacrifice/awakening, interception, final stand, snowy rest, and victory completed. No browser errors; final combat time 135 seconds, excluding cinematics.
- Thirteen scene entries tested for pause/resume and current-scene skip. Four consecutive retries each returned to two fighters, zero projectiles/effects/decoys, and thirteen display objects.
- Eight barrage auditions and seven sound previews load in the production build; no missing assets. Existing music and quieter water cues remain unchanged.
- Character/ultimate previews checked; simulated standard-controller pause/resume and held confirmation behavior pass. Resize and focus-loss pause pass.
- Water sampling verified uninterrupted travel followed by ground impacts, with no residual projectiles at victory. Contact interpolation has a separate regression test. Impact states cannot damage another fighter or decoy after stopping.
- Visual checks covered flat puddle buildup, floor-anchored waves, compact crossfire mirrors, full Haku reflections, enlarged needle art, repaired carry/lower frames, and unclipped Fury artwork.

## Coverage limits

Body corrections are visually calibrated from the established idle references. Automated checks verify metadata and anchors, not a universal five-percent anatomical measurement guarantee. Hardware-controller feel and subjective audio listening were not verified; controller coverage used simulated input. The full playthrough reached 144 fps at its final sample, rather than establishing a benchmark on every desktop GPU.
