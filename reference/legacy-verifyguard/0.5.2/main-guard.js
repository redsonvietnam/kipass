/* VerifyGuard 0.5.2 — Kipas verification-page guard.
 * Hides confirmed ad slots and full-screen click layers only when they contain
 * an outbound HTTP(S) ad link. Preserves Kipas verification requests and native
 * button handlers; never fabricates a token or a CAPTCHA response.
 */
(() => {
  "use strict";

  if (location.hostname !== "kipascommunity.com" || !/^\/verify\/?$/.test(location.pathname)) return;
  if (window.__verifyGuardMain051) return;

  const state = {
    version: "0.5.2",
    active: true,
    blockedPopups: 0,
    hiddenAdLayers: 0
  };

  Object.defineProperty(window, "__verifyGuardStatus", {
    value: state, configurable: false, enumerable: false, writable: false
  });
  Object.defineProperty(window, "__verifyGuardMain051", {
    value: true, configurable: false, enumerable: false, writable: false
  });

  let nativeOpen = window.open;
  const guardedOpen = function (url, target, ...features) {
    let destination;
    try {
      destination = new URL(String(url), location.href);
    } catch {
      return Reflect.apply(nativeOpen, window, [url, target, ...features]);
    }

    const externalHttp = /^https?:$/.test(destination.protocol) && destination.origin !== location.origin;
    if (externalHttp) {
      state.blockedPopups += 1;
      try {
        document.dispatchEvent(new CustomEvent("verifyguard:popup-blocked", {
          detail: { host: destination.hostname, count: state.blockedPopups }
        }));
      } catch { /* no-op */ }
      return null;
    }
    return Reflect.apply(nativeOpen, window, [url, target, ...features]);
  };

  try {
    Object.defineProperty(window, "open", {
      configurable: false,
      enumerable: true,
      get() { return guardedOpen; },
      set(next) {
        if (typeof next === "function" && next !== guardedOpen) nativeOpen = next;
      }
    });
  } catch {
    try { window.open = guardedOpen; } catch { /* browser may reject override */ }
  }

  function hideAdLayer(element) {
    if (!(element instanceof HTMLElement) || element.dataset.verifyguardHidden === "1") return false;
    element.dataset.verifyguardHidden = "1";
    element.setAttribute("aria-hidden", "true");
    element.style.setProperty("display", "none", "important");
    element.style.setProperty("visibility", "hidden", "important");
    element.style.setProperty("pointer-events", "none", "important");
    state.hiddenAdLayers += 1;
    return true;
  }

  function isExternalHttpLink(anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) return false;
    try {
      const u = new URL(anchor.href, location.href);
      return /^https?:$/.test(u.protocol) && u.origin !== location.origin;
    } catch {
      return false;
    }
  }

  function containsHumanChallenge(element) {
    return !!element.querySelector(
      'iframe[src*="challenges.cloudflare.com"], iframe[title*="Cloudflare" i], .cf-turnstile, [data-sitekey]'
    );
  }

  function isFullScreenExternalAdLayer(element) {
    if (!(element instanceof HTMLElement) || element.dataset.verifyguardHidden === "1") return false;
    const style = getComputedStyle(element);
    if (style.position !== "fixed" && style.position !== "sticky") return false;

    const z = Number.parseInt(style.zIndex, 10);
    if (!Number.isFinite(z) || z < 100) return false;

    const rect = element.getBoundingClientRect();
    const viewportArea = Math.max(1, innerWidth * innerHeight);
    const areaRatio = (rect.width * rect.height) / viewportArea;
    if (areaRatio < 0.72 || rect.width < innerWidth * 0.82 || rect.height < innerHeight * 0.72) return false;

    // Do not hide a region containing a supported human challenge.
    if (containsHumanChallenge(element)) return false;

    // Strong evidence: a viewport-sized click layer wraps an outbound link.
    const anchors = element.querySelectorAll("a[href]");
    for (const anchor of anchors) {
      if (isExternalHttpLink(anchor)) return true;
    }
    return false;
  }

  function isLargeExternalClickLayer(element) {
    if (!(element instanceof HTMLElement)) return false;
    const id = String(element.id || "");
    if (!/^lk[a-z0-9]{2,12}$/i.test(id)) return false;

    const rect = element.getBoundingClientRect();
    const areaRatio = (rect.width * rect.height) / Math.max(1, innerWidth * innerHeight);
    if (areaRatio < 0.78 || rect.width < innerWidth * 0.85 || rect.height < innerHeight * 0.78) return false;

    return element instanceof HTMLAnchorElement
      ? isExternalHttpLink(element)
      : [...element.querySelectorAll("a[href]")].some(isExternalHttpLink);
  }

  const watchedFrameDocs = new WeakMap();
  const watchedFrameLoads = new WeakSet();

  function isKnownAdNotificationFrame(frame) {
    if (!(frame instanceof HTMLIFrameElement)) return false;
    if (/challenges\.cloudflare\.com/i.test(frame.src || "")) return false;

    let doc;
    try { doc = frame.contentDocument; } catch { return false; }
    if (!doc || !doc.documentElement) return false;
    if (doc.querySelector('.cf-turnstile, [data-sitekey], iframe[src*="challenges.cloudflare.com"]')) return false;

    const wrap = doc.querySelector('[class*="__wrap"]');
    const finalLink = doc.querySelector('[class*="__finlink"]');
    const closeLink = doc.querySelector('[class*="__closelink"]');
    const trackingAsset = doc.querySelector(
      'img[src*="rtb.runative-syndicate.com"], img[src*="cloudpiko.com/sb/notifications"]'
    );
    const bodyText = (doc.body?.innerText || "").replace(/\s+/g, " ").trim();
    return Boolean(wrap && finalLink && closeLink && trackingAsset && bodyText.length > 8);
  }

  function watchAdNotificationFrame(frame) {
    if (!(frame instanceof HTMLIFrameElement)) return;

    if (!watchedFrameLoads.has(frame)) {
      watchedFrameLoads.add(frame);
      frame.addEventListener("load", () => {
        setTimeout(() => {
          watchAdNotificationFrame(frame);
          scanAdLayers();
        }, 50);
      });
    }

    let doc;
    try { doc = frame.contentDocument; } catch { return; }
    if (!doc || !doc.documentElement) return;

    if (watchedFrameDocs.get(frame) !== doc) {
      const observer = new MutationObserver(() => {
        if (isKnownAdNotificationFrame(frame)) hideAdLayer(frame);
      });
      observer.observe(doc.documentElement, { childList: true, subtree: true });
      watchedFrameDocs.set(frame, doc);
    }

    if (isKnownAdNotificationFrame(frame)) hideAdLayer(frame);
  }

  function scanAdLayers() {
    document.querySelectorAll("iframe").forEach(watchAdNotificationFrame);
    document.querySelectorAll(".ad, .ad.wide, [id^='atLink-'], [id^='atContainer-']")
      .forEach(hideAdLayer);

    document.querySelectorAll("[id^='lk']")
      .forEach(element => { if (isLargeExternalClickLayer(element)) hideAdLayer(element); });

    // Ad networks use a random wrapper ID (for example q322gyo), not always an
    // "lk..." ID. Only hide it when it covers most of the viewport AND wraps
    // an outbound link. This avoids blanket-hiding legitimate dialogs.
    document.querySelectorAll("body *")
      .forEach(element => { if (isFullScreenExternalAdLayer(element)) hideAdLayer(element); });
  }

  scanAdLayers();
  const observer = new MutationObserver(scanAdLayers);
  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["id", "href", "data-href", "class", "style"]
  });

  document.addEventListener("click", event => {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [event.target];
    const adLayer = path.find(node => node instanceof Element && (
      node.matches(".ad, .ad.wide, [id^='atLink-'], [id^='atContainer-'], [data-verifyguard-hidden='1']") ||
      isLargeExternalClickLayer(node) ||
      isFullScreenExternalAdLayer(node)
    ));
    if (!adLayer) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
})();
