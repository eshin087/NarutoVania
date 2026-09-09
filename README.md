# Naruto: Land of Waves

A desktop browser story boss rush built with TypeScript, React, Phaser 3.90.0, and Vinext. Four fights follow Team 7 through the Zabuza and Haku encounters, with animated in-engine story scenes.

## Creating future chapters

Copy this prompt into Codex while this project is open:

> Make a new chapter about [manga moment/fight]. Follow the chapter workflow.

Start with the [chapter production guide](docs/chapters/README.md). The root [AGENTS.md](AGENTS.md) routes new chapter requests through canon research, generated art, delegated specialist work, independent game-development critique, validation and release. Per-chapter templates preserve progress across restarts.

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm ci
npm run dev
```

## Build and check

```sh
npm run typecheck
npm run test
npm run lint
npm run build
```

The client-only production site is exported to `dist/client`. It needs no database, server runtime, or ChatGPT login.

## Deployment

`vercel.json` builds the static export using `npm ci` and `npm run build`. Connect the repository to a Vercel project with the Other framework preset. The Sites build plugin is disabled on Vercel. `.openai/hosting.json` is retained solely for updates to the legacy Sites deployment.

## Controls

A/D or arrows move; Space jumps; J performs a stationary three-hit melee combo; down + hold J charges a heavy attack. K throws a tool, Shift dashes, F parries/blocks, Q/E use techniques, L substitutes, and R uses the ultimate. Escape pauses. Controller controls and character techniques are listed in the in-game menu.

Perfect-parried mirror needles return to the real Haku. Two distinct returned volleys force him out; melee, guard breaks, and ultimates remain alternatives.

The public Scene Select provides fight, cutscene, mirror-deflection, Sharingan, hound, Fireball, and chakra previews without replacing normal saved progress. Settings and checkpoints are browser-local. Developer input-pilot controls are excluded from production.

## Assets and licenses

`public/` contains the game assets and audio license manifests. `art/` retains generation prompts and audit notes; `scripts/` contains preparation utilities. Credits are accessible in the game. This is an unofficial Naruto fan project and is not affiliated with the original rights holders. Audio assets retain their individual source licenses; do not treat the entire asset collection as MIT-licensed.

## Folder maintenance

`outputs/` stores disposable deployment archives, captures, and local test scripts. `dist/`, `.vinext/`, `.next/`, `.vercel/`, and `node_modules/` are generated. `work/` contains optional audio-preparation inputs and tools and is not needed to play or build the game. These folders are excluded from Git. Keep source artwork, manifests, attribution, and original audio inputs when deleting caches.
