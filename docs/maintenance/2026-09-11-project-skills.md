# Project skills and continuity records — 2026-09-11

Starting source: `fc8687a`; clean checkout. User requested reusable project skills and MD tracking based on development history, and selected project-only installation.

Added seven instruction-only skills under `.agents/skills`: chapter production, sprite audit, combat tuning, scene continuity, audio review, independent game QA, and release/cleanup. These route to maintained specialist guides rather than duplicating complete pipelines. Added `docs/project` with status/handoff, scoped decisions, known issues/coverage, asset ownership, and regression navigation.

Corrected stale source documentation that still called the chapter registry unimplemented. Updated release routing so only requested destinations are published. Root AGENTS.md and README link the skills and the short startup path. No gameplay, runtime asset, dependency, personal skill, or global-memory changes.

## Validation

- All seven skills passed the installed skill-creator quick_validate.py checker. Its missing PyYAML dependency was installed only in a temporary validation folder; project dependencies were unchanged.
- All 162 local Markdown links in 34 checked project/skill/guide files resolved. Source and test navigation paths were checked against the current checkout.
- Git diff whitespace checks passed. The change contains Markdown instructions only; no game build or fresh playthrough was run. Prior game receipts remain dated evidence.
- Manual instruction review covered the cases below. This is a document-level routing review, not an independent agent execution or proof that the app has hot-reloaded the new skills. Official repository discovery guidance was verified before choosing `.agents/skills`.

| Example request | Reviewed routing and boundary |
| --- | --- |
| Make a new chapter / continue after restart | Chapter skill reads STATUS and existing log, verifies prior gate, uses bounded production roles, preserves current chapters |
| Zabuza shrinks while attacking | Sprite audit traces the active texture/anchor/scale and body landmarks before deciding on metadata versus replacement art |
| Diagnose a boss standing idle | Combat skill examines cooldown/history/fairness together; diagnosis alone does not mutate tuning |
| Fix an abrupt interception | Scene skill traces entry transforms and contact ownership; the protected target cannot be hit first |
| Review harsh audio with no playback available | Audio skill separates cue/loop analysis from unavailable listening; no subjective pass |
| Critique Chapter 2 without changing it | QA skill returns evidence-backed findings and coverage gaps; no gameplay edits or release |
| Is GitHub current? | Release skill reads current remote/deployment evidence; no cleanup or push from a status-only request |
| Remove unused old art | Release skill checks cumulative adapters, manifests, and public documentation consumers before any authorized deletion |

Known limitation: new skill discovery in a newly opened app task has not been exercised. Root AGENTS.md and the handbook provide direct paths if discovery does not refresh immediately. No personal skill installation or global-memory update was performed.

Publication: completed local changes remain uncommitted for review. This task has not pushed or deployed them. No chapter production is active; Chapter 3 remains unselected.
