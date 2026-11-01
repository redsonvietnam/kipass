# Kipass 1.1.1 preview

Derived from the preserved 1.1.0 stable baseline. The stable source is not modified.

Changes:
- Hidden native controls stay hidden until the site itself reveals them. This fixes the blank green button caused by the theme overriding the HTML hidden attribute.
- The HUD reports a pending site-verification state on pages declaring main.card[data-smartlink].
- Automatic Continue is suppressed on smartlink-backed verification pages. Verify, Turnstile, and third-party smartlink actions remain user-controlled.
- Other supported flows retain the existing narrow Continue checks; no CAPTCHA solving, ad clicking, or success-state fabrication is added.

Status: preview; static checks only until installed and exercised on a fresh test session.