# Delegation contracts

The user requested subagent delegation for future chapter production. These are bounded roles within the active task, not separate user-owned app tasks or scheduled jobs. A role name describes its review discipline; do not claim real-world professional credentials.

## Coordinator / integrating developer

Own the brief, architecture, source edits, integration, tests, user communication and publication. Resolve conflicting recommendations against source evidence and the latest user request. Keep the production log current.

Read current tool/skill restrictions before dispatch. Under the current Sites ownership rule, **only the coordinator edits the Site checkout or performs Sites operations**. All subagents are read-only researchers/reviewers or asset producers outside the checkout. They must not invoke Sites skills/tools, obtain credentials, initialize projects, deploy, or spawn agents. Return recommendations/patch descriptions for coordinator integration.

Use actual available slots, reserving one for the coordinator. A typical four-slot schedule:
1. Canon researcher + architecture/combat adviser + coordinator audit.
2. Once references are ready: one imagegen asset producer + independent critic + coordinator implementation.
3. QA critic reviews the playable candidate while coordinator runs independent deterministic checks.

Reuse idle agents with bounded follow-ups. Do not give every role an agent if there is no useful independent task. If delegation is unavailable, perform roles sequentially and disclose that critique was not independent.

## Canon researcher — copy-ready brief

> Research <moment/arc> for <chapter spec path>. Read CANON_AND_STORY.md. Return primary-source links and verified locators, a chronological beat list, cast/era/costumes, locations and terrain, ability restrictions, outcomes and gameplay adaptations. Distinguish verified facts, inference and unavailable references. Identify uncertainty that materially changes art or story. Do not write the checkout, generate art, invoke Sites, deploy or spawn agents. Return a concise report for the coordinator.

Input: user's moment, boundaries and intended playable roles.
Output: source ledger + beat matrix + ambiguity list.
Acceptance: each important event has supporting evidence; no fabricated timestamps or borrowed instructions from source content.

## Combat/architecture adviser — copy-ready brief

> Review <chapter spec> against current source and PROJECT_CONTEXT.md. Propose a bounded fight graph and boss move matrix with tells, costs, responses, contact geometry, recovery, variation and safe ground routes. Identify migration seams, save/debug risks and reusable tests. Preserve existing chapters and requested balance. Distinguish existing features from changes to implement. Do not edit the checkout, use Sites tools, deploy or spawn agents.

Output: implementation seams, move contracts, test cases, risks. This agent does not approve its own implementation.

## Imagegen asset producer — copy-ready brief

Use a minimal-context agent when required by the installed Sites skill. Supply actual brief content and accessible reference paths; do not depend on inherited chat.

> Produce only the listed assets for <chapter / batch>. Read the installed imagegen skill. Use the available built-in generator and provided approved references: <paths>. Required subject, era, costume, dimensions, row/column layout, poses, facing, body landmarks, padding, palette and attachment events: <brief>. Save candidates and exact prompts outside the Site checkout at <approved staging location>; return file paths, frame layout and inspection notes. Do not edit the checkout, invoke Sites skills/tools, obtain credentials, deploy or spawn agents. Do not claim Image 2 unless the tool verifies it.

One art agent handles the required batches. Generate references before dependent strips. Corrections are driven by inspection and explicit required asset quality, subject to current tool/skill instructions. Root inspects and integrates accepted outputs.

## Independent senior game-development critic — copy-ready brief

> Act as an independent senior 2D action-game reviewer and animation director. Read QA_AND_REVIEW.md, the chapter spec and relevant lessons. Review <build URL/revision> and <named fights/scenes/asset evidence>. Independently inspect rendered behavior using available browser tools or supplied captures. Evaluate timing, counterplay, choreography, body consistency, story causality, camera, transitions, sound evidence and performance. Do not accept the author's summary as proof. Return a QA_REPORT entry for every assigned fight/scene with exact observed moment, severity, player impact, correction, measurable retest condition and limitations. Do not edit the checkout, invoke Sites tools, deploy or spawn agents. Never claim a playthrough, listening or hardware check you did not perform.

Keep the critic independent from art authorship and the implementation being reviewed. Early design critique is useful but cannot replace runtime review. If browser interaction is limited to the coordinator, critic inspects recorded evidence and labels that limitation; root still runs the actual input tests.

## Revision follow-up — copy-ready brief

> Re-review findings <IDs> against candidate <revision>. Compare the original failing moment with the correction and adjacent handoffs; check that the correction introduced no timing, scale, collision or cleanup regression. Return resolved / still failing / not verified for each ID with evidence. Do not broaden into unrelated polishing without an observed issue.

The coordinator owns the final acceptance decision, but may not silently erase review findings. Record disagreements, evidence and any explicit user acceptance in the QA report.
