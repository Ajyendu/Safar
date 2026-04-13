/**
 * PARKED: full interactive demo copied from demos/ui-gallery/02-travelr-super-app.html
 * To restore markers, chat simulator, routes, and arrivals — in index.html replace
 *   <script src="demos/ui-shell-stubs.js"></script>
 * with
 *   <script src="demos/travelr-super-app-demo.js"></script>
 */
(function () {
  "use strict";

  const userLoc = [28.6139, 77.209];

  const places = [
    {
      id: 1,
      name: "India Gate",
      lat: 28.6129,
      lng: 77.2295,
      type: "Monument",
      icon: "solar:buildings-linear",
      rating: "4.8",
      image:
        "https://images.unsplash.com/photo-1587474260580-589f814b7e1c?auto=format&fit=crop&q=80&w=800",
      desc: "A prominent war memorial standing tall in the heart of Delhi, commemorating the soldiers of the British Indian Army.",
    },
    {
      id: 2,
      name: "Red Fort",
      lat: 28.6562,
      lng: 77.241,
      type: "Fortress",
      icon: "solar:castle-linear",
      rating: "4.7",
      image:
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=800",
      desc: "Historic fort built by Shah Jahan, famous for its massive red sandstone walls and intricate Mughal architecture.",
    },
    {
      id: 3,
      name: "Humayun's Tomb",
      lat: 28.5933,
      lng: 77.2507,
      type: "Mausoleum",
      icon: "solar:monument-linear",
      rating: "4.9",
      image:
        "https://images.unsplash.com/photo-1620300435165-4f4044c34af7?auto=format&fit=crop&q=80&w=800",
      desc: "Stunning 16th-century tomb, a precursor to the Taj Mahal, surrounded by magnificent Persian-style gardens.",
    },
    {
      id: 4,
      name: "Lotus Temple",
      lat: 28.5535,
      lng: 77.2588,
      type: "Temple",
      icon: "solar:magic-stick-3-linear",
      rating: "4.6",
      image:
        "https://images.unsplash.com/photo-1621213038668-1bd05321f660?auto=format&fit=crop&q=80&w=800",
      desc: "A Bahá'í House of Worship notable for its flowerlike shape, serving as a prominent architectural masterpiece.",
    },
  ];

  let map;
  let markers = [];
  let userMarker;
  let activeRoute = null;
  let activePlace = null;
  let isChatOpen = false;
  let voiceEnabled = false;

  document.addEventListener("DOMContentLoaded", () => {
    map = L.map("map", {
      zoomControl: false,
      attributionControl: false,
    }).setView(userLoc, 13);
    window.map = map;

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
      },
    ).addTo(map);

    const userIcon = L.divIcon({
      className: "custom-user-icon",
      html: `<div class="relative flex h-8 w-8 items-center justify-center">
                       <div class="pulse-ring absolute inset-0 rounded-full bg-[#38bdf8]"></div>
                       <div class="relative h-4 w-4 rounded-full bg-[#38bdf8] ring-2 ring-white"></div>
                     </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    userMarker = L.marker(userLoc, {
      icon: userIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    renderMarkers();
  });

  const createIcon = (place, isVisited = false) => {
    const bg = isVisited ? "bg-green-500" : "bg-slate-900";
    const iconColor = "text-white";

    return L.divIcon({
      className: "custom-marker-icon",
      html: `<div class="flex h-10 w-10 items-center justify-center rounded-2xl ${bg} ${iconColor} shadow-lg ring-2 ring-white/50 backdrop-blur-md">
                       <iconify-icon icon="${isVisited ? "solar:check-circle-linear" : place.icon}" stroke-width="1.5" class="text-xl"></iconify-icon>
                     </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  const renderMarkers = () => {
    markers.forEach((m) => map.removeLayer(m));
    markers = [];
    places.forEach((place) => {
      const marker = L.marker([place.lat, place.lng], {
        icon: createIcon(place),
      })
        .addTo(map)
        .on("click", () => selectPlace(place));
      place.marker = marker;
      markers.push(marker);
    });
  };

  const selectPlace = (place) => {
    activePlace = place;

    const offsetLat = window.innerWidth <= 768 ? -0.015 : -0.005;
    map.flyTo([place.lat + offsetLat, place.lng], 14, { duration: 1.2 });

    document.getElementById("panel-title").textContent = place.name;
    document.getElementById("panel-img").src = place.image;
    document.getElementById("modal-title").textContent = place.name;
    document.getElementById("modal-img").src = place.image;
    document.getElementById("modal-desc").textContent = place.desc;
    document.getElementById("monument-title").textContent = place.name;

    const panel = document.getElementById("place-panel");
    panel.classList.remove("translate-y-[150%]");

    botTyping();
    setTimeout(() => {
      addMessage(
        `Ah, ${place.name}! Excellent choice. Should I guide you there or tell you a story about it?`,
        false,
      );
    }, 1200);
  };

  window.centerMap = function () {
    map.flyTo(userLoc, 14, { duration: 1 });
  };

  window.toggleChat = function () {
    isChatOpen = !isChatOpen;
    const panel = document.getElementById("chat-panel");
    if (isChatOpen) {
      panel.classList.remove("translate-x-[120%]");
    } else {
      panel.classList.add("translate-x-[120%]");
    }
  };

  window.toggleVoice = function () {
    voiceEnabled = !voiceEnabled;
    const toggleDot = document.querySelector("#voice-toggle div");
    const toggleBg = document.getElementById("voice-toggle");
    if (voiceEnabled) {
      toggleDot.classList.add("translate-x-4");
      toggleBg.classList.replace("bg-slate-200", "bg-[#f97316]");
    } else {
      toggleDot.classList.remove("translate-x-4");
      toggleBg.classList.replace("bg-[#f97316]", "bg-slate-200");
    }
  };

  window.openDetails = function () {
    const modal = document.getElementById("details-modal");
    const content = document.getElementById("details-content");
    modal.classList.remove("pointer-events-none", "opacity-0");
    modal.classList.add("pointer-events-auto", "opacity-100");
    setTimeout(() => content.classList.remove("translate-y-full"), 50);
  };

  window.closeDetails = function () {
    const modal = document.getElementById("details-modal");
    const content = document.getElementById("details-content");
    content.classList.add("translate-y-full");
    setTimeout(() => {
      modal.classList.remove("pointer-events-auto", "opacity-100");
      modal.classList.add("pointer-events-none", "opacity-0");
    }, 300);
  };

  window.startJourney = function () {
    if (!activePlace) return;

    document.getElementById("place-panel").classList.add("translate-y-[150%]");

    if (activeRoute) map.removeLayer(activeRoute);
    activeRoute = L.polyline([userLoc, [activePlace.lat, activePlace.lng]], {
      color: "#f97316",
      weight: 4,
      dashArray: "8, 8",
      lineCap: "round",
      className: "route-line",
    }).addTo(map);

    map.fitBounds(activeRoute.getBounds(), { padding: [50, 50] });

    document.getElementById("nav-target").textContent = activePlace.name;
    document
      .getElementById("nav-banner")
      .classList.remove("-translate-y-[150%]");

    setTimeout(() => triggerArrival(activePlace), 4000);
  };

  window.endJourney = function () {
    if (activeRoute) map.removeLayer(activeRoute);
    activeRoute = null;
    document.getElementById("nav-banner").classList.add("-translate-y-[150%]");
    window.centerMap();
  };

  function triggerArrival(place) {
    place.marker.setIcon(createIcon(place, true));

    const toast = document.getElementById("toast");
    document.getElementById("toast-msg").textContent =
      `You've arrived at ${place.name}!`;
    toast.classList.remove("-translate-y-[150%]");

    setTimeout(() => {
      toast.classList.add("-translate-y-[150%]");
      window.endJourney();
      window.openDetails();
    }, 3000);
  }

  window.enterMonumentMode = function () {
    window.closeDetails();
    const overlay = document.getElementById("monument-mode");
    overlay.classList.remove("pointer-events-none", "opacity-0");
    overlay.classList.add("pointer-events-auto", "opacity-100");
  };

  window.exitMonumentMode = function () {
    const overlay = document.getElementById("monument-mode");
    overlay.classList.remove("pointer-events-auto", "opacity-100");
    overlay.classList.add("pointer-events-none", "opacity-0");
  };

  const botTyping = () => {
    const container = document.getElementById("chat-messages");
    const id = "typing-" + Date.now();
    const html = `
              <div id="${id}" class="flex max-w-[85%] gap-3 transition-opacity">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100"><iconify-icon icon="solar:stars-linear" class="text-sm text-slate-600"></iconify-icon></div>
                  <div class="flex items-center gap-1 rounded-2xl rounded-tl-none bg-slate-100 px-4 py-3">
                      <div class="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                      <div class="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                      <div class="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                  </div>
              </div>`;
    container.insertAdjacentHTML("beforeend", html);
    container.scrollTop = container.scrollHeight;
    return id;
  };

  const addMessage = (text, isUser = false) => {
    const container = document.getElementById("chat-messages");
    const typingId = document.querySelector('[id^="typing-"]');
    if (typingId) typingId.remove();

    const userHtml = `
              <div class="ml-auto max-w-[85%] rounded-2xl rounded-tr-none bg-[#f97316] px-4 py-3 text-sm text-white">
                  ${text}
              </div>`;

    const botHtml = `
              <div class="flex max-w-[85%] gap-3">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <iconify-icon icon="solar:stars-linear" class="text-sm text-slate-600"></iconify-icon>
                  </div>
                  <div class="rounded-2xl rounded-tl-none bg-slate-100 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                      ${text}
                  </div>
              </div>`;

    container.insertAdjacentHTML("beforeend", isUser ? userHtml : botHtml);
    container.scrollTop = container.scrollHeight;
  };

  window.handleChat = function (e) {
    if (e.key === "Enter") sendMsg();
  };

  window.sendMsg = function () {
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, true);
    input.value = "";

    botTyping();
    setTimeout(() => {
      if (text.toLowerCase().includes("route")) {
        addMessage("I'll draw the route on the map for you!", false);
        if (activePlace) startJourney();
      } else {
        addMessage(
          "That's fascinating! Did you know the Red Fort was originally white? It was painted red by the British to preserve the stone.",
          false,
        );
      }
    }, 1500);
  };
})();
