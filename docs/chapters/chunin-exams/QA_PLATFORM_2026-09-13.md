# HP platform-fighter revision — candidate QA

Candidate: local changes on `7232a42`, Chapter2 runtime and two generated atlases. Final freeze21:01–21:02 local tool time2026-09-13; production build `dist/client`. Independent reviewer: `smash_qa`, read-only role. Release hash/receipt is recorded in the production log after publication.

## Scope and evidence

- User confirmed retained health bars. Chapter2/F-LB parry are stated defaults after Continue; no required question is pending. Exact Nintendo engine parity is not claimed.
- 275 tests /32 files, TypeScript and lint pass. Production build passes; existing large-chunk warning remains.
- `game/chunin/platform-combat.test.ts`: directional/back/both-sided contact, free normals with recovery commitment, exactly-once events at40ms steps, charged aim, acceleration, landing/wall bounds, ordinary launch versus major armor, combo escape, parry/block versus hit impulses, health-preserving power-up cleanup.
- Focused browser checks (`tools/check-platform-combat.cjs`) use explicitly labeled position/reset setup. Passed short/full hop distinction, backward drift with unchanged facing, up tilt/new art, charged-down aim retained after changing direction, diagonal air dodge with no second dodge, fast-fall, Gaara launch and landing, Lee damage impulse. Not a legitimate full playthrough.
- Candidate1 full ordinary-input run:69.16 combat seconds,4 perfect parries,9 ultimates,0 retries, canonical ending,0 page errors, final hazards/effects0. Efficient state-reading automation is below the human pacing target; HP and ultimate economy were not inflated to force a slower pilot. Final frozen-candidate run and static smoke pending below.
- New art reviewed against existing proportions. New frames are additional poses; Chapter1 artwork/combat/audio is unchanged. Shared input adds W/up, which Chapter1 does not consume.

## Review and limits

Final frozen-candidate ordinary-input run completed the whole continuous duel and canonical ending in77.17 combat seconds,2 perfect parries,9 ultimates,0 retries,100HP after the established threshold recoveries. No page errors; final shots/effects0. Observed desktop loop~165fps. Browser automation uses state-reading action selection and is faster than representative human play; no claim of universal60fps or human difficulty follows. The original2–3 minute human target remains a user-review question, not a reason to silently raise HP again.

Independent read-only reviewer found no remaining P0/P1 or required-behavior P2 in the reviewed candidate. Both-facing up/down/back poses retain Lee scale, Gaara tumble/landing is distinct, major armor keeps casting, charged contact and real airborne perfect-parry feedback work, pause freezes the clock, and all four Scene Select timelines preserve their chronology. New Lee landing frame22 was observed during78ms of remaining lock. Down-air frame20 precedes contact/landing. [Retained independent receipt](QA_PLATFORM_INDEPENDENT_2026-09-13.json). The review used labeled focused setup; it is not a second legitimate completion.

Static production smoke passed both chapter entries, Ch2 intro/ultimate/modal/controller/focus/resize/debug ending/save isolation and Chapter1's four fight initializations, with zero errors/missing assets and development pilots excluded. This is not a full new Chapter1 playthrough. Physical-controller and subjective listening coverage are unavailable. Audio assets and mix are unchanged. Simulated controller coverage is separate from physical hardware; screenshot scale checks do not establish human combat feel.
