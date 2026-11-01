/* VerifyGuard 0.5.2 — conservative Kipas flow assistant.
 * Waits longer for slow server responses, then clicks only Kipas's own enabled
 * Continue/Verify button when the ad slots are hidden and the hit-test is clear.
 * Does not modify verification POST data, tokens, or CAPTCHA state.
 */
(() => {
  "use strict";

  if (location.hostname !== "kipascommunity.com" || !/^\/verify\/?$/.test(location.pathname)) return;
  if (window.__verifyGuardAutoRun051) return;
  window.__verifyGuardAutoRun051 = true;

  const STATUS_ID = "verifyguard-auto-status";
  const INITIAL_WAIT_MS = 180000;
  const POST_CLICK_WAIT_MS = 120000;
  const POLL_MS = 500;

  const state = {
    enabled: true,
    running: false,
    busy: false,
    clickedSteps: new Set(),
    stepStartedAt: 0,
    waitStartedAt: Date.now(),
    lastClickAt: 0,
    lastStep: 0,
    lastMessage: "",
    observer: null,
    pollId: 0,
    initialWaitNoticeShown: false
  };

  function status(message, kind = "info") {
    if (state.lastMessage === message) return;
    state.lastMessage = message;

    let node = document.getElementById(STATUS_ID);
    if (!node) {
      node = document.createElement("div");
      node.id = STATUS_ID;
      Object.assign(node.style, {
        position: "fixed",
        left: "10px",
        bottom: "10px",
        zIndex: "2147483646",
        maxWidth: "min(88vw, 360px)",
        padding: "8px 12px",
        borderRadius: "12px",
        color: "#fff",
        background: "#172554",
        border: "1px solid #64748b",
        boxShadow: "0 3px 18px #0005",
        font: "12px/1.4 system-ui,sans-serif",
        pointerEvents: "none"
      });
      (document.documentElement || document.body).appendChild(node);
    }
    node.style.background = kind === "success" ? "#14532d" : kind === "warning" ? "#78350f" : "#172554";
    node.textContent = `VerifyGuard · ${message}`;
  }

  function stop(message, kind = "warning") {
    state.running = false;
    if (state.pollId) clearInterval(state.pollId);
    state.pollId = 0;
    state.observer?.disconnect();
    state.observer = null;
    status(message, kind);
  }

  function pageText() {
    return (document.body?.innerText || "").replace(/\s+/g, " ").trim();
  }

  function isVisible(element) {
    if (!(element instanceof HTMLElement) || !element.isConnected) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" &&
      style.visibility !== "hidden" && Number(style.opacity || 1) > 0.04;
  }

  function currentStep(text) {
    const match = text.match(/\bStep\s*(\d+)\s*of\s*3\b/i);
    return match ? Number(match[1]) : 0;
  }

  function isSuccess(text) {
    return /\bAccount verified\b/i.test(text) && /\bLogin is allowed until\b/i.test(text);
  }

  function blockingError(text) {
    const cases = [
      [/Ad blocker detected|ADS_BLOCK/i, "Kipas báo phát hiện ad blocker. Đã dừng, không thử vượt kiểm tra."],
      [/Ads didn't load|ADS_CHECK/i, "Kipas không tải được quảng cáo cần kiểm tra. Đã dừng."],
      [/Check incomplete|CHECK_INCOMPLETE/i, "Kipas báo kiểm tra chưa hoàn tất. Đã dừng."],
      [/Verification failed|Link already used/i, "Link xác minh lỗi hoặc đã dùng. Hãy lấy link mới từ game."],
      [/Connection lost|NETWORK_OFFLINE/i, "Mất kết nối mạng. Đã dừng."],
      [/Browser not supported/i, "Trình duyệt không được Kipas hỗ trợ. Đã dừng."]
    ];
    return cases.find(([pattern]) => pattern.test(text))?.[1] || "";
  }

  function interactiveChallengePresent() {
    const selectors = [
      'iframe[src*="challenges.cloudflare.com"]',
      'iframe[title*="Cloudflare" i]',
      ".cf-turnstile [role=checkbox]",
      ".cf-turnstile input",
      "[data-sitekey] [role=checkbox]"
    ];
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        if (!isVisible(element)) continue;
        const rect = element.getBoundingClientRect();
        if (rect.width >= 100 && rect.height >= 35) return true;
      }
    }
    return /verify you are human|complete the security check|select all .* images|confirm you are not a robot/i.test(pageText());
  }

  function adsAreHidden() {
    const slots = [...document.querySelectorAll(".ad, .ad.wide")];
    if (slots.length < 2) return false;
    return slots.every(element => {
      const style = getComputedStyle(element);
      return style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none";
    });
  }

  function findButton(step) {
    const expected = step === 3 ? "Verify" : "Continue";
    return [...document.querySelectorAll("button")].find(button =>
      (button.innerText || "").trim() === expected && isVisible(button)
    ) || null;
  }

  function clickIsSafe(button) {
    if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") return false;
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    if (!(hit === button || button.contains(hit))) return false;

    // A visible full-screen lk* ad click layer must never be clicked through.
    for (const element of document.querySelectorAll('[id^="lk"]')) {
      if (!isVisible(element)) continue;
      const r = element.getBoundingClientRect();
      const ratio = (r.width * r.height) / Math.max(1, innerWidth * innerHeight);
      if (ratio >= 0.75) return false;
    }
    return true;
  }

  async function inspectAndRun() {
    if (!state.enabled || !state.running || state.busy || document.visibilityState !== "visible") return;
    if (location.hostname !== "kipascommunity.com" || !/^\/verify\/?$/.test(location.pathname)) {
      stop("Đã rời trang xác minh Kipas.");
      return;
    }

    const text = pageText();
    if (isSuccess(text)) {
      stop("XÁC MINH THÀNH CÔNG · quay lại game Kipas.", "success");
      return;
    }

    const error = blockingError(text);
    if (error) {
      stop(error, "warning");
      return;
    }

    if (interactiveChallengePresent()) {
      stop("Kipas yêu cầu CAPTCHA/Turnstile tương tác. Bro hoàn thành thử thách bằng tay nhé.", "warning");
      return;
    }

    const step = currentStep(text);
    if (!step) {
      if (/Preparing the verification/i.test(text)) {
        const elapsed = Date.now() - state.waitStartedAt;
        if (elapsed > INITIAL_WAIT_MS) {
          stop("Máy chủ vẫn đang chuẩn bị sau 3 phút. Đã dừng để bro kiểm tra trang/link.", "warning");
        } else {
          const seconds = Math.floor(elapsed / 1000);
          status(seconds > 15
            ? `Máy chủ đang chuẩn bị phản hồi… (${seconds}s), tiếp tục chờ`
            : "Đang chờ máy chủ Kipas khởi tạo xác minh…");
        }
        return;
      }
      status("Đang chờ trang xác minh tải xong…");
      return;
    }

    if (step !== state.lastStep) {
      state.lastStep = step;
      state.stepStartedAt = Date.now();
      state.clickedSteps.delete(step);
      status(`Đã nhận Step ${step}/3 · chờ timer và nút hợp lệ…`);
    }

    if (state.clickedSteps.has(step)) {
      if (Date.now() - state.lastClickAt > POST_CLICK_WAIT_MS) {
        stop(`Step ${step} chưa có phản hồi máy chủ sau 2 phút. Không tự gửi lại POST.`);
      }
      return;
    }

    const button = findButton(step);
    if (!button) {
      status(`Step ${step}/3 · đang chờ nút ${step === 3 ? "Verify" : "Continue"}…`);
      return;
    }
    if (button.disabled) {
      status(`Step ${step}/3 · đang chờ timer của Kipas…`);
      return;
    }

    if (!adsAreHidden()) {
      stop("Không xác nhận được hai banner Kipas đã ẩn. Đã dừng để tránh bấm nhầm.");
      return;
    }
    if (!clickIsSafe(button)) {
      const blockedFor = Date.now() - state.stepStartedAt;
      if (blockedFor < 20000) {
        status("Đang chờ VerifyGuard xử lý lớp phủ trước khi bấm…");
        return;
      }
      stop("Lớp phủ vẫn che nút Kipas sau 20 giây. Đã dừng để tránh bấm nhầm.");
      return;
    }

    state.busy = true;
    state.clickedSteps.add(step);
    state.lastClickAt = Date.now();
    status(`Đang kích hoạt nút chính thức ${step === 3 ? "Verify" : "Continue"} ở Step ${step}/3…`);
    try {
      button.click();
    } catch (error) {
      stop(`Không thể kích hoạt nút Kipas: ${String(error?.message || error)}`);
    } finally {
      state.busy = false;
    }
  }

  function startLoop() {
    if (!state.enabled || state.running) return;
    state.running = true;
    state.busy = false;
    state.waitStartedAt = Date.now();
    status("Đang bảo vệ trang · chờ phản hồi chậm, chỉ bấm nút Kipas hợp lệ…");
    state.observer = new MutationObserver(() => { void inspectAndRun(); });
    state.observer.observe(document.documentElement, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ["disabled", "aria-disabled", "style", "class"]
    });
    state.pollId = setInterval(() => { void inspectAndRun(); }, POLL_MS);
    void inspectAndRun();
  }

  function onStorageChanged(changes, areaName) {
    if (areaName !== "local" || !changes.autoRunEnabled) return;
    state.enabled = changes.autoRunEnabled.newValue !== false;
    if (!state.enabled) {
      stop("Tự động hoá đã tạm dừng theo cài đặt.");
    } else if (!state.running) {
      startLoop();
    }
  }

  status("Đang khởi tạo VerifyGuard 0.5.2…");
  chrome.storage.local.get({ autoRunEnabled: true }).then(({ autoRunEnabled }) => {
    state.enabled = autoRunEnabled !== false;
    if (!state.enabled) {
      stop("Tự động hoá đang tắt trong cài đặt VerifyGuard.");
      return;
    }
    startLoop();
  }).catch(() => {
    stop("Không đọc được cài đặt extension. Mở VerifyGuard để kiểm tra.");
  });

  chrome.storage.onChanged.addListener(onStorageChanged);
})();
