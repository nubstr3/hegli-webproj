// TEMPORARY. Only active when the URL has ?debug (e.g. hegli.dev/?debug). Shows script errors on screen
// so they can be read on a phone without a Mac. Delete this file and its <script> tag when done.
(function () {
  if (!/[?&]debug\b/.test(location.search)) return;
  var lines = [];
  var box;
  function paint() {
    if (!document.body) return;
    if (!box) {
      box = document.createElement("pre");
      box.style.cssText =
        "position:fixed;left:0;right:0;bottom:0;max-height:55vh;overflow:auto;margin:0;padding:10px;z-index:99999;background:#200;color:#fbb;font:11px/1.4 monospace;white-space:pre-wrap;word-break:break-all";
      document.body.appendChild(box);
    }
    box.textContent = lines.join("\n");
  }
  function add(s) {
    lines.push(s);
    paint();
  }
  add("UA: " + navigator.userAgent);
  window.addEventListener(
    "error",
    function (e) {
      if (e.target && e.target !== window && (e.target.src || e.target.href)) {
        add("LOAD FAIL: " + (e.target.src || e.target.href));
      } else {
        add("ERROR: " + e.message + " @ " + String(e.filename).split("/").pop() + ":" + e.lineno + ":" + e.colno);
      }
    },
    true
  );
  window.addEventListener("unhandledrejection", function (e) {
    add("REJECTION: " + (e.reason && (e.reason.stack || e.reason.message) || e.reason));
  });
  window.addEventListener("load", function () {
    setTimeout(function () {
      var hydrated = false;
      var els = document.querySelectorAll("body *");
      for (var i = 0; i < els.length && !hydrated; i++) {
        var ks = Object.keys(els[i]);
        for (var j = 0; j < ks.length; j++) if (ks[j].indexOf("__react") === 0) { hydrated = true; break; }
      }
      add("HYDRATED: " + hydrated);
      add("scripts on page: " + document.scripts.length);
    }, 3000);
  });
})();