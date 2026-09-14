# Land of Waves production log

## 2026-09-13 — HP platform combat adaptation (in progress)

User approved Chapter 2's HP-based platform-fighter combat and requested it in Chapter 1. Preserve four fights, current boss HP, signature kits, checkpoints, parries, ultimate economy and story. No stocks or ring-outs.

- Shared directional attack definitions moved to `game/platform-combat.ts`; Chapter 2 imports updated without tuning changes.
- Chapter 1 uses directional J/X normals and aerials, K/Y charged smashes, acceleration, short/full/double jumps, fast-fall, directional air dodge and launches. Ranged tool moved to I/L3; techniques, substitution and parry unchanged.
- Generated and inspected 72 directional frames for Kakashi, Naruto and Sasuke. Prompts: `art/land-platform-prompts.json`; stable scales and roots: `public/art-platform/manifest.json`.
- Existing mirror exits, barrages, returning sword and ultimate sequences retain movement ownership. Generic launches have landing recovery and a four-hit escape limit; hounds wait for grounded contact.
- Initial automated gate: 287 tests passed, typecheck and lint passed. Independent rendered critique and a full ordinary-input chapter playthrough are underway. Not released yet.

Baseline game source before this revision: `a3d19da`; baseline documentation commit: `c2c5242`. Prior Chapter 1 history is retained in the versioned art validation receipts linked by the chapter spec.

## Final validation milestone

287 tests/33 files, typecheck, lint and static build pass. Full ordinary-input Chapter 1 run reached the ending with zero retries, nine parries, seven ultimates and approximately61 combat seconds. Both chapters pass static smoke; controls and generated asset hashes match. Independent review corrections include down-air direction, whiff stars, inherited Arcade drag, landing pose, airborne completion, and handoff opacity/root refresh. [QA report](QA_PLATFORM_2026-09-13.md). Final targeted independent sign-off and GitHub/Vercel publication receipt remain to be appended.

Independent final verdict: accepted, no remaining blocking findings. [Retained receipt](QA_PLATFORM_INDEPENDENT_2026-09-13.json). All four launch/landing paths, mirror/sword ownership and final rescue handoff were checked. Physical controller, subjective listening and forced60/120Hz comparisons remain unavailable. Candidate is ready for the authorized GitHub/Vercel release; current live version still unchanged.
