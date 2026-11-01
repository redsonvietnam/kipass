# Version inventory and provenance

All source files below were recovered from the active Windows workspace or the POCO backup. SHA-256 is generated from the imported files and recorded in `SHA256SUMS.txt`.

## 1.1.0 stable baseline

- Source: phone backup `Download/Kipass-Backup-1.1.0/` and the matching local backup.
- `content.js`: 26,205 bytes; SHA-256 `82F8300E8E54D576058978F89855298D780CA4920316ABD0BF6EB030F2BA55F6`.
- Original manifest declares version `1.1.0`.
- Historical note: a recovered file named `kipass-1.0.0.js` has the **same SHA-256** as this 1.1.0 source. Its paired manifest also declares `1.1.0`; it is therefore not treated as a distinct 1.0.0 release.

## 1.2.0 source-only archive

- Source: `kipass-content-1.2.0.js`.
- `content.js`: 27,150 bytes; SHA-256 recorded in `SHA256SUMS.txt`.
- No matching original 1.2.0 manifest was found. A manifest is intentionally not fabricated; this archive is not a ready-to-load extension folder.

## 1.3.0 preview

- Source recovered from `Kipass-Extension-1.3.0-preview`.
- NIGHTSHIFT visual direction. Not promoted to stable.

## 1.3.1 preview

- Source recovered from `Kipass-Extension-1.3.1-preview`.
- Adds more tolerant progress-step recognition, including `1-of-3` / `1/3` variants according to the source comments/logic. Not promoted to stable.

## 1.4.0 preview

- Source recovered from `Kipass-Extension-1.4.0-preview`.
- Visual changes: centered typography, more natural green pitch and white field lines.
- Original 1.1.0 non-CSS logic was preserved when this preview was created; however, the live end-to-end workflow was not verified successfully.

## Confidence labels

- `stable`: historical working baseline and source integrity confirmed; not a promise that the current third-party site has unchanged behavior.
- `preview`: code artifact exists and parses; functional behavior is not certified.
- `source-only`: code artifact exists without the corresponding original extension manifest.