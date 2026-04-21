// Bank-side embed snippet. Drop this on any page:
//   <script src="https://help.bank.example/embed.js"
//           data-origin="https://help.bank.example"
//           data-page="onboarding-aadhaar"
//           data-step="8"
//           data-stuck-field="aadhaar_number"></script>
(function () {
  var current = document.currentScript;
  var origin = (current && current.dataset.origin) || window.location.origin;

  var iframe = document.createElement("iframe");
  iframe.src = origin;
  iframe.title = "DBS Help";
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
    if (e.data && e.data.type === "bank-help-ready") post();
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
