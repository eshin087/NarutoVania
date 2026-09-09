# Release and maintenance

## Destinations and authorization

Current destinations, last inspected 2026-09-08:
- Primary: https://narutovania.vercel.app/
- Legacy: https://narutovania-land-of-waves.gcdone.chatgpt.site/
- GitHub: https://github.com/eshin087/narutovania

Verify current Git remotes, .vercel/project.json and .openai/hosting.json rather than copying opaque project/version IDs from old logs. Keep credentials out of documentation, files, Git config, command output and remote URLs.

Follow explicit publication authorization in the active user request/session; do not ask again when already granted. This workflow alone is not blanket authorization for all future publication. Without authorization, complete a concrete validated preview first and ask only the final publication decision. Documentation-only edits do not require a game deployment.

Read currently installed Sites building/hosting skills whenever they apply. Only the owner uses Sites tools and edits the checkout under current lifecycle rules. Follow tool-required review/confirmation behavior; do not invent additional approval gates.

## Production gate

Read current package scripts. Baseline requires Node22.13+:
- npm ci, when dependencies need installation.
- npm run typecheck
- npm test
- npm run lint
- npm run build

Current static output: dist/client. Test the built static client, not only the development server. Freeze the candidate during the full ordinary-input playthrough; record exact revision/build. Check new chapter plus prior chapter regressions, debug/save isolation, missing assets, console errors, bounded entities/audio, focus loss, resize and development-control exclusion.

Do not rerun builds/tests for a documentation-only change without a relevant reason. Validate Markdown links, source references and instructions instead.

## Publication sequence

1. Keep current public versions live while preparing and validating the candidate.
2. Review Git diff for intended source/assets/licenses only; omit caches, captures, raw temporary audio and credentials.
3. Commit the validated source when appropriate to the user's Git workflow. Push the intended branch; inspect Vercel deployment result rather than assuming a push means success.
4. Package/deploy the same validated source to the existing Sites project using its current skill and tool workflow. Read current project metadata, use returned IDs, and verify terminal success.
5. Smoke-test both public URLs: title/chapter selection, new fight, representative repaired/new scene, assets, controls, saved progress and production tool boundaries.
6. Record revision, deployment URLs/status and actual coverage/limits in the chapter log and QA report.

Do not publish an unreviewed preview as the production replacement. For a failed release, preserve the old working deployment and diagnose; use an intentional rollback/revert rather than force-pushing or destructive resets.

## Maintenance

- Keep accepted art, source prompts, manifests, licenses and reusable tests tracked.
- Treat outputs/, work/, dist/, node_modules and build caches according to .gitignore and actual usage. Verify absolute paths before destructive cleanup.
- Old versioned art/source may still be loaded by cumulative adapters. Trace references before deletion.
- Stop only task-owned servers and processes when finished; never broad-kill unrelated tools.
- Update the chapter log after each milestone and release. Add new demonstrated lessons with cause, correction and a regression check.
- Keep the current chapter specification separate from immutable revision receipts. Mark superseded choices explicitly.
- Do not write global Codex memory unless the user separately requests it.
