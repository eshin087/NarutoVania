# Chapter production guide

This directory turns a short chapter request into a repeatable research, art, implementation, critique, and delivery process. [AGENTS.md](../../AGENTS.md) is the automatically discovered project entry point.

Example request:

> Make a new chapter about Naruto and Sasuke's first Valley of the End fight. Follow the chapter workflow.

The coordinator will research the moment, create a chapter brief, delegate bounded tasks, produce required artwork, implement the chapter, and ask an independent reviewer to critique every fight and scene. It will revise observed defects and validate the production build. This is an instruction system used when an agent is working on the repository; it does not run while the computer or agent is offline.

## Read order

For an existing task, begin with [current status and handoff](../project/STATUS.md). The [project handbook](../project/README.md) provides the skill index and links to decisions, issues, assets, and test coverage; load only what the task needs.

1. [Project context](PROJECT_CONTEXT.md): current behavior, source map, and extension hazards.
2. [Lessons learned](LESSONS_LEARNED.md): repeated failures and prevention.
3. [Workflow](WORKFLOW.md): stages, dependencies, gates, and restart protocol.
4. [Agent roles](AGENT_ROLES.md): delegation briefs and independent reviewer contract.
5. The relevant specialist guides below.

| Guide | Purpose |
| --- | --- |
| [Canon and story](CANON_AND_STORY.md) | Research, adaptation boundaries, scene causality and handoffs |
| [Art and animation](ART_AND_ANIMATION.md) | Asset planning, generation, proportions, anchors and inspection |
| [Combat and audio](COMBAT_AND_AUDIO.md) | Technical combat, readable patterns, ownership and sound quality |
| [QA and review](QA_AND_REVIEW.md) | Independent scene critique, evidence, severity and revision loop |
| [Release and maintenance](RELEASE_AND_MAINTENANCE.md) | Saved progress, production checks, authorized destinations and upkeep |
| [Chunin Exams](chunin-exams/CHAPTER_SPEC.md) | Lee versus Gaara production specification and implementation |
| [Land of Waves baseline](land-of-waves/CHAPTER_SPEC.md) | Existing chapter continuity and accepted gameplay adaptations |

Create a new chapter folder using [chapter specification](templates/CHAPTER_SPEC.md), [production log](templates/PRODUCTION_LOG.md), and [QA report](templates/QA_REPORT.md). Keep historical revision reports; mark which revision is current.

## Defaults and open preferences

- Preserve the existing chapter library when adding chapters. Chapter 2 already implements selection and separate progress; see the current source map before extending it.
- Preserve current controls and presentation direction; determine the new chapter's length and fight count from the requested moment without filler.
- This documentation request does not grant blanket permission for future public releases. Follow explicit authorization in the active task/session. If absent, prepare a complete validated preview and make publication the final decision.
- User replies and subsequent corrections supersede these defaults. Record them in the chapter log.

Chapter 2 adds the chapter selector, independent Lee/Gaara runtime, and version-3 per-chapter saves. Consult its production log and QA report for the current validation and release state.
