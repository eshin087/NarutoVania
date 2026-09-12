# Chapter workflow

## 0. Resume or initialize

Read AGENTS.md, this guide, current context and lessons. Inspect Git status, package scripts, active chapter logs and relevant source. Preserve unrelated local work.

Read [project STATUS](../project/STATUS.md) for the active handoff and release pointers. Use [decisions](../project/DECISIONS.md) to resolve scoped defaults and [issues](../project/ISSUES.md) to distinguish open findings from old fixed regressions. Update the active handoff when the task changes.

If a matching chapter log exists, verify its last milestone and continue. Otherwise create a descriptive chapter directory from the templates. Record the user's exact requested moment, known preferences, current revision, likely scope and outstanding questions.

Ask only questions whose answers change the chapter materially: ambiguous era/moment, playable character choice, missing reference, or desired adaptation. Continue independent work. Routine choreography, tools and implementation choices belong to the coordinator. Do not ask the user to approve each asset or each technical step.

## 1. Research and define the chapter

Delegate canon research while the coordinator audits extension seams. Use the [research guide](CANON_AND_STORY.md). Return a cited chronological beat list, cast/era/abilities, setting, key poses, and uncertainty.

Build CHAPTER_SPEC.md with:
- Requested beginning and ending, playable roles and chapter objective.
- Fight/scene graph, canonical setbacks and outcomes.
- A move matrix with anticipation, response, contact, recovery and counterplay.
- A scene storyboard with actor ownership, start/end transforms, contact dependencies and skip result.
- Asset inventory and reuse decisions.
- Difficulty, duration, controls, performance and acceptance targets.

**Gate:** the whole sequence makes causal sense, no missing required story beats, no accidental extra fights, and adaptations are labeled. Research missing facts before committing them to art.

## 2. Plan and produce art

Give one asset agent approved references and bounded batches using [art instructions](ART_AND_ANIMATION.md). Research must establish costume/era before character generation. Generate new references first, then required strips and effects; use approved references consistently.

While art is produced, the coordinator works on architecture, data contracts, deterministic mechanics and tests without integrating unaccepted candidates. A review agent can critique storyboards and combat design in parallel.

**Gate:** inspect all required candidates, metadata and both facings. Reject anatomical outliers or clipped cores. User-requested assets are not optional placeholders. Keep accepted IDs stable and record why replacements are needed.

## 3. Implement one complete fight and its handoffs

Coordinator integrates the minimal chapter migration if needed, then a coherent slice:
entry scene → fight → outcome → next scene, with checkpoint, retry and Scene Select.

Use the shared action scheduler, event-driven staging, body presentation profiles and owned lifecycles. Match animation contact to damage events. Implement direct preview initialization alongside natural progression.

**Gate:** the slice plays in the browser, initializes normally and in debug, cleans up, and communicates cause/effect. Independent critic reviews it before repeating defects across the chapter.

## 4. Complete the chapter

Implement the remaining fights, scenes, art/effects, audio, UI prompts and chapter navigation. Reuse accepted contracts; each boss still needs a distinct rhythm and signature mechanic. Add deterministic coverage for new state transitions and failure paths.

Update the production log after each accepted asset batch, completed fight/scene, critique and validation milestone. Record exact files and the next action. Do not rely on chat context or ignored outputs as the only record.

## 5. Independent critique and revision

Submit the playable build and named scene checklist to the reviewer described in [QA](QA_AND_REVIEW.md). Include evidence, not only a summary of intended behavior.

For every finding record severity, reproduction, player impact, proposed correction and retest condition. Fix P0/P1; resolve or document acceptance of P2. The reviewer must re-inspect corrected moments and neighboring transitions. If the same failure survives two revisions, inspect the underlying ownership, geometry or art normalization instead of piling on another timer, tween or scale multiplier.

Do not stop merely because automated checks pass. Do not endlessly polish an accepted scene without a new observation or requirement.

## 6. Final validation and release

Freeze source for the final playthrough. Run project checks, static production browser checks, ordinary-input full chapter completion, failure/retry paths, saves/debug isolation and affected prior-chapter regression. Separate measured evidence from unknown human feel, physical controller or listening coverage.

Follow [release instructions](RELEASE_AND_MAINTENANCE.md). With publication authorization, publish the same validated source to the requested destinations and smoke-test each. Otherwise deliver the complete validated preview and request only the final publication decision.

## Restart and continuation protocol

Before a pause or after a meaningful milestone, write:
- Current gate and source revision/dirty files.
- Accepted assets, rejected candidates and why.
- Agent task/result locations; do not assume an old agent is still running.
- Commands completed and actual results.
- Current scene/fight issue, reproduction and exact next action.
- Publication status and remaining limitations.

After restart verify files, processes and tool availability. Start only missing services; do not regenerate accepted art or restart the entire chapter. If the user's new instruction changes scope, update the spec and log, preserving compatible completed work.

Keep STATUS short and current; keep chronological evidence in the chapter log. Update the asset index only when ownership/reference changes and the regression map when new coverage is added. Newly observed root causes belong in LESSONS_LEARNED with a regression check, not as another universal rule copied into every skill.
