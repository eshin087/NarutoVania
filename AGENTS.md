# Narutovania project instructions

## New chapter requests

When the user asks to create a chapter from a manga moment, arc, or fight, execute the chapter-production workflow in [docs/chapters/README.md](docs/chapters/README.md). Read [current context](docs/chapters/PROJECT_CONTEXT.md), [lessons](docs/chapters/LESSONS_LEARNED.md), and [workflow](docs/chapters/WORKFLOW.md) before implementation.

The user explicitly requested delegation for chapter production. Use bounded subagents for canon research, art production, and independent senior game-development critique according to [agent roles](docs/chapters/AGENT_ROLES.md). Use available concurrency; do useful coordinator work alongside agents. Do not create app tasks, scheduled automations, or uncontrolled recursive agents.

The coordinator owns integration. While Sites lifecycle restrictions apply, subagents must not edit the Site checkout, deploy, obtain credentials, invoke Sites skills/tools, or spawn agents. Asset generation uses one asset-only agent, with staging outside the checkout. Consult currently installed skills; this file does not override higher-priority instructions or tool restrictions.

## Production rules

- Treat the latest user instructions as authoritative. Distinguish established project defaults from chapter-specific adaptations and historical experiments.
- Preserve existing chapters by default. The chapter registry and selector now mount independent Land of Waves and Chunin Exam runtimes. Preserve per-chapter progress and shared settings; use game/chapter-registry.ts and read the active chapter production logs.
- Research the requested moment and record sources before defining the story. Do not invent canon, chapter numbers, verified timestamps, or unavailable evidence.
- Generate required new art with the available built-in image generator before integrating it. Read the imagegen skill. Do not claim a model version that cannot be selected or verified.
- Reuse approved body proportions, stationary default melee, quiet idle, restored running cycles, shared controls, and lifecycle rules unless the user changes them.
- Require independent visual critique of every fight and transition. Passing tests alone does not establish good animation, fair human difficulty, or pleasant audio.
- Fix blocking findings and re-review the affected scenes. Record unavailable listening, physical-controller, or browser coverage honestly.
- Keep normal progress isolated from debug sessions. Do not ship development pilots or state overrides.
- Follow [release instructions](docs/chapters/RELEASE_AND_MAINTENANCE.md). Existing live builds remain available until replacements pass validation.

## Resume and maintenance

Each new chapter gets a directory under docs/chapters/ containing a CHAPTER_SPEC.md, PRODUCTION_LOG.md, and revision-specific QA reports from the templates. On restart or "continue", read its production log, inspect Git and active tools, verify completed artifacts, then resume the next incomplete gate. Do not regenerate accepted art or repeat completed research without a reason.

Update the chapter log at meaningful milestones and before stopping. Add newly demonstrated lessons to the project guide, with evidence and a regression check. Do not edit global memory unless separately requested.

These instructions are an on-demand agent workflow, not a background service. For unrelated small fixes, use the relevant guide without running the entire chapter pipeline.
