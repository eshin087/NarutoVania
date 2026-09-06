# Naruto: Land of Waves — Story Boss Rush

A desktop browser fan game built with TypeScript, React, Phaser 3.90.0, and the Sites starter. Five playable story encounters follow Team 7 from the lakeside confrontation with Zabuza to the bridge battle and snowy aftermath. There are no traversal levels or filler enemy waves.

## Play

Move with A/D or arrows; crouch with S/down. Space jumps, J attacks, and down + hold J charges a heavy strike. K throws a ranged tool. Shift dashes, including one air dash per jump; down + direction + Shift slides. F parries on a fresh, timed press and blocks while held. Red attacks require evasion. Q/E use the active character's techniques, L substitutes a decoy, and R uses a charged ultimate. Escape pauses; Enter skips cinematics or retries after defeat.

Standard controller: stick/D-pad move, A jump, X melee, Y tool, B dash, LB parry/block, RB/RT techniques, LT substitution, right-stick click ultimate, and Start pause. The controls menu includes each active character's kit and separate music, effects, and voice levels. Fullscreen and reduced shake are supported.

Control Kakashi, Naruto, Kakashi, Sasuke, and Naruto in story order. Kakashi has Sharingan, Ninja Hounds, and a Chidori / Lightning Blade ultimate in every playable duel. This is an intentional gameplay expansion; the story cinematics preserve his copied-water exchanges. Sasuke has no Chidori, Naruto has no Rasengan, and Sakura has no later healing or super-strength. Sakura protects Tazuna in a cinematic; the final Kakashi/Zabuza confrontation is also cinematic. Cinematic objectives handle canonical setbacks; players never have to lose deliberately. Every phase saves a checkpoint. Retries restore its starting resources and skip viewed introductions.

The revised tuning targets 60–90 seconds per fight with quicker boss anticipation, meaningful defensive mistakes, and short punish windows. Sasuke must hold out for 60 seconds and break Haku's guard twice inside the mirrors; this triggers the protective sacrifice without a forced player death. Naruto finishes Haku. Legacy Sakura/finale checkpoints migrate through their cinematics. The active-play timer excludes pauses and cutscenes.

Perfect parries drain 23 or more boss stamina without cancelling an entire attack string. Kakashi's Sharingan briefly slows time, highlights attacks, doubles parry guard damage, and empowers the next counter by 50%. Naruto's rescue kit replaces Transformation with Clone Launcher: a clone-assisted upward kick that pressures guard. Substitution remains the distinct decoy action.

Boss guard break lasts 1.55 seconds, with 1.6× base damage. Recovery grants 1.7 seconds of reduced incoming posture damage and prevents repeated flinches. Allies deal reduced guard damage. Bosses retain armor during committed attacks; defensive timing is necessary. Shurikens cost 4 chakra. Ultimate charge grows more slowly. Dramatic 1.7-second ultimate presentations remain.

The active mirror formation lasts up to 38 seconds, survives guard breaks, and has bounded interrupt openings. Naruto's ultimate breaks at most two mirrors. Ordinary attacks can break them, and upper mirrors are within normal jump-tool reach.

## Development

Run `npm install`, then `npm run dev` (the current starter serves port 3000 by default). Run `npm run typecheck`, `npm run lint`, `npm test`, `node scripts/verify-boss-assets.mjs`, and `node scripts/verify-combat-assets.mjs`. `npm run build` creates the client-only static output in `dist/client`; hosting configuration is in `.openai/hosting.json`.

The entry point is `game/boss-page.tsx`. `boss-runtime.ts` mounts separate loading, title, gameplay, HUD, and results scenes. `boss-gameplay.ts` integrates Arcade Physics with bounded combat hitboxes; `combat-core.ts` owns action timing, resources, defenses, and damage rules. `chapter.ts`, `story-director.ts`, and `boss-ai.ts` define character kits, phase outcomes, and boss decisions. `battle-input.ts` provides shared keyboard/controller actions. Earlier platformer source is retained as history and is not imported by the new entry point.

## Artwork and sound

Generated character, arena, prop, and effect assets are in `public/art-v2/`. The animation manifest records rectangles, anchors, timing, hit events, and attachments. References, generation prompts, and inspection notes are in `art/boss-rush/`. The core set contains 432 frames across six characters, with additional awakened Naruto, unmasked Haku, and ending Zabuza animation. The user authorized code removal of baked backgrounds; generated character art remains intact.

`public/art-v3/` adds 16 technique icons, four character ultimate cut-ins, 24 Kakashi palm/kick/sweep/heavy frames, and 12 water-jet/dragon/wave frames. Its manifest and `art/combat-revision/` retain prompts, rectangles, anchors, timing, hit events, and inspection notes. The HUD shows technique names and costs; selecting a card opens the full description in the controls menu.

`public/audio-v3/manifest.json` records the active recording sources, licenses, attributions, and edits. It replaces combat effects with 27 edited Taira Komori martial-arts, sword, water, and magic recordings. It retains the reusable music, footsteps, and fighter efforts from `public/audio/`. Impact variants, quieter and less frequent voices, and music ducking keep attacks distinct. Music and fighter efforts are substitute recordings, not the original Naruto soundtrack or cast. Playback is bounded, with independent volume controls, crossfades, and pause/retry cleanup. There is no continuous oscillator drone. Full attribution and story references are available in Credits. Sakura's edited voice clips retain CC-BY-SA 4.0 terms.

This is an unofficial fan game. Naruto and its characters belong to Masashi Kishimoto and their respective rights holders.

## Browser tools and verification

When WebMCP is available, the game exposes status, start, pause/resume, retry, and cinematic-skip actions through the same commands as the interface. Development-only normal-input sequence and combat-pilot tools support repeatable browser playtests. They do not override resources, positions, time, or story outcomes and are excluded from production.

See `VALIDATION.md` for verification results and scope limitations.

`public/art-v5/` contains the natural four-frame tidal breaker, six manga moments, launcher icon, prompts, frame metadata, and QA. Cutscene speech is original concise paraphrase; directions, camera bounds, landings, and ground placement were revised.
