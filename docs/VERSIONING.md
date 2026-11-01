# Versioning workflow

1. Never edit a folder whose name ends in `-stable` or a version already tagged/released.
2. Copy the selected baseline to a new version folder before edits.
3. Keep behavioral changes and visual-only changes distinguishable in the changelog.
4. Update the manifest version and the folder name together.
5. Run `tools/validate.ps1` and inspect the diff against the chosen baseline.
6. Record real device/browser tests in `docs/TEST-STATUS.md`.
7. Only after the promotion gate passes should a preview become stable and receive a Git tag.

Suggested next work: create a new `1.1.1-preview` from the 1.1.0 baseline, diagnose the actual site's initial state and progress labels, and test native Continue only. Do not change orientation/skin in the same patch; portrait preference is a later task.