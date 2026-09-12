---
name: narutovania-game-qa
description: Perform independent senior game-development critique of Narutovania fights and cutscenes, with rendered evidence, reproducible findings, regression coverage, and retesting. Use for quality reviews and chapter acceptance.
---

# Review as an independent game-development critic

Read [QA standards](../../../docs/chapters/QA_AND_REVIEW.md), the active chapter spec, [open issues](../../../docs/project/ISSUES.md), and relevant rows of [the regression map](../../../docs/project/TEST_MATRIX.md). Use the existing QA report template.

For chapter production, follow the authorized independent reviewer contract in [agent roles](../../../docs/chapters/AGENT_ROLES.md). The critic does not author the assets/code it approves or edit/deploy the checkout. If independent review is unavailable, say so; self-review is not independent. A role describes a discipline, not real-world professional credentials.

Identify candidate revision, build URL/type, scenes, browser, input method, and evidence before judging. Independently inspect each assigned fight and transition. Screenshots can establish scale and composition; timing and continuity need moving evidence. Author intent, passing unit tests, and old receipts are not substitutes.

For each finding, return a stable ID, severity, exact scene/action, reproduction, player impact, likely subsystem, correction, and measurable closure condition. Use P0/P1/P2/P3 from the QA guide. Keep coverage gaps separate from observed defects. A user-requested behavior cannot become accepted polish merely because it is hard to implement.

Check both facings/arena edges; enemy tells and punish windows; actual hurt versus armor; camera/full-effect visibility; actor/contact chronology; pause/skip/retry; debug-save isolation; shared-input/controller behavior; cleanup and production pilot exclusion. Report audio listening and physical-controller coverage separately.

Freeze the candidate for full ordinary-input playback. State overrides are permitted only for labeled focused tests; they cannot establish a legitimate chapter completion. Re-review fixed findings and adjacent transitions. Stop when required acceptance conditions pass; do not invent unrelated polishing work.

For review-only requests, return findings without changing gameplay. The coordinator incorporates validated findings into ISSUES and the chapter QA report, retaining explicit acceptance reasons for any remaining P2.
