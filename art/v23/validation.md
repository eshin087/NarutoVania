# V23: Mirror entry, softer sound, and a continuous ending

## Implemented
- Eight staggered ice frames form an enclosing arch, followed by Haku's visible entry and staggered reflections. One shared mirror component retains measured interiors and camera clamping.
- Ranged selection no longer rejects its only available move solely because it was used last. Coordinated needle fans are thinned before release when necessary, retaining two origins and a 224px corridor; unsafe existing flight paths still defer/omit a volley.
- New imagegen Haku entry/interception/fall, restrained Zabuza kneeling/kunai, Naruto handoff, forward-running mercenary, and three distinct low biting hound strips. Source prompts and cleanup metadata are retained. Fixed row scales were checked against idle heads/torso proportions, then Haku and kneeling Zabuza reduced after visual comparison.
- Haku unmasks beside Naruto and fallen Sasuke; the adult duel is staged farther left. Its water exchange uses separated origins, with no early Chidori.
- One ending controller owns movement and poses. Sakura runs in, dogs bite at ankle height with grounded bodies, Haku arrives before the Chidori thrust, and the dogs dismiss on contact. Naruto hands the kunai to Zabuza. The survivor runs forward. Snow uses carried positions and the calibrated resting frame.
- Replaced noisy warning/ice/charge cues and legacy layered effects with softer selected recordings. Forty-two effects have short fades and peaks at or below -12dBFS in preparation. Existing quiet water/music and user volume preferences are retained. Audio manifest preserves original licenses, selected source layers, hashes, and edit notes.

## Validation
- 218 tests across 22 files pass, including new interception timing, safe multi-origin emissions, cadence fallback, layout, art padding/scales and sound-source tests.
- TypeScript, lint and production build pass.
- Browser chapter completed all four fights through the snowy ending: zero deaths, zero page errors. Combat HP/damage, projectile speeds, ultimate charging and defensive windows remain unchanged.
- Focused browser previews: unmasking, interception, kunai, survivor run, carrying and snow. Verified hidden hounds at interception, mirror exit/reflection cleanup, pause/resume, resized viewport, and simulated standard-controller movement/dash.
- Final art-only calibration and softer source substitutions received focused scene and audio decode checks after the chapter run. All replacement effects decode in Chromium.
- No subjective listening or physical-controller verification was available. Signal analysis and simulated controller coverage are recorded separately from those limitations.

## Sources
Generated with the built-in image generator; the underlying model was not explicitly selected. Checkerboard cleanup was authorized by the user. Audio sources and licenses are listed in public/audio-v23/manifest.json.
