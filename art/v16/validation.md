# V16 fighter scale and targeted water launches

- Zabuza's newer melee poses now use head-size calibration against his original idle/run reference. Naruto's melee poses were recalibrated before applying the requested 0.95 visual multiplier to Naruto and Sasuke. Gameplay bodies, reach, damage, timing, and resource costs are unchanged.
- Shared presentation corrections are applied after normal combat poses, direct sword poses, cinematic poses, reactions, and Fury poses. Existing afterimages copy the final rendered pose. Measurement annotations remain approximate visual measurements, not a certified five-percent anatomical guarantee for every foreshortened limb.
- A new generated ice mirror has a complete top and bottom. Visible alpha bounds exclude transparent sprite padding when fitting Haku. Sampled crossfire mirrors are about 100 by 190 logical pixels; prison mirrors retain 130 by 230. The component adds only the clearance needed for the actual pose.
- Airborne dragon pairs and streams originate at the casting hand, target the player's torso at release, and retain constant flight velocity afterward. A short trail-growth phase prevents the full dragon from appearing across the caster. Existing flight/impact/dissipation behavior is retained.
- Escape-route preparation checks both current and proposed projectiles. Failed route checks retry at 100 ms intervals, up to three retries, then omit the volley. Route reach uses the player's running speed and a bounded dash allowance only when stamina permits.
- Hunter-nin dialogue is rendered in the HUD scene and projected from Haku's visible head bounds; it no longer receives the world camera's zoom twice.
- The yellow sword anticipation arc and accompanying dot are removed. Successful parry feedback and unblockable exclamation marks remain.

## Validation

- 188 unit tests, TypeScript checking, lint, and production build pass.
- Full chapter completed using ordinary input actions through the development input pilot, without HP/position overrides or retries. All four fights and the ending completed; combat timer 148 seconds. No browser errors; no remaining projectiles at victory. Final observed frame rate: 144 fps.
- Thirteen character/ultimate previews pass, including simulated controller pause/resume and debug-save isolation.
- Focused browser checks cover both water-spirit variants, both crossfire variants, prison mirrors, and hunter-nin intervention: 120 samples, no errors or missing assets. Reflection containment and upper-screen clearance are asserted from rendered bounds.
- Freeze, next-frame stepping, and reference-overlay controls were verified by comparing rendered canvas captures.
- Physical-controller hardware and subjective audio listening were not tested. Audio was unchanged.
