# Project ancestry

Kipass grew out of earlier VerifyGuard experiments. The old projects are kept separately in [`reference/legacy-verifyguard/`](../reference/legacy-verifyguard/), never as executable Kipass releases.

## Recovered predecessor snapshots

### VerifyGuard 0.3.0

- Source folder on device: `/sdcard/Download/VerifyGuard/`.
- Manifest version: `0.3.0`.
- Includes the content script, popup UI, manifest and icons.
- Metadata discrepancy: README and CHANGELOG still describe `0.1.0`; manifest is the source of truth for the snapshot label. Original files were not edited to reconcile that discrepancy.

### VerifyGuard 0.5.2

- Source folder on device: `/sdcard/Download/VerifyGuard-0.5.0/VerifyGuard/`.
- Manifest version: `0.5.2`.
- Includes `auto-run.js`, `main-guard.js`, `kipas-ads.css`, content script and popup files.
- Metadata discrepancy: the parent folder is named `VerifyGuard-0.5.0` and CHANGELOG begins at `0.5.0`, but manifest declares `0.5.2`. The snapshot is filed under the manifest version and the discrepancy is recorded, not silently corrected.

## Relationship to Kipass

These VerifyGuard versions are historical ancestors/reference material only. Kipass's version history remains under `versions/`; the historical VerifyGuard code is not part of the current extension, is not automatically loaded, and is not evidence that current Kipass verification works. Any future code reuse requires a separate review, an explicit design decision, and fresh tests. Current tests must not simulate ad impressions/clicks, falsify gate state, or bypass human checks.