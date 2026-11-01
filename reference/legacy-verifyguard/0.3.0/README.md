# VerifyGuard 0.1.0

VerifyGuard is a small Manifest V3 browser extension that helps inspect verification pages without pretending to complete verification.

## What it does

- Scans the current page only after the user clicks **Phân tích trang**.
- Highlights likely verification controls (green or amber outline).
- Highlights links with strong ad/sponsored markers (red outline).
- Reports large fixed/sticky overlays and visible iframes.
- Detects a page message such as `Ad blocker detected` / `ADS_BLOCK` and reports it without trying to bypass it.
- Optional click guard: when enabled, a link with explicit ad/sponsored markers is paused and the user is asked whether to stay or open it anyway.
- Stores the last scan locally in `chrome.storage.local`; query strings, tokens and signatures are deliberately omitted from the report.

## What it does not do

- It never auto-clicks buttons or links.
- It does not solve CAPTCHA, forge verification state, spoof ad views, bypass a site's access gate, or rewrite verification requests.
- It does not hide or remove overlays automatically. Detection is heuristic and can be wrong; the user must review highlighted elements.
- It does not inspect the contents of cross-origin iframes.

## Install on desktop Brave / Chrome

1. Extract the ZIP to a permanent folder.
2. Open `brave://extensions` or `chrome://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the extracted `VerifyGuard` folder.
5. Open the page to inspect, click the VerifyGuard toolbar icon, then choose **Phân tích trang**.

## Android Brave status

The package is Manifest V3 and uses the standard `activeTab` + `scripting` flow. Brave has tracked Android extension support behind `brave://flags/#brave-android-extensions`; availability and installation UI depend on the specific Brave build. If the flag is absent or the extensions page has no install/load control, this build cannot load the extension natively yet. Do not use unknown APKs or third-party installers to force it.

## Permissions

- `activeTab`: read/inspect the page only after the user explicitly opens the extension.
- `scripting`: inject the local content script into the current tab on request.
- `storage`: remember local settings and the last sanitized report.

No host-wide permission, remote code, analytics, external server, or network request is used by the extension.

## Known limitations

- Candidate detection uses visible text, page context, link attributes and DOM structure; it is not proof that a button is the site's official verify control.
- Some ad overlays are inside cross-origin frames or canvas-based surfaces and cannot be inspected from the parent page.
- Some publishers intentionally label ad links deceptively; the guard only catches explicit markers and is not a guarantee.
