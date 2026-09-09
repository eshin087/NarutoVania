# Independent game-development review

The reviewer acts with senior 2D action-game and animation-director standards. This describes the work, not a claim of professional credentials. The reviewer must inspect evidence independently of the implementation author's claims.

Use [QA_REPORT.md](templates/QA_REPORT.md). Review every named fight and transition, not one representative screenshot. Record build/commit, browser, input method, observed moments and limitations.

## Gates

| Gate | Required evidence |
| --- | --- |
| Canon and intent | Cited sequence, era/abilities, labeled adaptations, player purpose and canonical setback objective |
| Art | Both-facing contact sheets against idle/run; measured anatomy/root; no alpha/clipping/style outliers |
| Rendered combat | Anticipation/contact/recovery, actual hurt vs armor, telegraphs, readable effects and stable depth |
| Fairness | Ordinary-input success and mistakes, edge/center routes, stamina depletion, parry/block/dash, punish windows |
| Story | Natural fight handoffs and direct previews; correct actor ownership, release/contact/landing chronology and dialogue |
| Lifecycle | Pause/skip/retry/death/scene change; no orphan effects, duplicate weapons, stale volleys or audio nodes |
| Product | Chapter selection/progress, debug isolation, keyboard/controller parity, resize/fullscreen/focus, production tool exclusion |
| Audio | Actual listening coverage recorded separately from decode, peak and concurrency measurements |
| Release | Automated checks, static production browser run, full chapter, prior-chapter regression and public smoke when deployed |

## Per-fight critique

Can a new player identify the threat and a viable response? Do melee anticipation and contact match the sprite? Are attacks varied without unavoidable overlap? Can grounded players escape major barrages with available movement resources? Do mistakes hurt without repeated unavoidable contact? Does the boss recover enough for earned retaliation? Is a guard break visually different from armor?

Check ultimate availability, intended fight duration, checkpoint/retry resources and entity counts. Test at both arena edges and in both facings. Do not use a perfect automated pilot as proof of human difficulty.

## Per-scene critique

Inspect entry → movement → anticipation → release → contact → reaction → settled pose → handoff. Check:
- Continuous actor transforms and facing from gameplay, including fallen bodies.
- No competing animation owners or pose resets.
- Weapon origins and exact counts; no baked duplicate projectile.
- Cause precedes result, interceptor arrives before protected target is struck.
- Correct anatomy in kneel/fall/carry compared with standing.
- Camera contains complete art and tracks motion without hiding essential action.
- Dialogue remains attached to the correct speaker and occurs once.
- Pause, replay and scene-local skip produce valid equivalent resulting states.

## Severity and acceptance

- **P0, release blocker:** crash, progression dead end, save corruption, missing required assets or failed deployment.
- **P1, must fix:** unavoidable damage, duplicate contact, orphan effects, incorrect story causality, major scale jumps, clipped core action, persistent harsh audio or cleanup failure.
- **P2, quality defect:** confusing pose, abrupt entry, drifting feet, weak tell, repetition or poor bubble/camera staging.
- **P3, polish:** minor secondary motion or decorative refinement.

No average score can cancel a P0/P1. Fix and re-review all P0/P1. Resolve P2 or record an explicit acceptance with reason and residual impact; required user-requested behavior cannot be quietly reclassified as optional polish. Unobserved criteria are "not verified", never passed.

## Revision loop

1. Coordinator submits immutable candidate revision, named scene checklist and evidence.
2. Critic independently returns findings with reproducible moment, impact, correction and objective retest condition.
3. Coordinator fixes; replacement art goes through art acceptance again.
4. Critic rechecks each finding and neighboring transitions.
5. Run affected regression tests; repeat full chapter when shared runtime/state changes warrant it.
6. Stop when required gates pass. After two failed local fixes, diagnose the underlying model instead of layering more timers/scales.

## Honest test coverage

Use ordinary shared inputs for a playthrough. Do not mutate HP, positions, resource meters, clocks or outcomes to claim completion. Development-only direct state setup is useful for focused tests, but label it separately. Freeze source/HMR during final playback.

Simulated controller mappings are not physical-controller verification. Captures are not actual listening. A smoke test is not a full playthrough. Prior revision evidence is not fresh validation.

Track concise reports and reproducible tests in Git. Raw videos/captures may live in ignored outputs with clear filenames, but durable findings should remain intelligible if those files disappear.
