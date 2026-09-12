# Chapter 2 Audacity palette — 2026-09-11

Integrated palette: 21 selected WAVs under [public/audio-chunin](../../../../public/audio-chunin), with [manifest](../../../../public/audio-chunin/manifest.json) and [credits](../../../../public/audio-chunin/CREDITS.md). This folder retains the edit recipes. The notes below describe the asset-only task's external staging; its `wav/`, raw `sources/`, Audacity project, audition and command logs are not distributed with the game. Their absence from a fresh clone is intentional. Use the tracked selected exports and recipes as the durable handoff.

Audacity 3.7.9 (Windows file/product version 3,7,9,0) and mod-script-pipe were verified with read-only Help/GetInfo first. The initial project contained no tracks or clips. A separate task project was created. All output audio was imported, trimmed, filtered, faded, normalized and exported through Audacity. Python only orchestrated the pipe, copied/downloaded sources, and measured exported WAVs; it did not synthesize or render the delivered cues.

## Listening status

**Not performed.** Signal checks passed, but they do not establish pleasant sound or audible gameplay balance. `audition-isolated.wav` presents each final cue once with 800 ms spacing; exact cue timing is in `audition-timeline.json`. `chapter2-palette.aup3` contains the same sequential arrangement, ready for actual listening in Audacity. Do not mark subjective or in-game listening passed from these measurements.

## Mapping

| Gameplay event | Clip or pool | Trigger guidance |
| --- | --- | --- |
| Palm contact | hit-palm-1..3 | One source at contact |
| Kick / Hurricane contact | hit-kick-1..3 | One source at contact |
| Weight drop / Lotus landing | hit-heavy, hit-heavy-2 | One heavy contact; no explosion stack |
| Attack movement / dash | whoosh-1, whoosh-2 | One brief swish |
| Anticipation / fist preparation | tell | Once when the tell begins |
| Parry / Guy interception | parry, parry-2 | Short dry deflection; no metallic ring |
| Held guard | guard | Soft contact |
| Broken guard / armor crack | break | Single brief crack |
| Sand gather / ground warning | sand-cast | Ground warning can reuse at lower gain |
| Sand shot volley travel | sand-move | Once per volley; never loop or per projectile |
| Sand shield / eruption contact | sand-impact | Once per contact event |
| Dissolve / loose grain tail | sand-settle | Quiet optional tail |
| Sand ricochet | sand-bounce | One cue per volley bounce |
| Arena step | step | Quiet, cadence-limited |

Optional aliases: dash → whoosh-2; ground-warning → sand-cast. The supplied pools require no pitch changes. Root coordinator owns Chapter 2-only profile integration, trigger timing, concurrency and ducking. Preserve Chapter 1, music, voice settings, stored slider preferences and mute defaults.

## Sources

Kenney Impact Sounds provides untreated punch, soft-body, wood and plank takes (CC0). Fantozzi's sand/stone footsteps, sliced by qubodup, provide discrete granular events (CC0). Taira Komori's swish1_1, swish1_2 and make_fist provide movement/tell effects (royalty-free project use with no standalone sound-library redistribution). Author pages/licenses were checked on 2026-09-11 and archived under `sources/`. Full URLs, authors, attribution and original source hashes are recorded in `recipes.json` and `manifest.json`; see `CREDITS.md`.

No V23 processed audio was used. No anime audio was extracted. Each cue has one source, original playback rate, and no added oscillator/noise, layers, compression, reverb or pitch shift. The source author's pre-existing production is not claimed to be unprocessed field recording. A downloaded continuous Taira sand wash was rejected before output selection; only the Fantozzi sand/stone takes are used for sand cues. Do not copy the complete staging directory into public assets: integrate only selected WAVs and required provenance.

## Edit recipe and verification

`recipes.json` holds exact source ranges, high/low cutoffs, normalization peaks, fades, original hashes and processing order. The two bundled Audacity filters use 6 dB/octave. Normalize/DC removal runs before fades. A final 10 ms endpoint fade, selected through 10 ms beyond the clip, addresses a sample-rounding artifact at the clip boundary. All final exports are mono 16-bit PCM at 44100 Hz, 0.14–0.41 seconds, with zero clipped samples and first/last sample magnitudes below 0.0002. Actual peaks/RMS/onsets/tails/spectral energy and SHA-256 hashes are in the manifest. The 0.1 dB target-ceiling tolerance accounts for PCM dither/rounding; this is not a loudness or listening assessment.

Audacity event history is retained in `audacity-edit-log.jsonl`. `edit_palette_audacity.py` rebuilds the task-owned palette; it asserts every existing track name belongs to this exact task before clearing them. `finalize_audacity.py` applies final edge fades and arranges the audition. `verify_audio.py` verifies and writes the manifest. These scripts are task-specific, not general helpers to run against another user's project.

One initial ClassicFilters invocation was followed by the original Audacity process exiting and a recovered Audacity process appearing; the stale task pipe script was stopped, read-only connection was reverified, and the final run used the standard High-passFilter/Low-passFilter plugins instead. A collapsed short selection was fixed by turning beat snapping off in the task project. Failed/intermediate outputs were replaced; all final files passed the subsequent verification. No original/user audio project was modified.
