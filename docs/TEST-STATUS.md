# Test status

Last reviewed: 2026-11-01

| Version | JS syntax | Manifest JSON | Installed | Live functional flow | Classification |
|---|---|---|---|---|---|
| 1.1.0 | PASS | PASS | PASS on Titanium (unpacked source path verified) | Historical success reported by user; current session remained at `READY FOR KICK-OFF`, with no step transition observed during ~50 seconds | Stable baseline, current compatibility re-test needed |
| 1.2.0 | PASS | N/A (original manifest unavailable) | Not certified | Not tested | Source-only archive |
| 1.3.0 | PASS | PASS | Not certified in current target | Not tested end-to-end | Preview |
| 1.3.1 | PASS | PASS | Not certified in current target | Not tested end-to-end | Preview |
| 1.4.0 | PASS | PASS | Installed on Yandex during prior session | Visual skin was observed; Verify/Continue end-to-end not confirmed | Preview |

## Known 1.1.0 behavior from source inspection

- The extension injects the Match Center HUD on `/verify/` pages.
- It recognizes the literal `Step 1 of 3` and `Step 2 of 3` patterns for auto-Continue.
- It only clicks a visible, enabled native `Continue` button after a second state check.
- It intentionally does not click the initial `Verify` control or CAPTCHA/human-verification controls.
- The progress parser does not match a bare `1/3` format. A later experimental version attempts broader recognition.

## What has not been validated

- The site's current ad gate and whether the page loaded the required ad state.
- Current end-to-end verification behavior across browsers.
- Any behavior that would simulate ad impressions/clicks or bypass CAPTCHA; those are not test goals.

## Promotion gate for a future stable release

1. `node --check` passes for all JS files in the candidate.
2. Manifest JSON parses and its version matches the release folder.
3. On a fresh legitimate verification session, the page's real state is observed correctly.
4. Native Continue only proceeds when the site marks the step complete and the button is enabled.
5. CAPTCHA/human checks remain visible and manual.
6. Browser/device/orientation and regression results are recorded before promotion.