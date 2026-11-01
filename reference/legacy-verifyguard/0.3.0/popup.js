const $ = id => document.getElementById(id);

function safeText(parent, tag, text, className) {
  const el = document.createElement(tag);
  el.textContent = text || "";
  if (className) el.className = className;
  parent.appendChild(el);
  return el;
}

function setStatus(message) {
  $("status").textContent = message;
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("Không đọc được tab hiện tại.");
  if (!/^https?:/.test(tab.url || "")) throw new Error("Chỉ phân tích trang web HTTP/HTTPS, không phân tích trang nội bộ của trình duyệt.");
  return tab;
}

async function inject(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
}

async function messageTab(tabId, message) {
  return await chrome.tabs.sendMessage(tabId, message);
}

function addGroupTitle(text) {
  safeText($("results"), "div", text, "group-title");
}

function addItem({ title, badge, badgeClass = "", reason = "", destination = "" }) {
  const item = document.createElement("article");
  item.className = "item";
  const top = document.createElement("div");
  top.className = "item-top";
  safeText(top, "strong", title);
  safeText(top, "span", badge, `pill ${badgeClass}`.trim());
  item.appendChild(top);
  if (reason) safeText(item, "div", reason, "reason");
  if (destination) safeText(item, "div", destination, "destination");
  $("results").appendChild(item);
}

function render(scan) {
  $("siteName").textContent = scan.pageTitle || scan.pageHost;
  $("siteUrl").textContent = scan.pageUrl || scan.pageHost;
  $("summary").classList.remove("hidden");
  $("verifyCount").textContent = String(scan.verifyCandidates.length);
  $("adCount").textContent = String(scan.suspiciousLinks.length);
  $("overlayCount").textContent = String(scan.overlays.length);
  $("results").replaceChildren();
  $("warning").classList.toggle("hidden", !scan.adBlockWarning);
  $("warning").textContent = scan.adBlockWarning
    ? "Trang đang báo phát hiện ad blocker/VPN. Đây là quyết định từ website; VerifyGuard không giả mạo kết quả và không tự tắt Shields."
    : "";

  addGroupTitle("Ứng viên xác minh");
  if (!scan.verifyCandidates.length) {
    safeText($("results"), "div", "Chưa nhận diện được nút xác minh rõ ràng. Hãy kiểm tra bằng mắt trước khi bấm.", "empty");
  } else {
    for (const candidate of scan.verifyCandidates) {
      const cls = candidate.confidence === "cao" ? "" : "warn";
      addItem({
        title: `${candidate.tag.toUpperCase()} · ${candidate.label}`,
        badge: candidate.confidence,
        badgeClass: cls,
        reason: candidate.reason,
        destination: candidate.destination
      });
    }
  }

  addGroupTitle("Liên kết quảng cáo có tín hiệu mạnh");
  if (!scan.suspiciousLinks.length) {
    safeText($("results"), "div", "Không thấy liên kết có dấu hiệu quảng cáo rõ ràng.", "empty");
  } else {
    for (const item of scan.suspiciousLinks) {
      addItem({
        title: item.label,
        badge: "ad-like",
        badgeClass: "danger",
        reason: item.reasons.join("; "),
        destination: item.destination
      });
    }
  }

  addGroupTitle("Lớp phủ và iframe");
  for (const overlay of scan.overlays) {
    addItem({
      title: `${overlay.tag.toUpperCase()} · ${overlay.label}`,
      badge: overlay.adLike ? "ad overlay" : "overlay",
      badgeClass: overlay.adLike ? "danger" : "warn",
      reason: `Diện tích khoảng ${overlay.areaPercent}% màn hình · z-index ${overlay.zIndex}` + (overlay.reasons.length ? ` · ${overlay.reasons.join("; ")}` : "")
    });
  }
  for (const frame of scan.frames) {
    addItem({
      title: `IFRAME · ${frame.title}`,
      badge: frame.external ? "external" : "same-site",
      badgeClass: frame.external ? "warn" : "",
      reason: `${frame.width} × ${frame.height}`,
      destination: frame.origin
    });
  }
  if (!scan.overlays.length && !scan.frames.length) {
    safeText($("results"), "div", "Không thấy overlay/iframe nổi bật.", "empty");
  }
  setStatus(`${scan.progress}. ${scan.note}`);
}

async function scanCurrent() {
  const button = $("scanBtn");
  button.disabled = true;
  setStatus("Đang phân tích trang hiện tại…");
  try {
    const tab = await activeTab();
    await inject(tab.id);
    const response = await messageTab(tab.id, { type: "VG_SCAN" });
    if (!response?.ok || !response.scan) throw new Error(response?.error || "Không nhận được kết quả quét.");
    render(response.scan);
  } catch (error) {
    setStatus(error.message || String(error));
  } finally {
    button.disabled = false;
  }
}

async function clearCurrent() {
  try {
    const tab = await activeTab();
    await inject(tab.id);
    await messageTab(tab.id, { type: "VG_CLEAR" });
    $("results").replaceChildren();
    $("summary").classList.add("hidden");
    $("warning").classList.add("hidden");
    setStatus("Đã xóa các dấu đánh dấu trên trang.");
  } catch (error) {
    setStatus(error.message || String(error));
  }
}

async function setGuard(enabled) {
  try {
    await chrome.storage.local.set({ guardEnabled: enabled });
    const tab = await activeTab();
    await inject(tab.id);
    await messageTab(tab.id, { type: "VG_SET_GUARD", enabled });
    setStatus(enabled
      ? "Bảo vệ đang bật: chỉ giữ lại liên kết có dấu hiệu quảng cáo rõ ràng để hỏi bạn trước khi mở."
      : "Bảo vệ click quảng cáo đã tắt.");
  } catch (error) {
    await chrome.storage.local.set({ guardEnabled: enabled });
    setStatus(`Đã lưu lựa chọn. Mở một tab web rồi bật lại nếu muốn áp dụng: ${error.message || error}`);
  }
}

async function init() {
  const { guardEnabled = false, lastScan = null } = await chrome.storage.local.get({ guardEnabled: false, lastScan: null });
  $("guardToggle").checked = Boolean(guardEnabled);
  if (lastScan) {
    $("siteName").textContent = lastScan.pageTitle || lastScan.pageHost || "Kết quả lần trước";
    $("siteUrl").textContent = `${lastScan.pageUrl || ""} · kết quả lưu cục bộ, có thể đã cũ`;
  }
  $("scanBtn").addEventListener("click", scanCurrent);
  $("clearBtn").addEventListener("click", clearCurrent);
  $("guardToggle").addEventListener("change", event => setGuard(event.target.checked));
  // Opening the extension popup is an explicit user gesture; scan the active tab immediately.
  scanCurrent();
}

document.addEventListener("DOMContentLoaded", init);
