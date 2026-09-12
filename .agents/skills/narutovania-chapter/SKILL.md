---
name: narutovania-chapter
description: Build or resume a Narutovania chapter from a manga fight or moment using the existing research, art, implementation, and independent-review workflow. Use for chapter production, not isolated bug fixes or status-only questions.
---

# Produce a chapter

Work from this repository's root. Read [AGENTS.md](../../../AGENTS.md), [status](../../../docs/project/STATUS.md), and the [chapter guide](../../../docs/chapters/README.md), including its required context, lessons, workflow, and role contracts. Open the matching chapter log before starting new work.

Use the latest user scope to select the moment, playable character, duration, canonical outcome, and release destination. Ask only about choices that materially change the chapter and cannot be inferred. Existing chapter tuning is evidence, not a default HP pool for a new boss.

## Produce and integrate

1. Verify the last completed gate against files, Git, and current tools. A completed release log means start the requested revision, not regenerate the chapter.
2. Follow the existing workflow. Delegate bounded canon research, one asset-only production task, and independent game-development critique when relevant work can run alongside coordinator work. Use actual tools/slots, not persistent agent names from a previous session. The coordinator owns integration and publication; retain the role contract's read-only/external-staging boundaries.
3. Record sourced lore and gameplay adaptations in CHAPTER_SPEC before committing to dependent artwork. Read the installed imagegen skill for required generation; preserve accepted assets unless inspection warrants replacement.
4. Integrate a complete entry → fight → outcome slice, including retry and debug initialization. Preserve both current chapters, per-chapter progress, shared settings, and the production/development boundary.
5. Freeze the candidate for rendered critique and ordinary-input playback. Fix blocking findings, re-review affected moments, and use [the regression map](../../../docs/project/TEST_MATRIX.md) to determine adjacent checks.
6. Publish only to the destination authorized for this work, using the release guide. A chapter request by itself does not authorize every historical host.

## Durable handoff

Update the chapter log and project STATUS with the actual gate, accepted assets, outstanding issue IDs, commands/results, and exact next action. Distinguish implemented, tested, and deployed. Record decisions and unresolved coverage in the project handbook rather than relying on conversation history. Do not copy transient server/session IDs as if they survive restart.

For a request only to review a proposed chapter, return the requested research/design without implementing or publishing it. This skill does not create app tasks or recurring automations.
