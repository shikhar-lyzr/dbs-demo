// Bank-side embed snippet. Drop this on any page:
//   <script src="https://help.bank.example/embed.js"
//           data-origin="https://help.bank.example"
//           data-page="onboarding-aadhaar"
//           data-step="8"
//           data-stuck-field="aadhaar_number"></script>
(function () {
  var current = document.currentScript;
  var origin = (current && current.dataset.origin) || window.location.origin;
  var mountSelector = (current && current.dataset.mount) || null;

  var iframe = document.createElement("iframe");
  iframe.src = origin.replace(/\/$/, "") + "/widget";
  iframe.title = "DBS Help";
  iframe.id = "bank-help-iframe";

  var mountEl = mountSelector ? document.querySelector(mountSelector) : null;
  if (mountEl) {
    // Mount inside a host element (e.g., inside phone frame).
    iframe.style.cssText = [
      "position:absolute",
      "bottom:12px",
      "right:12px",
      "width:calc(100% - 24px)",
      "max-width:360px",
      "height:70%",
      "max-height:480px",
      "border:0",
      "z-index:50",
      "background:transparent",
      "color-scheme:light",
      "border-radius:16px",
      "box-shadow:0 10px 30px rgba(0,0,0,0.25)",
    ].join(";");
    // Ensure host is a positioning context
    var cs = window.getComputedStyle(mountEl);
    if (cs.position === "static") mountEl.style.position = "relative";
    mountEl.appendChild(iframe);
  } else {
    iframe.style.cssText = [
      "position:fixed",
      "bottom:0",
      "right:0",
      "width:400px",
      "height:580px",
      "border:0",
      "z-index:2147483647",
      "background:transparent",
      "color-scheme:light",
    ].join(";");
    document.body.appendChild(iframe);
  }

  function readContext() {
    if (!current) return {};
    var d = current.dataset;
    return {
      type: "bank-help-context",
      page: d.page,
      step: d.step,
      stuckField: d.stuckField,
      url: window.location.href,
      title: document.title,
    };
  }

  function post() {
    if (iframe.contentWindow) iframe.contentWindow.postMessage(readContext(), "*");
  }

  window.addEventListener("message", function (e) {
    if (!e.data) return;
    if (e.data.type === "bank-help-ready") post();
    if (e.data.type === "bank-help-navigate" && typeof e.data.href === "string") {
      try { window.location.href = e.data.href; } catch (_) {}
    }
  });

  window.BankHelp = {
    update: function (patch) {
      var ctx = readContext();
      Object.assign(ctx, patch || {});
      ctx.type = "bank-help-context";
      if (iframe.contentWindow) iframe.contentWindow.postMessage(ctx, "*");
    },
  };
})();
