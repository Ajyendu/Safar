/**
 * Loads the monument React app when the URL hash is a client route (#/…).
 * Login modal: site stays visible behind blur (#/login, #/signup redirects). Other routes: full app shell.
 */
(function () {
  var DIST = "monument-app/client/dist/";
  var ENTRY = DIST + "assets/monument-app.js";
  var STYLES = DIST + "assets/monument-app.css";

  function isReactHash() {
    return location.hash.startsWith("#/");
  }

  function isAuthModalHash() {
    var h = location.hash;
    return h === "#/login" || h === "#/signup";
  }

  function injectBundleOnce() {
    if (window.__SAFAR_REACT_LOADING__) return;
    window.__SAFAR_REACT_LOADING__ = true;
    if (!document.querySelector('link[href="' + STYLES + '"]')) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = STYLES;
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[src="' + ENTRY + '"]')) {
      var script = document.createElement("script");
      script.type = "module";
      script.src = ENTRY;
      document.body.appendChild(script);
    }
  }

  function updateLayer() {
    var root = document.getElementById("root");
    var overlay = document.getElementById("home-overlay");
    if (!isReactHash()) {
      if (root) {
        root.classList.add("hidden");
        root.classList.remove("safar-react-modal", "safar-react-full");
      }
      if (overlay) overlay.style.display = "";
      return;
    }

    injectBundleOnce();

    if (!root) return;
    root.classList.remove("hidden");

    if (isAuthModalHash()) {
      root.classList.add("safar-react-modal");
      root.classList.remove("safar-react-full");
      if (overlay) overlay.style.display = "";
    } else {
      root.classList.add("safar-react-full");
      root.classList.remove("safar-react-modal");
      if (overlay) overlay.style.display = "none";
    }
  }

  function sync() {
    updateLayer();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sync);
  } else {
    sync();
  }
  window.addEventListener("hashchange", sync);
})();
