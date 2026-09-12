---
name: narutovania-combat-tuning
description: Tune or diagnose Narutovania boss difficulty, attack cadence, parries, stamina, ultimate charging, and projectile barrages. Use for combat changes and fairness checks, not visual-only sprite corrections.
---

# Tune a fight from evidence

Read the active chapter spec, [decisions](../../../docs/project/DECISIONS.md), and [combat guide](../../../docs/chapters/COMBAT_AND_AUDIO.md). Inspect actual tuning and contact code rather than copying values from an old plan or a HUD's placeholder state.

State the requested experience and the variables permitted to change. Preserve unrelated HP/damage, defensive windows, costs, and controls. Lee is a stamina/taijutsu character; do not restore generic chakra or shuriken behavior through shared code.

## Diagnose the complete pressure cycle

Map eligible move → anticipation → locked aim → emissions/contact → recovery → next eligible move. Inspect cooldown/history/fairness gates together when a boss idles or repeats. Track last major move separately from intervening ordinary moves. Prefer a readable fallback over silently suppressing all attacks.

For barrages, check existing shots and upcoming volleys together at center and both edges. An empty 180px interval is insufficient if the player cannot reach it with available time/stamina. Delay or omit unsafe emissions before release; never erase visible threats to create a route. Keep target locking, damaging cores, swept collision, and current projectile caps explicit.

For combat feedback, keep actual hit, armor, block, parry, and guard break separate. Test contact identity and cancellation during iteration, not just array cleanup afterward. Default light strings remain stationary. Extra visual strikes cannot add damage or charge.

## Measure and validate

Measure fight and scene time separately, incoming/outgoing actual damage, parry count, ultimate uses, deaths, boss idle gaps, and entity counts. Compare efficient play with a run including mistakes when evaluating difficulty. A perfect automated pilot is not a human-fairness verdict.

Use [regression mappings](../../../docs/project/TEST_MATRIX.md) for timing, resource, interruption, and save boundaries. For a requested change, adjust the smallest justified tuning set and retest affected patterns through ordinary inputs. For diagnosis-only requests, explain the cause and proposed change without applying it. Record the baseline, measured result, and residual uncertainty in the chapter log/QA; do not turn one chapter's target into a project-wide rule.
