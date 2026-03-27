/**
 * UI shell only: basemap + non-destructive panel toggles.
 * Markers, routing, chat bot, and gallery demo flows are intentionally omitted.
 * Swap in travelr-super-app-demo.js for the full static-gallery behavior.
 */
(function () {
  "use strict";

  var userLoc = [28.6139, 77.209];
  var map = null;
  var isChatOpen = false;
  var voiceEnabled = false;

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof L === "undefined") return;
    map = L.map("map", {
      zoomControl: false,
      attributionControl: false,
    }).setView(userLoc, 13);
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 },
    ).addTo(map);
    window.map = map;
  });

  window.centerMap = function () {
    if (!map) return;
    map.flyTo(userLoc, 14, { duration: 0.85 });
  };

  window.toggleChat = function () {
    var panel = document.getElementById("chat-panel");
    if (!panel) return;
    isChatOpen = !isChatOpen;
    if (isChatOpen) panel.classList.remove("translate-x-[120%]");
    else panel.classList.add("translate-x-[120%]");
  };

  window.toggleVoice = function () {
    var toggleDot = document.querySelector("#voice-toggle div");
    var toggleBg = document.getElementById("voice-toggle");
    if (!toggleDot || !toggleBg) return;
    voiceEnabled = !voiceEnabled;
    if (voiceEnabled) {
      toggleDot.classList.add("translate-x-4");
      toggleBg.classList.replace("bg-slate-200", "bg-[#f97316]");
    } else {
      toggleDot.classList.remove("translate-x-4");
      toggleBg.classList.replace("bg-[#f97316]", "bg-slate-200");
    }
  };

  window.openDetails = function () {
    var modal = document.getElementById("details-modal");
    var content = document.getElementById("details-content");
    if (!modal || !content) return;
    modal.classList.remove("pointer-events-none", "opacity-0");
    modal.classList.add("pointer-events-auto", "opacity-100");
    setTimeout(function () {
      content.classList.remove("translate-y-full");
    }, 50);
  };

  window.closeDetails = function () {
    var modal = document.getElementById("details-modal");
    var content = document.getElementById("details-content");
    if (!modal || !content) return;
    content.classList.add("translate-y-full");
    setTimeout(function () {
      modal.classList.remove("pointer-events-auto", "opacity-100");
      modal.classList.add("pointer-events-none", "opacity-0");
    }, 300);
  };

  /** No routing / markers in UI-only mode */
  window.startJourney = function () {};

  window.endJourney = function () {
    var nav = document.getElementById("nav-banner");
    if (nav) nav.classList.add("-translate-y-[150%]");
    window.centerMap();
  };

  window.enterMonumentMode = function () {
    window.closeDetails();
    var overlay = document.getElementById("monument-mode");
    if (!overlay) return;
    overlay.classList.remove("pointer-events-none", "opacity-0");
    overlay.classList.add("pointer-events-auto", "opacity-100");
  };

  window.exitMonumentMode = function () {
    var overlay = document.getElementById("monument-mode");
    if (!overlay) return;
    overlay.classList.remove("pointer-events-auto", "opacity-100");
    overlay.classList.add("pointer-events-none", "opacity-0");
  };

  window.handleChat = function (e) {
    if (e && e.key === "Enter") e.preventDefault();
  };

  window.sendMsg = function () {
    /* Chat / AI features paused */
  };
})();
