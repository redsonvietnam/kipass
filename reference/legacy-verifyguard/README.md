# VerifyGuard legacy reference archive

This folder contains historical predecessor code recovered byte-for-byte from the POCO shared-storage backups on 2026-11-01. These files are archived for provenance and design-history review only; they are not part of the Kipass runtime, are not installed by this repository, and must not be enabled as part of current Kipass tests.

## Contents

| Folder | Manifest version | Recovery path | Notes |
|---|---|---|---|
| `0.3.0/` | 0.3.0 | `/sdcard/Download/VerifyGuard/` | The manifest declares 0.3.0, while the original README and CHANGELOG still describe 0.1.0. Both are retained unchanged. |
| `0.5.2/` | 0.5.2 | `/sdcard/Download/VerifyGuard-0.5.0/VerifyGuard/` | The parent folder says 0.5.0, but the embedded manifest declares 0.5.2. The original CHANGELOG starts at 0.5.0. Files are retained unchanged. |

## Handling rules

- Reference-only: do not copy these files into `versions/` or merge them into Kipass.
- Do not install or enable these legacy packages during current verification tests.
- Do not treat historical ad-hiding or auto-run behavior as an approved/current feature. The 0.5.2 package includes automatic page-flow code and ad-related CSS; it is preserved to understand the project's history, not to operate it.
- No license metadata was found in the recovered folders. Do not assume a third-party license; resolve ownership and licensing before redistributing beyond this repository.
- Source files and manifests are unmodified. `SHA256SUMS.txt` records their hashes.