# Open issues and coverage gaps

Last triage: 2026-09-11, continuous Chapter 2 revision based on `fc8687a`. Current source/rendered checks are recorded in [continuous QA](../chapters/chunin-exams/QA_CONTINUOUS_2026-09-11.md). Consult STATUS/production log for publication state.

## Known quality follow-up

| ID | Status / severity | Observation and scope | Reproduction / evidence | Closure condition |
| --- | --- | --- | --- | --- |
| CH2-001 | Resolved locally | Generated removal/hold/release frames replace detached cuffs. | Independent rendered retest passed after scale correction; CH2-R04 in [revision QA](../chapters/chunin-exams/QA_REVISION_2026-09-11.md). | Preserve contact-driven drop and sequence scale in future edits. |
| CH2-AUDIO-01 | Replacement implemented; subjective acceptance pending | 21 short Audacity-edited cues replace Chapter 2's old contacts/swish/parry/sand effects. | Export and browser mix checks pass; public Sound check available; no listening sign-off. | User/listener assesses isolated cues and repeated combat, then records any remaining harsh/repetitive cue IDs. |

## Verification gaps, not confirmed bugs

| ID | Gap | Latest evidence | How to close |
| --- | --- | --- | --- |
| COVERAGE-01 | Physical controller unverified | Simulated connection, prompts, and input checks passed in the local revision's production smoke. | Test a physical standard controller through movement, menus, parry, disconnect/reconnect, and chapter change; record hardware/revision. |
| COVERAGE-02 | Subjective audio mix unverified | Decoding, loading, and lifecycle were checked; no actual listening sign-off. | Audition isolated cues and repeated battle/cutscene mix with separate sliders; record cue IDs, conditions, and findings. |
| COVERAGE-03 | Representative human difficulty/duration not established | Efficient/imperfect ordinary-input runs completed continuous combat in 97.91/109.79 seconds, no retries, 95/70 HP. | Record human runs; separate combat time, scenes, retries, damage, parries, and ultimates. Do not inflate HP merely to counter efficient automation. |
| COVERAGE-04 | Exact manga shot placement unverified | Chapter 2 opening is labeled an adaptation in its spec. | Inspect primary visual references for a requested fidelity revision; record actual locators and staging differences, not invented timestamps. |

## Triage protocol

Use the severity rules in [QA](../chapters/QA_AND_REVIEW.md). Add a stable ID, chapter/build, observed versus reported status, scene/action, reproduction, player impact, evidence, proposed correction, and retest condition. A fresh report should be reproduced before calling a historical fix regressed.

Close only with evidence on the affected candidate; link the revision-specific QA result. Keep accepted limitations explicit and revisit them when scope changes. Do not schedule this list as automatic work or treat every historical complaint in the conversation as unresolved.
