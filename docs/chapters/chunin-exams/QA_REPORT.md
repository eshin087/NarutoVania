# Chapter 2 QA and release review — 2026-09-08

## Candidate
The Power of Youth: Lee versus Gaara. Final phase endurance3000/3900/4600; all other Lee/Gaara tuning unchanged after the visual review. Chapter1 mechanics preserved.

## Verified
- npm run typecheck: pass.
- npm run lint: pass.
- npm test:232 passing tests /24 files.
- npm run build: pass, static dist/client. Existing Phaser-sized bundle warning remains; no build errors.
- Final full chapter in Edge through shared ordinary inputs, no HP/position/time/outcome overrides: all3 phases and automatic canonical ending, no retries,17 perfect parries,65 remaining health. Combat clock285.33s (4m45s); approximately50s of automatic story staging makes a roughly5.5-minute chapter. Efficient automated defense is not a human-duration guarantee; the requested5–8minute target allows skill-dependent variation.
- Earlier aggressive input diagnostic exercised actual defeat/retry. All phases restore starting resources and one ready ultimate.
- Sampled desktop frame rate approximately165fps on available165Hz environment. Effects sampled at0–42, ending0; hostile shots bounded48. No page errors. Audio buffers load without missing records; effects clean up and music crossfade stays bounded at2 sources.
- Static production smoke: chapter selector, Chapter2 opening and ultimate, modal pause, simulated controller connection/disconnection and prompts, focus loss, resize, everyphase initialization, debug ending, exact normal-save isolation, Chapter1 four-fight initialization, no development pilot in production. Zero console page errors or missing HTTP assets.
- Both-facing art contact sheet inspected: Lee idle/run/melee/reactions, Gaara idle/cast/reactions, Guy intervention. Idle versus combo crown/body normalization measured; planted roots and transparent padded cells inspected. No manga cards.

## Independent review
ch2_architecture reviewed rendered title, opening samples, all3fight phases, both Lotus presentations, weights/Gates transitions and completed ending. It independently verified debug-save isolation, modal fix, chapter teardown and Chapter1 startup. ch2_canon reviewed story chronology against official Naruto sources; ch2_art inspected generated candidates.

Resolved findings:
1. Major selection could never reach walls after intervening ordinary attacks: separate last-major identity; deterministic regression.
2. A breaking parry canceled the projectile collection but remaining iterator entries could still hit: cancellation generation guard; deterministic regression.
3. Repeated guard-break feedback and frame-dependent boss recovery drift: transition-only feedback and delta-based movement.
4. Scene outcomes could mention a Lotus never performed: mandatory brief Primary Lotus/sand-shell reveal and Reverse Lotus/sand cushion before their aftermaths, distinct final airborne combination.
5. Escape could resume behind Controls: explicit modal input ownership covers keyboard and gamepad; browser retest and regression pass.
6. Dust and Gates effects hid Lee: render behind bodies with reduced opacity; independent visual recheck pass.

Accepted P2 for this first fight-review build: weight removal uses existing crouch poses and simple detached cuff props. The drop/impact and dialogue are clear, but a dedicated hand-to-cuff removal strip would improve this short scene.

## Limits
No physical-controller verification or subjective listening evaluation. Simulated controller tests and decoded audio/lifecycle checks do not substitute for those. Exact original manga panels/entrance shot placement were not frame-verified; opening and combat spectacle are labeled adaptations in CHAPTER_SPEC. Generated character conditioning used detailed textual references because local image-conditioning reads failed under the Windows ACL helper.

## Reproduction
- tools/playtest-chunin.cjs: development preview, ordinary shared input pilot, bounded run, writes outputs/ch2-final-playthrough.json.
- tools/smoke-chapters.cjs: static production and public smoke; no development overrides.
- Set NARUTO_PLAYWRIGHT_MODULE to the installed Playwright module when not available through normal Node resolution, NARUTO_TEST_URL to the target, optionally NARUTO_BROWSER to browser executable.
- tools/ingest-chunin-art.py accepts the external selected-source directory; requires Pillow and NumPy. Compiled accepted WebPs and frame manifest are tracked, as are selected generation prompts.

Publication: source commit 207d87a is deployed successfully to https://narutovania.vercel.app/. Public production smoke passed with zero page errors or missing assets. Deployment receipt is recorded in PRODUCTION_LOG.md.
