(() => {
  "use strict";

  if (window.__verifyGuardInstalled) return;
  window.__verifyGuardInstalled = true;

  const VERIFY_RE = /\b(verify|verification|verify account|human verification|confirm account|continue|proceed|get link|unlock|next step|complete step|access link)\b/i;
  const STRONG_VERIFY_RE = /\b(verify|verification|verify account|human verification|confirm account)\b/i;
  const AD_TOKEN_RE = /(^|[\s_:-])(ad|ads|advert|advertisement|sponsor|sponsored|promo|popunder|popunder|banner-ad|adslot|ad-slot)([\s_:-]|$)/i;
  const AD_EXACT_RE = /^(adsbygoogle|ad-container|ad-slot|ad-wrapper|sponsor|sponsored|popunder|popup-ad)$/i;
  const CONTINUE_RE = /\b(continue|proceed|next|go on|get link|unlock|access link|complete)\b/i;
  const INSTALL_RE = /\b(download|install|clean now|remove virus|update now|scan now|claim prize|you won|allow notifications)\b/i;
  const VERIFY_CONTEXT_RE = /\b(verify|verification|account|human|security check|step\s*\d|complete the steps)\b/i;
  const MAX_ITEMS = 12;
  const MARK_ATTR = "data-verifyguard-mark";
  const STYLE_ID = "verifyguard-style-v1";

  let guardEnabled = false;
  let lastScan = null;
  let modalHost = null;
  let scanTimer = null;

  const safePageUrl = () => `${location.origin}${location.pathname}`;
  const normalise = (value, max = 140) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

  function visible(el) {
    if (!(el instanceof Element)) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const style = getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0.04;
  }

  function elementLabel(el) {
    return normalise(
      el.innerText || el.textContent || el.getAttribute("aria-label") ||
      el.getAttribute("title") || el.getAttribute("value") || "(không có nhãn)",
      120
    );
  }

  function linkUrl(el) {
    const href = el?.href || el?.getAttribute?.("href");
    if (!href) return "";
    try {
      const url = new URL(href, location.href);
      if (!/^https?:$/.test(url.protocol)) return "";
      return `${url.origin}${url.pathname}`;
    } catch {
      return "";
    }
  }

  function adSignals(el) {
    const reasons = [];
    let node = el;
    for (let depth = 0; node && depth < 6; depth += 1, node = node.parentElement) {
      const id = node.id || "";
      const classes = typeof node.className === "string" ? node.className : "";
      const rel = node.getAttribute?.("rel") || "";
      const markerText = `${id} ${classes}`;
      if (AD_EXACT_RE.test(id) || AD_TOKEN_RE.test(markerText)) reasons.push("class/id có dấu hiệu quảng cáo");
      if (/\bsponsored\b/i.test(rel)) reasons.push("liên kết được đánh dấu sponsored");
      for (const attr of ["data-ad", "data-ad-slot", "data-ad-client", "data-sponsored", "data-advertisement"]) {
        if (node.hasAttribute?.(attr)) reasons.push(`có thuộc tính ${attr}`);
      }
    }
    const label = elementLabel(el);
    if (INSTALL_RE.test(label) && linkUrl(el)) reasons.push("nội dung giống lời mời tải/cài đặt hoặc cảnh báo giả");
    return { strong: reasons.length > 0, reasons: [...new Set(reasons)] };
  }

  function mark(el, kind) {
    if (!(el instanceof Element)) return;
    el.setAttribute(MARK_ATTR, kind);
  }

  function clearMarks() {
    document.querySelectorAll(`[${MARK_ATTR}]`).forEach(el => el.removeAttribute(MARK_ATTR));
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById("verifyguard-ribbon-host")?.remove();
    modalHost?.remove();
    modalHost = null;
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      [${MARK_ATTR}="verify"] { outline: 3px solid #16a34a !important; outline-offset: 2px !important; }
      [${MARK_ATTR}="verify-maybe"] { outline: 3px dashed #d97706 !important; outline-offset: 2px !important; }
      [${MARK_ATTR}="ad"] { outline: 3px solid #dc2626 !important; outline-offset: 2px !important; }
      [${MARK_ATTR}="overlay"] { outline: 2px dashed #d97706 !important; outline-offset: 2px !important; }
      [${MARK_ATTR}="ad-overlay"] { outline: 3px solid #dc2626 !important; outline-offset: 2px !important; }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function showRibbon(scan) {
    document.getElementById("verifyguard-ribbon-host")?.remove();
    const host = document.createElement("div");
    host.id = "verifyguard-ribbon-host";
    Object.assign(host.style, {
      position: "fixed", right: "10px", bottom: "10px", zIndex: "2147483647",
      pointerEvents: "none", fontFamily: "system-ui, sans-serif"
    });
    const shadow = host.attachShadow({ mode: "closed" });
    const chip = document.createElement("div");
    chip.textContent = `VerifyGuard · ${scan.verifyCandidates.length} verify · ${scan.suspiciousLinks.length} ad-like`;
    Object.assign(chip.style, {
      background: "#111827", color: "#fff", border: "1px solid #4b5563", borderRadius: "999px",
      padding: "7px 11px", fontSize: "12px", boxShadow: "0 3px 16px #0005", opacity: ".94"
    });
    shadow.appendChild(chip);
    (document.documentElement || document.body).appendChild(host);
  }

  function getOverlayCandidates() {
    const viewportArea = Math.max(1, innerWidth * innerHeight);
    const found = [];
    const all = [...document.querySelectorAll("body *")];
    for (const el of all) {
      if (el.closest(`#verifyguard-ribbon-host, #verifyguard-confirm-host`)) continue;
      if (!visible(el)) continue;
      const style = getComputedStyle(el);
      const z = Number.parseInt(style.zIndex, 10);
      const rect = el.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area / viewportArea < 0.045 || area / viewportArea > 1.15) continue;
      if (!(style.position === "fixed" || style.position === "sticky" || (Number.isFinite(z) && z >= 50))) continue;
      if (el.children.length > 16) continue;
      const signals = adSignals(el);
      const label = elementLabel(el);
      if (!label && !signals.strong) continue;
      const item = {
        label: label || "lớp phủ không có chữ",
        tag: el.tagName.toLowerCase(),
        areaPercent: Math.round((area / viewportArea) * 100),
        zIndex: style.zIndex || "auto",
        adLike: signals.strong,
        reasons: signals.reasons
      };
      mark(el, signals.strong ? "ad-overlay" : "overlay");
      found.push(item);
      if (found.length >= MAX_ITEMS) break;
    }
    return found;
  }

  function scanPage() {
    clearMarks();
    installStyles();

    const bodyText = normalise(document.body?.innerText || "", 12000);
    const verifyContext = VERIFY_CONTEXT_RE.test(`${document.title} ${location.pathname} ${bodyText.slice(0, 1800)}`);
    const progressMatch = bodyText.match(/\bstep\s*\d+\s*(?:of|\/)\s*\d+\b/i);
    const controls = [...document.querySelectorAll('a[href], button, input[type="button"], input[type="submit"], [role="button"]')]
      .filter(visible);

    const verifyCandidates = [];
    const suspiciousLinks = [];

    for (const el of controls) {
      const label = elementLabel(el);
      const url = linkUrl(el);
      const signals = adSignals(el);
      const isStrongVerify = STRONG_VERIFY_RE.test(label);
      const isPossibleContinue = CONTINUE_RE.test(label) && verifyContext;
      if (isStrongVerify || isPossibleContinue) {
        const confidence = isStrongVerify ? "cao" : (progressMatch ? "khá" : "cần kiểm tra");
        verifyCandidates.push({
          label,
          tag: el.tagName.toLowerCase(),
          confidence,
          reason: isStrongVerify ? "nhãn thể hiện rõ bước xác minh" : "nút tiếp tục nằm trong ngữ cảnh xác minh",
          destination: url || "không có liên kết trực tiếp"
        });
        mark(el, isStrongVerify ? "verify" : "verify-maybe");
      }

      if (el.matches("a[href]") && signals.strong) {
        suspiciousLinks.push({
          label,
          destination: url || "đích không xác định",
          reasons: signals.reasons
        });
        mark(el, "ad");
      }
    }

    const frames = [...document.querySelectorAll("iframe")]
      .filter(visible)
      .slice(0, MAX_ITEMS)
      .map(frame => {
        let origin = "không xác định";
        try { origin = new URL(frame.src, location.href).origin; } catch { /* ignore */ }
        const external = origin !== location.origin;
        return {
          title: normalise(frame.title || "iframe không có tiêu đề", 90),
          origin,
          external,
          width: Math.round(frame.getBoundingClientRect().width),
          height: Math.round(frame.getBoundingClientRect().height)
        };
      });

    const overlays = getOverlayCandidates();
    const adBlockWarning = /ad blocker detected|ads_block|turn off your vpn or ad blocker/i.test(bodyText);
    const scan = {
      scannedAt: new Date().toISOString(),
      pageTitle: normalise(document.title, 120),
      pageUrl: safePageUrl(),
      pageHost: location.hostname,
      verifyContext,
      progress: progressMatch?.[0] || "không phát hiện bộ đếm Step x/y",
      adBlockWarning,
      verifyCandidates: verifyCandidates.slice(0, MAX_ITEMS),
      suspiciousLinks: suspiciousLinks.slice(0, MAX_ITEMS),
      overlays,
      frames,
      note: "Đây là phân loại heuristic, không xác nhận nút nào là verify chính thức. Không có thao tác click tự động."
    };
    lastScan = scan;
    chrome.storage.local.set({ lastScan: scan }).catch(() => {});
    showRibbon(scan);
    return scan;
  }

  function isStronglySponsoredAnchor(anchor) {
    if (!(anchor instanceof HTMLAnchorElement) || !anchor.href) return null;
    const signals = adSignals(anchor);
    if (!signals.strong) return null;
    let url;
    try { url = new URL(anchor.href, location.href); } catch { return null; }
    if (!/^https?:$/.test(url.protocol)) return null;
    return { href: url.href, label: elementLabel(anchor), reasons: signals.reasons };
  }

  function showGuardPrompt(info) {
    modalHost?.remove();
    modalHost = document.createElement("div");
    modalHost.id = "verifyguard-confirm-host";
    Object.assign(modalHost.style, {
      position: "fixed", inset: "0", zIndex: "2147483647", pointerEvents: "auto"
    });
    const root = modalHost.attachShadow({ mode: "closed" });
    const backdrop = document.createElement("div");
    Object.assign(backdrop.style, {
      position: "fixed", inset: "0", background: "rgba(15,23,42,.52)",
      display: "grid", placeItems: "center", padding: "18px", fontFamily: "system-ui, sans-serif"
    });
    const card = document.createElement("section");
    Object.assign(card.style, {
      width: "min(420px, 100%)", background: "#fff", color: "#111827", borderRadius: "16px",
      padding: "18px", boxShadow: "0 20px 60px #0005", boxSizing: "border-box"
    });
    const title = document.createElement("h2");
    title.textContent = "VerifyGuard phát hiện liên kết quảng cáo";
    Object.assign(title.style, { margin: "0 0 8px", fontSize: "18px" });
    const description = document.createElement("p");
    description.textContent = `Mục tiêu: ${info.label}. VerifyGuard đã giữ bạn ở trang hiện tại.`;
    Object.assign(description.style, { margin: "0 0 8px", fontSize: "14px", lineHeight: "1.5" });
    const destination = document.createElement("p");
    destination.textContent = (() => { try { return new URL(info.href).origin; } catch { return "đích ngoài trang"; } })();
    Object.assign(destination.style, { margin: "0 0 12px", color: "#6b7280", fontSize: "12px", overflowWrap: "anywhere" });
    const actions = document.createElement("div");
    Object.assign(actions.style, { display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" });
    const stay = document.createElement("button");
    stay.textContent = "Ở lại trang này";
    const open = document.createElement("button");
    open.textContent = "Mở liên kết anyway";
    for (const button of [stay, open]) Object.assign(button.style, {
      border: "0", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", cursor: "pointer"
    });
    Object.assign(stay.style, { background: "#e5e7eb", color: "#111827" });
    Object.assign(open.style, { background: "#b91c1c", color: "#fff" });
    stay.addEventListener("click", () => { modalHost?.remove(); modalHost = null; });
    open.addEventListener("click", () => {
      const href = info.href;
      modalHost?.remove(); modalHost = null;
      window.open(href, "_blank", "noopener,noreferrer");
    });
    actions.append(stay, open);
    card.append(title, description, destination, actions);
    backdrop.appendChild(card);
    root.appendChild(backdrop);
    (document.documentElement || document.body).appendChild(modalHost);
    stay.focus();
  }

  document.addEventListener("click", event => {
    if (!guardEnabled || event.defaultPrevented) return;
    const anchor = event.composedPath().find(node => node instanceof HTMLAnchorElement);
    const info = isStronglySponsoredAnchor(anchor);
    if (!info) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showGuardPrompt(info);
  }, true);

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    try {
      if (message?.type === "VG_SCAN") {
        sendResponse({ ok: true, scan: scanPage() });
      } else if (message?.type === "VG_CLEAR") {
        clearMarks();
        lastScan = null;
        chrome.storage.local.remove("lastScan").catch(() => {});
        sendResponse({ ok: true });
      } else if (message?.type === "VG_SET_GUARD") {
        guardEnabled = Boolean(message.enabled);
        sendResponse({ ok: true, enabled: guardEnabled });
      } else {
        sendResponse({ ok: false, error: "unknown_message" });
      }
    } catch (error) {
      sendResponse({ ok: false, error: String(error?.message || error) });
    }
    return false;
  });

  chrome.storage.local.get({ guardEnabled: false }).then(({ guardEnabled: stored }) => {
    guardEnabled = Boolean(stored);
  }).catch(() => {});
})();
