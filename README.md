# Narutovania: Land of Waves

A single-player desktop browser action chapter built with the Sites starter, TypeScript, React, and Phaser 3.90.0. Young Naruto crosses the forest and bridge, fights Zabuza's sword/water/mist phases, and faces Haku's six-mirror prison.

## Play

Move with A/D or arrows. Hold Space for a higher jump. Hold J for a three-hit melee combo and K for shuriken. Q summons two six-second shadow clones; L substitutes a targetable log and grants brief immunity; R spends a full combat-earned meter on Rasengan. Escape pauses. Controls, sound, reduced shake, and fullscreen are available in the interface.

Standard gamepad: stick/D-pad move, A/Cross jump, X/Square melee, Y/Triangle shuriken, LB clones, B/Circle substitution, RB Rasengan, Start pause. Prompts switch with input activity and return to keyboard on controller disconnection.

Checkpoints restore health and chakra before each boss. A Haku retry keeps Zabuza defeated. Only checkpoint and sound/shake settings persist locally. Active play time includes retries within a session and excludes menus and pauses. A saved-checkpoint reload starts a new session timer. First-play duration depends on exploration, combat proficiency, and retries; a practiced clear can be shorter than the 5–8 minute first-play target.

## Development

`npm install`, then `npm run dev -- --port 5173`. Use `npm run typecheck`, `npm test`, and `npm run build` to validate. The client-only static build is written to `dist/client`; Sites hosting configuration lives in `.openai/hosting.json`.

## Artwork

All character, enemy, scenery, prop, and combat-effect raster artwork was generated with imagegen before gameplay implementation. The selected reference and exact generation prompts are in `art/`. Runtime images are in `public/art/`. `game/assets.json` records frame rectangles, action sequences, scale information, and foot anchors. Clones reuse Naruto frames. Animation combines generated key poses with movement and transient effects.

The user authorized code cleanup of baked sprite backgrounds. `scripts/clean-background.mjs` preserves the generated character interior and clears border-connected checkerboard pixels. `scripts/analyze-art.mjs` measures component bounds and anchors. These are provenance tools; source paths in them refer to the original local generation workspace.

This is an unofficial fan game. Naruto and its characters belong to their respective rights holders. Audio is original synthesized ambient and combat sound, activated after interaction.

## Browser automation

When `document.modelContext.registerTool` is available, the game exposes `read_game_status`, `start_chapter`, `set_game_paused`, `retry_checkpoint`, and `continue_encounter`. Mutation tools use the same game commands as UI controls and validate input. A development-only bounded normal-input sequence tool supports repeatable playtesting; it is excluded from production.

## Validation

See `VALIDATION.md` for the browser playtest and known scope limits.
