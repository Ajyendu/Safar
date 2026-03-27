/**
 * Monument Mode for CH Travel Guide — geofence prompt + internal Leaflet map (QR checkpoints, camera/photo scan).
 * India Gate first; extend MONUMENT_INTERNAL by adding entries keyed like DELHI_MONUMENTS ids.
 */
(function (global) {
  "use strict";

  const R = 6371000;

  function haversineMeters(lat1, lng1, lat2, lng2) {
    const toR = (d) => (d * Math.PI) / 180;
    const dLat = toR(lat2 - lat1);
    const dLng = toR(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  function nearestNodeId(nodes, lat, lng) {
    if (!nodes || !nodes.length) return null;
    let best = nodes[0].id;
    let bestD = Infinity;
    nodes.forEach(function (n) {
      const d = haversineMeters(lat, lng, n.lat, n.lng);
      if (d < bestD) {
        bestD = d;
        best = n.id;
      }
    });
    return best;
  }

  function findNodeById(nodes, id) {
    if (!nodes || !id) return null;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) return nodes[i];
    }
    return null;
  }

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function qrCheckpointIcon() {
    return L.divIcon({
      className: "ch-monument-qr-marker-anchor",
      html:
        '<div class="ch-monument-qr-marker" title="QR checkpoint">' +
        '<svg class="ch-monument-qr-marker-svg" width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect fill="#fff" x="2" y="2" width="6" height="6"/>' +
        '<rect fill="#0c4a6e" x="3" y="3" width="4" height="4"/>' +
        '<rect fill="#fff" x="14" y="2" width="6" height="6"/>' +
        '<rect fill="#0c4a6e" x="15" y="3" width="4" height="4"/>' +
        '<rect fill="#fff" x="2" y="14" width="6" height="6"/>' +
        '<rect fill="#0c4a6e" x="3" y="15" width="4" height="4"/>' +
        '<rect fill="#fff" x="10" y="10" width="2" height="2"/>' +
        '<rect fill="#fff" x="14" y="10" width="2" height="2"/>' +
        '<rect fill="#fff" x="18" y="10" width="2" height="2"/>' +
        '<rect fill="#fff" x="10" y="14" width="2" height="2"/>' +
        '<rect fill="#fff" x="14" y="14" width="2" height="2"/>' +
        '<rect fill="#fff" x="18" y="14" width="2" height="2"/>' +
        "</svg></div>",
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -20],
    });
  }

  /**
   * Point-in-polygon (ray casting). Vertices in order (clockwise or CCW).
   * @param {{lat:number,lng:number}[]} vertices
   */
  function pointInPolygon(lat, lng, vertices) {
    if (!vertices || vertices.length < 3) return false;
    let inside = false;
    const n = vertices.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const yi = vertices[i].lat;
      const xi = vertices[i].lng;
      const yj = vertices[j].lat;
      const xj = vertices[j].lng;
      if (Math.abs(yj - yi) < 1e-14) continue;
      if (yi > lat !== yj > lat) {
        const xInt = ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
        if (lng < xInt) inside = !inside;
      }
    }
    return inside;
  }

  function boundsFromHexVertices(vertices, padDeg) {
    padDeg = padDeg == null ? 0.00025 : padDeg;
    let north = -90;
    let south = 90;
    let east = -180;
    let west = 180;
    vertices.forEach(function (p) {
      north = Math.max(north, p.lat);
      south = Math.min(south, p.lat);
      east = Math.max(east, p.lng);
      west = Math.min(west, p.lng);
    });
    return {
      north: north + padDeg,
      south: south - padDeg,
      east: east + padDeg,
      west: west - padDeg,
    };
  }

  /** Hex / polygon as [[lat,lng], ...] for Leaflet */
  function hexToLatLngRing(hex) {
    return hex.map(function (p) {
      return [p.lat, p.lng];
    });
  }

  function isInsideMonumentGeofence(cfg, lat, lng) {
    if (cfg.geofenceHex && cfg.geofenceHex.length >= 3) {
      return pointInPolygon(lat, lng, cfg.geofenceHex);
    }
    if (
      cfg.centerLat != null &&
      cfg.centerLng != null &&
      cfg.geofenceRadiusM != null
    ) {
      return (
        haversineMeters(lat, lng, cfg.centerLat, cfg.centerLng) <=
        cfg.geofenceRadiusM
      );
    }
    return false;
  }

  /** Strip HTML for Web Speech API (fallback when speechText is missing). */
  function plainTextFromHtml(html) {
    if (!html) return "";
    var d = document.createElement("div");
    d.innerHTML = html;
    return (d.textContent || d.innerText || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** Full narration: title, summary, key facts, and about — for text-to-speech. */
  function buildMonumentSpeechText(node) {
    if (!node) return "";
    var parts = [];
    if (node.name) parts.push(node.name + ".");
    if (node.summary) parts.push(node.summary);
    if (node.keyFacts && node.keyFacts.length) {
      parts.push("Key information.");
      node.keyFacts.forEach(function (line) {
        parts.push(line);
      });
    }
    if (node.aboutHtml) {
      parts.push(plainTextFromHtml(node.aboutHtml));
    } else if (node.speechText) {
      parts.push(node.speechText);
    } else if (node.infoHtml) {
      parts.push(plainTextFromHtml(node.infoHtml));
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }

  function pickSpeechVoice() {
    var synth = global.speechSynthesis;
    if (!synth) return null;
    var voices = synth.getVoices();
    if (!voices || !voices.length) return null;
    var i;
    for (i = 0; i < voices.length; i++) {
      var lang = (voices[i].lang || "").toLowerCase();
      if (lang.indexOf("en-in") === 0 || lang === "en-in") return voices[i];
    }
    for (i = 0; i < voices.length; i++) {
      if ((voices[i].lang || "").toLowerCase().indexOf("en") === 0) {
        return voices[i];
      }
    }
    return voices[0];
  }

  /**
   * Gallery + hero summary + key facts + about (maps-style card) for India Gate zone QRs.
   */
  const CHECKPOINT_ARTICLES_INDIA_GATE = {
    india_gate_qr: {
      summary:
        "War memorial arch honoring Indian soldiers of World War I and the Third Anglo-Afghan War. A national symbol and one of Delhi’s most visited landmarks.",
      keyFacts: [
        "42 m tall arch (Lutyens design)",
        "Built in 1931",
        "70,000+ soldiers commemorated",
        "Names inscribed on the walls",
        "Former site of Amar Jawan Jyoti (1972–2022)",
        "Free entry — open day and night",
      ],
      aboutHtml:
        "<p>India Gate is one of the most iconic landmarks of New Delhi, built as a war memorial during British rule. Designed by Edwin Lutyens, it honors over 70,000 Indian soldiers who died in World War I and the Third Anglo-Afghan War, with names engraved on its walls.</p>" +
        "<p>After independence it became a symbol of national pride rather than a colonial monument. The Amar Jawan Jyoti flame was added in 1972 and was later merged ceremonially with the National War Memorial in 2022.</p>",
      galleryImages: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/India_Gate_in_New_Delhi_03-2016_img3.jpg/1024px-India_Gate_in_New_Delhi_03-2016_img3.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/India_Gate_in_New_Delhi_03-2016_img3.jpg/960px-India_Gate_in_New_Delhi_03-2016_img3.jpg",
      ],
      speechText:
        "India Gate. War memorial arch honoring Indian soldiers of World War I and the Third Anglo-Afghan War. Key facts: 42 meter tall arch designed by Lutyens, built in 1931, more than 70 thousand soldiers commemorated, names inscribed on the walls, former site of Amar Jawan Jyoti from 1972 to 2022, free entry open day and night. India Gate is one of the most iconic landmarks of New Delhi. After independence it became a symbol of national pride. The Amar Jawan Jyoti flame was added in 1972 and was later merged with the National War Memorial in 2022.",
    },
    national_war_memorial: {
      summary:
        "Modern national tribute to armed forces martyrs after 1947 — circular design with four symbolic chakras and an eternal flame.",
      keyFacts: [
        "Inaugurated in 2019",
        "Honors post-independence martyrs",
        "Four circles: Amar, Tyag, Veerta, Rakshak",
        "Eternal flame at the center",
        "25,000+ names engraved",
        "Home of Amar Jawan Jyoti (merged from India Gate)",
      ],
      aboutHtml:
        "<p>National War Memorial is dedicated to Indian armed forces personnel who sacrificed their lives after independence in 1947. Its layered circular design represents sacrifice, bravery, and protection — the main national tribute to fallen soldiers.</p>" +
        "<p>For decades India lacked a dedicated national war memorial; this was fulfilled in 2019 near India Gate, and it became the new home of the Amar Jawan Jyoti flame.</p>",
      galleryImages: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/National_War_Memorial%2C_New_Delhi.jpg/1024px-National_War_Memorial%2C_New_Delhi.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/National_War_Memorial%2C_New_Delhi.jpg/960px-National_War_Memorial%2C_New_Delhi.jpg",
      ],
      speechText:
        "National War Memorial. Modern national tribute to armed forces martyrs after 1947. Key facts: inaugurated in 2019, honors post-independence martyrs, four circles Amar Tyag Veerta Rakshak, eternal flame at the center, more than 25 thousand names engraved, home of Amar Jawan Jyoti merged from India Gate. The memorial fulfills a long-standing need and strengthened national remembrance.",
    },
    netaji_canopy: {
      summary:
        "Historic sandstone canopy on Kartavya Path — from a colonial statue to a 2022 statue of Netaji, symbolizing decolonization.",
      keyFacts: [
        "On Kartavya Path near India Gate",
        "Originally King George V statue",
        "Statue removed in 1968",
        "Netaji statue installed in 2022",
        "Symbol of decolonization",
        "Sandstone canopy architecture",
      ],
      aboutHtml:
        "<p>Netaji Subhash Chandra Bose Canopy is a historic structure that once housed a statue of a British king. After independence the statue was removed, and in 2022 a grand statue of Subhas Chandra Bose was installed — symbolizing India’s shift toward honoring its own heroes.</p>" +
        "<p>The transformation marks a strong reclaiming of national identity on the ceremonial axis of New Delhi.</p>",
      galleryImages: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Canopy_near_India_Gate%2C_New_Delhi.jpg/1024px-Canopy_near_India_Gate%2C_New_Delhi.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Canopy_near_India_Gate%2C_New_Delhi.jpg/960px-Canopy_near_India_Gate%2C_New_Delhi.jpg",
      ],
      speechText:
        "Netaji Subhash Chandra Bose Canopy. Historic sandstone canopy on Kartavya Path. Key facts: originally King George the Fifth statue, removed in 1968, Netaji statue installed in 2022, symbol of decolonization. After independence the British statue was removed; the 2022 installation honors Netaji and reclaims national identity.",
    },
    param_yodha_sthal: {
      summary:
        "Memorial zone honoring Param Vir Chakra awardees — India’s highest military honor — with statues and stories of courage.",
      keyFacts: [
        "Inside National War Memorial",
        "Param Vir Chakra heroes",
        "Life-size statues",
        "Stories of bravery on display",
        "Educational and inspirational",
        "Part of the post-2019 memorial complex",
      ],
      aboutHtml:
        "<p>Param Yodha Sthal honors Param Vir Chakra awardees — the highest military honor in India — with statues and detailed accounts of valor, making it both a tribute and an educational space.</p>" +
        "<p>It adds a personal dimension to the National War Memorial by highlighting individual acts of courage.</p>",
      galleryImages: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/National_War_Memorial%2C_New_Delhi.jpg/1024px-National_War_Memorial%2C_New_Delhi.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/National_War_Memorial%2C_New_Delhi.jpg/960px-National_War_Memorial%2C_New_Delhi.jpg",
      ],
      speechText:
        "Param Yodha Sthal. Memorial zone honoring Param Vir Chakra awardees, India's highest military honor. Key facts: inside the National War Memorial, life-size statues, stories of bravery on display, educational and inspirational. It highlights individual acts of courage within the national memorial.",
    },
  };

  /**
   * Internal layouts keyed by monument id (e.g. india_gate).
   */
  const MONUMENT_INTERNAL = {
    india_gate: {
      name: "India Gate",
      /**
       * India Gate CICR / ceremonial area — hexagon (clockwise), WGS84.
       * Entry prompt + internal map clip use this polygon.
       */
      geofenceHex: [
        { lat: 28.614673, lng: 77.22789 },
        { lat: 28.616196, lng: 77.231327 },
        { lat: 28.614349, lng: 77.234578 },
        { lat: 28.611091, lng: 77.234278 },
        { lat: 28.609525, lng: 77.23092 },
        { lat: 28.611309, lng: 77.227827 },
      ],
      get bounds() {
        return boundsFromHexVertices(this.geofenceHex, 0.0002);
      },
      /** Four physical QR locations (same coords; Kartavya-side stop is the India Gate QR). */
      graphNodes: [
        Object.assign(
          {
            id: "param_yodha_sthal",
            name: "Param Yodha Sthal",
            lat: 28.614705,
            lng: 77.231241,
            qrHint: "ig-qr-param-yodha-sthal",
          },
          CHECKPOINT_ARTICLES_INDIA_GATE.param_yodha_sthal,
        ),
        Object.assign(
          {
            id: "national_war_memorial",
            name: "National War Memorial",
            lat: 28.612764,
            lng: 77.232741,
            qrHint: "ig-qr-national-war-memorial",
          },
          CHECKPOINT_ARTICLES_INDIA_GATE.national_war_memorial,
        ),
        Object.assign(
          {
            id: "netaji_canopy",
            name: "Netaji Subhash Chandra Bose Canopy",
            lat: 28.612869,
            lng: 77.230633,
            qrHint: "ig-qr-netaji-canopy",
          },
          CHECKPOINT_ARTICLES_INDIA_GATE.netaji_canopy,
        ),
        Object.assign(
          {
            id: "india_gate_qr",
            name: "India Gate",
            lat: 28.612943,
            lng: 77.229273,
            qrHint: "ig-qr-india-gate",
          },
          CHECKPOINT_ARTICLES_INDIA_GATE.india_gate_qr,
        ),
      ],
      /**
       * Ceremonial loop + spokes to named radials + Amar Jawan Jyoti (curves + west).
       * WGS84 [lat, lng] for Leaflet.
       */
      pathways: [
        {
          id: "war_mem_rd_ring",
          name: "Ceremonial circuit (round path)",
          /**
           * Smooth circle fit to surveyed clockwise loop (WGS84); algebraic fit + dense samples
           * so the line reads round despite GPS noise.
           */
          latlngs: [
            [28.612878, 77.230578],
            [28.612922, 77.230584],
            [28.612965, 77.230594],
            [28.613007, 77.230608],
            [28.613048, 77.230626],
            [28.613087, 77.230649],
            [28.613125, 77.230675],
            [28.61316, 77.230704],
            [28.613193, 77.230737],
            [28.613223, 77.230774],
            [28.613251, 77.230813],
            [28.613275, 77.230854],
            [28.613296, 77.230898],
            [28.613313, 77.230943],
            [28.613327, 77.230991],
            [28.613337, 77.231039],
            [28.613344, 77.231088],
            [28.613346, 77.231138],
            [28.613345, 77.231188],
            [28.61334, 77.231237],
            [28.613331, 77.231286],
            [28.613319, 77.231333],
            [28.613302, 77.23138],
            [28.613283, 77.231424],
            [28.61326, 77.231466],
            [28.613233, 77.231506],
            [28.613204, 77.231543],
            [28.613172, 77.231578],
            [28.613138, 77.231609],
            [28.613101, 77.231636],
            [28.613062, 77.23166],
            [28.613022, 77.231679],
            [28.61298, 77.231695],
            [28.612938, 77.231707],
            [28.612894, 77.231714],
            [28.61285, 77.231717],
            [28.612806, 77.231715],
            [28.612763, 77.23171],
            [28.61272, 77.2317],
            [28.612677, 77.231685],
            [28.612637, 77.231667],
            [28.612597, 77.231645],
            [28.61256, 77.231619],
            [28.612525, 77.231589],
            [28.612492, 77.231556],
            [28.612461, 77.23152],
            [28.612434, 77.231481],
            [28.61241, 77.23144],
            [28.612389, 77.231396],
            [28.612372, 77.23135],
            [28.612358, 77.231303],
            [28.612347, 77.231255],
            [28.612341, 77.231205],
            [28.612338, 77.231156],
            [28.61234, 77.231106],
            [28.612345, 77.231057],
            [28.612354, 77.231008],
            [28.612366, 77.23096],
            [28.612382, 77.230914],
            [28.612402, 77.23087],
            [28.612425, 77.230827],
            [28.612451, 77.230787],
            [28.61248, 77.23075],
            [28.612512, 77.230716],
            [28.612547, 77.230685],
            [28.612584, 77.230658],
            [28.612622, 77.230634],
            [28.612663, 77.230614],
            [28.612704, 77.230599],
            [28.612747, 77.230587],
            [28.612791, 77.23058],
            [28.612834, 77.230577],
            [28.612878, 77.230578],
          ],
          closed: true,
        },
        {
          id: "spoke_swami_vivekananda_rd",
          name: "Swami Vivekananda Rd → circuit",
          latlngs: [
            [28.615523, 77.229612],
            [28.613275, 77.230854],
          ],
        },
        {
          id: "spoke_tilak_marg",
          name: "Tilak Marg → circuit",
          latlngs: [
            [28.615363, 77.233003],
            [28.613233, 77.231506],
          ],
        },
        {
          id: "spoke_national_war_memorial_rd",
          name: "National War Memorial Rd → circuit",
          latlngs: [
            [28.612796, 77.232248],
            [28.612806, 77.231715],
          ],
        },
        {
          id: "spoke_zakir_hussain_marg",
          name: "Dr Zakir Hussain Marg → circuit",
          latlngs: [
            [28.610168, 77.232685],
            [28.61241, 77.23144],
          ],
        },
        {
          id: "spoke_shahjahan_rd",
          name: "Shahjahan Rd → circuit",
          latlngs: [
            [28.610307, 77.229272],
            [28.612451, 77.230787],
          ],
        },
        {
          id: "param_yodha_sthal_rd",
          name: "Param Yodha Sthal Road",
          latlngs: [
            [28.614399, 77.230268],
            [28.614352, 77.231245],
            [28.614305, 77.232222],
          ],
        },
        {
          id: "connector_param_yodha_sthal_to_py_road",
          name: "Param Yodha Sthal — link to Param Yodha Sthal Road",
          latlngs: [
            [28.614722, 77.231251],
            [28.614705, 77.231241],
            [28.614352, 77.231245],
          ],
        },
        {
          id: "bridge_ring_to_param_yodha_rd",
          name: "Link — circuit / Swami Vivekananda to Param Yodha Sthal Road",
          latlngs: [
            [28.613275, 77.230854],
            [28.614399, 77.230268],
          ],
        },
        {
          id: "bridge_param_yodha_rd_to_tilak_spoke",
          name: "Link — Param Yodha Sthal Road to Tilak Marg",
          latlngs: [
            [28.614305, 77.232222],
            [28.613233, 77.231506],
          ],
        },
        {
          id: "spoke_circuit_to_amar_jawan_approach",
          name: "Ceremonial circuit → Amar Jawan Jyoti (approach)",
          latlngs: [
            [28.612878, 77.230578],
            [28.612888, 77.229966],
          ],
        },
        {
          id: "amar_jawan_jyoti_curve_n",
          name: "Amar Jawan Jyoti Rd (curve, north side)",
          latlngs: [
            [28.612888, 77.229966],
            [28.612986, 77.22994],
            [28.613056, 77.229879],
            [28.613111, 77.229794],
            [28.613134, 77.229649],
            [28.613138, 77.229516],
            [28.613123, 77.229335],
            [28.613112, 77.229264],
            [28.613044, 77.22917],
            [28.612999, 77.22915],
            [28.612946, 77.22915],
          ],
        },
        {
          id: "amar_jawan_jyoti_curve_s",
          name: "Amar Jawan Jyoti Rd (curve, south side)",
          latlngs: [
            [28.612888, 77.229966],
            [28.612845, 77.229946],
            [28.61279, 77.229916],
            [28.612746, 77.229856],
            [28.612724, 77.229781],
            [28.612715, 77.229658],
            [28.612718, 77.229583],
            [28.612715, 77.229473],
            [28.612731, 77.229386],
            [28.612753, 77.229311],
            [28.612792, 77.229235],
            [28.612841, 77.22919],
            [28.612931, 77.229145],
            [28.612946, 77.22915],
          ],
        },
        {
          id: "amar_jawan_jyoti_west",
          name: "Amar Jawan Jyoti Rd (west)",
          latlngs: [
            [28.612946, 77.22915],
            [28.612997, 77.227836],
          ],
        },
      ],
    },
  };

  /** Base pathway lines on the internal map (dotted / dashed). */
  const MONUMENT_PATHWAY_COLOR = "#0ea5e9";
  const MONUMENT_PATHWAY_WEIGHT = 5;
  const MONUMENT_PATHWAY_DASH = "5, 8";
  /** Shortest-path overlay (distinct from base pathways). */
  const MONUMENT_ROUTE_COLOR = "#fbbf24";
  const MONUMENT_ROUTE_WEIGHT = 7;
  /** If you are within this distance of the path, treat as on-path (single solid line). */
  const MONUMENT_ROUTE_ON_PATH_EPS_M = 2.5;

  function keyForPoint(lat, lng) {
    return lat.toFixed(6) + "|" + lng.toFixed(6);
  }

  function closestPointOnSegment(p, a, b) {
    var lat = p[0];
    var lng = p[1];
    var al = a[0];
    var ao = a[1];
    var bl = b[0];
    var bo = b[1];
    var vx = bl - al;
    var vy = bo - ao;
    var wx = lat - al;
    var wy = lng - ao;
    var c2 = vx * vx + vy * vy;
    if (c2 < 1e-22) return { lat: al, lng: ao };
    var t = (vx * wx + vy * wy) / c2;
    t = Math.max(0, Math.min(1, t));
    return { lat: al + t * vx, lng: ao + t * vy };
  }

  function normalizedPathwayPoints(pw) {
    var pts = pw.latlngs ? pw.latlngs.slice() : [];
    if (!pts.length) return [];
    if (pw.closed && pts.length >= 2) {
      var f = pts[0];
      var l = pts[pts.length - 1];
      if (
        Math.abs(f[0] - l[0]) < 1e-8 &&
        Math.abs(f[1] - l[1]) < 1e-8
      ) {
        pts = pts.slice(0, -1);
      }
    }
    return pts;
  }

  function collectPathwaySegments(pathways) {
    var out = [];
    if (!pathways || !pathways.length) return out;
    pathways.forEach(function (pw) {
      var pts = normalizedPathwayPoints(pw);
      if (pts.length < 2) return;
      if (pw.closed) {
        for (var i = 0; i < pts.length; i++) {
          out.push({ a: pts[i], b: pts[(i + 1) % pts.length] });
        }
      } else {
        for (var j = 0; j < pts.length - 1; j++) {
          out.push({ a: pts[j], b: pts[j + 1] });
        }
      }
    });
    return out;
  }

  /** Shortest distance from a point to any pathway segment (meters). */
  function minDistanceMetersToPathways(lat, lng, pathways) {
    var segs = collectPathwaySegments(pathways);
    if (!segs.length) return null;
    var best = Infinity;
    segs.forEach(function (seg) {
      var c = closestPointOnSegment([lat, lng], seg.a, seg.b);
      var d = haversineMeters(lat, lng, c.lat, c.lng);
      if (d < best) best = d;
    });
    return best === Infinity ? null : best;
  }

  function segmentIntersectionXY(x1, y1, x2, y2, x3, y3, x4, y4, out) {
    var rx = x2 - x1;
    var ry = y2 - y1;
    var sx = x4 - x3;
    var sy = y4 - y3;
    var denom = rx * sy - ry * sx;
    if (Math.abs(denom) < 1e-18) return false;
    var qpx = x3 - x1;
    var qpy = y3 - y1;
    var t = (qpx * sy - qpy * sx) / denom;
    var u = (qpx * ry - qpy * rx) / denom;
    if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) {
      return false;
    }
    out.x = x1 + t * rx;
    out.y = y1 + t * ry;
    return true;
  }

  function tAlongSegmentAB(a, b, x, y) {
    var dx = b[1] - a[1];
    var dy = b[0] - a[0];
    if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > 1e-12) {
      return (x - a[1]) / dx;
    }
    if (Math.abs(dy) > 1e-12) {
      return (y - a[0]) / dy;
    }
    return 0;
  }

  /**
   * Clip segment [a,b] (each [lat,lng]) to inside convex polygon vertices {lat,lng}[].
   * Returns array of segments [[[lat,lng],[lat,lng]], ...].
   */
  function clipSegmentToPolygonVertices(a, b, vertices) {
    if (!vertices || vertices.length < 3) {
      return [[[a[0], a[1]], [b[0], b[1]]]];
    }
    var ts = [0, 1];
    var out = { x: 0, y: 0 };
    var n = vertices.length;
    for (var i = 0; i < n; i++) {
      var v0 = vertices[i];
      var v1 = vertices[(i + 1) % n];
      if (
        segmentIntersectionXY(
          a[1],
          a[0],
          b[1],
          b[0],
          v0.lng,
          v0.lat,
          v1.lng,
          v1.lat,
          out,
        )
      ) {
        var t = tAlongSegmentAB(a, b, out.x, out.y);
        if (t > 1e-8 && t < 1 - 1e-8) {
          ts.push(t);
        }
      }
    }
    ts.sort(function (p, q) {
      return p - q;
    });
    var uniq = [];
    ts.forEach(function (t) {
      if (
        !uniq.length ||
        Math.abs(t - uniq[uniq.length - 1]) > 1e-7
      ) {
        uniq.push(t);
      }
    });
    ts = uniq;
    var result = [];
    for (var k = 0; k < ts.length - 1; k++) {
      var t0 = ts[k];
      var t1 = ts[k + 1];
      if (t1 - t0 < 1e-9) continue;
      var tm = (t0 + t1) / 2;
      var mlat = a[0] + tm * (b[0] - a[0]);
      var mlng = a[1] + tm * (b[1] - a[1]);
      if (pointInPolygon(mlat, mlng, vertices)) {
        result.push([
          [a[0] + t0 * (b[0] - a[0]), a[1] + t0 * (b[1] - a[1])],
          [a[0] + t1 * (b[0] - a[0]), a[1] + t1 * (b[1] - a[1])],
        ]);
      }
    }
    return result;
  }

  function mergeClippedPathSegments(subs) {
    var polylines = [];
    var cur = null;
    subs.forEach(function (pair) {
      var p0 = pair[0];
      var p1 = pair[1];
      if (!cur) {
        cur = [p0.slice(), p1.slice()];
        return;
      }
      var L = cur[cur.length - 1];
      if (
        Math.abs(L[0] - p0[0]) < 1e-7 &&
        Math.abs(L[1] - p0[1]) < 1e-7
      ) {
        cur.push(p1.slice());
      } else {
        if (cur.length >= 2) polylines.push(cur);
        cur = [p0.slice(), p1.slice()];
      }
    });
    if (cur && cur.length >= 2) polylines.push(cur);
    return polylines.filter(function (pl) {
      return pl.length >= 2;
    });
  }

  /** Pathway → polylines drawn only inside geofence (spokes clipped at hex edge). */
  function pathwayPolylinesClippedToHex(pw, hexVertices) {
    var pts = normalizedPathwayPoints(pw);
    if (!pts || pts.length < 2) return [];
    var closed = !!pw.closed;
    var subs = [];
    for (var i = 0; i < pts.length - 1; i++) {
      clipSegmentToPolygonVertices(pts[i], pts[i + 1], hexVertices).forEach(
        function (s) {
          subs.push(s);
        },
      );
    }
    if (closed) {
      clipSegmentToPolygonVertices(
        pts[pts.length - 1],
        pts[0],
        hexVertices,
      ).forEach(function (s) {
        subs.push(s);
      });
    }
    return mergeClippedPathSegments(subs);
  }

  function addUndirectedEdgeMin(adj, k1, k2, dist) {
    if (k1 === k2 || !(dist >= 0) || !isFinite(dist)) return;
    function addOne(a, b, d) {
      if (!adj.has(a)) adj.set(a, []);
      var list = adj.get(a);
      var found = false;
      for (var i = 0; i < list.length; i++) {
        if (list[i].to === b) {
          if (d < list[i].dist) list[i].dist = d;
          found = true;
          break;
        }
      }
      if (!found) list.push({ to: b, dist: d });
    }
    addOne(k1, k2, dist);
    addOne(k2, k1, dist);
  }

  function buildPathwayAdjacency(pathways) {
    var adj = new Map();
    var pos = new Map();
    function ensurePos(lat, lng) {
      var k = keyForPoint(lat, lng);
      if (!pos.has(k)) pos.set(k, [lat, lng]);
      return k;
    }
    if (!pathways || !pathways.length) return { adj: adj, pos: pos };
    pathways.forEach(function (pw) {
      var pts = normalizedPathwayPoints(pw);
      if (pts.length < 2) return;
      if (pw.closed) {
        for (var i = 0; i < pts.length; i++) {
          var a = pts[i];
          var b = pts[(i + 1) % pts.length];
          var ka = ensurePos(a[0], a[1]);
          var kb = ensurePos(b[0], b[1]);
          var d = haversineMeters(a[0], a[1], b[0], b[1]);
          addUndirectedEdgeMin(adj, ka, kb, d);
        }
      } else {
        for (var j = 0; j < pts.length - 1; j++) {
          var a2 = pts[j];
          var b2 = pts[j + 1];
          var ka2 = ensurePos(a2[0], a2[1]);
          var kb2 = ensurePos(b2[0], b2[1]);
          var d2 = haversineMeters(a2[0], a2[1], b2[0], b2[1]);
          addUndirectedEdgeMin(adj, ka2, kb2, d2);
        }
      }
    });
    return { adj: adj, pos: pos };
  }

  function cloneAdjacency(adj) {
    var out = new Map();
    adj.forEach(function (list, k) {
      out.set(
        k,
        list.map(function (e) {
          return { to: e.to, dist: e.dist };
        }),
      );
    });
    return out;
  }

  function dijkstra(adj, start, goal) {
    var dist = new Map();
    var prev = new Map();
    var nodes = new Set();
    adj.forEach(function (_, k) {
      nodes.add(k);
    });
    if (!nodes.has(start) || !nodes.has(goal)) return null;
    nodes.forEach(function (k) {
      dist.set(k, Infinity);
    });
    dist.set(start, 0);
    while (nodes.size) {
      var u = null;
      var best = Infinity;
      nodes.forEach(function (k) {
        var d = dist.get(k);
        if (d < best) {
          best = d;
          u = k;
        }
      });
      if (u === null || best === Infinity) break;
      nodes.delete(u);
      if (u === goal) break;
      var neighbors = adj.get(u);
      if (!neighbors) continue;
      neighbors.forEach(function (e) {
        var alt = dist.get(u) + e.dist;
        if (
          alt <
          (dist.get(e.to) !== undefined ? dist.get(e.to) : Infinity)
        ) {
          dist.set(e.to, alt);
          prev.set(e.to, u);
        }
      });
    }
    if (dist.get(goal) === Infinity) return null;
    var path = [];
    var x = goal;
    while (x !== undefined) {
      path.push(x);
      if (x === start) break;
      x = prev.get(x);
    }
    path.reverse();
    if (path.length === 0 || path[0] !== start) return null;
    return path;
  }

  /**
   * Shortest walk along pathway polylines from (fromLat,fromLng) to (toLat,toLng).
   * Uses network edges + straight connectors from user/destination to nearest segment snaps.
   */
  function findShortestPathAlongPathways(pathways, fromLat, fromLng, toLat, toLng) {
    var base = buildPathwayAdjacency(pathways);
    if (base.adj.size === 0) return null;
    var segments = collectPathwaySegments(pathways);
    if (!segments.length) return null;

    var bestS = null;
    var bestSd = Infinity;
    segments.forEach(function (seg) {
      var c = closestPointOnSegment([fromLat, fromLng], seg.a, seg.b);
      var d = haversineMeters(fromLat, fromLng, c.lat, c.lng);
      if (d < bestSd) {
        bestSd = d;
        bestS = { c: c, seg: seg };
      }
    });
    var bestT = null;
    var bestTd = Infinity;
    segments.forEach(function (seg) {
      var c = closestPointOnSegment([toLat, toLng], seg.a, seg.b);
      var d = haversineMeters(toLat, toLng, c.lat, c.lng);
      if (d < bestTd) {
        bestTd = d;
        bestT = { c: c, seg: seg };
      }
    });
    if (!bestS || !bestT) return null;

    var adj = cloneAdjacency(base.adj);
    var pos = new Map(base.pos);

    var snapSk = keyForPoint(bestS.c.lat, bestS.c.lng);
    if (!pos.has(snapSk)) pos.set(snapSk, [bestS.c.lat, bestS.c.lng]);
    if (!adj.has(snapSk)) adj.set(snapSk, []);

    var sA = bestS.seg.a;
    var sB = bestS.seg.b;
    var sKa = keyForPoint(sA[0], sA[1]);
    var sKb = keyForPoint(sB[0], sB[1]);
    addUndirectedEdgeMin(
      adj,
      snapSk,
      sKa,
      haversineMeters(bestS.c.lat, bestS.c.lng, sA[0], sA[1]),
    );
    addUndirectedEdgeMin(
      adj,
      snapSk,
      sKb,
      haversineMeters(bestS.c.lat, bestS.c.lng, sB[0], sB[1]),
    );

    var snapTk = keyForPoint(bestT.c.lat, bestT.c.lng);
    if (!pos.has(snapTk)) pos.set(snapTk, [bestT.c.lat, bestT.c.lng]);
    if (!adj.has(snapTk)) adj.set(snapTk, []);

    var tA = bestT.seg.a;
    var tB = bestT.seg.b;
    var tKa = keyForPoint(tA[0], tA[1]);
    var tKb = keyForPoint(tB[0], tB[1]);
    addUndirectedEdgeMin(
      adj,
      snapTk,
      tKa,
      haversineMeters(bestT.c.lat, bestT.c.lng, tA[0], tA[1]),
    );
    addUndirectedEdgeMin(
      adj,
      snapTk,
      tKb,
      haversineMeters(bestT.c.lat, bestT.c.lng, tB[0], tB[1]),
    );

    var userKey = "u|" + keyForPoint(fromLat, fromLng);
    pos.set(userKey, [fromLat, fromLng]);
    adj.set(userKey, []);
    addUndirectedEdgeMin(
      adj,
      userKey,
      snapSk,
      haversineMeters(fromLat, fromLng, bestS.c.lat, bestS.c.lng),
    );

    var destKey = "d|" + keyForPoint(toLat, toLng);
    pos.set(destKey, [toLat, toLng]);
    adj.set(destKey, []);
    addUndirectedEdgeMin(
      adj,
      snapTk,
      destKey,
      haversineMeters(bestT.c.lat, bestT.c.lng, toLat, toLng),
    );

    var pathKeys = dijkstra(adj, userKey, destKey);
    if (!pathKeys || pathKeys.length < 2) return null;

    var latlngs = [];
    var last = null;
    pathKeys.forEach(function (k) {
      var p = pos.get(k);
      if (!p) return;
      if (
        last &&
        last[0] === p[0] &&
        last[1] === p[1]
      ) {
        return;
      }
      latlngs.push([p[0], p[1]]);
      last = p;
    });
    var totalM = 0;
    for (var i = 1; i < latlngs.length; i++) {
      totalM += haversineMeters(
        latlngs[i - 1][0],
        latlngs[i - 1][1],
        latlngs[i][0],
        latlngs[i][1],
      );
    }
    var approachM = haversineMeters(
      fromLat,
      fromLng,
      bestS.c.lat,
      bestS.c.lng,
    );
    var onPathM = 0;
    for (var j = 2; j < latlngs.length; j++) {
      onPathM += haversineMeters(
        latlngs[j - 1][0],
        latlngs[j - 1][1],
        latlngs[j][0],
        latlngs[j][1],
      );
    }
    if (onPathM < 1e-3) {
      onPathM = Math.max(0, totalM - approachM);
    }
    return {
      latlngs: latlngs,
      meters: totalM,
      approachMeters: approachM,
      onPathMeters: onPathM > 0 ? onPathM : Math.max(0, totalM - approachM),
      snapPoint: { lat: bestS.c.lat, lng: bestS.c.lng },
    };
  }

  function distPointToSegmentMeters(p, a, b) {
    var c = closestPointOnSegment(p, a, b);
    return haversineMeters(p[0], p[1], c.lat, c.lng);
  }

  function pathwayNameForEdge(pathways, p1, p2) {
    var mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    var best = "Path";
    var bestD = Infinity;
    pathways.forEach(function (pw) {
      var name = pw.name || pw.id || "Path";
      var pts = normalizedPathwayPoints(pw);
      if (pts.length < 2) return;
      if (pw.closed) {
        for (var i = 0; i < pts.length; i++) {
          var a = pts[i];
          var b = pts[(i + 1) % pts.length];
          var d = distPointToSegmentMeters(mid, a, b);
          if (d < bestD) {
            bestD = d;
            best = name;
          }
        }
      } else {
        for (var j = 0; j < pts.length - 1; j++) {
          var d2 = distPointToSegmentMeters(mid, pts[j], pts[j + 1]);
          if (d2 < bestD) {
            bestD = d2;
            best = name;
          }
        }
      }
    });
    return bestD < 50 ? best : "Path";
  }

  /**
   * Remaining route only (Google Maps–style): drop polyline segments already
   * passed by projecting the user onto the route and keeping from that point onward.
   */
  function trimRoutePolylineFromProgress(latlngs, uLat, uLng) {
    if (!latlngs || latlngs.length < 2) {
      return { latlngs: latlngs, meters: 0, prependedUser: false };
    }
    var bestSeg = 0;
    var bestC = null;
    var bestD = Infinity;
    for (var i = 0; i < latlngs.length - 1; i++) {
      var c = closestPointOnSegment([uLat, uLng], latlngs[i], latlngs[i + 1]);
      var d = haversineMeters(uLat, uLng, c.lat, c.lng);
      if (d < bestD - 1e-4) {
        bestD = d;
        bestSeg = i;
        bestC = c;
      }
    }
    if (!bestC) {
      return {
        latlngs: latlngs.slice(),
        meters: computePolylineLengthMeters(latlngs),
        prependedUser: false,
      };
    }
    var out = [[bestC.lat, bestC.lng]];
    for (var j = bestSeg + 1; j < latlngs.length; j++) {
      out.push(latlngs[j]);
    }
    if (out.length < 2) {
      out = [
        latlngs[latlngs.length - 2],
        latlngs[latlngs.length - 1],
      ];
    }
    var joinD = haversineMeters(uLat, uLng, out[0][0], out[0][1]);
    var prependedUser = false;
    if (joinD > 4) {
      out.unshift([uLat, uLng]);
      prependedUser = true;
    }
    return {
      latlngs: out,
      meters: computePolylineLengthMeters(out),
      prependedUser: prependedUser,
    };
  }

  function computePolylineLengthMeters(latlngs) {
    if (!latlngs || latlngs.length < 2) return 0;
    var t = 0;
    for (var i = 1; i < latlngs.length; i++) {
      t += haversineMeters(
        latlngs[i - 1][0],
        latlngs[i - 1][1],
        latlngs[i][0],
        latlngs[i][1],
      );
    }
    return t;
  }

  function bearingDeg(p1, p2) {
    var rad = Math.PI / 180;
    var p1r = p1[0] * rad;
    var q1 = p1[1] * rad;
    var p2r = p2[0] * rad;
    var q2 = p2[1] * rad;
    var y = Math.sin(q2 - q1) * Math.cos(p2r);
    var x =
      Math.cos(p1r) * Math.sin(p2r) -
      Math.sin(p1r) * Math.cos(p2r) * Math.cos(q2 - q1);
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  function turnKindFromBearings(bIn, bOut) {
    var d = (((bOut - bIn + 540) % 360) - 180);
    if (Math.abs(d) < 22) return null;
    if (d > 0) {
      return {
        kind: "right",
        text: "Turn right (about " + Math.round(Math.abs(d)) + "°).",
      };
    }
    return {
      kind: "left",
      text: "Turn left (about " + Math.round(Math.abs(d)) + "°).",
    };
  }

  /**
   * Steps for map cards: { kind, text } — kind: approach | straight | left | right | destination
   */
  function buildRouteNavSteps(pathways, result, destName) {
    var steps = [];
    var latlngs = result.latlngs;
    if (!latlngs || latlngs.length < 2) return steps;
    var ap = result.approachMeters;
    var eps = MONUMENT_ROUTE_ON_PATH_EPS_M;
    var hasApproach = ap != null && ap > eps;

    if (hasApproach) {
      steps.push({
        kind: "approach",
        text:
          "Continue about " +
          Math.round(ap) +
          " m to join the highlighted route.",
      });
    }

    var edgeStart = hasApproach ? 1 : 0;
    if (latlngs.length - 1 <= edgeStart) {
      steps.push({
        kind: "destination",
        text: "Reached your destination: " + destName + ".",
      });
      return steps;
    }

    var groups = [];
    for (var i = edgeStart; i < latlngs.length - 1; i++) {
      var a = latlngs[i];
      var b = latlngs[i + 1];
      var segM = haversineMeters(a[0], a[1], b[0], b[1]);
      var nm = pathwayNameForEdge(pathways, a, b);
      if (
        groups.length &&
        groups[groups.length - 1].name === nm
      ) {
        groups[groups.length - 1].m += segM;
        groups[groups.length - 1].endVertex = i + 1;
      } else {
        groups.push({
          name: nm,
          m: segM,
          startVertex: i,
          endVertex: i + 1,
        });
      }
    }

    for (var g = 0; g < groups.length; g++) {
      if (g > 0) {
        var junc = groups[g].startVertex;
        if (junc > 0 && junc < latlngs.length - 1) {
          var bIn = bearingDeg(
            latlngs[junc - 1],
            latlngs[junc],
          );
          var bOut = bearingDeg(latlngs[junc], latlngs[junc + 1]);
          var turn = turnKindFromBearings(bIn, bOut);
          if (turn) steps.push(turn);
        }
      }
      var gm = groups[g].m;
      steps.push({
        kind: "straight",
        text:
          "Go about " +
          (gm < 1000
            ? Math.round(gm) + " m"
            : (gm / 1000).toFixed(2) + " km") +
          " along " +
          groups[g].name +
          ".",
      });
    }

    steps.push({
      kind: "destination",
      text: "Reached your destination: " + destName + ".",
    });
    return steps;
  }

  function navIconSvg(kind) {
    var common =
      ' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"';
    switch (kind) {
      case "left":
        return (
          "<svg" +
          common +
          ' class="ch-monument-nav-icon-svg"><path fill="currentColor" d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>'
        );
      case "right":
        return (
          "<svg" +
          common +
          ' class="ch-monument-nav-icon-svg"><path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>'
        );
      case "straight":
        return (
          "<svg" +
          common +
          ' class="ch-monument-nav-icon-svg"><path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>'
        );
      case "approach":
        return (
          "<svg" +
          common +
          ' class="ch-monument-nav-icon-svg"><path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>'
        );
      case "destination":
      default:
        return (
          "<svg" +
          common +
          ' class="ch-monument-nav-icon-svg"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
        );
    }
  }

  function renderRouteNavCards(steps, totalMeters) {
    var nav = document.getElementById("ch-monument-route-nav");
    if (!nav) return;
    nav.innerHTML = "";
    if (!steps || !steps.length) {
      nav.style.display = "none";
      nav.setAttribute("aria-hidden", "true");
      return;
    }
    if (totalMeters != null && isFinite(totalMeters)) {
      var summary = document.createElement("div");
      summary.className = "ch-monument-route-nav-summary";
      summary.textContent =
        totalMeters < 1000
          ? "Total route: ~" + Math.round(totalMeters) + " m"
          : "Total route: ~" + (totalMeters / 1000).toFixed(2) + " km";
      nav.appendChild(summary);
    }
    steps.forEach(function (step) {
      var kind = step.kind || "straight";
      var card = document.createElement("div");
      card.className =
        "ch-monument-nav-card ch-monument-nav-card--" + kind;
      card.setAttribute("role", "listitem");
      var icon = document.createElement("div");
      icon.className = "ch-monument-nav-card-icon";
      icon.innerHTML = navIconSvg(kind);
      var text = document.createElement("p");
      text.className = "ch-monument-nav-card-text";
      text.textContent = step.text || "";
      card.appendChild(icon);
      card.appendChild(text);
      nav.appendChild(card);
    });
    nav.style.display = "flex";
    nav.setAttribute("aria-hidden", "false");
  }

  function ensureMonumentRoutePane(map) {
    if (!map.getPane("chMonumentRoutePane")) {
      map.createPane("chMonumentRoutePane");
      map.getPane("chMonumentRoutePane").style.zIndex = 650;
    }
  }

  /** Leaflet layer for the active “shortest path” route. */
  let monumentRouteLayer = null;
  /** When set, position updates recompute this route (live navigation). */
  let monumentRouteTargetNodeId = null;
  let monumentLiveRouteTimer = null;

  /**
   * @param {boolean} [clearFollowTarget] If true, stop live updates (Clear route / exit / switch checkpoint).
   */
  function clearMonumentRoute(clearFollowTarget) {
    if (clearFollowTarget) {
      monumentRouteTargetNodeId = null;
      if (monumentLiveRouteTimer) {
        clearTimeout(monumentLiveRouteTimer);
        monumentLiveRouteTimer = null;
      }
    }
    if (monumentRouteLayer && internalMap) {
      internalMap.removeLayer(monumentRouteLayer);
    }
    monumentRouteLayer = null;
    var clearBtn = document.getElementById("ch-monument-map-clear-route");
    var nav = document.getElementById("ch-monument-route-nav");
    if (clearBtn) clearBtn.style.display = "none";
    if (nav) {
      nav.innerHTML = "";
      nav.style.display = "none";
      nav.setAttribute("aria-hidden", "true");
    }
  }

  function scheduleMonumentLiveRouteRefresh() {
    if (!monumentRouteTargetNodeId || !activeMonumentId) return;
    if (monumentLiveRouteTimer) return;
    monumentLiveRouteTimer = setTimeout(function () {
      monumentLiveRouteTimer = null;
      if (
        !monumentRouteTargetNodeId ||
        !activeMonumentId ||
        !lastKnownUser ||
        !internalMap
      ) {
        return;
      }
      var cfg = MONUMENT_INTERNAL[activeMonumentId];
      if (!cfg) return;
      var node = findNodeById(cfg.graphNodes, monumentRouteTargetNodeId);
      if (!node) return;
      drawMonumentRouteToCheckpoint(node, {
        silent: true,
        skipFitBounds: true,
      });
    }, 400);
  }

  function updateMonumentRouteButtonUI() {
    var clearBtn = document.getElementById("ch-monument-map-clear-route");
    if (clearBtn) {
      clearBtn.style.display = monumentRouteLayer ? "inline-block" : "none";
    }
  }

  function showMonumentRouteToCheckpoint(node) {
    if (!node || !activeMonumentId) return;
    if (!internalMap) {
      setTimeout(function () {
        showMonumentRouteToCheckpoint(node);
      }, 80);
      return;
    }
    internalMap.invalidateSize();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        drawMonumentRouteToCheckpoint(node);
      });
    });
  }

  function drawMonumentRouteToCheckpoint(node, opts) {
    opts = opts || {};
    var silent = opts.silent === true;
    var skipFitBounds = opts.skipFitBounds === true;
    if (!node || !internalMap || !activeMonumentId) return;
    var cfg = MONUMENT_INTERNAL[activeMonumentId];
    if (!cfg || !cfg.pathways || !cfg.pathways.length) {
      if (!silent) {
        alert("No pathway data for routing.");
      }
      return;
    }
    if (!lastKnownUser) {
      if (!silent) {
        alert(
          "Set your position first — enable GPS or “Move my location with cursor” on the main map.",
        );
      }
      return;
    }
    var result = findShortestPathAlongPathways(
      cfg.pathways,
      lastKnownUser.lat,
      lastKnownUser.lng,
      node.lat,
      node.lng,
    );
    if (!result || !result.latlngs || result.latlngs.length < 2) {
      if (!silent) {
        alert(
          "Could not find a connected path along the drawn routes to this checkpoint.",
        );
      }
      return;
    }
    clearMonumentRoute(false);
    ensureMonumentRoutePane(internalMap);
    var routeOpts = {
      pane: "chMonumentRoutePane",
      interactive: false,
    };
    var trimmed = trimRoutePolylineFromProgress(
      result.latlngs,
      lastKnownUser.lat,
      lastKnownUser.lng,
    );
    var nl = trimmed.latlngs.slice();
    var uLat = lastKnownUser.lat;
    var uLng = lastKnownUser.lng;
    var dToStart = haversineMeters(
      uLat,
      uLng,
      nl[0][0],
      nl[0][1],
    );
    var didUnshiftUser = false;
    if (dToStart > MONUMENT_ROUTE_ON_PATH_EPS_M) {
      nl.unshift([uLat, uLng]);
      didUnshiftUser = true;
    }
    var navMeters = computePolylineLengthMeters(nl);
    var appr = 0;
    if (nl.length >= 2 && (didUnshiftUser || trimmed.prependedUser)) {
      appr = haversineMeters(nl[0][0], nl[0][1], nl[1][0], nl[1][1]);
    }
    var hasAppr = appr > MONUMENT_ROUTE_ON_PATH_EPS_M;
    var navResult = {
      latlngs: nl,
      meters: navMeters,
      approachMeters: hasAppr ? appr : 0,
      snapPoint: null,
      onPathMeters: hasAppr ? Math.max(0, navMeters - appr) : navMeters,
    };
    monumentRouteLayer = L.polyline(
      nl,
      Object.assign({}, routeOpts, {
        color: MONUMENT_ROUTE_COLOR,
        weight: MONUMENT_ROUTE_WEIGHT,
        opacity: 1,
        lineJoin: "round",
        lineCap: "round",
      }),
    ).addTo(internalMap);
    if (monumentRouteLayer && monumentRouteLayer.eachLayer) {
      monumentRouteLayer.eachLayer(function (ly) {
        if (ly.bringToFront) ly.bringToFront();
      });
    } else if (monumentRouteLayer && monumentRouteLayer.bringToFront) {
      monumentRouteLayer.bringToFront();
    }
    if (!skipFitBounds) {
      try {
        var b = L.latLngBounds(nl);
        if (lastKnownUser) {
          b.extend([lastKnownUser.lat, lastKnownUser.lng]);
        }
        internalMap.fitBounds(b, {
          padding: [28, 28],
          maxZoom: 19,
          animate: true,
        });
      } catch (e) {
        /* ignore */
      }
    }
    var navSteps = buildRouteNavSteps(
      cfg.pathways,
      navResult,
      node.name || "checkpoint",
    );
    renderRouteNavCards(navSteps, navResult.meters);
    monumentRouteTargetNodeId = node.id;
    updateMonumentRouteButtonUI();
  }

  /** Remember last tick inside geofence per monument (cursor/GPS can jump in from outside). */
  const previousInsideState = {};

  let activeMonumentId = null;
  let internalMap = null;
  let internalUserMarker = null;
  let monumentInfoEscapeHandler = null;
  /** Last GPS / cursor position (also used for QR info distance). */
  let lastKnownUser = null;
  /** Checkpoint id when the info modal is open (for live distance updates). */
  let monumentInfoTargetNodeId = null;
  /** Photo carousel for checkpoint detail modal. */
  let monumentGalleryImages = [];
  let monumentGalleryIndex = 0;
  let promptEl = null;
  let overlayEl = null;
  let pendingMonumentId = null;
  /** Stops camera QR preview + rAF when non-null. */
  let monumentQrCameraCleanup = null;
  /** dismissed until user leaves geofence */
  const dismissedUntilLeave = {};

  /** Satellite basemap for Monument Mode (outside hex gets a dark polygon veil). */
  const TILE_SATELLITE = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
      maxZoom: 19,
    },
  );

  function ensurePromptEl() {
    if (promptEl) return promptEl;
    promptEl = document.createElement("div");
    promptEl.id = "ch-monument-prompt";
    promptEl.className = "ch-monument-prompt";
    promptEl.setAttribute("role", "dialog");
    promptEl.setAttribute("aria-modal", "true");
    promptEl.style.display = "none";
    document.body.appendChild(promptEl);
    return promptEl;
  }

  function hidePrompt() {
    if (promptEl) promptEl.style.display = "none";
    pendingMonumentId = null;
  }

  function showPrompt(monumentId, cfg) {
    pendingMonumentId = monumentId;
    const el = ensurePromptEl();
    el.innerHTML =
      '<div class="ch-monument-prompt-card">' +
      '<h3 class="ch-monument-prompt-title">You are at ' +
      cfg.name +
      "</h3>" +
      '<p class="ch-monument-prompt-text">You\'ve entered the <strong>' +
      cfg.name +
      "</strong> on-site zone (ceremonial hexagon). Open <strong>Monument Mode</strong> for the internal map — <strong>satellite</strong> inside the hex, <strong>dark</strong> outside — with QR checkpoints, scanner, and details.</p>" +
      '<div class="ch-monument-prompt-actions">' +
      '<button type="button" class="ch-monument-btn ch-monument-btn-secondary" data-action="dismiss">Not now</button>' +
      '<button type="button" class="ch-monument-btn ch-monument-btn-primary" data-action="enter">Enter Monument Mode</button>' +
      "</div></div>";

    el.querySelector('[data-action="dismiss"]').onclick = function () {
      dismissedUntilLeave[monumentId] = true;
      hidePrompt();
    };
    el.querySelector('[data-action="enter"]').onclick = function () {
      hidePrompt();
      openMonumentMode(monumentId);
    };

    el.style.display = "flex";
  }

  function destroyInternalMap() {
    clearMonumentRoute(true);
    if (internalMap) {
      internalMap.remove();
      internalMap = null;
    }
    internalUserMarker = null;
  }

  function closeMonumentCheckpointInfo() {
    stopMonumentInfoSpeech();
    monumentInfoTargetNodeId = null;
    monumentGalleryImages = [];
    monumentGalleryIndex = 0;
    const heroVideoEl = document.getElementById("ch-monument-info-hero-video");
    if (heroVideoEl) {
      try {
        heroVideoEl.pause();
      } catch (_e) {
        /* ignore */
      }
      heroVideoEl.removeAttribute("src");
      heroVideoEl.style.display = "none";
    }
    const galleryImgEl = document.getElementById("ch-monument-info-gallery-img");
    if (galleryImgEl) galleryImgEl.style.display = "block";
    const summaryEl = document.getElementById("ch-monument-info-summary");
    if (summaryEl) summaryEl.textContent = "";
    const keyEl = document.getElementById("ch-monument-info-keyfacts");
    if (keyEl) keyEl.innerHTML = "";
    const aboutEl = document.getElementById("ch-monument-info-about");
    if (aboutEl) aboutEl.innerHTML = "";
    const backdrop = document.getElementById("ch-monument-info-backdrop");
    if (backdrop) {
      backdrop.style.display = "none";
      backdrop.setAttribute("aria-hidden", "true");
    }
  }

  function refreshMonumentInfoDistanceIfOpen() {
    const bd = document.getElementById("ch-monument-info-backdrop");
    if (
      !bd ||
      bd.style.display !== "flex" ||
      !monumentInfoTargetNodeId ||
      !activeMonumentId
    ) {
      return;
    }
    const cfg = MONUMENT_INTERNAL[activeMonumentId];
    if (!cfg) return;
    const node = findNodeById(cfg.graphNodes, monumentInfoTargetNodeId);
    const distEl = document.getElementById("ch-monument-info-distance");
    if (!node || !distEl) return;
    if (!lastKnownUser) {
      distEl.textContent =
        "Distance from you: unknown — enable GPS or “Move my location with cursor” on the main map.";
      return;
    }
    const m = haversineMeters(
      lastKnownUser.lat,
      lastKnownUser.lng,
      node.lat,
      node.lng,
    );
    distEl.textContent =
      "Straight-line distance from your current position: about " +
      (m < 1000 ? Math.round(m) + " m" : (m / 1000).toFixed(1) + " km") +
      ".";
  }

  function formatStraightLineDistanceShort(m) {
    if (m == null || !isFinite(m)) return "—";
    if (m < 1000) return Math.round(m) + " m";
    return (m / 1000).toFixed(1) + " km";
  }

  /** Updates each sidebar QR row (~straight-line from lastKnownUser). */
  function refreshMonumentQrListDistances() {
    const list = document.getElementById("ch-monument-qr-list");
    if (!list || !activeMonumentId) return;
    const cfg = MONUMENT_INTERNAL[activeMonumentId];
    if (!cfg) return;
    const u = lastKnownUser;
    list
      .querySelectorAll(".ch-monument-qr-card[data-node-id]")
      .forEach(function (card) {
        const distEl = card.querySelector(".ch-monument-qr-card-distance");
        if (!distEl) return;
        const id = card.getAttribute("data-node-id");
        const node = findNodeById(cfg.graphNodes, id);
        if (!node) {
          distEl.textContent = "";
          distEl.removeAttribute("title");
          distEl.classList.add("ch-monument-qr-card-distance--unknown");
          return;
        }
        if (!u) {
          distEl.textContent = "—";
          distEl.setAttribute(
            "title",
            "Enable GPS or “Move my location with cursor” on the main map to see distance.",
          );
          distEl.classList.add("ch-monument-qr-card-distance--unknown");
          return;
        }
        const m = haversineMeters(u.lat, u.lng, node.lat, node.lng);
        distEl.textContent = "~" + formatStraightLineDistanceShort(m);
        distEl.setAttribute(
          "title",
          "Approx. straight-line distance from your position on the main map",
        );
        distEl.classList.remove("ch-monument-qr-card-distance--unknown");
      });
    if (u && cfg.graphNodes) {
      const cards = Array.from(
        list.querySelectorAll(".ch-monument-qr-card[data-node-id]"),
      );
      cards.sort(function (a, b) {
        const na = findNodeById(
          cfg.graphNodes,
          a.getAttribute("data-node-id"),
        );
        const nb = findNodeById(
          cfg.graphNodes,
          b.getAttribute("data-node-id"),
        );
        if (!na || !nb) return 0;
        return (
          haversineMeters(u.lat, u.lng, na.lat, na.lng) -
          haversineMeters(u.lat, u.lng, nb.lat, nb.lng)
        );
      });
      cards.forEach(function (card) {
        list.appendChild(card);
      });
    }
  }

  function updateMonumentVoiceButtons(speaking) {
    var play = document.getElementById("ch-monument-info-voice");
    var stop = document.getElementById("ch-monument-info-voice-stop");
    if (play) {
      play.style.display = speaking ? "none" : "inline-flex";
      play.setAttribute("aria-pressed", speaking ? "true" : "false");
    }
    if (stop) stop.style.display = speaking ? "inline-flex" : "none";
  }

  function updateMonumentGalleryView(nameLabel) {
    var img = document.getElementById("ch-monument-info-gallery-img");
    var prev = document.getElementById("ch-monument-gallery-prev");
    var next = document.getElementById("ch-monument-gallery-next");
    if (!img) return;
    var showNav = monumentGalleryImages.length > 1;
    if (prev) {
      prev.style.visibility = showNav ? "visible" : "hidden";
      prev.disabled = !showNav;
    }
    if (next) {
      next.style.visibility = showNav ? "visible" : "hidden";
      next.disabled = !showNav;
    }
    if (!monumentGalleryImages.length) {
      img.removeAttribute("src");
      img.alt = "";
      return;
    }
    img.src = monumentGalleryImages[monumentGalleryIndex];
    img.alt = nameLabel ? "Photo: " + nameLabel : "";
  }

  function shiftMonumentGallery(delta) {
    if (!monumentGalleryImages.length) return;
    monumentGalleryIndex =
      (monumentGalleryIndex + delta + monumentGalleryImages.length) %
      monumentGalleryImages.length;
    var t = document.getElementById("ch-monument-info-title");
    updateMonumentGalleryView(t ? t.textContent : "");
  }

  function stopMonumentInfoSpeech() {
    if (typeof global.speechSynthesis !== "undefined") {
      global.speechSynthesis.cancel();
    }
    updateMonumentVoiceButtons(false);
  }

  function speakMonumentInfoText(text) {
    if (!text || !String(text).trim()) {
      alert("No information to read aloud.");
      return;
    }
    if (typeof global.speechSynthesis === "undefined") {
      alert(
        "Text-to-speech is not supported in this browser. Try Chrome, Edge, or Safari.",
      );
      return;
    }
    var synth = global.speechSynthesis;
    synth.cancel();
    try {
      if (synth.paused) synth.resume();
    } catch (e) {
      /* ignore */
    }
    /* Must call speak() in the same turn as the user click (no setTimeout) so iOS Safari allows audio. */
    var u = new SpeechSynthesisUtterance(String(text).trim());
    var voice = pickSpeechVoice();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang || "en-US";
    } else {
      u.lang = "en-US";
    }
    u.rate = 0.92;
    u.pitch = 1;
    u.volume = 1;
    u.onend = function () {
      updateMonumentVoiceButtons(false);
    };
    u.onerror = function (ev) {
      console.warn("Speech synthesis error", ev && ev.error);
      updateMonumentVoiceButtons(false);
    };
    updateMonumentVoiceButtons(true);
    synth.speak(u);
  }

  function openMonumentCheckpointInfo(node) {
    if (!node) return;
    stopMonumentInfoSpeech();
    if (monumentInfoTargetNodeId && monumentInfoTargetNodeId !== node.id) {
      clearMonumentRoute(true);
    }
    monumentInfoTargetNodeId = node.id;
    const titleEl = document.getElementById("ch-monument-info-title");
    const summaryEl = document.getElementById("ch-monument-info-summary");
    const keyEl = document.getElementById("ch-monument-info-keyfacts");
    const aboutEl = document.getElementById("ch-monument-info-about");
    const distEl = document.getElementById("ch-monument-info-distance");
    const codeEl = document.getElementById("ch-monument-info-qr-code");
    const imgEl = document.getElementById("ch-monument-info-qr-img");
    const heroVideoEl = document.getElementById("ch-monument-info-hero-video");
    const galleryImgEl = document.getElementById("ch-monument-info-gallery-img");
    const backdrop = document.getElementById("ch-monument-info-backdrop");
    if (!titleEl || !backdrop) return;
    titleEl.textContent = node.name;
    const shouldShowHeroVideo =
      activeMonumentId === "india_gate" && node.id === "india_gate_qr";
    if (summaryEl) {
      summaryEl.textContent =
        node.summary ||
        (node.info
          ? String(node.info).slice(0, 220) +
            (String(node.info).length > 220 ? "…" : "")
          : "");
    }
    if (keyEl) {
      keyEl.innerHTML = "";
      if (node.keyFacts && node.keyFacts.length) {
        var ul = document.createElement("ul");
        ul.className = "ch-monument-keyfacts-list";
        node.keyFacts.forEach(function (line) {
          var li = document.createElement("li");
          li.textContent = line;
          ul.appendChild(li);
        });
        keyEl.appendChild(ul);
      } else if (node.infoHtml) {
        keyEl.innerHTML =
          '<p class="ch-monument-about-fallback">' +
          escapeHtml(plainTextFromHtml(node.infoHtml).slice(0, 400)) +
          "</p>";
      }
    }
    if (aboutEl) {
      if (node.aboutHtml) {
        aboutEl.innerHTML = node.aboutHtml;
      } else if (node.infoHtml) {
        aboutEl.innerHTML = node.infoHtml;
      } else if (node.info) {
        aboutEl.innerHTML =
          "<p>" + escapeHtml(node.info) + "</p>";
      } else {
        aboutEl.innerHTML =
          "<p>Scan the physical QR at this location or use the code below in your app.</p>";
      }
    }
    if (heroVideoEl) {
      if (shouldShowHeroVideo) {
        // Local asset in the same folder as the HTML files.
        // Add cache-busting so newer MP4 with the same name is loaded.
        heroVideoEl.src = "India gate.mp4?cachebust=" + Date.now();
        heroVideoEl.style.display = "block";
        try {
          heroVideoEl.load();
        } catch (_e) {
          /* ignore */
        }
      } else {
        try {
          heroVideoEl.pause();
        } catch (_e) {
          /* ignore */
        }
        heroVideoEl.removeAttribute("src");
        heroVideoEl.style.display = "none";
      }
    }
    if (galleryImgEl) {
      galleryImgEl.style.display = shouldShowHeroVideo ? "none" : "block";
    }
    monumentGalleryImages = shouldShowHeroVideo
      ? []
      : Array.isArray(node.galleryImages)
        ? node.galleryImages.slice()
        : [];
    monumentGalleryIndex = 0;
    updateMonumentGalleryView(node.name);
    if (codeEl) codeEl.textContent = node.qrHint || "";
    if (imgEl) {
      const payload = encodeURIComponent(node.qrHint || node.name);
      imgEl.src =
        "https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=" +
        payload;
      imgEl.alt = "QR code: " + node.name;
    }
    backdrop.style.display = "flex";
    backdrop.setAttribute("aria-hidden", "false");
    refreshMonumentInfoDistanceIfOpen();
  }

  function closeMonumentQrCameraScanner() {
    if (monumentQrCameraCleanup) {
      monumentQrCameraCleanup();
      monumentQrCameraCleanup = null;
    }
  }

  /**
   * Live camera QR decode (getUserMedia + jsQR). Closes on success, Close, Escape, or backdrop tap.
   */
  function openMonumentQrCameraScanner() {
    const jsQRlib = global.jsQR;
    if (typeof jsQRlib !== "function") {
      alert("QR scanner did not load. Check your connection and try again.");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        "Camera is not available in this browser. Open the site over https (or localhost) and allow camera access.",
      );
      return;
    }

    closeMonumentQrCameraScanner();

    const backdrop = document.createElement("div");
    backdrop.id = "ch-monument-qr-camera-backdrop";
    backdrop.className = "ch-monument-qr-camera-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-label", "Scan QR with camera");
    backdrop.innerHTML =
      '<div class="ch-monument-qr-camera-panel">' +
      '<video class="ch-monument-qr-camera-video" playsinline muted autoplay></video>' +
      '<p class="ch-monument-qr-camera-hint">Point the camera at a checkpoint QR code. It will read automatically.</p>' +
      '<div class="ch-monument-qr-camera-actions">' +
      '<button type="button" class="ch-monument-btn ch-monument-btn-primary" data-action="close">Close</button>' +
      "</div>" +
      "</div>";

    const video = backdrop.querySelector("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    let stream = null;
    let rafId = null;
    let lastDecodeAt = 0;
    const decodeIntervalMs = 220;

    function cleanup() {
      document.removeEventListener("keydown", onKeyDown, true);
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (stream) {
        stream.getTracks().forEach(function (t) {
          t.stop();
        });
        stream = null;
      }
      video.srcObject = null;
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
      monumentQrCameraCleanup = null;
    }

    monumentQrCameraCleanup = cleanup;

    function onKeyDown(ev) {
      if (ev.key !== "Escape") return;
      ev.stopPropagation();
      cleanup();
    }

    document.addEventListener("keydown", onKeyDown, true);

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) {
        cleanup();
      }
    });

    backdrop.querySelector('[data-action="close"]').onclick = cleanup;

    document.body.appendChild(backdrop);

    const constraintsTry = [
      { video: { facingMode: { ideal: "environment" } }, audio: false },
      { video: true, audio: false },
    ];

    function startDecodeLoop() {
      function tick() {
        rafId = requestAnimationFrame(tick);
        if (!stream || !video.videoWidth) {
          return;
        }
        const now = performance.now();
        if (now - lastDecodeAt < decodeIntervalMs) {
          return;
        }
        lastDecodeAt = now;
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const maxSide = 720;
        let cw = vw;
        let ch = vh;
        if (vw > maxSide || vh > maxSide) {
          const scale = maxSide / Math.max(vw, vh);
          cw = Math.max(1, Math.floor(vw * scale));
          ch = Math.max(1, Math.floor(vh * scale));
        }
        canvas.width = cw;
        canvas.height = ch;
        try {
          ctx.drawImage(video, 0, 0, cw, ch);
          const imageData = ctx.getImageData(0, 0, cw, ch);
          const code = jsQRlib(
            imageData.data,
            imageData.width,
            imageData.height,
            {
              inversionAttempts: "attemptBoth",
            },
          );
          if (code && code.data) {
            cleanup();
            handleScannedQrPayload(code.data);
          }
        } catch (_err) {
          /* ignore frame errors */
        }
      }
      tick();
    }

    function tryGetUserMedia(i) {
      if (i >= constraintsTry.length) {
        alert("Could not open the camera. Check permissions and try again.");
        cleanup();
        return;
      }
      navigator.mediaDevices
        .getUserMedia(constraintsTry[i])
        .then(function (s) {
          stream = s;
          video.srcObject = s;
          const p = video.play();
          if (p && typeof p.catch === "function") {
            p.catch(function () {});
          }
          startDecodeLoop();
        })
        .catch(function () {
          tryGetUserMedia(i + 1);
        });
    }

    tryGetUserMedia(0);
  }

  function resolveNodeFromQrPayload(raw) {
    let s = String(raw || "").trim();
    if (!s) return null;
    try {
      if (/^https?:\/\//i.test(s)) {
        const u = new URL(s);
        const tail = (u.pathname + u.search + u.hash).replace(/^\/+/, "");
        if (tail) s = tail;
        else s = u.hostname + s;
      }
    } catch (_err) {
      /* keep s */
    }
    s = s.toLowerCase().replace(/\s+/g, "");

    const mids = Object.keys(MONUMENT_INTERNAL);
    for (let mi = 0; mi < mids.length; mi++) {
      const cfg = MONUMENT_INTERNAL[mids[mi]];
      const nodes = cfg.graphNodes || [];
      for (let ni = 0; ni < nodes.length; ni++) {
        const n = nodes[ni];
        const hint = (n.qrHint || "").trim().toLowerCase();
        if (!hint) continue;
        if (s === hint || s.indexOf(hint) !== -1 || hint.indexOf(s) !== -1) {
          return { monumentId: mids[mi], node: n };
        }
      }
    }
    if (s.indexOf("ig-qr-kartavya-path") !== -1) {
      const cfgI = MONUMENT_INTERNAL.india_gate;
      if (cfgI) {
        const legacy = findNodeById(cfgI.graphNodes, "india_gate_qr");
        if (legacy) return { monumentId: "india_gate", node: legacy };
      }
    }
    return null;
  }

  function handleScannedQrPayload(raw) {
    const hit = resolveNodeFromQrPayload(raw);
    if (!hit) {
      alert(
        "That QR text does not match a checkpoint here. Codes look like ig-qr-india-gate, ig-qr-national-war-memorial, etc.",
      );
      return false;
    }
    if (activeMonumentId !== hit.monumentId) {
      openMonumentMode(hit.monumentId);
    }
    function tryShow() {
      if (document.getElementById("ch-monument-info-title")) {
        openMonumentCheckpointInfo(hit.node);
        return true;
      }
      return false;
    }
    if (!tryShow()) {
      setTimeout(tryShow, 250);
      setTimeout(tryShow, 650);
    }
    return true;
  }

  function closeMonumentMode() {
    closeMonumentQrCameraScanner();
    activeMonumentId = null;
    closeMonumentCheckpointInfo();
    if (monumentInfoEscapeHandler) {
      document.removeEventListener("keydown", monumentInfoEscapeHandler);
      monumentInfoEscapeHandler = null;
    }
    if (overlayEl) {
      overlayEl.style.display = "none";
      overlayEl.innerHTML = "";
    }
    destroyInternalMap();
  }

  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    overlayEl = document.createElement("div");
    overlayEl.id = "ch-monument-overlay";
    overlayEl.className = "ch-monument-overlay";
    overlayEl.style.display = "none";
    document.body.appendChild(overlayEl);
    return overlayEl;
  }

  function openMonumentMode(monumentId) {
    const cfg = MONUMENT_INTERNAL[monumentId];
    if (!cfg) return;

    closeMonumentQrCameraScanner();
    activeMonumentId = monumentId;
    const root = ensureOverlay();
    root.style.display = "flex";
    root.innerHTML =
      '<div class="ch-monument-shell">' +
      '<header class="ch-monument-header">' +
      '<div><span class="ch-monument-badge">Monument Mode</span><h2 class="ch-monument-heading">' +
      cfg.name +
      "</h2></div>" +
      '<button type="button" class="ch-monument-exit" id="ch-monument-exit" aria-label="Exit monument mode">&times; Exit</button>' +
      "</header>" +
      '<div class="ch-monument-main">' +
      '<div class="ch-monument-map-col">' +
      '<div class="ch-monument-map-wrap">' +
      '<div class="ch-monument-map-topbar">' +
      '<button type="button" class="ch-monument-map-clear-route" id="ch-monument-map-clear-route" style="display:none" aria-label="Clear route">Clear route</button>' +
      '<button type="button" class="ch-monument-map-scan" id="ch-monument-qr-scan" title="Scan QR with camera" aria-label="Scan QR with camera">' +
      '<i class="fas fa-qrcode" aria-hidden="true"></i>' +
      "<span>Scan QR</span>" +
      "</button>" +
      "</div>" +
      '<div class="ch-monument-route-nav" id="ch-monument-route-nav" style="display:none" role="list" aria-label="Turn by turn directions"></div>' +
      '<div class="ch-monument-map" id="ch-monument-map"></div>' +
      "</div>" +
      "</div>" +
      '<aside class="ch-monument-side" aria-label="QR checkpoints">' +
      '<div class="ch-monument-side-inner">' +
      '<h3 class="ch-monument-side-title">QR checkpoints</h3>' +
      '<p class="ch-monument-nearest">Nearest: <strong id="ch-monument-nearest">—</strong></p>' +
      '<p class="ch-monument-path-nearest">Distance to nearest route line: <strong id="ch-monument-nearest-path-m">—</strong></p>' +
      '<p class="ch-monument-side-hint">Each row shows <strong>approx. distance</strong> from your position (straight line) when GPS or cursor location is set on the main map. Tap a <strong>pin</strong> or <strong>row</strong> for details, or <strong>Show route</strong> to draw the path on the map with <strong>turn-by-turn cards</strong> (top right). <strong>Scan QR</strong> opens the camera.</p>' +
      '<div class="ch-monument-qr-list" id="ch-monument-qr-list"></div>' +
      "</div>" +
      "</aside>" +
      "</div>" +
      '<div class="ch-monument-info-backdrop" id="ch-monument-info-backdrop" style="display:none" aria-hidden="true">' +
      '<div class="ch-monument-info-modal ch-monument-info-modal--gallery" role="dialog" aria-modal="true" aria-labelledby="ch-monument-info-title">' +
      '<button type="button" class="ch-monument-info-close" id="ch-monument-info-close" aria-label="Close">&times;</button>' +
      '<div class="ch-monument-info-hero">' +
      '<div class="ch-monument-info-gallery-wrap">' +
      '<div class="ch-monument-info-carousel">' +
      '<button type="button" class="ch-monument-gallery-nav ch-monument-gallery-prev" id="ch-monument-gallery-prev" aria-label="Previous photo" disabled>&#8249;</button>' +
      '<div class="ch-monument-info-carousel-frame">' +
      '<video id="ch-monument-info-hero-video" class="ch-monument-info-gallery-video" controls playsinline preload="metadata" style="display:none;"></video>' +
      '<img id="ch-monument-info-gallery-img" class="ch-monument-info-gallery-img" alt="" loading="lazy" />' +
      "</div>" +
      '<button type="button" class="ch-monument-gallery-nav ch-monument-gallery-next" id="ch-monument-gallery-next" aria-label="Next photo" disabled>&#8250;</button>' +
      "</div>" +
      "</div>" +
      '<div class="ch-monument-info-hero-text">' +
      '<div class="ch-monument-info-title-row">' +
      '<h3 id="ch-monument-info-title" class="ch-monument-info-title"></h3>' +
      '<div class="ch-monument-info-title-actions" role="group" aria-label="Voice">' +
      '<button type="button" class="ch-monument-btn ch-monument-btn-voice-icon" id="ch-monument-info-voice" aria-label="Read information aloud" aria-pressed="false">' +
      '<i class="fas fa-volume-up" aria-hidden="true"></i></button>' +
      '<button type="button" class="ch-monument-btn ch-monument-btn-voice-stop-icon" id="ch-monument-info-voice-stop" style="display:none" aria-label="Stop">' +
      '<i class="fas fa-stop" aria-hidden="true"></i></button>' +
      "</div>" +
      "</div>" +
      '<p class="ch-monument-info-summary" id="ch-monument-info-summary"></p>' +
      '<p class="ch-monument-info-distance" id="ch-monument-info-distance"></p>' +
      '<div class="ch-monument-info-hero-actions">' +
      '<button type="button" class="ch-monument-btn ch-monument-btn-directions" id="ch-monument-info-route">Get directions</button>' +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="ch-monument-info-panels">' +
      '<div class="ch-monument-info-panel ch-monument-info-panel--key">' +
      '<h4 class="ch-monument-info-panel-title">Key information</h4>' +
      '<div id="ch-monument-info-keyfacts" class="ch-monument-info-keyfacts"></div>' +
      "</div>" +
      '<div class="ch-monument-info-panel ch-monument-info-panel--about">' +
      '<h4 class="ch-monument-info-panel-title">About</h4>' +
      '<div id="ch-monument-info-about" class="ch-monument-info-about"></div>' +
      "</div>" +
      "</div>" +
      '<div class="ch-monument-info-footer">' +
      '<div class="ch-monument-info-qr-wrap">' +
      '<img id="ch-monument-info-qr-img" class="ch-monument-info-qr-img" alt="" width="112" height="112" loading="lazy" />' +
      '<code id="ch-monument-info-qr-code" class="ch-monument-info-qr-code"></code>' +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>";

    document.getElementById("ch-monument-exit").onclick = closeMonumentMode;

    document.getElementById("ch-monument-qr-scan").onclick = function () {
      openMonumentQrCameraScanner();
    };

    document.getElementById("ch-monument-info-close").onclick =
      closeMonumentCheckpointInfo;
    document.getElementById("ch-monument-info-route").onclick = function () {
      if (!monumentInfoTargetNodeId) return;
      const n = findNodeById(cfg.graphNodes, monumentInfoTargetNodeId);
      if (!n) return;
      closeMonumentCheckpointInfo();
      showMonumentRouteToCheckpoint(n);
    };
    document.getElementById("ch-monument-info-voice").onclick = function () {
      if (!monumentInfoTargetNodeId) return;
      const n = findNodeById(cfg.graphNodes, monumentInfoTargetNodeId);
      if (!n) return;
      var t = buildMonumentSpeechText(n);
      if (!t) {
        t = n.speechText || plainTextFromHtml(n.aboutHtml || n.infoHtml || "");
      }
      speakMonumentInfoText(t);
    };
    document.getElementById("ch-monument-gallery-prev").onclick = function () {
      shiftMonumentGallery(-1);
    };
    document.getElementById("ch-monument-gallery-next").onclick = function () {
      shiftMonumentGallery(1);
    };
    document.getElementById("ch-monument-info-voice-stop").onclick = function () {
      stopMonumentInfoSpeech();
    };
    if (typeof global.speechSynthesis !== "undefined") {
      global.speechSynthesis.getVoices();
    }
    document.getElementById("ch-monument-map-clear-route").onclick =
      function () {
        clearMonumentRoute(true);
        updateMonumentRouteButtonUI();
      };
    document.getElementById("ch-monument-info-backdrop").onclick = function (
      e,
    ) {
      if (e.target.id === "ch-monument-info-backdrop") {
        closeMonumentCheckpointInfo();
      }
    };

    const qrListEl = document.getElementById("ch-monument-qr-list");
    cfg.graphNodes.forEach(function (n) {
      const card = document.createElement("div");
      card.className = "ch-monument-qr-card ch-monument-qr-card--clickable";
      card.setAttribute("data-node-id", n.id);
      card.setAttribute("role", "group");
      card.innerHTML =
        '<div class="ch-monument-qr-card-head">' +
        '<span class="ch-monument-qr-card-title">' +
        escapeHtml(n.name) +
        "</span>" +
        '<span class="ch-monument-qr-card-distance ch-monument-qr-card-distance--unknown">—</span>' +
        "</div>" +
        '<div class="ch-monument-qr-card-actions">' +
        '<button type="button" class="ch-monument-btn ch-monument-route-btn" data-node-id="' +
        escapeHtml(n.id) +
        '">Show route</button>' +
        "</div>" +
        '<div class="ch-monument-qr-card-hint">Tap row for details</div>';
      qrListEl.appendChild(card);
    });
    refreshMonumentQrListDistances();
    function openCardInfoFromEvent(e) {
      const card = e.target.closest(".ch-monument-qr-card");
      if (!card) return;
      const id = card.getAttribute("data-node-id");
      const node = findNodeById(cfg.graphNodes, id);
      if (node) openMonumentCheckpointInfo(node);
    }
    qrListEl.addEventListener("click", function (e) {
      const routeBtn = e.target.closest(".ch-monument-route-btn");
      if (routeBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = routeBtn.getAttribute("data-node-id");
        const node = findNodeById(cfg.graphNodes, id);
        if (node) {
          closeMonumentCheckpointInfo();
          showMonumentRouteToCheckpoint(node);
        }
        return;
      }
      openCardInfoFromEvent(e);
    });

    if (monumentInfoEscapeHandler) {
      document.removeEventListener("keydown", monumentInfoEscapeHandler);
    }
    monumentInfoEscapeHandler = function (ev) {
      if (ev.key !== "Escape") return;
      if (monumentQrCameraCleanup) {
        monumentQrCameraCleanup();
        return;
      }
      const bd = document.getElementById("ch-monument-info-backdrop");
      if (bd && bd.style.display === "flex") closeMonumentCheckpointInfo();
    };
    document.addEventListener("keydown", monumentInfoEscapeHandler);

    const b = cfg.bounds;
    let hexRing = null;
    /** Tight view around hex (or cfg bounds); used for fit + min zoom lock. */
    let fitBoundsTarget = L.latLngBounds([
      [b.south, b.west],
      [b.north, b.east],
    ]);
    /** Slightly larger — user can pan a little but not wander far. */
    let maxBoundsTarget = L.latLngBounds([
      [b.south - 0.0004, b.west - 0.0004],
      [b.north + 0.0004, b.east + 0.0004],
    ]);

    var hexBbForCamera = null;
    if (cfg.geofenceHex && cfg.geofenceHex.length >= 3) {
      hexRing = hexToLatLngRing(cfg.geofenceHex);
      hexBbForCamera = L.latLngBounds(hexRing);
      fitBoundsTarget = hexBbForCamera.pad(0.022);
      maxBoundsTarget = hexBbForCamera.pad(0.1);
    }

    const initialCenter = fitBoundsTarget.getCenter();
    internalMap = L.map("ch-monument-map", {
      center: initialCenter,
      zoom: 18,
      zoomControl: true,
      maxZoom: 19,
    });
    TILE_SATELLITE.addTo(internalMap);

    function applyMonumentCamera() {
      if (!internalMap || activeMonumentId !== monumentId) return;
      internalMap.setMaxBounds(
        L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180)),
      );
      internalMap.invalidateSize();
      var padPx = L.point(6, 6);
      var z = internalMap.getBoundsZoom(fitBoundsTarget, false, padPx);
      z = Math.min(internalMap.getMaxZoom(), Math.max(z, 0));
      internalMap.setView(fitBoundsTarget.getCenter(), z, { animate: false });
      if (hexRing && hexRing.length >= 3 && hexBbForCamera) {
        var maxZ = internalMap.getMaxZoom();
        while (z < maxZ) {
          internalMap.setZoom(z + 1, { animate: false });
          var vb = internalMap.getBounds();
          if (
            vb.contains(hexBbForCamera.getSouthWest()) &&
            vb.contains(hexBbForCamera.getNorthEast())
          ) {
            z = internalMap.getZoom();
            continue;
          }
          internalMap.setZoom(z, { animate: false });
          break;
        }
      }
      internalMap.setMaxBounds(maxBoundsTarget);
      internalMap.options.maxBoundsViscosity = 0.98;
      internalMap.setMinZoom(internalMap.getZoom());
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(applyMonumentCamera);
    });
    setTimeout(applyMonumentCamera, 120);

    if (hexRing && hexRing.length >= 3) {
      const hb = L.latLngBounds(hexRing);
      const margin = 0.05;
      const outerMask = [
        [hb.getSouth() - margin, hb.getWest() - margin],
        [hb.getNorth() + margin, hb.getWest() - margin],
        [hb.getNorth() + margin, hb.getEast() + margin],
        [hb.getSouth() - margin, hb.getEast() + margin],
      ];
      L.polygon([outerMask, hexRing], {
        stroke: false,
        fillColor: "#020617",
        fillOpacity: 0.9,
        interactive: false,
      }).addTo(internalMap);
      const hexOutline = hexRing.slice();
      hexOutline.push(hexRing[0]);
      L.polyline(hexOutline, {
        color: "#0369a1",
        weight: 2,
        opacity: 0.95,
      }).addTo(internalMap);
    }

    if (cfg.pathways && cfg.pathways.length) {
      cfg.pathways.forEach(function (pw) {
        var drawPolylines;
        if (cfg.geofenceHex && cfg.geofenceHex.length >= 3) {
          drawPolylines = pathwayPolylinesClippedToHex(pw, cfg.geofenceHex);
        } else {
          const latlngs = pw.latlngs;
          if (!latlngs || latlngs.length < 2) return;
          var pl = latlngs;
          if (pw.closed) {
            pl = latlngs.slice();
            var a = pl[0];
            var b = pl[pl.length - 1];
            if (a[0] !== b[0] || a[1] !== b[1]) pl.push(a);
          }
          drawPolylines = [pl];
        }
        drawPolylines.forEach(function (pl) {
          if (!pl || pl.length < 2) return;
          L.polyline(pl, {
            color: MONUMENT_PATHWAY_COLOR,
            weight: MONUMENT_PATHWAY_WEIGHT,
            opacity: 0.98,
            dashArray: MONUMENT_PATHWAY_DASH,
            lineJoin: "round",
            lineCap: "round",
            interactive: false,
          }).addTo(internalMap);
        });
      });
    }

    cfg.graphNodes.forEach(function (n) {
      const marker = L.marker([n.lat, n.lng], {
        icon: qrCheckpointIcon(),
        title: n.name,
      }).addTo(internalMap);
      marker.bindTooltip("QR: " + n.name + " — tap for details", {
        direction: "top",
      });
      marker.on("click", function () {
        openMonumentCheckpointInfo(n);
      });
    });

    if (lastKnownUser) {
      updateInternalUser(lastKnownUser.lat, lastKnownUser.lng);
    }
  }

  function updateInternalUser(lat, lng) {
    if (lat == null || lng == null) return;
    lastKnownUser = { lat: lat, lng: lng };

    const nearestEl = document.getElementById("ch-monument-nearest");
    const pathDistEl = document.getElementById("ch-monument-nearest-path-m");
    if (activeMonumentId && (nearestEl || pathDistEl)) {
      const cfg = MONUMENT_INTERNAL[activeMonumentId];
      if (cfg) {
        if (nearestEl) {
          const nid = nearestNodeId(cfg.graphNodes, lat, lng);
          const node = findNodeById(cfg.graphNodes, nid);
          nearestEl.textContent = node ? node.name : "—";
        }
        if (pathDistEl) {
          if (!cfg.pathways || !cfg.pathways.length) {
            pathDistEl.textContent = "—";
          } else {
            var md = minDistanceMetersToPathways(lat, lng, cfg.pathways);
            pathDistEl.textContent =
              md == null || !isFinite(md)
                ? "—"
                : md < 1000
                  ? "~" + Math.round(md) + " m"
                  : "~" + (md / 1000).toFixed(1) + " km";
          }
        }
      }
    }

    refreshMonumentQrListDistances();

    if (!internalMap || !activeMonumentId) return;

    if (!internalUserMarker) {
      internalUserMarker = L.circleMarker([lat, lng], {
        radius: 10,
        fillColor: "#0ea5e9",
        color: "#fff",
        weight: 3,
        fillOpacity: 1,
      }).addTo(internalMap);
    } else {
      internalUserMarker.setLatLng([lat, lng]);
    }

    refreshMonumentInfoDistanceIfOpen();
    scheduleMonumentLiveRouteRefresh();
  }

  function onUserPosition(lat, lng) {
    lastKnownUser = { lat: lat, lng: lng };

    if (activeMonumentId) {
      const cfg = MONUMENT_INTERNAL[activeMonumentId];
      if (cfg) {
        if (!isInsideMonumentGeofence(cfg, lat, lng)) {
          closeMonumentMode();
        } else {
          updateInternalUser(lat, lng);
        }
      }
      return;
    }

    Object.keys(MONUMENT_INTERNAL).forEach(function (mid) {
      const cfg = MONUMENT_INTERNAL[mid];
      const inside = isInsideMonumentGeofence(cfg, lat, lng);
      const wasInside = !!previousInsideState[mid];
      if (!inside) {
        dismissedUntilLeave[mid] = false;
      } else if (inside && !wasInside) {
        dismissedUntilLeave[mid] = false;
      }
      previousInsideState[mid] = inside;
    });

    for (const monumentId of Object.keys(MONUMENT_INTERNAL)) {
      const cfg = MONUMENT_INTERNAL[monumentId];
      const inside = isInsideMonumentGeofence(cfg, lat, lng);
      if (!inside) continue;
      if (dismissedUntilLeave[monumentId]) continue;
      if (
        promptEl &&
        promptEl.style.display === "flex" &&
        pendingMonumentId === monumentId
      ) {
        updateInternalUser(lat, lng);
        return;
      }
      if (promptEl && promptEl.style.display === "flex") return;
      showPrompt(monumentId, cfg);
      return;
    }

    hidePrompt();
  }

  global.CHMonumentMode = {
    onUserPosition: onUserPosition,
    close: closeMonumentMode,
    isOpen: function () {
      return !!activeMonumentId;
    },
    /** For testing / demos without GPS */
    openDemo: function (id) {
      id = id || "india_gate";
      if (MONUMENT_INTERNAL[id]) openMonumentMode(id);
    },
    /**
     * Call with raw QR string (or URL containing it). Opens Monument Mode and the info modal with distance.
     */
    handleScannedQrPayload: handleScannedQrPayload,
    openCheckpointInfo: openMonumentCheckpointInfo,
  };
})(typeof window !== "undefined" ? window : this);
