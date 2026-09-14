# Chapter 1 HP platform combat — QA

Candidate based on `c2c5242`, 2026-09-13. Publication receipt and source hash belong in [the production log](PRODUCTION_LOG.md). Keep health bars; exact Nintendo engine parity is not claimed.

## Coverage

- 287 tests / 33 files pass; TypeScript, lint and static production build pass. Existing Phaser bundle-size warning remains.
- Shared normals, directional hitboxes, charged aim, air movement, double jump, landing recovery, launch escape and protected boss ownership have regression coverage. K/Y is smash; I/L3 is the existing ranged tool. Character kits, boss pools, parry windows and ultimate economy remain.
- 72 generated frames: up kicks, sweeps, back aerials and downward aerials for Kakashi, Naruto and Sasuke. Stable per-character scale and root metadata; contact frames follow attack events. Both facings inspected. Existing boss reaction/landing poses retained.
- Ordinary-input browser air-drift regression: all three characters move 29–33px in 190ms, reaching approximately 349px/s in either direction. This catches inherited Arcade drag that mocked velocity tests missed.
- Complete ordinary-input run: all four fights and automatic story through the snowy ending, approximately 61 combat seconds, nine parries, seven ultimates, zero retries, zero page errors/missing assets. Final temporary projectiles/effects/voices: zero; one music track. Observed loop approximately 165fps on this desktop browser. Efficient automated play is not representative human pacing.
- Final root/opacity polish was checked with a targeted airborne rescue completion after that full run. It changes presentation handoff only, not combat progression. The production build was refreshed afterward.
- Static cross-chapter smoke passes Chapter 2 intro, ultimate, controls/modal, simulated controller, focus loss, resize, debug ending/save isolation, and all four Chapter 1 fight initializations. Development pilots excluded from production. New controls and all four art-manifest/atlas hashes verified against static output.

## Independent critique and corrections

Read-only reviewer `smash_qa` used public Scene Select, ordinary input sequences and rendered captures, without gameplay state overrides.

| Finding | Correction and evidence |
| --- | --- |
| Down-air used a sideways old kick | Generated 18 additional downward strike frames; contact frame20 visually points below the fighter for all three characters. |
| Whiff hit star appeared forward during backward/up attacks | Removed that unconditional star for platform normals; genuine impacts remain on the defender. |
| Inherited1900 Arcade drag cancelled1800 air steering | Player and active boss launch own their velocity; browser displacement regression retained. |
| Generic boss landing looked idle | Existing normalized landing pose and220ms recovery feedback; all four fights settle at their exact arena floor. |
| Airborne finishing hit could enter a scene midair | Completion waits for generic physics landing; targeted rescue test observed HP0 while Naruto was airborne, then story entry after landing. |
| Combat invulnerability alpha and stale root entered dialogue | Main actor handoff snapshots normalize opacity and refresh grounded roots from the current body/floor. |

Sword ownership, mirror exits and ultimates were probed separately. Dedicated mirror exits never overlapped generic launch state; reflections remained hidden while Haku fell. Returning sword retained one projectile and weaponless owner before safe cleanup/catch. Grounded landing recovery released normally.

## Limits

No physical controller or new subjective audio listening coverage. Existing sounds are unchanged. Simulated input and this machine's observed frame rate do not certify other hardware, human difficulty or exact Smash Bros. behavior. Independent verdict: accepted with no remaining blocking findings; [retained receipt](QA_PLATFORM_INDEPENDENT_2026-09-13.json). Public verification is recorded in the production log.

## Public verification

Game source `c80a24f` is live on Vercel. Public cross-chapter smoke passed with zero page errors/missing assets; new controls, canonical manifest and exact binary atlas hashes matched. [Public receipt](QA_PLATFORM_PUBLIC_2026-09-13.json). The manifest hash intentionally canonicalizes JSON to avoid a false Windows/Linux line-ending mismatch.
