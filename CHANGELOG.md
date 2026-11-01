# Changelog

## 2026-11-01 â€” Initial repository import

- Imported the preserved 1.1.0 baseline (original `content.js` and manifest).
- Archived the distinct 1.2.0 `content.js`; original manifest was not present in the recovered workspace.
- Imported 1.3.0, 1.3.1 and 1.4.0 as previews, not stable releases.
- Added version inventory, test-status notes and a source validation script.
- No original version source was modified during import.
## 2026-11-01 — Legacy reference archive

- Archived the recovered VerifyGuard 0.3.0 and 0.5.2 source snapshots under eference/legacy-verifyguard/ without modifying their original files.
- Recorded manifest/folder/changelog version discrepancies and reference-only handling rules.

## 2026-11-01 — 1.1.1 preview

- Created a separate preview from the unchanged 1.1.0 stable baseline.
- Fixed theme CSS exposing the page's initially hidden button as a blank green control.
- Added explicit smartlink-gate detection and a truthful pending status.
- Suppressed auto-Continue on smartlink-backed verification pages; ad/smartlink and human-check actions remain manual.
- Added preview regression checks to tools/validate.ps1.
