# <Chapter title>

Status: draft / researched / implementing / reviewing / validated / released
Chapter ID:
Requested moment and user wording:
Current source revision:
Production log: PRODUCTION_LOG.md
Current QA report:
Previous chapters to preserve:

## Scope and decisions

- Start/end of this chapter:
- Playable characters and forms:
- Fight count and intended durations:
- Required story outcomes:
- Combat and presentation defaults preserved:
- Explicit changes from project defaults:
- User decisions, dates and unresolved questions:
- Publication authorization/destinations:

## Research ledger

| Source ID | Title / URL | Inspected chapter, page, episode or timestamp | Supported fact/beat | Verified / inferred / unavailable |
| --- | --- | --- | --- | --- |
| | | | | |

## Cast and setting

| Character | Era/costume/form | Reference art | Known techniques | Equipment | Body reference/anchors |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Terrain, ground line, arena bounds, foreground/background layers, lighting and camera constraints:

## Ordered story/fight graph

| ID | Scene or fight | Player / cast | Purpose and source | Completion trigger | Resulting state / next ID |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Canonical setbacks and how completing an objective triggers them:
Gameplay adaptations and why:
Condensed or omitted events and why:

## Fight contract — repeat for each fight

Fight ID / checkpoint:
Player kit and signature mechanic:
Boss objective, phase transitions and fail/retry behavior:
Initial resources, expected ultimate use and target duration:

| Move ID | Tell / timing | Target lock / geometry | Player responses | Contact damage/count | Cost/cooldown | Recovery / cancel rules |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

Barrage schedules, ground routes, history fallback, caps and interruption cleanup:
Intentional visual/core size differences:
Ordinary-input test scenarios:

## Storyboard — repeat for every scene

Scene ID / purpose / source:
Entry snapshot: actors, facing, positions, poses, equipment, fallen bodies, camera.
Single animation owner per actor:
Beat sequence: movement → release → contact → reaction → landing → completion.
Named events and dependencies:
Dialogue: speaker, paraphrase, head anchor and reading duration.
Camera/visible bounds:
Exit snapshot, flags, checkpoint and next scene/fight:
Scene-local skip final state:
Direct Scene Select initialization:
Pause/resume/input-quarantine requirements:

## Asset inventory

| Asset ID | New/reuse | Reference and prompt | States/frames | Body scale / anchors / effects bounds | Contact events | Owner / acceptance status |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

Audio source/license/edit ledger:
Required previews and comparison sheets:

## Integration and acceptance

Required registry/save/loader/type/scene changes:
Affected old-chapter regression cases:
Performance/entity/audio budgets:
Named fights/scenes requiring independent review:
Evidence paths, limitations and release criteria:
