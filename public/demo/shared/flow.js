/* =========================================================
   DBS digibank Demo Walkthrough — Shared Flow Script
   flow.js: phone/fullscreen toggle, demo bar, BankHelp update
   ========================================================= */

(function () {
  'use strict';

  /* ── Read page metadata from <body> ─────────────────────── */
  var body = document.body;
  var PAGE_SLUG = body.getAttribute('data-page') || '';
  var STEP_NUM  = parseInt(body.getAttribute('data-step') || '0', 10);

  /* ── Mode (phone / fullscreen) ──────────────────────────── */
  var STORAGE_KEY = 'demo-mode';

  function getMode() {
    return localStorage.getItem(STORAGE_KEY) || 'phone';
  }

  function applyMode(mode) {
    body.classList.remove('mode-phone', 'mode-fullscreen');
    body.classList.add('mode-' + mode);
    var btn = document.getElementById('demo-toggle-btn');
    if (btn) {
      btn.textContent = mode === 'phone' ? '⬜ Full-screen' : '📱 Phone view';
    }
  }

  function toggleMode() {
    var current = getMode();
    var next = current === 'phone' ? 'fullscreen' : 'phone';
    localStorage.setItem(STORAGE_KEY, next);
    applyMode(next);
  }

  /* ── Build Demo Top Bar ─────────────────────────────────── */
  function buildDemoBar() {
    var bar = document.createElement('div');
    bar.className = 'demo-bar';
    bar.id = 'demo-bar';

    var stepLabel = STEP_NUM > 0 ? 'Step ' + STEP_NUM + ' / 20' : 'Entry';

    bar.innerHTML =
      '<span class="demo-bar-title">DBS Bank India &middot; Demo Walkthrough</span>' +
      '<span class="demo-bar-step">' + stepLabel + '</span>' +
      '<div class="demo-bar-actions">' +
        '<button class="toggle-btn" id="demo-toggle-btn">Loading...</button>' +
        '<a class="reset-link" href="01-login.html">&#8635; Reset &amp; restart</a>' +
      '</div>';

    body.insertBefore(bar, body.firstChild);

    document.getElementById('demo-toggle-btn').addEventListener('click', toggleMode);
  }

  /* ── Move the help iframe inside the phone-frame ─────────── */
  var _iframeState = 'collapsed';

  function applyIframeStyles(iframe, state) {
    _iframeState = state;
    // Sit above a fixed bottom button bar if one exists.
    var bottomBar = document.querySelector('.bottom-btn-area');
    var bottomOffset = bottomBar ? (bottomBar.getBoundingClientRect().height + 14) : 14;
    iframe.style.position = 'absolute';
    iframe.style.top = 'auto';
    iframe.style.left = 'auto';
    iframe.style.right = '12px';
    iframe.style.bottom = bottomOffset + 'px';
    iframe.style.border = '0';
    iframe.style.background = 'transparent';
    iframe.style.zIndex = '50';
    iframe.style.transition = 'width 180ms ease, height 180ms ease, box-shadow 180ms ease, border-radius 180ms ease';
    iframe.style.colorScheme = 'light';
    if (state === 'open') {
      iframe.style.width = 'calc(100% - 24px)';
      iframe.style.maxWidth = '360px';
      iframe.style.height = '70%';
      iframe.style.maxHeight = '480px';
      iframe.style.borderRadius = '16px';
      iframe.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)';
    } else {
      // Collapsed: just enough room for the floating "?" button.
      iframe.style.width = '72px';
      iframe.style.maxWidth = '72px';
      iframe.style.height = '72px';
      iframe.style.maxHeight = '72px';
      iframe.style.borderRadius = '50%';
      iframe.style.boxShadow = 'none';
    }
  }

  function mountHelpIframeInFrame() {
    var iframe = document.getElementById('bank-help-iframe');
    var frame = document.querySelector('.phone-frame');
    if (!iframe || !frame) return;
    var cs = window.getComputedStyle(frame);
    if (cs.position === 'static') frame.style.position = 'relative';
    if (iframe.parentElement !== frame) frame.appendChild(iframe);
    applyIframeStyles(iframe, _iframeState);
  }

  // Listen for resize messages from the widget.
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'bank-help-resize') return;
    var iframe = document.getElementById('bank-help-iframe');
    if (!iframe) return;
    applyIframeStyles(iframe, e.data.state === 'open' ? 'open' : 'collapsed');
  });

  /* ── Wrap content in phone frame if not already done ─────── */
  function ensurePhoneFrame() {
    // Only wrap if there isn't already a phone-frame
    if (document.querySelector('.phone-frame')) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'page-wrapper';

    var frame = document.createElement('div');
    frame.className = 'phone-frame';

    var screen = document.createElement('div');
    screen.className = 'phone-screen';
    screen.id = 'phone-screen';

    // Move all children except the demo-bar into the phone-screen
    var children = Array.prototype.slice.call(body.children);
    children.forEach(function (child) {
      if (child.id !== 'demo-bar') {
        screen.appendChild(child);
      }
    });

    frame.appendChild(screen);
    wrapper.appendChild(frame);
    body.appendChild(wrapper);
  }

  /* ── BankHelp integration ───────────────────────────────── */
  var _bankHelpReady = false;
  var _pendingUpdate = null;

  function tryBankHelpUpdate(payload) {
    if (typeof window.BankHelp !== 'undefined' && typeof window.BankHelp.update === 'function') {
      window.BankHelp.update(payload);
      _bankHelpReady = true;
    } else {
      _pendingUpdate = payload;
    }
  }

  // Retry loop: up to 20 tries × 100ms = 2 seconds
  var _retries = 0;
  function retryBankHelp() {
    if (_bankHelpReady || _retries >= 20) return;
    _retries++;
    if (typeof window.BankHelp !== 'undefined' && typeof window.BankHelp.update === 'function') {
      if (_pendingUpdate) {
        window.BankHelp.update(_pendingUpdate);
        _pendingUpdate = null;
      }
      _bankHelpReady = true;
    } else {
      setTimeout(retryBankHelp, 100);
    }
  }

  /* ── Public helper: demoStuck(fieldId) ─────────────────── */
  window.demoStuck = function (fieldId) {
    tryBankHelpUpdate({ stuckField: fieldId });
  };

  /* ── Wire all fields with data-field attribute ─────────── */
  function wireFields() {
    var fields = document.querySelectorAll('[data-field]');
    fields.forEach(function (el) {
      var fieldId = el.getAttribute('data-field');
      el.addEventListener('focus', function () { window.demoStuck(fieldId); });
      el.addEventListener('change', function () { window.demoStuck(fieldId); });
    });
  }

  /* ── Navigation helpers ─────────────────────────────────── */
  window.demoBack = function () {
    history.back();
  };

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    buildDemoBar();
    applyMode(getMode());
    // Mount the help iframe inside the phone frame (once embed.js has injected it).
    // Try immediately and retry a few times since embed.js may load async.
    var mountTries = 0;
    (function tryMount() {
      mountHelpIframeInFrame();
      if (!document.getElementById('bank-help-iframe') && mountTries < 20) {
        mountTries++;
        setTimeout(tryMount, 100);
      }
    })();
    wireFields();

    // Push initial page+step context
    var initialPayload = { page: PAGE_SLUG, step: STEP_NUM };
    tryBankHelpUpdate(initialPayload);
    if (!_bankHelpReady) {
      setTimeout(retryBankHelp, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
