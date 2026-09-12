---
name: narutovania-release
description: Verify or carry out authorized Narutovania GitHub/Vercel releases, check local-to-public parity, or identify safe folder-size cleanup. Use for publication, deployment status, and unused-file maintenance.
---

# Verify a release or maintain the checkout

Read [status](../../../docs/project/STATUS.md) and [release instructions](../../../docs/chapters/RELEASE_AND_MAINTENANCE.md). Determine whether the user asked for a status report, cleanup, source push, or deployment. Checking status does not authorize changes; publication follows the task's actual authorized destinations.

## Release/status mode

Inspect Git status, HEAD, branch, current remote, and applicable deployment configuration. Reconcile current remote/deployment results with the candidate hash; a prior success receipt or local tracking ref is not proof of today's remote state. Do not expose credentials.

Use existing scripts and [test mappings](../../../docs/project/TEST_MATRIX.md) for the changed scope. A game release needs a validated static production candidate and affected chapter regressions. Documentation-only edits need links/instruction validation, not a new full playthrough. A push to main may automatically deploy through Vercel; account for that side effect rather than promising a source-only push.

Push only authorized, intended files. Verify provider completion and smoke-test each requested destination. Legacy Sites configuration does not mandate a Sites publish. If Sites is requested, read the currently installed Sites skills and follow their lifecycle; never copy old credentials or deployment IDs.

Record source hash, provider result, public smoke evidence, and limits in the relevant log. For a failed release, preserve the working live deployment and diagnose before an authorized corrective release. Do not force-push or claim success because the upload began.

## Cleanup mode

Inventory size and actual consumers before choosing deletions. Versioned art can remain live through prefix adapters and dynamic loads. Trace source references, manifests, scene catalogs, and browser requests; a failed literal search alone does not prove an asset is unused. Preserve accepted artwork/prompts, licenses, tests, source, settings, and Git history.

Distinguish rebuildable caches/captures from retained inputs. For authorized deletion, resolve and verify each target stays inside the intended directory and is not a broad root. Report bytes reclaimed and recoverability. Do not delete node_modules or reusable source solely because it is large. Build and smoke-test when retained runtime inputs changed; use proportionate checks for cache-only cleanup.

Track maintenance evidence under docs/maintenance and update STATUS. Never turn a status-only question into cleanup or publication.
