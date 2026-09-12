# Current status and handoff

Last source inspection: **2026-09-11**, published game source `2c10a5c`. This is a dated repository snapshot, not continuous monitoring. Recheck Git and live deployment status when a task depends on them.

## Shipped baseline

| Chapter | Implementation | Durable evidence |
| --- | --- | --- |
| 01 — Land of Waves | Four fights: mist, rescue, mirrors, seal; automatic in-engine story | [Spec](../chapters/land-of-waves/CHAPTER_SPEC.md), [V23 receipt](../../art/v23/validation.md) |
| 02 — The Power of Youth | Lee vs. Gaara; shield, speed, gates; short canonical ending | [Spec](../chapters/chunin-exams/CHAPTER_SPEC.md), [production log](../chapters/chunin-exams/PRODUCTION_LOG.md), [QA](../chapters/chunin-exams/QA_REPORT.md) |

Last recorded game release: `2c10a5c`, published 2026-09-11 to [Vercel](https://narutovania.vercel.app/), replacing `207d87a`/receipt `fc8687a`. Vercel Ready and GitHub status success; both chapter and audio public probes passed. 264 automated tests, final static build and independent rendered checks passed. [Release receipt](../chapters/chunin-exams/PRODUCTION_LOG.md), [GitHub repository](https://github.com/eshin087/NarutoVania).

Legacy [ChatGPT Site](https://narutovania-land-of-waves.gcdone.chatgpt.site/) was not updated in the Chapter 2 release. Its current parity has not been checked for this documentation task.

## Completed revision / handoff

- Completed request: one continuous Lee/Gaara health bar, power-ups at health thresholds, fairer bouncing sand barrages, readable floor/parry tells, double jump, smoother scene spacing and replacement Chapter 2 audio.
- User confirmed Retry resumes at the latest power-up checkpoint. Gaara has 6000 total HP; weight removal at 70% and Gates at 35%. Damage beyond thresholds is retained and saved at checkpoint entry. No boss refill on power-up. Lee retains injuries with a small recovery; the established ready-Lotus power-up reward remains.
- Double jump is implemented in both active chapter runtimes using one shared controller, preserving coyote time, fresh inputs and an independent air-dash allowance. Both chapters was the recommended default; the optional scope question has not received an answer. Air parry already existed and now has explicit regression coverage.
- Six previously accepted generated atlases remain integrated. New changes use those frames with clearer preparation, recoil/retreat staging, stable facings, full-width ground tells and finite one-floor-bounce trajectories shared by collision and fairness.
- Current validation: 264 tests / 31 files, typecheck, lint and production build pass. Independent resolver audit passed 1944 single routes plus 324 multi-wave scenarios; 162 cases are retained in tests. Frozen ordinary-input full runs completed at 97.91s/109.79s, no retries, 95/70HP. Rendered review closed CONT-R09–R14. [Current QA](../chapters/chunin-exams/QA_CONTINUOUS_2026-09-11.md).
- Audacity 3.7.9 produced 21 new Chapter 2 clips with source/license records and edit recipes. Static browser decoding, Sound check, monitored output peak and lifecycle pass. Chapter 1 audio preserved. Subjective listening remains unperformed; public Sound check supports user review.
- Final static smoke passed both chapters, debug saves, simulated controller/focus/modal/resize, ending and production pilot exclusion. This is not a full new Chapter 1 playthrough or physical-pad test.
- Game source `2c10a5c` is pushed and public; both public probes passed. The receipt commit changes docs only. Local preview used port3000; static preview port3002; recheck services after restart. Legacy Sites unchanged.
- Earlier project skills/docs are included in this release. See [workflow update](../maintenance/2026-09-11-project-skills.md). Do not reinstall or recreate accepted art/skills on resume.
- Next: await user review of fight/sound feel or a new scoped request. No implementation/release gate remains open. Physical-controller, subjective listening and representative human pacing remain coverage limits.
- No Chapter 3 has been selected.

## Replace this section when a new task starts

Keep one active handoff with: user request and accepted choices; chapter/gate; starting revision and task-owned files; accepted assets; issue IDs; evidence and limitations; exact next action; preview/deployment state; and any required unanswered question. Use the chapter log for chronological detail.

After restart, verify artifacts and services actually exist. Do not assume old agents, browser tabs, local server ports, session IDs, ignored captures, or external raw-art paths remain available. Read only the specialist guides relevant to the next action.
