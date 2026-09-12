# Project handbook

This directory keeps the current state and decisions easy to recover between chats. It complements the chapter-production guides; it is not a second copy of them.

Start with [status and handoff](STATUS.md), then follow the relevant links below. Verify dated records against the current checkout before acting.

| Need | Read |
| --- | --- |
| What is shipped, active, or next? | [Status](STATUS.md) |
| Why did we choose this behavior? | [Decisions](DECISIONS.md) |
| What remains broken or unverified? | [Issues and coverage gaps](ISSUES.md) |
| Which artwork/metadata is actually used? | [Asset index](ASSET_INDEX.md) |
| What should a change be tested against? | [Regression map](TEST_MATRIX.md) |
| Where is the implementation? | [Source map](../chapters/PROJECT_CONTEXT.md) |
| How do I produce a chapter? | [Chapter workflow](../chapters/README.md) |

## Project skills

These skills live in `.agents/skills/` and travel with this repository. Each reads only the guides relevant to its task.

| Skill | Use it for |
| --- | --- |
| [narutovania-chapter](../../.agents/skills/narutovania-chapter/SKILL.md) | New chapters and resuming a chapter after restart |
| [narutovania-sprite-audit](../../.agents/skills/narutovania-sprite-audit/SKILL.md) | Body proportions, anchors, clipping, animation variants, and new art acceptance |
| [narutovania-combat-tuning](../../.agents/skills/narutovania-combat-tuning/SKILL.md) | Boss rhythm, difficulty, stamina, ultimate economy, and fair projectile patterns |
| [narutovania-scene-continuity](../../.agents/skills/narutovania-scene-continuity/SKILL.md) | Cutscene transitions, contacts, camera, dialogue, and actor ownership |
| [narutovania-audio-review](../../.agents/skills/narutovania-audio-review/SKILL.md) | Harsh or repetitive cues, recorded replacements, and mix verification |
| [narutovania-game-qa](../../.agents/skills/narutovania-game-qa/SKILL.md) | Independent rendered critique and regression verification |
| [narutovania-release](../../.agents/skills/narutovania-release/SKILL.md) | Authorized releases, Git/live parity, and evidence-based folder cleanup |

Example prompts:

> Make a new chapter about [manga moment/fight]. Follow the chapter workflow.

> Use $narutovania-sprite-audit to fix Gaara's size changes between idle and casting.

> Use $narutovania-game-qa to review Chapter 2. Report findings before changing gameplay.

> Continue the active task from docs/project/STATUS.md. Verify the last checkpoint first.

Codex can select a skill by its description or an explicit name. Repository skills use `.agents/skills`; if newly added skills do not appear, restart Codex. The root AGENTS.md also links these instructions so a task can read the relevant file directly. This follows [official skill discovery guidance](https://learn.chatgpt.com/docs/build-skills), checked 2026-09-11. No personal installation or background service is involved.

## Keep the records useful

- Update STATUS at a meaningful milestone or before stopping: task, gate, files, evidence, next action, and publication state. Replace stale active-task details rather than accumulating a diary there.
- Put chronological work in the active chapter's PRODUCTION_LOG. For maintenance outside a chapter, use a dated report under `docs/maintenance/`.
- Record a decision once in DECISIONS with its scope and evidence; link it from the chapter spec. Mark reversals as superseded instead of keeping both as active instructions.
- Record unresolved findings in ISSUES with reproduction and a closure test. A coverage gap is not a confirmed game bug.
- Update ASSET_INDEX when ownership or a canonical reference changes; frame measurements stay in the runtime manifest.
- Update TEST_MATRIX when a new subsystem or meaningful regression is added. Previous results belong in revision-specific QA reports.
- Read STATUS plus task-relevant records, not every historical validation file. New user instructions take precedence over older project decisions. None of these files grants permission to publish an unrelated change.
