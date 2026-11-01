# Changelog

## 0.5.0
- Added an opt-out automatic Kipas flow runner on `/verify/`.
- Waits for Kipas's own disabled timer to finish, then clicks only the visible, enabled native `Continue` / `Verify` button.
- Checks the center hit target, hidden ad containers, and visible full-screen `lk*` overlays before each click.
- Stops on Kipas errors, `ADS_BLOCK` / `ADS_CHECK`, an expired/used link, or an interactive Cloudflare Turnstile challenge.
- Detects the server-confirmed `Account verified` + login-window message; never fabricates a result.
- Added a popup setting to pause/resume automatic running (enabled by default).
- Leaves the page's original event handlers, ad-delivery checks, same-origin verification POST, and Turnstile logic untouched.

## 0.4.0
- Added early MAIN-world popup guard on the Kipas verification route.
- Added CSS to hide the confirmed `.ad` / `.ad.wide` banner containers and their iframe slots.
- Added a narrow filter for large, externally linked `lk...` click-through layers.

## 0.3.0 (experimental)
- Added a post-load heuristic for large `lk...` overlays.
