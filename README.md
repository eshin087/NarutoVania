# Naruto: Land of Waves — Story Boss Rush

A desktop browser fan game built with TypeScript, React, Phaser 3.90.0, and the Sites starter. Seven consecutive story encounters follow Team 7 from the lakeside confrontation with Zabuza to the bridge battle and snowy aftermath. There are no traversal levels or filler enemy waves.

## Play

Move with A/D or arrows; crouch with S/down. Space jumps, J attacks, and down + hold J charges a heavy strike. K throws a ranged tool. Shift dashes, including one air dash per jump; down + direction + Shift slides. F parries on a fresh, timed press and blocks while held. Red attacks require evasion. Q/E use the active character's techniques, L substitutes a decoy, and R uses a charged ultimate. Escape pauses; Enter skips cinematics or retries after defeat.

Standard controller: stick/D-pad move, A jump, X melee, Y tool, B dash, LB parry/block, RB/RT techniques, LT substitution, right-stick click ultimate, and Start pause. The controls menu includes each active character's kit and separate music, effects, and voice levels. Fullscreen and reduced shake are supported.

Control Kakashi, Naruto, Kakashi, Sakura, Sasuke, Naruto, and Kakashi in story order. Characters have arc-appropriate techniques: no Rasengan, Chidori, later healing, or super-strength. Sakura's short Tazuna protection encounter is a gameplay expansion of her protective role. Cinematic objectives handle canonical setbacks; players never have to lose deliberately. Every phase saves a checkpoint. Retries restore its starting resources and skip viewed introductions.

The chapter targets 15–20 minutes, excluding retries. Timing depends on combat proficiency and cinematic skipping. The active-play timer excludes pauses and cinematics, includes retries, and resets when continuing a saved checkpoint in a new session. Only settings and the current chapter checkpoint persist locally; legacy saves begin at the boss-rush opening.

## Development

Run `npm install`, then `npm run dev` (the current starter serves port 3000 by default). Run `npm run typecheck`, `npm run lint`, `npm test`, and `node scripts/verify-boss-assets.mjs`. `npm run build` creates the client-only static output in `dist/client`; hosting configuration is in `.openai/hosting.json`.

The entry point is `game/boss-page.tsx`. `boss-runtime.ts` mounts separate loading, title, gameplay, HUD, and results scenes. `boss-gameplay.ts` integrates Arcade Physics with bounded combat hitboxes; `combat-core.ts` owns action timing, resources, defenses, and damage rules. `chapter.ts`, `story-director.ts`, and `boss-ai.ts` define character kits, phase outcomes, and boss decisions. `battle-input.ts` provides shared keyboard/controller actions. Earlier platformer source is retained as history and is not imported by the new entry point.

## Artwork and sound

Generated character, arena, prop, and effect assets are in `public/art-v2/`. The animation manifest records rectangles, anchors, timing, hit events, and attachments. References, generation prompts, and inspection notes are in `art/boss-rush/`. The core set contains 432 frames across six characters, with additional awakened Naruto, unmasked Haku, and ending Zabuza animation. The user authorized code removal of baked backgrounds; generated character art remains intact.

`public/audio/manifest.json` records all recording sources, licenses, attributions, and edits. Music and fighter efforts are reusable substitute recordings, not the original Naruto soundtrack or cast. The game uses decoded assets with bounded playback, volume controls, crossfades, and pause/retry cleanup. There is no continuous oscillator drone. Full attribution and story references are available from the in-game Credits menu. Sakura's edited voice clips retain CC-BY-SA 4.0 terms.

This is an unofficial fan game. Naruto and its characters belong to Masashi Kishimoto and their respective rights holders.

## Browser tools and verification

When WebMCP is available, the game exposes status, start, pause/resume, retry, and cinematic-skip actions through the same commands as the interface. Development-only normal-input sequence and combat-pilot tools support repeatable browser playtests. They do not override resources, positions, time, or story outcomes and are excluded from production.

See `VALIDATION.md` for verification results and scope limitations.
