(() => {
  'use strict';

  const ID = 'kipass-portrait-hud';
  const TOP_HEIGHT = 'clamp(72px, 12vh, 96px)';
  const BOTTOM_HEIGHT = 'clamp(64px, 10.75vh, 86px)';

  // Detect recognizable human-verification challenges only.
  // Do not use a generic [data-sitekey] selector: Kipas marks its own
  // MAIN/card element with that attribute, which is not a CAPTCHA.
  const challengeText = /anti[-\s]?bot|bot\s+(?:check|verification)|checking your browser|checking if the site connection is secure|verify (?:that )?you are human|complete the security check|security challenge|suspicious traffic|automated requests|unusual traffic|select all .* images|i am not a robot/i;
  const challengeSelectors = [
    'iframe[src*="challenges.cloudflare.com"]',
    'iframe[src*="recaptcha"]',
    'iframe[src*="hcaptcha"]',
    'iframe[title*="captcha" i]',
    '.cf-turnstile', '.g-recaptcha', '.h-captcha', '#px-captcha',
    '#cf-challenge-running', '#challenge-form', '#challenge-stage'
  ];

  if (!['kipascommunity.com', 'www.kipascommunity.com'].includes(location.hostname) ||
      !location.pathname.startsWith('/verify/')) return;
  if (document.getElementById(ID)) return;

  let oldTop = '', oldBottom = '', reserved = false;
  let host = null, queued = false, observer = null, statusTimer = null;
  let statusNode = null;
  let themeStyle = null;
  const autoClickedSteps = new Set();

  const visible = (el) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 &&
      s.display !== 'none' && s.visibility !== 'hidden' &&
      Number(s.opacity || 1) > 0;
  };

  function hasChallenge() {
    if (challengeText.test((document.body?.innerText || '').slice(0, 50000))) return true;
    return challengeSelectors.some((selector) => {
      try { return [...document.querySelectorAll(selector)].some(visible); }
      catch { return false; }
    });
  }

  function reserve() {
    if (!document.body || reserved) return;
    oldTop = document.body.style.paddingTop;
    oldBottom = document.body.style.paddingBottom;
    const computed = getComputedStyle(document.body);
    document.body.style.paddingTop =
      'calc(' + computed.paddingTop + ' + ' + TOP_HEIGHT + ')';
    document.body.style.paddingBottom =
      'calc(' + computed.paddingBottom + ' + ' + BOTTOM_HEIGHT +
      ' + env(safe-area-inset-bottom, 0px))';
    reserved = true;
  }

  function restore() {
    if (!reserved || !document.body) return;
    document.body.style.paddingTop = oldTop;
    document.body.style.paddingBottom = oldBottom;
    reserved = false;
  }

  function continueState() {
    const bodyText = document.body?.innerText || '';
    const controls = [...document.querySelectorAll(
      'button, a, [role="button"], input[type="button"], input[type="submit"]'
    )];

    const continueControl = controls.find((el) => {
      if (!visible(el)) return false;
      const label = (el.innerText || el.value ||
        el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
      return /^continue(?:\b|$)/i.test(label);
    });

    if (continueControl) {
      const style = getComputedStyle(continueControl);
      const disabled = !!continueControl.disabled ||
        continueControl.getAttribute('aria-disabled') === 'true' ||
        style.pointerEvents === 'none' ||
        Number(style.opacity || 1) < 0.45;
      return disabled ? 'WAITING' : 'CONTINUE READY';
    }

    if (/wait for the timer|step \d+ of \d+/i.test(bodyText)) return 'WAITING';
    return 'CHECKING';
  }


  function matchPresentation() {
    const text = document.body?.innerText || '';
    if (/account verified|verification successful|successfully verified|verified successfully/i.test(text)) {
      return { step: 3, mode: 'success', title: 'GOOOOOAL!', kicker: 'ACCOUNT VERIFIED', detail: 'FULL-TIME · THE WIN IS YOURS' };
    }
    if (/link already used|link has expired|verification link.*expired/i.test(text)) {
      return { step: 0, mode: 'expired', title: 'FULL-TIME', kicker: 'SESSION EXPIRED', detail: 'RETURN TO KIPAS AND OPEN A FRESH LINK' };
    }

    const match = text.match(/\bStep\s+(\d+)\s+of\s+(\d+)\b/i);
    const step = match ? Math.min(3, Math.max(1, Number(match[1]))) : 0;
    const state = continueState();

    if (step === 1) return {
      step, mode: 'live', title: 'KICK-OFF!', kicker: 'THE MATCH IS UNDER WAY',
      detail: state === 'WAITING' ? 'WAITING FOR THE WHISTLE...' :
        state === 'CONTINUE READY' ? 'THE WHISTLE HAS GONE · PLAY ON!' : 'GETTING INTO POSITION...'
    };
    if (step === 2) return {
      step, mode: 'live', title: 'BUILDING UP PLAY...', kicker: 'A PERFECT PASSING MOVE',
      detail: state === 'WAITING' ? 'KEEP THE PLAY ALIVE · WAIT FOR THE SIGNAL' :
        state === 'CONTINUE READY' ? 'SPACE IS OPEN · PLAY THE NEXT PASS!' : 'SCANNING THE PITCH...'
    };
    if (step === 3) return {
      step, mode: 'live', title: 'SHOOTING...', kicker: 'HERE COMES THE FINISH',
      detail: state === 'WAITING' ? 'COMPOSURE · WAIT FOR THE FINAL WHISTLE' :
        state === 'CONTINUE READY' ? 'ON TARGET · THE FINAL ACTION IS READY' : 'LINING UP THE SHOT...'
    };
    return { step: 0, mode: 'pre-match', title: 'READY FOR KICK-OFF', kicker: 'KIPASS MATCH CENTER', detail: 'PREPARING THE MATCHDAY EXPERIENCE...' };
  }

  function ensureMatchCenterStyle() {
    if (themeStyle) return;
    themeStyle = document.createElement('style');
    themeStyle.id = 'kipass-match-center-theme';
    themeStyle.textContent = [
      'body.kp-match-body{background:radial-gradient(ellipse at 12% 8%,rgba(18,216,242,.16),transparent 38%),radial-gradient(ellipse at 88% 80%,rgba(255,91,53,.13),transparent 36%),radial-gradient(ellipse at 60% 45%,rgba(31,220,50,.08),transparent 45%),linear-gradient(155deg,#030712 0%,#091421 52%,#080b12 100%)!important}',
      'main.kp-match-themed{position:relative!important;isolation:isolate;overflow:hidden!important;width:min(460px,calc(100% - 20px))!important;max-width:460px!important;margin:16px auto 22px!important;padding:clamp(10px,3vw,15px)!important;border:1px solid rgba(18,216,242,.38)!important;border-radius:20px!important;color:#f4f8ff!important;text-align:left!important;background:radial-gradient(ellipse at 50% 0%,rgba(18,216,242,.13),transparent 48%),linear-gradient(145deg,rgba(12,23,39,.98),rgba(5,10,20,.98) 68%,rgba(17,18,29,.98))!important;box-shadow:0 18px 48px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.025) inset,0 0 30px rgba(18,216,242,.10)!important;font-family:"eFootball Sans",Arial,sans-serif!important}',
      'main.kp-match-themed::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.18;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(255,255,255,.06) 21px,transparent 22px 42px)}',
      'main.kp-match-themed>.brand,main.kp-match-themed>.icon{display:none!important}',
      'main.kp-match-themed button,main.kp-match-themed input[type="button"],main.kp-match-themed input[type="submit"]{display:flex!important;align-items:center;justify-content:center;width:100%!important;min-height:56px!important;margin:14px 0 2px!important;padding:14px 18px!important;border:0!important;border-radius:11px!important;background:linear-gradient(105deg,#12d8f2 0%,#d9ff39 100%)!important;color:#07101a!important;font-family:"eFootball Sans",Arial,sans-serif!important;font-size:16px!important;font-weight:1000!important;letter-spacing:.10em!important;text-transform:uppercase!important;box-shadow:0 4px 0 #287b8a,0 10px 22px rgba(18,216,242,.20)!important;cursor:pointer!important}',
      'main.kp-match-themed button:disabled,main.kp-match-themed input:disabled{opacity:.48!important;filter:grayscale(.55)}',
      'main.kp-match-themed a{color:#12d8f2!important;font-weight:800}',
      'main.kp-match-themed>h1{display:block!important;margin:16px 2px 8px!important;color:#f4f8ff!important;font-size:clamp(18px,5vw,23px)!important;font-weight:900!important;letter-spacing:-.025em!important;line-height:1.15!important}',
      'main.kp-match-themed>.message,main.kp-match-themed>.note,main.kp-match-themed>p{display:block!important;margin:8px 2px!important;color:#b7c5d8!important;font-size:12px!important;line-height:1.55!important}',
      'main.kp-match-themed>.note{padding:10px 12px!important;border-left:3px solid #12d8f2!important;border-radius:0 8px 8px 0!important;background:rgba(18,216,242,.07)!important}',
      'main.kp-match-themed button:focus-visible,main.kp-match-themed a:focus-visible{outline:3px solid #12d8f2!important;outline-offset:3px!important}',
      '#kp-match-panel{display:block;position:relative;overflow:hidden;border-radius:15px}',
      '#kp-match-panel .kp-topline{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:5px 3px 12px;border-bottom:1px solid rgba(255,255,255,.10)}',
      '#kp-match-panel .kp-brand{display:flex;align-items:center;gap:9px;min-width:0}',
      '#kp-match-panel .kp-crest{display:grid;place-items:center;width:37px;height:40px;flex:0 0 auto;clip-path:polygon(0 0,100% 0,100% 78%,50% 100%,0 78%);background:linear-gradient(145deg,#12d8f2,#d9ff39);color:#07100a;font-size:15px;font-weight:1000;font-style:italic}',
      '#kp-match-panel .kp-brand-text{display:flex;flex-direction:column;gap:2px;min-width:0}',
      '#kp-match-panel .kp-brand-text small{color:#9aa7a0;font-size:8px;font-weight:900;letter-spacing:.20em}',
      '#kp-match-panel .kp-brand-text strong{color:#f5f8f1;font-size:13px;letter-spacing:.08em;white-space:nowrap}',
      '#kp-match-panel .kp-live{display:flex;align-items:center;gap:5px;color:#d9ff39;font-size:8px;font-weight:1000;letter-spacing:.16em;white-space:nowrap}',
      '#kp-match-panel .kp-live::before{content:"";width:6px;height:6px;border-radius:50%;background:#1fdc32;box-shadow:0 0 10px #1fdc32;animation:kp-pulse 1.2s infinite}',
      '#kp-match-panel .kp-hero{padding:17px 5px 12px}',
      '#kp-match-panel .kp-overline{display:block;color:#12d8f2;font-size:9px;font-weight:1000;letter-spacing:.21em}',
      '#kp-match-panel .kp-headline{display:block;margin-top:5px;color:#f6f8ef;font-size:clamp(23px,7vw,32px);font-weight:1000;font-style:italic;line-height:1;letter-spacing:-.045em;text-transform:uppercase;text-shadow:0 2px 18px rgba(217,255,57,.15)}',
      '#kp-match-panel .kp-detail{display:block;margin-top:8px;color:#aebbb0;font-size:9px;font-weight:900;letter-spacing:.11em;line-height:1.5}',
      '#kp-match-panel .kp-scoreband{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin:2px 0 12px;padding:11px 10px;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:linear-gradient(100deg,rgba(255,255,255,.065),rgba(255,255,255,.02))}',
      '#kp-match-panel .kp-team{display:flex;align-items:center;gap:7px;min-width:0;color:#f0f4ed;font-size:9px;font-weight:1000;letter-spacing:.09em;line-height:1.35}',
      '#kp-match-panel .kp-team:last-child{justify-content:flex-end;text-align:right}',
      '#kp-match-panel .kp-mini-crest{display:grid;place-items:center;width:27px;height:27px;flex:0 0 auto;border-radius:8px;background:#17241d;border:1px solid rgba(217,255,57,.35);color:#d9ff39;font-size:9px;font-weight:1000}',
      '#kp-match-panel .kp-vs{color:#ff714f;font-size:18px;font-style:italic;font-weight:1000;letter-spacing:-.06em}',
      '#kp-match-panel .kp-vs small{display:block;margin-top:2px;color:#78877e;font-size:7px;font-style:normal;letter-spacing:.14em;text-align:center}',
      '#kp-match-panel .kp-pitch{position:relative;height:clamp(104px,26vw,132px);overflow:hidden;border:1px solid rgba(18,216,242,.48);border-radius:11px;background:linear-gradient(90deg,rgba(18,216,242,.12),rgba(31,220,50,.10)),repeating-linear-gradient(0deg,#123321 0 17px,#0e2a1c 18px 35px)}',
      '#kp-match-panel .kp-pitch::before{content:"";position:absolute;inset:8px;border:1px solid rgba(223,255,229,.35);border-radius:2px}',
      '#kp-match-panel .kp-pitch::after{content:"";position:absolute;top:8px;bottom:8px;left:50%;border-left:1px solid rgba(223,255,229,.35)}',
      '#kp-match-panel .kp-center-circle{position:absolute;left:50%;top:50%;width:43px;height:43px;border:1px solid rgba(223,255,229,.35);border-radius:50%;transform:translate(-50%,-50%)}',
      '#kp-match-panel .kp-box-left,#kp-match-panel .kp-box-right{position:absolute;top:26px;width:28px;height:59px;border:1px solid rgba(223,255,229,.35)}',
      '#kp-match-panel .kp-box-left{left:8px;border-left:0}#kp-match-panel .kp-box-right{right:8px;border-right:0}',
      '#kp-match-panel .kp-ball{position:absolute;top:50%;left:18%;width:13px;height:13px;border:2px solid #07100a;border-radius:50%;background:#f8fff1;box-shadow:0 0 0 4px rgba(18,216,242,.22),0 0 15px #12d8f2;transform:translate(-50%,-50%);animation:kp-ball-run 3.8s ease-in-out infinite alternate}',
      '#kp-match-panel .kp-pitch-label{position:absolute;right:13px;bottom:12px;color:rgba(237,255,237,.55);font-size:7px;font-weight:900;letter-spacing:.18em}',
      '#kp-match-panel .kp-phases{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin:12px 0}',
      '#kp-match-panel .kp-phase{display:flex;flex-direction:column;gap:5px;padding:8px 7px;border-radius:8px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.025);color:#68776d}',
      '#kp-match-panel .kp-phase b{font-size:8px;letter-spacing:.15em}#kp-match-panel .kp-phase span{font-size:8px;font-weight:1000;letter-spacing:.07em}',
      '#kp-match-panel .kp-phase.active{border-color:rgba(217,255,57,.7);background:rgba(31,220,50,.12);color:#e6ff9b;box-shadow:0 0 15px rgba(31,220,50,.10) inset}',
      '#kp-match-panel .kp-commentary{display:flex;align-items:center;gap:10px;margin-top:9px;padding:11px 12px;border-left:3px solid #ff714f;border-radius:0 9px 9px 0;background:linear-gradient(90deg,rgba(255,113,79,.11),rgba(18,216,242,.045))}',
      '#kp-match-panel .kp-commentary-mark{display:grid;place-items:center;width:27px;height:27px;flex:0 0 auto;border-radius:50%;background:rgba(255,113,79,.17);color:#ff876b;font-size:13px}',
      '#kp-match-panel .kp-commentary-copy{display:flex;flex-direction:column;gap:3px;min-width:0}',
      '#kp-match-panel .kp-commentary-copy small{color:#ba887d;font-size:7px;font-weight:1000;letter-spacing:.20em}',
      '#kp-match-panel .kp-commentary-copy strong{color:#fff3ed;font-size:10px;font-weight:1000;letter-spacing:.08em}',
      '#kp-match-panel .kp-player{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:11px;padding:9px 2px 2px;border-top:1px solid rgba(255,255,255,.08)}',
      '#kp-match-panel .kp-player span{color:#78877e;font-size:8px;font-weight:1000;letter-spacing:.17em}#kp-match-panel .kp-player strong{color:#d9ff39;font-size:11px;font-weight:1000;letter-spacing:.1em}',
      '#kp-match-panel .kp-foot{display:flex;justify-content:space-between;gap:8px;margin-top:8px;color:#5e6d64;font-size:7px;font-weight:900;letter-spacing:.17em}',
      '#kp-match-panel[data-mode="success"] .kp-headline{color:#d9ff39;text-shadow:0 0 24px rgba(217,255,57,.42)}#kp-match-panel[data-mode="success"] .kp-commentary{border-color:#d9ff39;background:rgba(31,220,50,.12)}',
      '#kp-match-panel[data-mode="expired"] .kp-headline,#kp-match-panel[data-mode="expired"] .kp-live{color:#ff714f}',
      '@keyframes kp-pulse{0%,100%{opacity:1}50%{opacity:.35}}@keyframes kp-ball-run{0%{left:18%}45%{left:49%}100%{left:83%}}',
      '@media(max-width:360px){main.kp-match-themed{padding:9px!important;border-radius:18px!important}#kp-match-panel .kp-headline{font-size:22px}#kp-match-panel .kp-pitch{height:96px}#kp-match-panel .kp-scoreband{padding:9px 7px}#kp-match-panel .kp-team{font-size:8px}}',
      '@media(min-width:600px){main.kp-match-themed{padding:18px!important}#kp-match-panel .kp-hero{padding:22px 8px 16px}#kp-match-panel .kp-pitch{height:150px}}',
      '@media(prefers-reduced-motion:reduce){#kp-match-panel .kp-live::before,#kp-match-panel .kp-ball{animation:none!important}}'
    ].join('\n');
    document.head?.appendChild(themeStyle);
  }

  function applyMatchCenter() {
    const card = document.querySelector('main.card') || document.querySelector('main');
    if (!card || hasChallenge()) return;
    ensureMatchCenterStyle();
    document.body?.classList.add('kp-match-body');
    card.classList.add('kp-match-themed');

    let panel = card.querySelector('#kp-match-panel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'kp-match-panel';
      panel.setAttribute('aria-live', 'polite');
      panel.innerHTML = [
        '<div class="kp-topline"><div class="kp-brand"><span class="kp-crest">KP</span><span class="kp-brand-text"><small>PRO FOOTBALL / MATCHDAY</small><strong>KIPASS MATCH CENTER</strong></span></div><span class="kp-live">LIVE</span></div>',
        '<div class="kp-hero"><span class="kp-overline">SEASON 2027 / PLAYER ACCESS</span><strong class="kp-headline">READY FOR KICK-OFF</strong><span class="kp-detail">PREPARING THE MATCHDAY EXPERIENCE...</span></div>',
        '<div class="kp-scoreband"><div class="kp-team"><span class="kp-mini-crest">KP</span><span>KIPAS<br>FOOTBALL</span></div><div class="kp-vs">VS<small>ACCESS MATCH</small></div><div class="kp-team"><span>PLAYER<br>PROFILE</span><span class="kp-mini-crest">ID</span></div></div>',
        '<div class="kp-pitch" aria-hidden="true"><span class="kp-center-circle"></span><span class="kp-box-left"></span><span class="kp-box-right"></span><span class="kp-ball"></span><span class="kp-pitch-label">THE ROAD TO GOAL</span></div>',
        '<div class="kp-phases"><div class="kp-phase" data-phase="1"><b>01</b><span>KICK-OFF</span></div><div class="kp-phase" data-phase="2"><b>02</b><span>BUILD-UP</span></div><div class="kp-phase" data-phase="3"><b>03</b><span>FINISH</span></div></div>',
        '<div class="kp-commentary"><span class="kp-commentary-mark">⚽</span><span class="kp-commentary-copy"><small>LIVE COMMENTARY</small><strong class="kp-kicker">THE MATCH IS UNDER WAY</strong></span></div>',
        '<div class="kp-player"><span>PLAYER ID</span><strong class="kp-player-id">PENDING</strong></div>',
        '<div class="kp-foot"><span>KEEP THIS MATCH OPEN</span><span>KP / 2027</span></div>'
      ].join('');
      card.insertBefore(panel, card.firstChild);
    }

    const view = matchPresentation();
    panel.dataset.step = String(view.step);
    panel.dataset.mode = view.mode;
    panel.querySelector('.kp-headline').textContent = view.title;
    panel.querySelector('.kp-overline').textContent = view.mode === 'success'
      ? 'FINAL WHISTLE / VERIFIED'
      : view.mode === 'expired'
        ? 'MATCH REPORT / SESSION CLOSED'
        : 'SEASON 2027 / PLAYER ACCESS';
    panel.querySelector('.kp-detail').textContent = view.detail;
    panel.querySelector('.kp-kicker').textContent = view.kicker;
    panel.querySelector('.kp-live').textContent = view.mode === 'expired'
      ? 'FULL-TIME'
      : view.mode === 'success' ? 'WINNER' : 'LIVE';
    panel.querySelectorAll('.kp-phase').forEach((phase) => {
      const index = Number(phase.dataset.phase);
      phase.classList.toggle('active', view.step >= index && view.step > 0);
    });

    const player = (document.body?.innerText || '').match(/Player\s+([A-Za-z0-9_-]+)\s*[·|]\s*ID\s+([A-Za-z0-9_-]+)/i);
    panel.querySelector('.kp-player-id').textContent = player
      ? player[2]
      : view.mode === 'success' ? 'VERIFIED' : 'PLAYER PROFILE';
  }

  function removeMatchCenter() {
    document.querySelector('#kp-match-panel')?.remove();
    document.querySelector('main.kp-match-themed')?.classList.remove('kp-match-themed');
    document.body?.classList.remove('kp-match-body');
    themeStyle?.remove();
    themeStyle = null;
  }

  function maybeAutoContinue() {
    if (hasChallenge()) return;

    // Only the site's native Continue button on timed steps 1 and 2.
    // Never click Verify or any CAPTCHA / human-verification control.
    const stepMatch = (document.body?.innerText || '').match(/\bStep\s+([12])\s+of\s+3\b/i);
    if (!stepMatch) return;
    const step = stepMatch[1];
    if (autoClickedSteps.has(step)) return;

    const button = [...document.querySelectorAll('button')].find((el) => {
      if (!visible(el)) return false;
      const label = (el.innerText || el.value ||
        el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
      return /^continue$/i.test(label);
    });
    if (!button) return;

    const isEnabled = () => {
      if (!button.isConnected || !visible(button) || button.disabled ||
          button.getAttribute('aria-disabled') === 'true') return false;
      const style = getComputedStyle(button);
      return style.pointerEvents !== 'none' && Number(style.opacity || 1) >= 0.45;
    };
    if (!isEnabled()) return;

    autoClickedSteps.add(step);
    if (statusNode) statusNode.textContent = 'AUTO CONTINUING';

    // Re-check the site's state shortly before invoking its own button.
    setTimeout(() => {
      const currentStep = (document.body?.innerText || '').match(/\bStep\s+([12])\s+of\s+3\b/i);
      if (hasChallenge() || currentStep?.[1] !== step || !isEnabled()) {
        autoClickedSteps.delete(step);
        return;
      }
      button.click();
      if (statusNode) statusNode.textContent = 'CONTINUE SENT';
    }, 350);
  }

  function updateStatus() {
    if (!statusNode || hasChallenge()) return;
    applyMatchCenter();
    const view = matchPresentation();
    if (statusNode.textContent !== view.title) statusNode.textContent = view.title;
    statusNode.classList.toggle('ready', continueState() === 'CONTINUE READY');
    maybeAutoContinue();
  }

  function show() {
    if (!document.body || host) return;

    host = document.createElement('div');
    host.id = ID;
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText =
      'all:initial;position:fixed;inset:0;z-index:2147483000;' +
      'pointer-events:none;display:block';
    host.style.setProperty('--kp-top-height', TOP_HEIGHT);
    host.style.setProperty('--kp-bottom-height', BOTTOM_HEIGHT);

    const root = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = [
      '*,*::before,*::after{box-sizing:border-box}',
      '.bar{position:fixed;left:0;right:0;display:flex;align-items:center;justify-content:space-between;gap:10px;overflow:hidden;padding-inline:clamp(14px,4vw,22px);color:#f8fff1;background:linear-gradient(105deg,#05090c 0%,#102018 62%,#111a17 100%);font-family:"eFootball Sans",Arial,sans-serif;-webkit-font-smoothing:antialiased;pointer-events:none}',
      '.top{top:0;height:calc(var(--kp-top-height) + env(safe-area-inset-top,0px));padding-top:env(safe-area-inset-top,0px);border-bottom:3px solid #d9ff39;box-shadow:0 3px 16px rgba(31,220,50,.18)}',
      '.bottom{bottom:0;height:calc(var(--kp-bottom-height) + env(safe-area-inset-bottom,0px));padding-bottom:env(safe-area-inset-bottom,0px);background:#05090c;border-top:2px solid #ff714f;box-shadow:0 -4px 18px rgba(255,113,79,.08)}',
      '.brand,.product{display:flex;align-items:center;gap:11px;min-width:0}',
      '.konami{font-family:"KONAMI Wordmark",Arial,sans-serif;font-size:clamp(15px,4vw,18px);font-weight:900;letter-spacing:.01em;line-height:1;color:#fff;white-space:nowrap}',
      '.divider{width:1px;height:34px;background:#ffffff3d;flex:0 0 auto}',
      '.game{display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.game-name{font-family:"eFootball Sans",Arial,sans-serif;font-size:clamp(17px,4.6vw,21px);font-weight:700;line-height:1;letter-spacing:.02em;white-space:nowrap}',
      '.edition{font-family:"eFootball Sans",Arial,sans-serif;color:#bac5d6;font-size:10px;font-weight:700;letter-spacing:.22em;line-height:1}',
      '.tag{font-family:"eFootball Sans",Arial,sans-serif;color:#d7deea;border:1px solid #ffffff35;border-radius:5px;padding:7px 9px;font-size:clamp(9px,2.5vw,11px);font-weight:700;letter-spacing:.09em;white-space:nowrap;line-height:1.2}',
      '.tag.ready{color:#d9ff39;border-color:#d9ff39;background:rgba(31,220,50,.13);box-shadow:0 0 14px rgba(31,220,50,.12)}',
      '.product-name{font-family:"eFootball Sans",Arial,sans-serif;color:#fff;font-size:clamp(18px,4.8vw,22px);font-weight:700;letter-spacing:-.02em;line-height:1;white-space:nowrap}',
      '.author{font-family:"eFootball Sans",Arial,sans-serif;color:#aab5c6;font-size:clamp(11px,3vw,13px);font-weight:400;white-space:nowrap}',
      '.footer-tag{font-family:"eFootball Sans",Arial,sans-serif;color:#8793a6;font-size:clamp(9px,2.4vw,10px);font-weight:700;letter-spacing:.12em;text-align:right;white-space:nowrap}',
      '@media(max-width:360px){.bar{gap:6px;padding-inline:12px}.brand,.product{gap:8px}.footer-tag{display:none}.tag{font-size:9px;padding:6px 7px}.konami{font-size:14px}.game-name{font-size:16px}.product-name{font-size:18px}}',
      '@media(max-height:620px){.top{border-bottom-width:2px}.bottom{border-top-width:1px}}'
    ].join('');

    const top = document.createElement('header');
    top.className = 'bar top';
    top.innerHTML =
      '<div class="brand"><span class="konami">KONAMI</span>' +
      '<span class="divider"></span><span class="game">' +
      '<span class="game-name">eFootball</span>' +
      '<span class="edition">2027</span></span></div>' +
      '<span class="tag">CHECKING</span>';

    const bottom = document.createElement('footer');
    bottom.className = 'bar bottom';
    bottom.innerHTML =
      '<span class="product"><span class="product-name">Kipass</span>' +
      '<span class="author">by Fesdinang</span></span>' +
      '<span class="footer-tag">KIPAS COMPANION</span>';

    statusNode = top.querySelector('.tag');
    root.append(style, top, bottom);
    document.documentElement.appendChild(host);
    reserve();
    updateStatus();
  }

  function inspect() {
    queued = false;
    if (!document.body) return;
    if (hasChallenge()) {
      host?.remove();
      host = null;
      statusNode = null;
      restore();
      removeMatchCenter();
      return;
    }
    show();
    updateStatus();
  }

  function schedule() {
    if (!queued) {
      queued = true;
      queueMicrotask(inspect);
    }
  }

  function start() {
    inspect();
    observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, {
      childList: true, subtree: true, characterData: true,
      attributes: true,
      attributeFilter: ['src', 'class', 'style', 'hidden', 'aria-hidden',
        'disabled', 'aria-disabled', 'aria-label']
    });
    statusTimer = setInterval(updateStatus, 900);

    addEventListener('pagehide', () => {
      observer?.disconnect();
      if (statusTimer) clearInterval(statusTimer);
      host?.remove();
      host = null;
      statusNode = null;
      restore();
      removeMatchCenter();
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
