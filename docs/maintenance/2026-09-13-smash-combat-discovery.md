# Smash-style combat redesign — discovery, 2026-09-13

Historical discovery snapshot, superseded by the [implemented Chapter2 spec](../chapters/chunin-exams/SMASH_COMBAT_SPEC.md). User confirmed HP; Continue authorized proceeding with stated Chapter2/F-parry defaults. The questions below are not pending.

User requests combat that feels like Smash Bros. while retaining parries. Starting checkout `7232a42`; Git was clean before these notes. No gameplay edits or deployment for this request.

## Pending choices

Question UI asks: percentage/knockback/ring-outs versus retained HP; Chapter 2 first versus both chapters; existing fresh-press F/LB parry and held block versus shield-release parry. Smash Ultimate is the stated reference unless the user specifies otherwise. Recommended options are not submitted answers. Resolve these design choices before replacing win conditions, chapter-wide controls or defense behavior.

## Verified constraints

- `game/combat-core.ts` has HP/stamina, a fixed light string, one aerial action and fixed hurt immunity. No percentage-scaled launch velocity, directional influence, stocks or ledges.
- `game/chunin/runtime.ts` gives Lee an Arcade body but renders a largely grounded Gaara model. Movement sets horizontal velocity directly and clamps arena edges. Air combos/recovery require explicit launch and movement ownership for both fighters.
- `game/battle-input.ts` has left/right/down but no up action or independent directional attack selection. Tilts, charged directional attacks, aerials and recovery need a keyboard/controller control map.
- `game/chunin/combat.ts` drives continuous Gaara HP and 70%/35% story thresholds. Map power-ups/checkpoints explicitly to the selected new win condition.
- Core/input/audio are shared. A Chapter 2 prototype needs opt-in rules or isolated adapters to preserve Chapter 1.
- Existing artwork has limited aerial coverage. Inventory directional attacks, tumble/landing/recovery and boss aerial reactions; generate missing art before integration and reuse accepted body/root measurements.

## Checked references

- [Nintendo gameplay basics](https://www.smashbros.com/en_US/howtoplay/basic.html): accumulating damage increases launch distance, with stage recovery as part of combat.
- [Nintendo techniques](https://www.smashbros.com/en_US/howtoplay/technique.html): directional air dodge, short-hop attack and perfect shield. Overview only; exact formulas and timings are not verified.

## Next work after answers

Define movement/launch/hitstun, directional ground/aerial attacks, short/full hops, fast-fall, aerial drift, landing recovery and specials. Bosses must participate in the same contact/launch rules with explicit limited armor. If ring-outs are selected, specify ledges/platforms, blast boundaries, recovery, stocks, HUD, story milestones and save migration. If HP stays, label the outcome a Smash-inspired adaptation.

Record the approved spec/control map, generate required art, implement an independently reviewable fight and obtain rendered critique under AGENTS.md. Then test affected/preserved chapters. Do not claim exact feel, human difficulty, physical-pad or audio listening verification from source inspection. Discovery-only Markdown requires no game build. Prior release remains live while awaiting answers.
