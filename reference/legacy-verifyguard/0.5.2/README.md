# VerifyGuard 0.5.0

VerifyGuard is designed for the Kipas verification flow on Yandex/Chromium Android. Paste a **fresh verification link** into the browser; the extension applies the ad and popup protections and can advance the site's own steps automatically.

## What happens automatically

1. On `https://kipascommunity.com/verify/`, CSS hides the confirmed `.ad` / `.ad.wide` containers and their ad iframe slots.
2. A MAIN-world guard blocks external HTTP(S) `window.open()` calls on that exact verification route. Same-origin opens are passed to the native browser function.
3. The auto-runner waits for Kipas's own timer. It does not alter or shorten the timer.
4. Once the site enables its own visible button, VerifyGuard checks that the center hit target is the actual `Continue` / `Verify` button, that ad slots are hidden, and that no visible full-screen `lk*` layer remains. It then invokes that button's native click handler once for the current step.
5. It waits for the next Kipas step or the server-confirmed `Account verified` page.

## Human-required stops

The runner stops and asks the user to intervene if Kipas displays an interactive CAPTCHA/Cloudflare Turnstile challenge, ad-block detection, a network error, an expired/used link, an incomplete check, or an unexpected page. It never solves CAPTCHA, forges tokens/signatures, alters request bodies, spoofs ad-network reachability, or writes a success state.

## Why the popup guard is narrow

The inspected Kipas button handler calls `window.open(card.dataset.smartlink, '_blank', 'noopener')` and then calls the site's own `advance(view.pass)`. Blocking only the external popup kept the Kipas tab open while its original same-origin `POST /verify/` returned HTTP 200 and the page advanced through Steps 1–3. VerifyGuard therefore blocks external popup windows on `/verify/` without changing the site's own button handler or verification request.

## Settings

- **Tự động chạy xác minh Kipas**: enabled by default. Disable it from the extension popup to pause automatic Continue/Verify clicks.
- **Bảo vệ click quảng cáo rõ ràng**: optional extra guard for explicit sponsored links on other supported pages.

## Install / update on Yandex Android

1. Extract the ZIP to a stable folder on the device.
2. Open `browser://extensions` and enable Developer mode if needed.
3. Load the unpacked `VerifyGuard` folder, or reload the existing extension after replacing its files.
4. Open a **fresh** Kipas verification link from the game. Existing tabs do not retroactively receive document-start scripts; navigate to a fresh link after installing/updating.
5. Leave the auto-run setting enabled. The small VerifyGuard status strip reports each step and any human-required stop.

## Successful reference run

The baseline run on 31 Oct 2026 used Yandex Android's own `yandex_devtools_remote` socket. It confirmed the banner selectors, iframe placement, external smartlink popup call, native Continue/Verify buttons, original same-origin POST responses, and final `Account verified` page with a 40-minute login window. The auto-run feature is based on those observations, but this new automatic mode still needs a fresh end-to-end test on the user's device after installation.

## Privacy and permissions

- Runs only on the named Kipas verification route for auto-run and MAIN-world popup guarding.
- Uses local `chrome.storage` only for settings and the existing local scan report.
- Does not transmit page contents, tokens, signatures, or account IDs to any external server.
