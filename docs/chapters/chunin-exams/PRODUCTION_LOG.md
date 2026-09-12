# Chapter 2 production log

## Published continuous-duel release — 2026-09-11

Validated game source `2c10a5c692cad57bba73a2612934fa6be3d98acc` (`Rebuild Lee vs Gaara as a continuous parry duel`) is pushed to GitHub main. This also publishes the seven project skills, handbook, updated AGENTS.md and README chapter prompt. Local/remote source hashes matched before release.

Vercel reported **Ready / Production**, deployment `dpl_c5CUy5mFnyohoz4X7RhnzEczimJy`, with [deployment URL](https://narutovania-a6j4jtjck-eshin087s-projects.vercel.app) and primary alias [narutovania.vercel.app](https://narutovania.vercel.app/). GitHub's Vercel commit status reports success. The prior deployment stayed live throughout the new build. Legacy Sites was not changed.

Both public probes passed in fresh browser sessions: `tools/smoke-chapters.cjs` (Chapter 2 intro/ultimate/modal/controller/focus/resize/debug ending/save isolation; Chapter 1 four fight initializations; production pilot exclusion) and `tools/smoke-chunin-audio.cjs` (21 decodes, eight public auditions, combat/ultimate mix, pause/exit cleanup). Zero page errors or missing HTTP assets. Live monitored mix peak0.300965; zero paused effects/music and closed AudioContext after exit. [Full candidate QA](QA_CONTINUOUS_2026-09-11.md) records tests, complete duel runs, independent review and coverage limits. Subjective listening, physical controllers and representative human difficulty remain unverified.

This receipt changes documentation only; subsequent receipt commit has identical game source/assets. No unfinished implementation or publication gate remains for this revision. Await user feedback on sound feel and human fight pacing.

## 2026-09-11 continuous-duel revision — validated locally

User confirmed Audacity installed and enabled, and requested continuous Gaara health with threshold power-ups, bouncing reaction-fair projectiles, stronger ground/parry cues, double jump, and smoother spacing. Retry at latest power-up was confirmed. Gaara uses 6000 maximum with 4200/2100 thresholds; exact overkill and checkpoint-entry HP persist. Double jump is shared across both chapters by the recommended default; airborne parry already worked and is now covered explicitly.

Coordinator implemented shared piecewise one-floor-bounce flight with 180ms harmless rebound preparation and 1800ms finite lifetime, a 260ms route reaction budget, slower projectile travel, clearer complete ground footprints, pale hand release glints, and 700ms scene separation/landing when needed. Root/facing are preserved on handoff; Gates aura follows final recoil position. 264 tests / 31 files, typecheck, lint and production build pass. Independent route sweep passed 1944 paths plus 324 multi-wave scenarios; 162 cases are retained as a regression. Both ordinary-input full runs completed at 97.91s/109.79s combat with no retries. No further HP inflation; representative human pacing remains unverified.

Audacity 3.7.9 pipe was verified read-only on an empty original project. Separate task project exported 21 Kenney/Fantozzi/Taira source cues. Classic Filters crashed and was replaced by normal bundled filters; task-project beat snapping was disabled after it collapsed a short fade selection. Sources remain intact, no user project overwritten. Selected WAVs, source/license manifest and edit recipes are integrated; raw packs and the large Audacity project remain outside the checkout. Quiet endpoints/zero clipped samples, all browser decodes, public sound previews and source cleanup pass. Actual monitored mix peak0.333184. Subjective listening is unperformed.

Independent rendered review closed CONT-R09–R14 after both-facing spacing/facing/ground-glint/aura retests. Static production smoke passed both chapters, controller simulation, focus/modal/resize, debug save isolation and pilot exclusion. Full evidence and coverage limits: [continuous QA](QA_CONTINUOUS_2026-09-11.md). GitHub/Vercel publication is next; current public version remains live until replacement succeeds. Earlier project skills/docs are included in this release scope.



## Earlier 2026-09-11 revision — superseded tuning, retained art evidence

User requests recognizable Lee techniques, more spectacular parryable sand barrages, shorter/easier fights, better scale/cutscenes, a fiery Gates aura, and a new audio workflow. Confirmed duration: **2–3 minutes combat across three phases**. Audio editing waits for requested Audacity installation confirmation; independent work continues. Ground hazards versus projectile-only parry scope is awaiting the optional answer.

Initial source reproductions confirmed Hurricane misses at 50/80/88px from overshoot, ultimate could do zero damage during frozen 95ms immunity, and five simultaneous pellets could consume all stamina despite an initial perfect parry. These are now fixed locally with regressions. HP is 1700/2150/2650, with unchanged shield damage multiplier. Chapter 1 and live build remain unchanged.

Canon worker inspected 12 official episode stills plus chapter 81/86 images and the official taijutsu article. E is now the descriptive Lotus Launcher. Primary Lotus visibly wraps/inverts; Reverse Lotus has a bandage pull/downward strike; Guy's palm interception precedes dispersed sand. Full video playback/timestamps were unavailable. See [revision QA](QA_REVISION_2026-09-11.md) and [art prompts/references](REVISION_2026-09-11_ART.md).

Local implementation milestone: six new atlases integrated, with stable sequence scales and preserved original pixels at Guy's wrists/Gaara's ankles. Independent raster review accepts all 108 frames. Rendered critique and revisions addressed Lotus choreography, persistent Gates aura, weight removal, speed reveal, Guy's interception and body spacing. Final Gaara foot-root correction removes a measured 20.6px cast-to-idle crop shift; targeted cast/idle and ending retest passed in both directions.

Combat validation: full ordinary-input run completed in 125.23 seconds of combat with no retries, 55 HP, six parries and nine ultimates. No page errors or final hazards/effects. Fairness now plans around remaining movement lock and a 40ms discrete-collision allowance; focused resolver tests cover 8/16/40ms. 251 tests / 26 files, typecheck and lint pass. Final production build and static smoke pass after the last anchor change: both chapters, controller simulation, focus/resize/modal, debug saves and pilot exclusion. Zero page errors or missing assets. Existing Phaser bundle-size warning remains nonblocking.

Resume gate: audio replacement awaits the user's requested Audacity 3.7.9 installation, mod-script-pipe enablement and restart confirmation. No audio edits or subjective listening sign-off. After confirmation, verify editor access, create/refine reusable Chapter 2 cues, audition the rendered mix, rerun relevant checks, then publish GitHub/Vercel. Do not regenerate accepted art or change Chapter 1 audio. Local ports 3000/3002 must be reverified after restart. No revision commit/push/deployment yet; retain earlier uncommitted project skills/docs.

## Original production history

2026-09-08 — Gate 1 complete. Baseline b1b0d43. User approved 5–8 minutes / three phases, canonical brief ending, Vercel publication after QA.

Research agent ch2_canon delivered cited beats; official sources in CHAPTER_SPEC. Exact entrance/spectator placements unverified and labeled adaptation. Architecture agent ch2_architecture recommends isolated scene/runtime/page, generic shared Combatant and injected BattleInput bridge. Both read-only.

Gate 2 active: ch2_art generating references then six bounded art sheets in external staging under .codex/visualizations/2026/09/05/01a0700e-9aab-7040-b123-d472c87e3925/ch2-art. No assets accepted/integrated yet.

Coordinator edits: Combatant generic ID and injectable BattleInput. Next: chapter-aware persistence/selector, deterministic Lee/Gaara combat model, then integrate inspected assets and independent critique.

Tool note: default filesystem ACL helper fails. apply_patch attempted and failed before read; scoped escalated PowerShell works. No deployment yet. Existing live game unchanged.

Art audit (first accepted batch): Lee quiet/run/pose atlas, Gaara atlas, preliminary hall and sand atlas accepted. Generated alpha retained for Gaara; Lee magenta removed under prior user authorization. Lee continuous melee sheet measured crown widths 50–52 source px versus idle44–46; neutral body233px versus208px. Rendering melee .59 and idle .66 yields ~30px crowns and137px bodies for both, avoiding attack enlargement. Run uses .62 for49px crown. No per-frame silhouette resizing. Atlas cells get16px padding; contact pose timing follows shared attack events. Sources/cleanup code retained in tools/ingest-chunin-art.py.

Independent deterministic critique from ch2_architecture: fixed unreachable wall major (separate lastMajorId), canceled volley still hitting within same update (attackGeneration guard), repeated break cue, frame-rate movement. 228 tests pass, typecheck and lint pass before remaining asset integration. First rendered title inspected: alpha/scale/arena/feet good. Full chapter and audio listening not yet verified.

Pacing diagnostic 1: ordinary-input browser pilot completed Shield phase in52.54s (3 ultimates, no perfect parries, health70 at40s), no console errors. This is faster than chapter target with efficient attack selection. Initial phase pools1800/2200/2500 adjusted to2400/3100/3700 pending full playthrough. No damage, defensive windows or ultimate charge rates changed; Chapter1 unchanged.

Full ordinary-input run1 completed all3 phases plus canonical ending with no retries, no page errors,8 perfect parries,30 health remaining,0 final hazards/effects. Combat clock248.73s excludes automatic story scenes. This was below requested5–8min combat target, so final pools adjusted to3000/3900/4600. Retest required; no mechanics/presentation/damage changes.

Independent rendered critic cleared all fights, ultimates, Gates transition and final ending. Menu P1 (Escape resumed behind Controls) resolved with explicit modalOpen input ownership; keyboard+controller polling obey it. Verified exact debug-save isolation and chapter unmount (0canvases)→Chapter1 mount(1canvas). Dust/Gates obscure-body P2 corrected with behind-body rendering and lower opacity. Remaining P2: weight removal is simplified to cuff-like props and existing kneel pose; accepted for this first fight-review build, with full causal drop/impact and dialogue retained. Dedicated hand-to-cuff choreography remains a polish item, not a missing story beat.

Final validation gate:232 tests /24files, typecheck/lint/build pass. Final ordinary-input run285.3267s combat plus roughly50s story, no retries,65HP,17parries,16ultimates across the whole chapter. No console errors. Static production smoke passes bothchapterentries, Ch2 intro/ultimate/ending, controller prompts/focus/resize/modal, debugsave isolation, all4Ch1 fight initialization and production pilot exclusion. Independent rendered review has no unresolvedP0/P1. See QA_REPORT.md for full evidence and accepted weight-removal polish limitation. Publishing to approved primary Vercel target next; legacy Sites destination is not part of this chapter release request.

## Published release — 2026-09-08

Validated game source: `207d87a` (`Add Lee versus Gaara Chunin Exam chapter`), pushed to GitHub main. Vercel reported success for deployment https://vercel.com/eshin087s-projects/narutovania/858RnLG6VeZbYCpWsRphyXHn1k7a .

Public smoke at https://narutovania.vercel.app/ passed using tools/smoke-chapters.cjs in a fresh browser session: Chapter 2 intro/ultimate/modal/controller/focus/resize/debug ending/save isolation, Chapter 1 four-fight initialization, and production pilot exclusion. Zero page errors and zero missing HTTP assets. The same validated game source is now public; legacy ChatGPT Site was not changed by this release.
