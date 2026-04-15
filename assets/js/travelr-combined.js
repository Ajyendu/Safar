/**
 * Travelr — wires together the generated HTML experiences:
 * Leaflet map, chat, place flows, documentary modal, metro planner,
 * India Gate tour + checkpoints, QR flow, and settings (voice / cursor / map theme).
 */
(function () {
  "use strict";

  const CONFIG = {
    fallbackUserLocation: [28.6139, 77.209],
  };

  /**
   * Delhi monuments — aligned with app.js (DELHI_MONUMENTS + PLACE_DETAILED_INFO).
   * ids are numeric for list UX; slug matches original string ids.
   */
  const PLACES_BY_CITY = {
    delhi: [
      {
        id: 1,
        slug: "red_fort",
        name: "Red Fort (Lal Qila)",
        lat: 28.6562,
        lng: 77.241,
        type: "Architecture",
        icon: "solar:castle-linear",
        rating: "4.8",
        keywords: ["red fort", "lal qila", "delhi", "monument", "mughal", "shah jahan"],
        image: "",
        desc: "UNESCO World Heritage Site; Mughal fort, built by Shah Jahan (1639–48).",
        built: "1639–1648",
        entry: "Ticketed · closed Monday",
        cultural:
          "Symbol of Indian independence; Prime Minister addresses the nation from here on 15 August. Stunning red sandstone architecture and Diwan-i-Aam, Diwan-i-Khas.",
        facts: [
          "UNESCO World Heritage Site",
          "Built 1639–1648 by Shah Jahan",
          "Independence Day flag ceremony",
          "Open Tue–Sun, closed Monday",
        ],
      },
      {
        id: 2,
        slug: "india_gate",
        name: "India Gate",
        lat: 28.6129,
        lng: 77.2295,
        type: "Memorial",
        icon: "solar:monument-linear",
        rating: "4.9",
        keywords: ["india gate", "delhi", "monument", "war memorial", "rajpath"],
        image: "",
        desc: "War memorial to 84,000 Indian soldiers; iconic arch on Rajpath.",
        built: "1931",
        entry: "Free · open 24/7",
        cultural:
          "National monument of remembrance; eternal flame (Amar Jawan Jyoti); surrounded by lawns, popular for evening visits.",
        facts: [
          "42 m tall arch",
          "Names of 13,300+ soldiers inscribed",
          "Amar Jawan Jyoti – eternal flame",
          "Free entry, open 24/7",
        ],
      },
      {
        id: 3,
        slug: "qutub_minar",
        name: "Qutub Minar",
        lat: 28.5219,
        lng: 77.1843,
        type: "Architecture",
        icon: "solar:tower-linear",
        rating: "4.8",
        keywords: ["qutub minar", "qutb", "delhi", "monument", "minaret"],
        image: "",
        desc: "UNESCO site; 73 m minaret, Qutub complex, early Sultanate architecture.",
        built: "1199–1368",
        entry: "Ticketed",
        cultural:
          "Tallest brick minaret in the world; early Sultanate Indo-Islamic architecture; Quwwat-ul-Islam mosque and Iron Pillar in same complex.",
        facts: [
          "73 m (239 ft) tall",
          "UNESCO World Heritage Site",
          "Built 1199–1368",
          "Iron Pillar of Delhi in same complex",
        ],
      },
      {
        id: 4,
        slug: "humayun_tomb",
        name: "Humayun's Tomb",
        lat: 28.593,
        lng: 77.2505,
        type: "Architecture",
        icon: "solar:monument-linear",
        rating: "4.9",
        keywords: ["humayun", "humayun tomb", "delhi", "monument", "mughal"],
        image: "",
        desc: "UNESCO site; Mughal garden tomb, precursor to the Taj Mahal.",
        built: "1569–1570",
        entry: "Ticketed",
        cultural:
          "Pioneering Mughal garden tomb; double dome and charbagh garden; influenced Taj Mahal design.",
        facts: [
          "UNESCO World Heritage Site",
          "Built 1569–1570",
          "Garden tomb (charbagh)",
          "Red sandstone and white marble",
        ],
      },
      {
        id: 5,
        slug: "lotus_temple",
        name: "Lotus Temple",
        lat: 28.5535,
        lng: 77.2588,
        type: "Religious",
        icon: "solar:magic-stick-3-linear",
        rating: "4.7",
        keywords: ["lotus temple", "bahai", "delhi", "monument"],
        image: "",
        desc: "Bahá'í House of Worship; lotus-shaped white marble building.",
        built: "1986",
        entry: "Free · closed Monday",
        cultural:
          "No idols; silence and meditation; striking 27-petal lotus design in white marble. People of any faith can pray here.",
        facts: [
          "Bahá'í House of Worship",
          "Opened 1986",
          "27 marble petals",
          "Free entry, closed Monday",
        ],
      },
      {
        id: 6,
        slug: "akshardham",
        name: "Akshardham Temple",
        lat: 28.6126,
        lng: 77.2774,
        type: "Religious",
        icon: "solar:buildings-linear",
        rating: "4.8",
        keywords: ["akshardham", "delhi", "monument", "temple", "swaminarayan"],
        image: "",
        desc: "Swaminarayan temple complex; grand Hindu temple with gardens and shows.",
        built: "2005",
        entry: "Free temple · paid exhibitions",
        cultural:
          "Intricate carvings, water show, cultural exhibitions. No cameras or phones inside; free entry to temple, paid exhibitions.",
        facts: [
          "Opened 2005",
          "Mandir, exhibitions, gardens",
          "Evening water show",
          "Strict dress code, no phones inside",
        ],
      },
      {
        id: 7,
        slug: "jama_masjid",
        name: "Jama Masjid",
        lat: 28.6506,
        lng: 77.2332,
        type: "Religious",
        icon: "solar:buildings-3-linear",
        rating: "4.7",
        keywords: ["jama masjid", "jamia", "delhi", "monument", "mosque"],
        image: "",
        desc: "India's largest mosque; built by Shah Jahan (1650–56), Old Delhi.",
        built: "1650–1656",
        entry: "Free / fees for tower",
        cultural:
          "Largest mosque in India; courtyard and minarets; non-Muslims can visit outside prayer times (modest dress, small fee for tower).",
        facts: [
          "Largest mosque in India",
          "Built 1650–1656 by Shah Jahan",
          "Three domes, two 40 m minarets",
          "Views from minaret (paid)",
        ],
      },
      {
        id: 8,
        slug: "rashtrapati_bhavan",
        name: "Rashtrapati Bhavan",
        lat: 28.6144,
        lng: 77.1996,
        type: "Architecture",
        icon: "solar:buildings-2-linear",
        rating: "4.6",
        keywords: ["rashtrapati bhavan", "president house", "delhi", "monument", "rajpath"],
        image: "",
        desc: "Official residence of the President of India; Rajpath, Lutyens' Delhi.",
        built: "1929",
        entry: "Garden tours (seasonal)",
        cultural:
          "340 rooms; Mughal Gardens open in spring; Changing of the Guard; central to Republic Day parade on Rajpath.",
        facts: [
          "Official residence of the President",
          "Designed by Edwin Lutyens; completed 1929",
          "Mughal Gardens (seasonal)",
          "North of India Gate on Rajpath",
        ],
      },
    ],
  };

  /** Local marker PNG/WebP, optional single video, Sketchfab / 3D — no bundled stock galleries. */
  const MEDIA_ASSETS = {
    red_fort: {
      markerFile: "/assets/images/markers/Red Fort.png",
      sketchfabEmbed: "https://sketchfab.com/models/2ad9ae0a1b524a37a2c3ab245b0e5423/embed",
      videos: [],
    },
    india_gate: {
      markerFile: "/assets/images/markers/india gate.png",
      sketchfabEmbed: "https://sketchfab.com/models/59fe55328271479d82acb65310178d99/embed",
      videos: [{ url: "/assets/videos/India gate.mp4", title: "India Gate" }],
    },
    qutub_minar: {
      markerFile: "/assets/images/markers/qutub minar .png",
      sketchfabEmbed: "https://sketchfab.com/models/e165e25ec8f1497aa83ab72419f40ddc/embed",
      videos: [],
    },
    humayun_tomb: {
      markerFile: "/assets/images/markers/humayun tomb.png",
      sketchfabEmbed: "https://sketchfab.com/models/592c6356517b4199bd88e5caf68da36d/embed",
      videos: [],
    },
    lotus_temple: {
      markerFile: "/assets/images/markers/lotus temple .png",
      local3dPage: "/pages/monuments-3d.html?monument=lotus_temple",
      videos: [],
    },
    akshardham: {
      markerFile: "/assets/images/markers/akshardham.png",
      sketchfabEmbed: "https://sketchfab.com/models/72df91f9fc3c4a979d9b8c08fbf357a6/embed",
      videos: [],
    },
    jama_masjid: {
      markerFile: "/assets/images/markers/Jama masjid.webp",
      sketchfabEmbed: "https://sketchfab.com/models/9bdbc1a76f4e43e893978e67678d6efd/embed",
      videos: [],
    },
    rashtrapati_bhavan: {
      markerFile: "/assets/images/markers/rashtrapati bhavan.png",
      sketchfabEmbed: "https://sketchfab.com/models/69bd010237304baf9ffcc247fdedb446/embed",
      videos: [],
    },
  };

  const METRO_UI = {
    origin: "Rajiv Chowk Metro (simulated)",
    destination: "Central Secretariat (simulated)",
    durationMin: 34,
    distanceMi: "4.2 mi",
    arrive: "Arrive around 10:45 AM",
    lines: ["Blue Line", "Red Line"],
  };

  /** Template for India Gate on-site tour (cloned into mutable state). */
  const CHECKPOINT_ARTICLES_ORIGINAL = {
    india_gate_qr: {
      summary:
        "War memorial arch honoring Indian soldiers of World War I and the Third Anglo-Afghan War. A national symbol and one of Delhi's most visited landmarks.",
      keyFacts: [
        "42 m tall arch (Lutyens design)",
        "Built in 1931",
        "70,000+ soldiers commemorated",
        "Names inscribed on the walls",
        "Former site of Amar Jawan Jyoti (1972-2022)",
        "Free entry - open day and night",
      ],
      aboutHtml:
        "<p>India Gate is one of the most iconic landmarks of New Delhi, built as a war memorial during British rule. Designed by Edwin Lutyens, it honors over 70,000 Indian soldiers who died in World War I and the Third Anglo-Afghan War, with names engraved on its walls.</p><p>After independence it became a symbol of national pride rather than a colonial monument. The Amar Jawan Jyoti flame was added in 1972 and was later merged ceremonially with the National War Memorial in 2022.</p>",
    },
    national_war_memorial: {
      summary:
        "Modern national tribute to armed forces martyrs after 1947 - circular design with four symbolic chakras and an eternal flame.",
      keyFacts: [
        "Inaugurated in 2019",
        "Honors post-independence martyrs",
        "Four circles: Amar, Tyag, Veerta, Rakshak",
        "Eternal flame at the center",
        "25,000+ names engraved",
        "Home of Amar Jawan Jyoti (merged from India Gate)",
      ],
      aboutHtml:
        "<p>National War Memorial is dedicated to Indian armed forces personnel who sacrificed their lives after independence in 1947. Its layered circular design represents sacrifice, bravery, and protection - the main national tribute to fallen soldiers.</p><p>For decades India lacked a dedicated national war memorial; this was fulfilled in 2019 near India Gate, and it became the new home of the Amar Jawan Jyoti flame.</p>",
    },
    netaji_canopy: {
      summary:
        "Historic sandstone canopy on Kartavya Path - from a colonial statue to a 2022 statue of Netaji, symbolizing decolonization.",
      keyFacts: [
        "On Kartavya Path near India Gate",
        "Originally King George V statue",
        "Statue removed in 1968",
        "Netaji statue installed in 2022",
        "Symbol of decolonization",
        "Sandstone canopy architecture",
      ],
      aboutHtml:
        "<p>Netaji Subhash Chandra Bose Canopy is a historic structure that once housed a statue of a British king. After independence the statue was removed, and in 2022 a grand statue of Subhas Chandra Bose was installed - symbolizing India's shift toward honoring its own heroes.</p><p>The transformation marks a strong reclaiming of national identity on the ceremonial axis of New Delhi.</p>",
    },
    param_yodha_sthal: {
      summary:
        "Memorial zone honoring Param Vir Chakra awardees - India's highest military honor - with statues and stories of courage.",
      keyFacts: [
        "Inside National War Memorial",
        "Param Vir Chakra heroes",
        "Life-size statues",
        "Stories of bravery on display",
        "Educational and inspirational",
        "Part of the post-2019 memorial complex",
      ],
      aboutHtml:
        "<p>Param Yodha Sthal honors Param Vir Chakra awardees - the highest military honor in India - with statues and detailed accounts of valor, making it both a tribute and an educational space.</p><p>It adds a personal dimension to the National War Memorial by highlighting individual acts of courage.</p>",
    },
  };

  const CHECKPOINTS_TEMPLATE = [
    {
      id: "param_yodha_sthal",
      order: 1,
      name: "Param Yodha Sthal",
      teaser: "Honors decorated heroes of the Indian Armed Forces.",
      body: "Scan the QR at Param Yodha Sthal to unlock stories of India's highest gallantry awardees.",
      status: "pending",
      video: null,
      label: "",
      lat: 28.614705,
      lng: 77.231241,
      about:
        "Param Yodha Sthal commemorates Param Vir Chakra recipients and anchors the modern remembrance zone beside India Gate.",
      facts: { built: "2019", height: "—", architect: "—" },
    },
    {
      id: "national_war_memorial",
      order: 2,
      name: "National War Memorial",
      teaser: "Primary national tribute to post-independence martyrs.",
      body: "Walk to the memorial rings and scan the QR to unlock the next chapter.",
      status: "pending",
      video: "/assets/videos/India gate.mp4",
      label: "",
      lat: 28.612764,
      lng: 77.232741,
      about:
        "Inaugurated in 2019, the National War Memorial honors armed forces personnel martyred after 1947 through four concentric circles and an eternal flame.",
      facts: {
        built: "2019",
        height: "—",
        architect: "WeBe Design Lab",
      },
    },
    {
      id: "netaji_canopy",
      order: 3,
      name: "Netaji Subhash Chandra Bose Canopy",
      teaser: "The restored canopy near Kartavya Path.",
      body: "Complete earlier checkpoints to reveal the full walking path.",
      status: "pending",
      video: null,
      label: "",
      lat: 28.612869,
      lng: 77.230633,
      about:
        "The historic canopy now hosts the statue of Netaji Subhash Chandra Bose, reconnecting the ceremonial axis with post-independence memory.",
      facts: { built: "1936", height: "73 ft canopy", architect: "Edwin Lutyens (axis)" },
    },
    {
      id: "india_gate_qr",
      order: 4,
      name: "India Gate",
      teaser: "Final checkpoint at the iconic 42m memorial arch.",
      body: "The final stop opens after earlier checkpoints are completed.",
      status: "pending",
      video: null,
      label: "",
      lat: 28.612943,
      lng: 77.229273,
      about:
        "India Gate, designed by Sir Edwin Lutyens and completed in 1931, remains the central landmark of the ceremonial district.",
      facts: { built: "1931", height: "42 m", architect: "Sir Edwin Lutyens" },
    },
  ];

  /** Original India Gate checkpoint pathway coordinates ([lng,lat]). */
  const INDIA_GATE_PATHWAYS = [
    {
      id: "pw-param-nwm",
      from: "param_yodha_sthal",
      to: "national_war_memorial",
      coordinates: [
        [77.231241, 28.614705],
        [77.232741, 28.612764],
      ],
    },
    {
      id: "pw-param-netaji",
      from: "param_yodha_sthal",
      to: "netaji_canopy",
      coordinates: [
        [77.231241, 28.614705],
        [77.230633, 28.612869],
      ],
    },
    {
      id: "pw-param-india-gate",
      from: "param_yodha_sthal",
      to: "india_gate_qr",
      coordinates: [
        [77.231241, 28.614705],
        [77.229273, 28.612943],
      ],
    },
    {
      id: "pw-nwm-netaji",
      from: "national_war_memorial",
      to: "netaji_canopy",
      coordinates: [
        [77.232741, 28.612764],
        [77.230633, 28.612869],
      ],
    },
    {
      id: "pw-nwm-india-gate",
      from: "national_war_memorial",
      to: "india_gate_qr",
      coordinates: [
        [77.232741, 28.612764],
        [77.229273, 28.612943],
      ],
    },
    {
      id: "pw-netaji-india-gate",
      from: "netaji_canopy",
      to: "india_gate_qr",
      coordinates: [
        [77.230633, 28.612869],
        [77.229273, 28.612943],
      ],
    },
  ];

  /** Exact Monument pathways imported from original monument-internal.js */
  const INDIA_GATE_BASE_PATHWAYS = [
    {
      id: "war_mem_rd_ring",
      name: "Ceremonial circuit (round path)",
      closed: true,
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
    },
    {
      id: "spoke_swami_vivekananda_rd",
      name: "Swami Vivekananda Rd -> circuit",
      latlngs: [[28.615523, 77.229612], [28.613275, 77.230854]],
    },
    {
      id: "spoke_tilak_marg",
      name: "Tilak Marg -> circuit",
      latlngs: [[28.615363, 77.233003], [28.613233, 77.231506]],
    },
    {
      id: "spoke_national_war_memorial_rd",
      name: "National War Memorial Rd -> circuit",
      latlngs: [[28.612796, 77.232248], [28.612806, 77.231715]],
    },
    {
      id: "spoke_zakir_hussain_marg",
      name: "Dr Zakir Hussain Marg -> circuit",
      latlngs: [[28.610168, 77.232685], [28.61241, 77.23144]],
    },
    {
      id: "spoke_shahjahan_rd",
      name: "Shahjahan Rd -> circuit",
      latlngs: [[28.610307, 77.229272], [28.612451, 77.230787]],
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
      name: "Param Yodha Sthal link road",
      latlngs: [
        [28.614722, 77.231251],
        [28.614705, 77.231241],
        [28.614352, 77.231245],
      ],
    },
    {
      id: "bridge_ring_to_param_yodha_rd",
      name: "Circuit link to Param Yodha Sthal Rd",
      latlngs: [[28.613275, 77.230854], [28.614399, 77.230268]],
    },
    {
      id: "bridge_param_yodha_rd_to_tilak_spoke",
      name: "Param Yodha Sthal Rd link to Tilak Marg",
      latlngs: [[28.614305, 77.232222], [28.613233, 77.231506]],
    },
    {
      id: "spoke_circuit_to_amar_jawan_approach",
      name: "Circuit to Amar Jawan approach",
      latlngs: [[28.612878, 77.230578], [28.612888, 77.229966]],
    },
    {
      id: "amar_jawan_jyoti_curve_n",
      name: "Amar Jawan Jyoti Rd (north curve)",
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
      name: "Amar Jawan Jyoti Rd (south curve)",
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
      latlngs: [[28.612946, 77.22915], [28.612997, 77.227836]],
    },
  ];

  const INDIA_GATE_CHECKPOINT_NODES = {
    param_yodha_sthal: { lat: 28.614705, lng: 77.231241, name: "Param Yodha Sthal" },
    national_war_memorial: { lat: 28.612764, lng: 77.232741, name: "National War Memorial" },
    netaji_canopy: { lat: 28.612869, lng: 77.230633, name: "Netaji Subhash Chandra Bose Canopy" },
    india_gate_qr: { lat: 28.612943, lng: 77.229273, name: "India Gate" },
  };

  const state = {
    userLocation: CONFIG.fallbackUserLocation.slice(),
    places: PLACES_BY_CITY.delhi,
    checkpoints:
      typeof structuredClone === "function"
        ? structuredClone(CHECKPOINTS_TEMPLATE)
        : JSON.parse(JSON.stringify(CHECKPOINTS_TEMPLATE)),
    map: null,
    markers: [],
    userMarker: null,
    lightLayer: null,
    darkLayer: null,
    satelliteLayer: null,
    darkUi: false,
    mapStyle: "default",
    activeRoute: null,
    /** Route alternatives currently drawn for regular navigation mode. */
    navAltRouteLayers: [],
    /** Selected route geometry (lat,lng tuples) for live progress/off-route checks. */
    navSelectedRouteCoords: null,
    navSelectedRouteDistanceM: null,
    navSelectedRouteDurationSec: null,
    navLastAutoRerouteMs: 0,
    routingControl: null,
    travelMetricsAbort: null,
    travelMetricsFromMap: false,
    activePlace: null,
    voiceEnabled: false,
    cursorMode: false,
    chatOpen: false,
    qrResolve: null,
    /** @type {string[]} */
    modalHeroGalleryUrls: [],
    modalHeroGalleryIndex: 0,
    /** @type {"walk"|"2w"|"car"|"metro"} */
    navRouteMode: "2w",
    /** First/last mile when navRouteMode is metro */
    /** @type {"walk"|"2w"|"car"} */
    metroFirstLegMode: "walk",
    /** @type {"walk"|"2w"|"car"} */
    metroLastLegMode: "walk",
    metroNavLayerGroup: null,
    navChatAnnounced: false,
    /** @type {number|null} geolocation watch id */
    liveNavWatchId: null,
    /** True while live navigation is on: hide explore + mode row, show turn strip. */
    navUiCompact: false,
    /** Cached OSRM / metro step lines; applied when entering live navigation. */
    /** @type {string[]|null} */
    navLastDirectionPhrases: null,
    /** Turn-by-turn maneuver points for current selected route. */
    navStepPoints: null,
    navCurrentStepIndex: 0,
    /** Smoothed map bearing (deg) during live nav; null = north-up. */
    navSmoothedBearing: null,
    /** @type {[number, number]|null} last fix for course-from-movement */
    navPrevGpsForBearing: null,
    /** Zoom level before live nav; restored when stopping. */
    navPreLiveZoom: null,
    liveNavMapControlsLocked: false,
    liveNavPrevMapControlState: null,
    liveNavAnchorIntervalId: null,
    /** Prevent repeated arrival prompts for the same destination. */
    navArrivalHandledPlaceSlug: null,
    /** Prevent repeated India Gate monument prompt while remaining nearby. */
    indiaGatePromptArmed: true,
    /** Monument mode map mask layers + zoom lock state. */
    monumentMaskOutside: null,
    monumentMaskInside: null,
    monumentPrevMinZoom: null,
    monumentPrevMaxBoundsViscosity: null,
    monumentInteractionLock: false,
    monumentHadPlacePanelOpen: false,
    monumentRouteLayer: null,
    monumentBasePathLayer: null,
    monumentQrLayer: null,
    placeClusterLayer: null,
    monumentPlaceMarkersHidden: false,
    monumentRoutingTargetId: null,
    monumentLastRerouteMs: 0,
    monumentLastRouteFrom: null,
    monumentNavSavedMaxBounds: null,
    monumentNavSavedMaxBoundsViscosity: null,
    monumentSimpleUiActive: false,
    monumentRatingPromptShown: false,
    monumentTourPlaceSlug: null,
    qrCameraStream: null,
    qrTorchOn: false,
    qrScanActive: false,
    qrScanBusy: false,
    qrScanRafId: null,
    qrBarcodeDetector: null,
  };

  function userLatLng() {
    return state.userLocation;
  }

  /** [lng, lat] anchors from original app.js — for nearest-station metro estimates. */
  const DELHI_METRO_STATIONS_REVISED = {
    "Samaypur Badli": [77.1383, 28.7446],
    "Rohini Sector 18/19": [77.1398, 28.7383],
    Jahangirpuri: [77.1627, 28.726],
    Azadpur: [77.1755, 28.7077],
    Vishwavidyalaya: [77.2147, 28.695],
    "Civil Lines": [77.225, 28.6769],
    "Kashmere Gate": [77.2219, 28.6517],
    "New Delhi": [77.2217, 28.6436],
    "Rajiv Chowk": [77.2197, 28.6328],
    "Patel Chowk": [77.214, 28.623],
    "Central Secretariat": [77.2123, 28.6159],
    INA: [77.2102, 28.5744],
    AIIMS: [77.2078, 28.5669],
    "Hauz Khas": [77.2067, 28.5443],
    Saket: [77.2137, 28.5244],
    "Qutub Minar": [77.1855, 28.5244],
    Chhatarpur: [77.175, 28.5067],
    Sultanpur: [77.161, 28.498],
    Ghitorni: [77.1492, 28.4938],
    "Guru Dronacharya": [77.1023, 28.482],
    Sikandarpur: [77.093, 28.4813],
    "MG Road": [77.0805, 28.4795],
    "IFFCO Chowk": [77.0724, 28.4723],
    "HUDA City Centre": [77.0727, 28.4593],
    "Dwarka Sector 21": [77.0586, 28.5518],
    Dwarka: [77.0443, 28.5772],
    Nawada: [77.0451, 28.6203],
    "Janakpuri West": [77.0779, 28.629],
    "Tilak Nagar": [77.0965, 28.6365],
    "Rajouri Garden": [77.1161, 28.6422],
    "Kirti Nagar": [77.1418, 28.6533],
    "Karol Bagh": [77.1891, 28.6442],
    "Ramakrishna Ashram Marg": [77.2086, 28.6392],
    "Mandi House": [77.2342, 28.6256],
    Indraprastha: [77.2496, 28.6206],
    "Yamuna Bank": [77.2679, 28.6233],
    Akshardham: [77.2795, 28.6178],
    "Mayur Vihar Phase-1": [77.2926, 28.6031],
    "Botanical Garden": [77.3343, 28.5639],
    "Noida Electronic City": [77.392, 28.574],
    Vaishali: [77.339, 28.6455],
    "Shaheed Sthal": [77.4156, 28.6706],
    "Hindon River": [77.408, 28.674],
    Arthala: [77.397, 28.673],
    "Mohan Nagar": [77.386, 28.6725],
    "Shyam Park": [77.375, 28.672],
    "Major Mohit Sharma": [77.366, 28.6716],
    "Raj Bagh": [77.357, 28.6713],
    "Dilshad Garden": [77.3214, 28.6759],
    Shahdara: [77.2897, 28.6734],
    Welcome: [77.277, 28.672],
    Inderlok: [77.1702, 28.6732],
    "Netaji Subhash Place": [77.1526, 28.6961],
    Rithala: [77.1072, 28.7208],
    "Lajpat Nagar": [77.2365, 28.5706],
    "Kalkaji Mandir": [77.2607, 28.5498],
    "Badarpur Border": [77.304, 28.4905],
    "Raja Nahar Singh": [77.316, 28.34],
    "Majlis Park": [77.182, 28.7244],
    "Punjabi Bagh West": [77.1421, 28.6703],
    Mayapuri: [77.1297, 28.6372],
    "Delhi Cantonment": [77.135, 28.5938],
    "Durgabai Deshmukh South Campus": [77.1691, 28.5894],
    Ashram: [77.2586, 28.5724],
    "Anand Vihar ISBT": [77.318, 28.6468],
    "Maujpur-Babarpur": [77.2796, 28.692],
    "Shiv Vihar": [77.289, 28.694],
    Munirka: [77.1711, 28.5549],
    "Okhla NSIC": [77.2648, 28.5545],
    "Jamia Millia Islamia": [77.2812, 28.5585],
    "Kalindi Kunj": [77.306, 28.5452],
    "Okhla Bird Sanctuary": [77.3216, 28.5529],
  };

  const TRAVEL = {
    earthRadiusM: 6371000,
    /** Live nav: fixed screen position for user icon — fraction of map height from top. */
    // Keep user marker in lower-center area like turn-by-turn apps.
    navUserScreenYFrac: 0.72,
    /** Zoom when live navigation starts; restored on stop. */
    // Street-level zoom for live navigation.
    liveNavZoom: 20,
    /** Consider destination reached when straight-line distance is within this radius. */
    navArrivalRadiusM: 40,
    /** If user drifts this far from selected route, trigger automatic reroute. */
    navOffRouteThresholdM: 55,
    /** Minimum time between automatic reroutes. */
    navAutoRerouteCooldownMs: 9000,
    /** Fallback proximity prompt radius for India Gate monument mode. */
    indiaGatePromptRadiusM: 150,
    /** Auto-clear active checkpoint when user is this close. */
    checkpointReachRadiusM: 35,
    /** Monument live reroute cadence while user is moving. */
    monumentRerouteEveryMs: 450,
    monumentRerouteMinMoveM: 1.5,
    /** Default Monument panel mode; context can override per entry. */
    monumentSimpleUi: false,
    /** India Gate Monument Mode entry area (hex) aligned with monument-internal.js. */
    indiaGatePromptHex: [
      { lat: 28.614673, lng: 77.22789 },
      { lat: 28.616196, lng: 77.231327 },
      { lat: 28.614349, lng: 77.234578 },
      { lat: 28.611091, lng: 77.234278 },
      { lat: 28.609525, lng: 77.23092 },
      { lat: 28.611309, lng: 77.227827 },
    ],
    /** ~4.8 km/h walking */
    walkMPerMin: 80,
    /** ~30 km/h effective city car speed (traffic + signals blended) */
    driveMPerMinCard: 500,
    /** ~18 km/h bicycle fallback (not 2W motorbike) */
    cycleMPerMin: 300,
    /** ~24 km/h first/last-mile car leg speed */
    driveMPerMinLeg: 400,
    /** ~32 km/h two-wheeler effective speed */
    twoWMPerMin: 533,
    /** Metro in-train effective speed */
    metroSpeedKmh: 33,
    /** Metro station wait/buffer (platform + access variability) */
    metroBaseWaitMin: 6,
    /** Per interchange penalty estimate */
    metroInterchangePenaltyMin: 4,
    minDirectDistForMetroM: 2000,
  };
  const MONUMENT_RATINGS_STORAGE_KEY = "safar_monument_ratings_v1";
  const UI_PREFS_STORAGE_KEY = "safar_ui_prefs_v1";

  function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
    const R = TRAVEL.earthRadiusM;
    const toR = (deg) => (deg * Math.PI) / 180;
    const dLat = toR(lat2 - lat1);
    const dLng = toR(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /** Approx local XY meters around lat0 for fast route progress calculations. */
  function toLocalMeters(lat, lng, lat0) {
    const kLat = 111320;
    const kLng = Math.cos((lat0 * Math.PI) / 180) * 111320;
    return { x: lng * kLng, y: lat * kLat };
  }

  /**
   * Returns distance to route + remaining route distance from projected point.
   * @param {[number, number]} pos [lat, lng]
   * @param {[number, number][]} coords route coords
   */
  function routeProgressEstimate(pos, coords) {
    if (!Array.isArray(coords) || coords.length < 2) return null;
    const lat0 = pos[0];
    const p = toLocalMeters(pos[0], pos[1], lat0);
    let best = { d: Infinity, segIdx: 0, t: 0 };
    for (let i = 1; i < coords.length; i++) {
      const aLL = coords[i - 1];
      const bLL = coords[i];
      const a = toLocalMeters(aLL[0], aLL[1], lat0);
      const b = toLocalMeters(bLL[0], bLL[1], lat0);
      const abx = b.x - a.x;
      const aby = b.y - a.y;
      const ab2 = abx * abx + aby * aby;
      const apx = p.x - a.x;
      const apy = p.y - a.y;
      const tRaw = ab2 > 0 ? (apx * abx + apy * aby) / ab2 : 0;
      const t = Math.max(0, Math.min(1, tRaw));
      const qx = a.x + abx * t;
      const qy = a.y + aby * t;
      const dx = p.x - qx;
      const dy = p.y - qy;
      const d = Math.hypot(dx, dy);
      if (d < best.d) best = { d, segIdx: i - 1, t };
    }

    let remainingM = 0;
    const segA = coords[best.segIdx];
    const segB = coords[best.segIdx + 1];
    const projected = [
      segA[0] + (segB[0] - segA[0]) * best.t,
      segA[1] + (segB[1] - segA[1]) * best.t,
    ];
    const segLen = haversineDistanceMeters(segA[0], segA[1], segB[0], segB[1]);
    remainingM += segLen * (1 - best.t);
    for (let i = best.segIdx + 2; i < coords.length; i++) {
      const a = coords[i - 1];
      const b = coords[i];
      remainingM += haversineDistanceMeters(a[0], a[1], b[0], b[1]);
    }
    return {
      distanceToRouteM: best.d,
      remainingM,
      segIdx: best.segIdx,
      segT: best.t,
      projected,
    };
  }

  /** Route-forward bearing (lookahead along selected path), so path stays toward screen top. */
  function routeForwardBearing(loc, coords, progress, lookaheadM = 120) {
    if (!Array.isArray(coords) || coords.length < 2 || !progress) return null;
    let remaining = Math.max(1, lookaheadM);
    let cursor = progress.projected || loc;
    let idx = progress.segIdx ?? 0;
    while (idx < coords.length - 1 && remaining > 0) {
      const a = cursor;
      const b = coords[idx + 1];
      const seg = haversineDistanceMeters(a[0], a[1], b[0], b[1]);
      if (seg <= remaining) {
        remaining -= seg;
        cursor = b;
        idx += 1;
        continue;
      }
      const t = remaining / Math.max(seg, 0.001);
      cursor = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      remaining = 0;
      break;
    }
    return bearingDegrees(loc[0], loc[1], cursor[0], cursor[1]);
  }

  /** Ray-casting point in polygon test for [{lat,lng}, ...] vertices. */
  function isPointInsidePolygon(lat, lng, polygon) {
    if (!Array.isArray(polygon) || polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;
      const intersects =
        yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  /** Initial bearing from (lat1,lng1) toward (lat2,lng2), degrees 0–360 clockwise from north. */
  function bearingDegrees(lat1, lng1, lat2, lng2) {
    const toR = (deg) => (deg * Math.PI) / 180;
    const φ1 = toR(lat1);
    const φ2 = toR(lat2);
    const Δλ = toR(lng2 - lng1);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
  }

  function lerpAngleDegrees(from, to, t) {
    let d = ((to - from + 540) % 360) - 180;
    return (from + d * t + 360) % 360;
  }

  function isLiveNavigationActive() {
    return state.liveNavWatchId != null && state.navUiCompact;
  }

  /** Reuse original app monument geofence prompt/data flow when available. */
  function notifyMonumentModeUserPosition(lat, lng) {
    if (
      typeof window !== "undefined" &&
      window.CHMonumentMode &&
      typeof window.CHMonumentMode.onUserPosition === "function"
    ) {
      try {
        window.CHMonumentMode.onUserPosition(lat, lng);
      } catch (_e) {
        /* ignore */
      }
    }
    maybePromptIndiaGateMonumentMode(lat, lng);
    maybeAutoClearCheckpoint(lat, lng);
    maybeRefreshMonumentRouteRealtime(lat, lng);
    enforceMonumentGeofence(lat, lng);
  }

  function enforceMonumentGeofence(lat, lng) {
    if (!isTourOverlayOpen()) return;
    const insideHex = isPointInsidePolygon(lat, lng, TRAVEL.indiaGatePromptHex);
    if (insideHex) return;
    dismissRouteOverlay();
    exitTourMode();
    showToast("You left the monument area. Monument Mode closed.");
  }

  function isTourOverlayOpen() {
    const t = el("tour-overlay");
    return !!t && !t.classList.contains("hidden");
  }

  function checkpointDistanceLabel(cp) {
    if (!cp || !isFinite(cp.distanceM)) return "";
    return cp.distanceM >= 1000
      ? `${(cp.distanceM / 1000).toFixed(2)} km away`
      : `${Math.round(cp.distanceM)} m away`;
  }

  function updateCheckpointDistances(lat, lng) {
    state.checkpoints.forEach((cp) => {
      if (cp.lat == null || cp.lng == null) {
        cp.distanceM = Infinity;
        return;
      }
      cp.distanceM = haversineDistanceMeters(lat, lng, cp.lat, cp.lng);
    });
  }

  function syncActiveCheckpoint() {
    const candidates = state.checkpoints.filter((c) => c.status !== "done");
    if (!candidates.length) return;
    let nearest = candidates[0];
    candidates.forEach((c) => {
      if ((c.distanceM ?? Infinity) < (nearest.distanceM ?? Infinity)) nearest = c;
    });
    state.checkpoints.forEach((c) => {
      if (c.status === "done") return;
      c.status = c.id === nearest.id ? "active" : "pending";
    });
  }

  function loadMonumentRatingsStore() {
    try {
      const raw = window.localStorage.getItem(MONUMENT_RATINGS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_e) {
      return {};
    }
  }

  function loadUiPrefs() {
    try {
      const raw = window.localStorage.getItem(UI_PREFS_STORAGE_KEY);
      const p = raw ? JSON.parse(raw) : {};
      if (p && typeof p === "object") {
        if (p.darkUi === true || p.darkUi === false) state.darkUi = p.darkUi;
        if (p.mapStyle === "default" || p.mapStyle === "satellite") state.mapStyle = p.mapStyle;
      }
    } catch (_e) {
      /* ignore */
    }
  }

  function saveUiPrefs() {
    try {
      window.localStorage.setItem(
        UI_PREFS_STORAGE_KEY,
        JSON.stringify({ darkUi: !!state.darkUi, mapStyle: state.mapStyle })
      );
    } catch (_e) {
      /* ignore */
    }
  }

  function applyDarkUiTheme() {
    // Dark mode currently controls map tiles only.
    document.body.classList.remove("dark-ui");
  }

  function saveMonumentRatingsStore(store) {
    try {
      window.localStorage.setItem(MONUMENT_RATINGS_STORAGE_KEY, JSON.stringify(store || {}));
    } catch (_e) {
      /* ignore */
    }
  }

  function applyMonumentRatingsToPlaces() {
    const store = loadMonumentRatingsStore();
    state.places.forEach((place) => {
      const rec = store[place.slug];
      const count = Number(rec?.count || 0);
      const sum = Number(rec?.sum || 0);
      if (count > 0 && sum > 0) {
        place.rating = (sum / count).toFixed(1);
        place.reviews = count;
      } else {
        place.rating = "Unrated";
        place.reviews = 0;
      }
    });
  }

  function setMonumentRatingCardVisible(visible) {
    const card = el("monument-rating-card");
    if (!card) return;
    card.classList.toggle("hidden", !visible);
    card.classList.toggle("flex", !!visible);
  }

  function maybePromptMonumentRating() {
    if (state.monumentRatingPromptShown) return;
    const slug = state.monumentTourPlaceSlug || "india_gate";
    const store = loadMonumentRatingsStore();
    if (store[slug]?.ratedOnDevice) return;
    const allDone = state.checkpoints.length > 0 && state.checkpoints.every((c) => c.status === "done");
    if (!allDone) return;
    state.monumentRatingPromptShown = true;
    setMonumentRatingCardVisible(true);
  }

  function submitMonumentRating(value) {
    const rating = Number(value);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return;
    const slug = state.monumentTourPlaceSlug || "india_gate";
    const store = loadMonumentRatingsStore();
    if (store[slug]?.ratedOnDevice) {
      setMonumentRatingCardVisible(false);
      showToast("You have already rated this monument on this device.");
      return;
    }
    const rec = store[slug] || { sum: 0, count: 0 };
    rec.sum = Number(rec.sum || 0) + rating;
    rec.count = Number(rec.count || 0) + 1;
    rec.ratedOnDevice = true;
    store[slug] = rec;
    saveMonumentRatingsStore(store);
    applyMonumentRatingsToPlaces();
    const place = state.places.find((p) => p.slug === slug);
    if (place) applyExploreDetailPlace(place);
    renderParisList(el("explore-search")?.value || "");
    setMonumentRatingCardVisible(false);
    showToast("Thanks for rating this monument.");
  }

  function completeCheckpoint(cp) {
    if (!cp || cp.status === "done") return false;
    cp.status = "done";
    syncActiveCheckpoint();
    if (isTourOverlayOpen()) renderTourPanel();
    maybePromptMonumentRating();
    showToast(`Checkpoint unlocked: ${cp.name}`);
    return true;
  }

  function buildCheckpointRouteDestination(cp) {
    if (!cp) return null;
    return {
      id: cp.id,
      slug: `india_gate_cp_${cp.id}`,
      name: cp.name,
      lat: cp.lat,
      lng: cp.lng,
      isMonumentCheckpoint: true,
    };
  }

  function routeToCheckpoint(cpId) {
    const cp = state.checkpoints.find((c) => c.id === cpId);
    if (!cp || cp.lat == null || cp.lng == null) return;
    const dest = buildCheckpointRouteDestination(cp);
    if (!dest) return;
    state.activePlace = dest;
    state.navUiCompact = false;
    state.navRouteMode = "walk";
    syncNavModeButtons();
    setExplorePanelVisible(true);
    syncNavBannerPlanningChrome();
    state.monumentRoutingTargetId = cp.id;
    state.monumentLastRerouteMs = Date.now();
    state.monumentLastRouteFrom = userLatLng().slice();
    beginMonumentPathRouting(cp, { fitBounds: true });
    showToast(`Routing to ${cp.name}`);
  }

  function maybeRefreshMonumentRouteRealtime(lat, lng) {
    if (!isTourOverlayOpen()) return;
    if (!state.monumentRoutingTargetId) return;
    const cp = state.checkpoints.find((c) => c.id === state.monumentRoutingTargetId);
    if (!cp || cp.status === "done") return;
    const now = Date.now();
    if (now - state.monumentLastRerouteMs < TRAVEL.monumentRerouteEveryMs) return;
    if (Array.isArray(state.monumentLastRouteFrom) && state.monumentLastRouteFrom.length === 2) {
      const moved = haversineDistanceMeters(
        state.monumentLastRouteFrom[0],
        state.monumentLastRouteFrom[1],
        lat,
        lng
      );
      if (moved < TRAVEL.monumentRerouteMinMoveM) return;
    }
    state.monumentLastRerouteMs = now;
    state.monumentLastRouteFrom = [lat, lng];
    beginMonumentPathRouting(cp, { fitBounds: false });
  }

  function clearMonumentRouteLayer() {
    if (state.monumentRouteLayer && state.map) {
      try {
        state.map.removeLayer(state.monumentRouteLayer);
      } catch (_e) {
        /* ignore */
      }
      state.monumentRouteLayer = null;
    }
  }

  function drawMonumentBasePathLayer() {
    if (!state.map) return;
    if (state.monumentBasePathLayer) return;
    const g = L.layerGroup().addTo(state.map);
    state.monumentBasePathLayer = g;
    INDIA_GATE_BASE_PATHWAYS.forEach((pw) => {
      const pts = pw.latlngs || [];
      if (pts.length < 2) return;
      g.addLayer(
        L.polyline(pts, {
          color: "#ffffff",
          weight: 7,
          opacity: 0.55,
          lineCap: "round",
          lineJoin: "round",
        })
      );
      g.addLayer(
        L.polyline(pts, {
          color: "#94a3b8",
          weight: 3.5,
          opacity: 0.85,
          dashArray: "2, 7",
          lineCap: "round",
          lineJoin: "round",
        })
      );
    });
  }

  function clearMonumentBasePathLayer() {
    if (state.monumentBasePathLayer && state.map) {
      try {
        state.map.removeLayer(state.monumentBasePathLayer);
      } catch (_e) {
        /* ignore */
      }
      state.monumentBasePathLayer = null;
    }
  }

  function drawMonumentQrMarkers() {
    if (!state.map) return;
    if (state.monumentQrLayer) return;
    const g = L.layerGroup().addTo(state.map);
    state.monumentQrLayer = g;
    refreshMonumentQrMarkers(userLatLng()[0], userLatLng()[1]);
  }

  function refreshMonumentQrMarkers(lat, lng) {
    if (!state.map || !state.monumentQrLayer) return;
    const g = state.monumentQrLayer;
    try {
      g.clearLayers();
    } catch (_e) {
      /* ignore */
    }
    const checkpointsById = {};
    state.checkpoints.forEach((cp) => {
      checkpointsById[cp.id] = cp;
    });
    const pendingIdsByDistance = state.checkpoints
      .filter((cp) => cp.status !== "done")
      .map((cp) => ({
        id: cp.id,
        d: cp.lat != null && cp.lng != null ? haversineDistanceMeters(lat, lng, cp.lat, cp.lng) : Infinity,
      }))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.id);
    const rankById = {};
    pendingIdsByDistance.forEach((id, idx) => {
      rankById[id] = idx + 1;
    });
    const showNumbering =
      isTourOverlayOpen() &&
      !state.monumentSimpleUiActive &&
      isPointInsidePolygon(lat, lng, TRAVEL.indiaGatePromptHex);
    Object.keys(INDIA_GATE_CHECKPOINT_NODES).forEach((id) => {
      const node = INDIA_GATE_CHECKPOINT_NODES[id];
      const cp = checkpointsById[id];
      const label = cp ? cp.name : node.name;
      const order = rankById[id] || "";
      const isDone = cp?.status === "done";
      const badgeHtml =
        showNumbering && isDone
          ? `<div style="width:16px;height:16px;min-width:16px;min-height:16px;border-radius:9999px;background:#16a34a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;line-height:1;">✓</div>`
          : showNumbering
            ? `<div style="width:16px;height:16px;min-width:16px;min-height:16px;border-radius:9999px;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;line-height:1;">${order}</div>`
            : "";
      const marker = L.marker([node.lat, node.lng], {
        icon: L.divIcon({
          className: "custom-marker-icon",
          html: `<div class="flex items-center gap-1.5 rounded-lg bg-white/95 px-2 py-1 shadow ring-1 ring-slate-300">
                   ${badgeHtml}
                   <iconify-icon icon="solar:qr-code-linear" class="text-[11px] text-slate-700"></iconify-icon>
                   <span class="max-w-[95px] truncate text-[9px] font-semibold text-slate-800">${escapeHtml(label)}</span>
                 </div>`,
          iconSize: [showNumbering ? 125 : 104, 22],
          iconAnchor: [10, 11],
        }),
        zIndexOffset: 800,
      });
      marker.addTo(g);
    });
  }

  function clearMonumentQrMarkers() {
    if (state.monumentQrLayer && state.map) {
      try {
        state.map.removeLayer(state.monumentQrLayer);
      } catch (_e) {
        /* ignore */
      }
      state.monumentQrLayer = null;
    }
  }

  function pathwayPointKey(lat, lng) {
    return `${lat.toFixed(6)}|${lng.toFixed(6)}`;
  }

  function normalizedPathwayLatLngs(pathway) {
    const pts = Array.isArray(pathway?.latlngs) ? pathway.latlngs.slice() : [];
    if (!pts.length) return [];
    if (pathway.closed && pts.length >= 2) {
      const f = pts[0];
      const l = pts[pts.length - 1];
      if (Math.abs(f[0] - l[0]) < 1e-8 && Math.abs(f[1] - l[1]) < 1e-8) return pts.slice(0, -1);
    }
    return pts;
  }

  function buildMonumentPathGraph() {
    /** @type {Map<string, {lat:number,lng:number,edges:Array<{to:string,meters:number}>}>} */
    const nodes = new Map();
    const addEdge = (a, b, pathwayName) => {
      const ka = pathwayPointKey(a[0], a[1]);
      const kb = pathwayPointKey(b[0], b[1]);
      if (!nodes.has(ka)) nodes.set(ka, { lat: a[0], lng: a[1], edges: [] });
      if (!nodes.has(kb)) nodes.set(kb, { lat: b[0], lng: b[1], edges: [] });
      const m = haversineDistanceMeters(a[0], a[1], b[0], b[1]);
      nodes.get(ka).edges.push({ to: kb, meters: m, pathwayName: pathwayName || "monument path" });
      nodes.get(kb).edges.push({ to: ka, meters: m, pathwayName: pathwayName || "monument path" });
    };
    INDIA_GATE_BASE_PATHWAYS.forEach((pw) => {
      const pts = normalizedPathwayLatLngs(pw);
      if (pts.length < 2) return;
      for (let i = 1; i < pts.length; i++) addEdge(pts[i - 1], pts[i], pw.name || pw.id);
      if (pw.closed) addEdge(pts[pts.length - 1], pts[0], pw.name || pw.id);
    });
    return nodes;
  }

  function nearestGraphNodeKey(nodes, lat, lng) {
    let bestKey = null;
    let bestM = Infinity;
    nodes.forEach((node, key) => {
      const d = haversineDistanceMeters(lat, lng, node.lat, node.lng);
      if (d < bestM) {
        bestM = d;
        bestKey = key;
      }
    });
    return bestKey;
  }

  function closestPointOnSegmentLatLng(p, a, b) {
    const vx = b[0] - a[0];
    const vy = b[1] - a[1];
    const wx = p[0] - a[0];
    const wy = p[1] - a[1];
    const c2 = vx * vx + vy * vy;
    if (c2 < 1e-22) return [a[0], a[1]];
    let t = (vx * wx + vy * wy) / c2;
    t = Math.max(0, Math.min(1, t));
    return [a[0] + t * vx, a[1] + t * vy];
  }

  function buildMonumentPathSegments() {
    const segs = [];
    INDIA_GATE_BASE_PATHWAYS.forEach((pw) => {
      const pts = normalizedPathwayLatLngs(pw);
      if (pts.length < 2) return;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        segs.push({
          a,
          b,
          aKey: pathwayPointKey(a[0], a[1]),
          bKey: pathwayPointKey(b[0], b[1]),
        });
      }
      if (pw.closed) {
        const a = pts[pts.length - 1];
        const b = pts[0];
        segs.push({
          a,
          b,
          aKey: pathwayPointKey(a[0], a[1]),
          bKey: pathwayPointKey(b[0], b[1]),
        });
      }
    });
    return segs;
  }

  function findNearestPathSnap(lat, lng) {
    const p = [lat, lng];
    const segs = buildMonumentPathSegments();
    let best = null;
    let bestM = Infinity;
    segs.forEach((s) => {
      const c = closestPointOnSegmentLatLng(p, s.a, s.b);
      const d = haversineDistanceMeters(lat, lng, c[0], c[1]);
      if (d < bestM) {
        bestM = d;
        best = { point: c, segment: s, meters: d };
      }
    });
    return best;
  }

  function addUndirectedEdge(nodes, fromKey, toKey, meters, pathwayName) {
    if (!nodes.has(fromKey) || !nodes.has(toKey)) return;
    const nm = pathwayName || "path connector";
    nodes.get(fromKey).edges.push({ to: toKey, meters, pathwayName: nm });
    nodes.get(toKey).edges.push({ to: fromKey, meters, pathwayName: nm });
  }

  function attachSnapNode(nodes, nodeKey, snap) {
    if (!snap || !snap.segment) return;
    const pt = snap.point;
    nodes.set(nodeKey, { lat: pt[0], lng: pt[1], edges: [] });
    const dA = haversineDistanceMeters(pt[0], pt[1], snap.segment.a[0], snap.segment.a[1]);
    const dB = haversineDistanceMeters(pt[0], pt[1], snap.segment.b[0], snap.segment.b[1]);
    addUndirectedEdge(nodes, nodeKey, snap.segment.aKey, dA, "path connector");
    addUndirectedEdge(nodes, nodeKey, snap.segment.bKey, dB, "path connector");
  }

  function shortestPathKeys(nodes, startKey, endKey) {
    if (!startKey || !endKey || !nodes.has(startKey) || !nodes.has(endKey)) return [];
    if (startKey === endKey) return [startKey];
    const dist = new Map();
    const prev = new Map();
    const unvisited = new Set(nodes.keys());
    nodes.forEach((_v, k) => dist.set(k, Infinity));
    dist.set(startKey, 0);

    while (unvisited.size) {
      let u = null;
      let best = Infinity;
      unvisited.forEach((k) => {
        const d = dist.get(k) ?? Infinity;
        if (d < best) {
          best = d;
          u = k;
        }
      });
      if (u == null || best === Infinity) break;
      unvisited.delete(u);
      if (u === endKey) break;
      const node = nodes.get(u);
      node.edges.forEach((e) => {
        if (!unvisited.has(e.to)) return;
        const alt = best + e.meters;
        if (alt < (dist.get(e.to) ?? Infinity)) {
          dist.set(e.to, alt);
          prev.set(e.to, u);
        }
      });
    }

    if (!prev.has(endKey) && startKey !== endKey) return [];
    const path = [];
    let cur = endKey;
    path.push(cur);
    while (prev.has(cur)) {
      cur = prev.get(cur);
      path.push(cur);
      if (cur === startKey) break;
    }
    path.reverse();
    return path;
  }

  function polylineDistanceMeters(latlngs) {
    if (!Array.isArray(latlngs) || latlngs.length < 2) return 0;
    let m = 0;
    for (let i = 1; i < latlngs.length; i++) {
      m += haversineDistanceMeters(
        latlngs[i - 1][0],
        latlngs[i - 1][1],
        latlngs[i][0],
        latlngs[i][1]
      );
    }
    return m;
  }

  function compactDistanceMeters(meters) {
    if (!isFinite(meters)) return "0 m";
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${Math.max(1, Math.round(meters))} m`;
  }

  function turnTokenFromDelta(deltaDeg) {
    const a = Math.abs(deltaDeg);
    if (a < 20) return { icon: "⬆", text: "Move straight" };
    if (deltaDeg > 0 && a < 55) return { icon: "↗", text: "Slight right" };
    if (deltaDeg < 0 && a < 55) return { icon: "↖", text: "Slight left" };
    if (deltaDeg > 0 && a < 130) return { icon: "➡", text: "Turn right" };
    if (deltaDeg < 0 && a < 130) return { icon: "⬅", text: "Turn left" };
    if (deltaDeg > 0) return { icon: "⤵", text: "Sharp right" };
    return { icon: "⤴", text: "Sharp left" };
  }

  function simplifyRouteForDirections(latlngs, minStepM = 12) {
    if (!Array.isArray(latlngs) || latlngs.length < 2) return latlngs || [];
    const out = [latlngs[0]];
    for (let i = 1; i < latlngs.length - 1; i++) {
      const prev = out[out.length - 1];
      const cur = latlngs[i];
      const d = haversineDistanceMeters(prev[0], prev[1], cur[0], cur[1]);
      if (d >= minStepM) out.push(cur);
    }
    out.push(latlngs[latlngs.length - 1]);
    return out;
  }

  function buildMonumentTurnPhrasesFromSegments(segments, destinationName) {
    if (!Array.isArray(segments) || !segments.length) {
      return [`⬆ Move straight to ${destinationName}`];
    }
    const steps = [];
    let prevBearing = null;
    let current = null;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const segM = seg.meters;
      if (segM < 2) continue;
      const brg = seg.bearing;
      let token = { icon: "⬆", text: "Move straight" };
      if (prevBearing != null) {
        const delta = ((brg - prevBearing + 540) % 360) - 180;
        token = turnTokenFromDelta(delta);
      }
      const stepName = seg.pathwayName || "this path";
      if (!current || current.text !== token.text || current.pathwayName !== stepName) {
        if (current) steps.push(current);
        current = { icon: token.icon, text: token.text, meters: segM, pathwayName: stepName };
      } else {
        current.meters += segM;
      }
      prevBearing = brg;
    }
    if (current) steps.push(current);
    if (!steps.length) return [`⬆ Move straight to ${destinationName}`];

    const phrases = steps.map(
      (s) => `${s.icon} ${s.text} on ${s.pathwayName} for ${compactDistanceMeters(s.meters)}`
    );
    phrases.push(`📍 Reach ${destinationName}`);
    return phrases;
  }

  function routeSegmentsFromPathKeys(nodes, pathKeys) {
    const out = [];
    if (!Array.isArray(pathKeys) || pathKeys.length < 2) return out;
    for (let i = 1; i < pathKeys.length; i++) {
      const fromKey = pathKeys[i - 1];
      const toKey = pathKeys[i];
      const fromNode = nodes.get(fromKey);
      const toNode = nodes.get(toKey);
      if (!fromNode || !toNode) continue;
      const edge = (fromNode.edges || []).find((e) => e.to === toKey);
      const meters =
        edge?.meters ?? haversineDistanceMeters(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng);
      out.push({
        meters,
        pathwayName: edge?.pathwayName || "this path",
        bearing: bearingDegrees(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng),
      });
    }
    return out;
  }

  function beginMonumentPathRouting(cp, opts) {
    const options = Object.assign({ fitBounds: true }, opts || {});
    if (!state.map || !cp) return;
    const from = userLatLng();
    const graph = buildMonumentPathGraph();
    const startSnap = findNearestPathSnap(from[0], from[1]);
    const endSnap = findNearestPathSnap(cp.lat, cp.lng);
    if (startSnap) attachSnapNode(graph, "__start_snap__", startSnap);
    if (endSnap) attachSnapNode(graph, "__end_snap__", endSnap);
    const startKey = startSnap ? "__start_snap__" : nearestGraphNodeKey(graph, from[0], from[1]);
    const endKey = endSnap ? "__end_snap__" : nearestGraphNodeKey(graph, cp.lat, cp.lng);
    const pathKeys = shortestPathKeys(graph, startKey, endKey);
    const core =
      pathKeys.length >= 2
        ? pathKeys.map((k) => {
            const n = graph.get(k);
            return [n.lat, n.lng];
          })
        : [[cp.lat, cp.lng]];
    const startNode = startKey && graph.get(startKey);
    const endNode = endKey && graph.get(endKey);
    const toNearest = startNode ? [from, [startNode.lat, startNode.lng]] : [from];
    const fromPathToTarget =
      endNode && (Math.abs(endNode.lat - cp.lat) > 1e-7 || Math.abs(endNode.lng - cp.lng) > 1e-7)
        ? [
            [endNode.lat, endNode.lng],
            [cp.lat, cp.lng],
          ]
        : [];
    clearRoutingMachine();
    clearMetroNavLayers();
    if (state.activeRoute) {
      try {
        state.map.removeLayer(state.activeRoute);
      } catch (_e) {
        /* ignore */
      }
      state.activeRoute = null;
    }
    clearMonumentRouteLayer();
    const g = L.layerGroup().addTo(state.map);
    state.monumentRouteLayer = g;
    if (toNearest.length >= 2) {
      g.addLayer(
        L.polyline(toNearest, {
          color: "#64748b",
          weight: 5,
          opacity: 0.85,
          dashArray: "10 10",
          lineCap: "round",
          lineJoin: "round",
        })
      );
    }
    g.addLayer(
      L.polyline(core, {
        color: "#ffffff",
        weight: 11,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      })
    );
    g.addLayer(
      L.polyline(core, {
        color: "#f97316",
        weight: 7,
        opacity: 0.98,
        lineCap: "round",
        lineJoin: "round",
      })
    );
    if (fromPathToTarget.length >= 2) {
      g.addLayer(
        L.polyline(fromPathToTarget, {
          color: "#64748b",
          weight: 5,
          opacity: 0.85,
          dashArray: "10 10",
          lineCap: "round",
          lineJoin: "round",
        })
      );
    }
    const routeStart = core[0] || from;
    const routeEnd = core[core.length - 1] || [cp.lat, cp.lng];
    g.addLayer(
      L.circleMarker(routeStart, {
        radius: 6,
        color: "#ffffff",
        weight: 2,
        fillColor: "#2563eb",
        fillOpacity: 0.95,
      })
    );
    g.addLayer(
      L.circleMarker(routeEnd, {
        radius: 6,
        color: "#ffffff",
        weight: 2,
        fillColor: "#16a34a",
        fillOpacity: 0.95,
      })
    );
    const full = toNearest.concat(core).concat(fromPathToTarget);
    if (options.fitBounds) {
      state.map.fitBounds(L.latLngBounds(full), { padding: [50, 50] });
    }
    if (state.liveNavWatchId != null) {
      lockUserIconToScreenAnchor(state.map, userLatLng(), TRAVEL.navUserScreenYFrac);
      scheduleLiveNavIconAnchorAfterMove();
    }
    const approxM =
      polylineDistanceMeters(toNearest) +
      polylineDistanceMeters(core) +
      polylineDistanceMeters(fromPathToTarget);
    const navStats = el("nav-stats");
    if (navStats) {
      navStats.textContent = `~${(approxM / 1000).toFixed(2)} km · monument pathway`;
    }
    const navTarget = el("nav-target");
    if (navTarget) navTarget.textContent = cp.name;
    const navBanner = el("nav-banner");
    if (navBanner) navBanner.classList.remove("-translate-y-[150%]");
    const stepSegments = routeSegmentsFromPathKeys(graph, pathKeys);
    state.navLastDirectionPhrases = buildMonumentTurnPhrasesFromSegments(stepSegments, cp.name);
    if (state.navUiCompact) applyNavDirectionsPhrases(state.navLastDirectionPhrases);
    state.navArrivalHandledPlaceSlug = null;
  }

  function maybeAutoClearCheckpoint(lat, lng) {
    if (!isTourOverlayOpen()) return;
    if (!state.activePlace || !isIndiaGate(state.activePlace)) return;
    updateCheckpointDistances(lat, lng);
    syncActiveCheckpoint();
    refreshMonumentQrMarkers(lat, lng);
    renderTourPanel();
    const active = state.checkpoints.find((c) => c.status === "active");
    if (!active || active.lat == null || active.lng == null) return;
    const d = haversineDistanceMeters(lat, lng, active.lat, active.lng);
    if (d <= TRAVEL.checkpointReachRadiusM) completeCheckpoint(active);
  }

  function enableMonumentMapMaskAndZoomLock() {
    if (!state.map) return;
    if (!state.map.getPane("monument-mask-pane")) {
      state.map.createPane("monument-mask-pane");
      state.map.getPane("monument-mask-pane").style.zIndex = "420";
      state.map.getPane("monument-mask-pane").style.pointerEvents = "none";
    }
    const hex = TRAVEL.indiaGatePromptHex.map((p) => [p.lat, p.lng]);
    if (!state.monumentMaskOutside) {
      const outer = [
        [90, -180],
        [90, 180],
        [-90, 180],
        [-90, -180],
      ];
      state.monumentMaskOutside = L.polygon([outer, hex], {
        pane: "monument-mask-pane",
        stroke: false,
        fillColor: "#0f172a",
        fillOpacity: 0.58,
      }).addTo(state.map);
    }
    if (!state.monumentMaskInside) {
      state.monumentMaskInside = L.polygon(hex, {
        pane: "monument-mask-pane",
        color: "#38bdf8",
        weight: 1.5,
        opacity: 0.75,
        fillColor: "#ffffff",
        fillOpacity: 0.08,
      }).addTo(state.map);
    }
    if (state.monumentPrevMinZoom == null) state.monumentPrevMinZoom = state.map.getMinZoom();
    const hexBounds = L.latLngBounds(hex);
    const sz = state.map.getSize();
    const verticalPadPx = Math.max(12, Math.round(sz.y * 0.06));
    const horizontalPadPx = Math.max(12, Math.round(sz.x * 0.05));
    const leftCardOffsetPx =
      typeof window !== "undefined" && window.innerWidth >= 768 ? 420 : 0;
    const leftPadPx = horizontalPadPx + leftCardOffsetPx;
    try {
      state.map.fitBounds(hexBounds, {
        animate: true,
        duration: 0.7,
        paddingTopLeft: [leftPadPx, verticalPadPx],
        paddingBottomRight: [horizontalPadPx, verticalPadPx],
        maxZoom: 19,
      });
    } catch (_e) {
      /* ignore */
    }
    state.map.once("moveend", () => {
      if (!state.map) return;
      const lockMin = state.map.getZoom();
      state.map.setMinZoom(lockMin);
      try {
        state.map.setMaxZoom(19);
      } catch (_e) {
        /* ignore */
      }
      try {
        state.map.setMaxBounds(state.map.getBounds());
        state.map.options.maxBoundsViscosity = 1.0;
      } catch (_e) {
        /* ignore */
      }
    });
    if (state.monumentPrevMaxBoundsViscosity == null) {
      state.monumentPrevMaxBoundsViscosity = state.map.options.maxBoundsViscosity ?? 0;
    }
    if (state.monumentInteractionLock) {
      if (state.map.dragging && !state.map.dragging.enabled()) state.map.dragging.enable();
      if (state.map.touchZoom && !state.map.touchZoom.enabled()) state.map.touchZoom.enable();
      if (state.map.scrollWheelZoom && !state.map.scrollWheelZoom.enabled()) state.map.scrollWheelZoom.enable();
      if (state.map.doubleClickZoom && !state.map.doubleClickZoom.enabled()) state.map.doubleClickZoom.enable();
      if (state.map.boxZoom && !state.map.boxZoom.enabled()) state.map.boxZoom.enable();
      if (state.map.keyboard && !state.map.keyboard.enabled()) state.map.keyboard.enable();
      state.monumentInteractionLock = false;
    }
  }

  function disableMonumentMapMaskAndZoomLock() {
    if (!state.map) return;
    if (state.monumentMaskOutside) {
      try {
        state.map.removeLayer(state.monumentMaskOutside);
      } catch (_e) {
        /* ignore */
      }
      state.monumentMaskOutside = null;
    }
    if (state.monumentMaskInside) {
      try {
        state.map.removeLayer(state.monumentMaskInside);
      } catch (_e) {
        /* ignore */
      }
      state.monumentMaskInside = null;
    }
    const prev = state.monumentPrevMinZoom;
    state.monumentPrevMinZoom = null;
    if (prev != null) {
      try {
        state.map.setMinZoom(prev);
      } catch (_e) {
        /* ignore */
      }
    }
    try {
      state.map.setMaxZoom(19);
    } catch (_e) {
      /* ignore */
    }
    try {
      state.map.setMaxBounds(null);
      state.map.options.maxBoundsViscosity = state.monumentPrevMaxBoundsViscosity ?? 0;
    } catch (_e) {
      /* ignore */
    }
    state.monumentPrevMaxBoundsViscosity = null;
    if (state.monumentInteractionLock) {
      if (state.map.dragging && !state.map.dragging.enabled()) state.map.dragging.enable();
      if (state.map.touchZoom && !state.map.touchZoom.enabled()) state.map.touchZoom.enable();
      if (state.map.scrollWheelZoom && !state.map.scrollWheelZoom.enabled()) state.map.scrollWheelZoom.enable();
      if (state.map.doubleClickZoom && !state.map.doubleClickZoom.enabled()) state.map.doubleClickZoom.enable();
      if (state.map.boxZoom && !state.map.boxZoom.enabled()) state.map.boxZoom.enable();
      if (state.map.keyboard && !state.map.keyboard.enabled()) state.map.keyboard.enable();
      state.monumentInteractionLock = false;
    }
  }

  /** Zoom after entering live nav: at least `liveNavZoom`, or closer if user was already zoomed in. */
  function liveNavigationTargetZoom() {
    const floor = TRAVEL.liveNavZoom;
    if (state.navPreLiveZoom == null) return floor;
    return Math.max(state.navPreLiveZoom, floor);
  }

  /** Pan map so `loc` stays at a fixed screen anchor (instant; no drift between GPS fixes). */
  function lockUserIconToScreenAnchor(map, loc, screenYFrac) {
    if (!map || !loc || loc.length < 2) return;
    const sz = map.getSize();
    if (!sz.x || !sz.y) return;
    const anchor = L.point(sz.x / 2, sz.y * screenYFrac);
    let pt;
    try {
      pt = map.latLngToContainerPoint(loc);
    } catch (_e) {
      return;
    }
    const d = anchor.subtract(pt);
    if (Math.abs(d.x) < 0.2 && Math.abs(d.y) < 0.2) return;
    try {
      map.panBy(d, { animate: false });
    } catch (_e) {
      /* ignore */
    }
  }

  function scheduleLiveNavIconAnchorAfterMove() {
    if (!state.map || !isLiveNavigationActive()) return;
    state.map.once("moveend", () => {
      if (state.map) {
        lockUserIconToScreenAnchor(state.map, userLatLng(), TRAVEL.navUserScreenYFrac);
      }
    });
  }

  function resetMapNorthUp() {
    state.navSmoothedBearing = null;
    state.navPrevGpsForBearing = null;
    if (state.map && typeof state.map.setBearing === "function") {
      try {
        state.map.setBearing(0);
      } catch (_e) {
        /* ignore */
      }
    }
  }

  function setLiveNavMapControlsLock(enabled) {
    if (!state.map) return;
    const m = state.map;
    if (enabled) {
      if (!state.liveNavMapControlsLocked) {
        state.liveNavPrevMapControlState = {
          dragging: !!(m.dragging && m.dragging.enabled()),
          touchZoom: !!(m.touchZoom && m.touchZoom.enabled()),
          scrollWheelZoom: !!(m.scrollWheelZoom && m.scrollWheelZoom.enabled()),
          doubleClickZoom: !!(m.doubleClickZoom && m.doubleClickZoom.enabled()),
          boxZoom: !!(m.boxZoom && m.boxZoom.enabled()),
          keyboard: !!(m.keyboard && m.keyboard.enabled()),
        };
      }
      if (m.dragging) m.dragging.disable();
      if (m.touchZoom) m.touchZoom.disable();
      if (m.scrollWheelZoom) m.scrollWheelZoom.disable();
      if (m.doubleClickZoom) m.doubleClickZoom.disable();
      if (m.boxZoom) m.boxZoom.disable();
      if (m.keyboard) m.keyboard.disable();
      state.liveNavMapControlsLocked = true;
      return;
    }

    const prev = state.liveNavPrevMapControlState || {};
    if (m.dragging && prev.dragging) m.dragging.enable();
    if (m.touchZoom && prev.touchZoom) m.touchZoom.enable();
    if (m.scrollWheelZoom && prev.scrollWheelZoom) m.scrollWheelZoom.enable();
    if (m.doubleClickZoom && prev.doubleClickZoom) m.doubleClickZoom.enable();
    if (m.boxZoom && prev.boxZoom) m.boxZoom.enable();
    if (m.keyboard && prev.keyboard) m.keyboard.enable();
    state.liveNavMapControlsLocked = false;
    state.liveNavPrevMapControlState = null;
  }

  function setLiveNavAnchorLoop(enabled) {
    if (enabled) {
      if (state.liveNavAnchorIntervalId != null) return;
      state.liveNavAnchorIntervalId = window.setInterval(() => {
        if (!isLiveNavigationActive() || !state.map) return;
        try {
          const z = liveNavigationTargetZoom();
          state.map.setView(userLatLng(), z, { animate: false });
          lockUserIconToScreenAnchor(state.map, userLatLng(), TRAVEL.navUserScreenYFrac);
        } catch (_e) {
          /* ignore */
        }
      }, 220);
      return;
    }
    if (state.liveNavAnchorIntervalId != null) {
      try {
        window.clearInterval(state.liveNavAnchorIntervalId);
      } catch (_e) {
        /* ignore */
      }
      state.liveNavAnchorIntervalId = null;
    }
  }

  function formatDistanceMeters(meters) {
    if (!isFinite(meters)) return "—";
    if (meters >= 1000) return (meters / 1000).toFixed(2) + " km";
    return Math.round(meters) + " m";
  }

  /** 0–59: compact "N min"; 60+: "X hours Y minutes" (omits zero minutes). */
  function formatDurationMinutes(totalMinutes) {
    const m = Math.round(Number(totalMinutes));
    if (!isFinite(m) || m < 0) return "—";
    if (m <= 59) return `${m} min`;
    const h = Math.floor(m / 60);
    const mins = m % 60;
    const hPart = `${h} ${h === 1 ? "hour" : "hours"}`;
    if (mins === 0) return hPart;
    const mPart = `${mins} ${mins === 1 ? "minute" : "minutes"}`;
    return `${hPart} ${mPart}`;
  }

  function formatDurationFromSeconds(sec) {
    if (!isFinite(sec)) return "—";
    return formatDurationMinutes(Math.round(sec / 60));
  }

  const OSRM_ROUTE_BASE = "https://router.project-osrm.org/route/v1";

  async function fetchOsrmRoute(lng1, lat1, lng2, lat2, profile, signal) {
    const coords = `${lng1},${lat1};${lng2},${lat2}`;
    const url = `${OSRM_ROUTE_BASE}/${profile}/${coords}?overview=false&alternatives=false`;
    try {
      const r = await fetch(url, { signal, mode: "cors" });
      if (!r.ok) return null;
      const j = await r.json();
      if (j.code !== "Ok" || !j.routes || !j.routes[0]) return null;
      return {
        distanceM: j.routes[0].distance,
        durationSec: j.routes[0].duration,
      };
    } catch (_e) {
      return null;
    }
  }

  function routeSpeedKmh(route) {
    if (!route || !isFinite(route.distanceM) || !isFinite(route.durationSec) || route.durationSec <= 0) return 0;
    return (route.distanceM / 1000) / (route.durationSec / 3600);
  }

  function isPlausibleRouteForMode(route, mode) {
    if (!route) return false;
    const v = routeSpeedKmh(route);
    if (!isFinite(v) || v <= 0) return false;
    if (mode === "walk") return v >= 2 && v <= 8.5;
    if (mode === "bike") return v >= 6 && v <= 35;
    if (mode === "car") return v >= 8 && v <= 140;
    return true;
  }

  async function fetchOsrmFootLeg(lng1, lat1, lng2, lat2, signal) {
    let r = await fetchOsrmRoute(lng1, lat1, lng2, lat2, "foot", signal);
    if (!r) r = await fetchOsrmRoute(lng1, lat1, lng2, lat2, "walking", signal);
    return r;
  }

  /** @returns {Promise<[number, number][]|null>} LatLng tuples for polyline */
  async function fetchOsrmGeoJsonLine(lat1, lng1, lat2, lng2, profile) {
    let profiles;
    if (profile === "foot") profiles = ["foot", "walking"];
    else if (profile === "bike") profiles = ["bike", "cycling"];
    else profiles = [profile];
    for (let i = 0; i < profiles.length; i++) {
      const p = profiles[i];
      const coords = `${lng1},${lat1};${lng2},${lat2}`;
      const url = `${OSRM_ROUTE_BASE}/${p}/${coords}?overview=full&geometries=geojson`;
      try {
        const r = await fetch(url, { mode: "cors" });
        if (!r.ok) continue;
        const j = await r.json();
        const line = j.routes && j.routes[0] && j.routes[0].geometry;
        if (j.code !== "Ok" || !line || !line.coordinates) continue;
        return line.coordinates.map((c) => [c[1], c[0]]);
      } catch (_e) {
        /* try next profile */
      }
    }
    return null;
  }

  /**
   * One ground leg for metro (to station or from station).
   * @param {"walk"|"2w"|"car"} legMode
   */
  async function resolveMetroAccessLeg(fromLat, fromLng, toLat, toLng, legMode) {
    const straight = haversineDistanceMeters(fromLat, fromLng, toLat, toLng);
    const lineFallback = [
      [fromLat, fromLng],
      [toLat, toLng],
    ];

    if (legMode === "walk") {
      let r = await fetchOsrmRoute(fromLng, fromLat, toLng, toLat, "foot");
      if (!r) r = await fetchOsrmRoute(fromLng, fromLat, toLng, toLat, "walking");
      let coords = await fetchOsrmGeoJsonLine(fromLat, fromLng, toLat, toLng, "foot");
      if (!coords) coords = lineFallback;
      const distanceM = r ? r.distanceM : straight;
      const durationSec =
        estimatedDurationMinutesForMode(distanceM, "walk", r ? r.durationSec : null, false) * 60;
      return { coords, distanceM, durationSec, humanLabel: "walk" };
    }

    if (legMode === "car") {
      const r = await fetchOsrmRoute(fromLng, fromLat, toLng, toLat, "driving");
      let coords = await fetchOsrmGeoJsonLine(fromLat, fromLng, toLat, toLng, "driving");
      if (!coords) coords = lineFallback;
      const distanceM = r ? r.distanceM : straight;
      const durationSec =
        estimatedDurationMinutesForMode(distanceM, "car", r ? r.durationSec : null, false) * 60;
      return { coords, distanceM, durationSec, humanLabel: "car" };
    }

    let r = await fetchOsrmRoute(fromLng, fromLat, toLng, toLat, "bike");
    if (!r) r = await fetchOsrmRoute(fromLng, fromLat, toLng, toLat, "cycling");
    let coords = await fetchOsrmGeoJsonLine(fromLat, fromLng, toLat, toLng, "bike");
    if (!coords) coords = await fetchOsrmGeoJsonLine(fromLat, fromLng, toLat, toLng, "cycling");
    let humanLabel = "bike";
    if (!r) {
      r = await fetchOsrmRoute(fromLng, fromLat, toLng, toLat, "driving");
      humanLabel = "2W road";
    }
    if (!coords) {
      const drv = await fetchOsrmGeoJsonLine(fromLat, fromLng, toLat, toLng, "driving");
      coords = drv || lineFallback;
    }
    const distanceM = r ? r.distanceM : straight;
    let durationSec =
      estimatedDurationMinutesForMode(distanceM, "2w", r ? r.durationSec : null, humanLabel === "2W road") * 60;
    if (humanLabel === "2W road") {
      durationSec = estimatedDurationMinutesForMode(distanceM, "2w", null, true) * 60;
    }
    return { coords, distanceM, durationSec, humanLabel };
  }

  function metroLegStatsPhrase(leg) {
    if (leg.humanLabel === "walk") return "walk";
    if (leg.humanLabel === "car") return "car";
    if (leg.humanLabel === "2W road") return "2W (road estimate)";
    return "bike";
  }

  function selectedLegModeLabel(mode) {
    if (mode === "walk") return "walk";
    if (mode === "car") return "car";
    return "2W";
  }

  function renderMetroLegModeText(selectedMode, resolvedLeg) {
    const chosen = selectedLegModeLabel(selectedMode);
    const resolved = metroLegStatsPhrase(resolvedLeg);
    if (selectedMode === "2w" && resolvedLeg && resolvedLeg.humanLabel === "2W road") {
      return "2W (road fallback)";
    }
    if (selectedMode === "2w" && resolved === "bike") {
      return "2W (bike path)";
    }
    if (resolved && chosen.toLowerCase() !== resolved.toLowerCase()) {
      return `${chosen} via ${resolved}`;
    }
    return chosen;
  }

  function osrmStepToPhrase(step) {
    if (!step || !step.maneuver) return "";
    const m = step.maneuver;
    const type = m.type || "";
    const mod = (m.modifier || "").replace(/-/g, " ");
    const nm = step.name && String(step.name).trim() ? String(step.name).trim() : "";
    if (type === "depart") return nm ? `Head toward ${nm}` : "Start along the highlighted route";
    if (type === "arrive") return "Arrive at destination";
    if (type === "roundabout" && step.exit != null) {
      return `Enter the roundabout, take exit ${step.exit}` + (nm ? ` toward ${nm}` : "");
    }
    if (type === "roundabout") return "Enter the roundabout" + (nm ? ` toward ${nm}` : "");
    if (type === "turn" || type === "end of road" || type === "fork" || type === "on ramp" || type === "off ramp") {
      const bit = mod ? `${mod} ` : "";
      return nm ? `${bit}onto ${nm}` : `${bit}continue on the route`.trim();
    }
    if (type === "merge") return nm ? `Merge toward ${nm}` : "Merge onto the route";
    if (type === "continue" || type === "new name") return nm ? `Continue on ${nm}` : "Continue straight";
    return nm ? `Continue toward ${nm}` : "";
  }

  /** @returns {Promise<string[]>} */
  async function fetchOsrmStepPhrases(lng1, lat1, lng2, lat2, profile) {
    const coords = `${lng1},${lat1};${lng2},${lat2}`;
    const url = `${OSRM_ROUTE_BASE}/${profile}/${coords}?overview=false&steps=true`;
    try {
      const r = await fetch(url, { mode: "cors" });
      if (!r.ok) return [];
      const j = await r.json();
      if (j.code !== "Ok" || !j.routes || !j.routes[0] || !j.routes[0].legs || !j.routes[0].legs[0]) return [];
      const steps = j.routes[0].legs[0].steps || [];
      const out = [];
      for (let i = 0; i < steps.length; i++) {
        const t = osrmStepToPhrase(steps[i]);
        if (t) out.push(t);
      }
      return out;
    } catch (_e) {
      return [];
    }
  }

  /**
   * Fetch multiple OSRM route alternatives and normalize them.
   * @returns {Promise<Array<{distanceM:number,durationSec:number,coords:[number,number][],phrases:string[]}>|null>}
   */
  async function fetchOsrmRouteAlternatives(lat1, lng1, lat2, lng2, profile, mode, signal) {
    let profiles;
    if (profile === "foot") profiles = ["foot", "walking"];
    else if (profile === "bike") profiles = ["bike", "cycling"];
    else profiles = [profile];

    for (let i = 0; i < profiles.length; i++) {
      const p = profiles[i];
      const coords = `${lng1},${lat1};${lng2},${lat2}`;
      const url = `${OSRM_ROUTE_BASE}/${p}/${coords}?overview=full&geometries=geojson&steps=true&alternatives=true`;
      try {
        const r = await fetch(url, { signal: signal || undefined, mode: "cors" });
        if (!r.ok) continue;
        const j = await r.json();
        if (j.code !== "Ok" || !Array.isArray(j.routes) || !j.routes.length) continue;
        const out = j.routes
          .map((route) => {
            const line = route.geometry && route.geometry.coordinates;
            if (!Array.isArray(line) || !line.length) return null;
            const points = line.map((c) => [c[1], c[0]]);
            const steps = route.legs && route.legs[0] && route.legs[0].steps ? route.legs[0].steps : [];
            const stepPoints = [];
            const phrases = [];
            steps.forEach((s) => {
              const t = osrmStepToPhrase(s);
              if (!t) return;
              const loc = s && s.maneuver && Array.isArray(s.maneuver.location) ? s.maneuver.location : null;
              if (loc && loc.length === 2) {
                stepPoints.push([loc[1], loc[0]]);
                phrases.push(t);
              }
            });
            return {
              distanceM: route.distance,
              durationSec: route.duration,
              coords: points,
              phrases,
              stepPoints,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.distanceM - b.distanceM);
        if (out.length) return out.slice(0, 3);
      } catch (_e) {
        /* try next profile */
      }
    }
    return null;
  }

  /**
   * Walking (foot), four-wheeler (driving), two-wheeler (bike when available; else driving length + faster ETA),
   * metro (foot legs to/from nearest stations + straight-line inter-station distance + train time estimate).
   */
  async function computeRoutedTravelMetrics(lat1, lng1, lat2, lng2, signal) {
    const straightLineM = haversineDistanceMeters(lat1, lng1, lat2, lng2);
    const batch = await Promise.all([
      fetchOsrmRoute(lng1, lat1, lng2, lat2, "foot", signal),
      fetchOsrmRoute(lng1, lat1, lng2, lat2, "driving", signal),
      fetchOsrmRoute(lng1, lat1, lng2, lat2, "bike", signal),
    ]);
    let foot = batch[0];
    let driving = batch[1];
    let bike = batch[2];
    if (!foot) foot = await fetchOsrmRoute(lng1, lat1, lng2, lat2, "walking", signal);
    if (!bike) bike = await fetchOsrmRoute(lng1, lat1, lng2, lat2, "cycling", signal);
    if (!isPlausibleRouteForMode(foot, "walk")) foot = null;
    if (!isPlausibleRouteForMode(driving, "car")) driving = null;
    if (!isPlausibleRouteForMode(bike, "bike")) bike = null;

    let footNote = "Via OSRM walking path";
    if (!foot && driving) {
      // If walking profile is unavailable, prefer real road distance over straight-line.
      foot = {
        distanceM: driving.distanceM,
        durationSec: estimatedDurationMinutesForMode(driving.distanceM, "walk", null, false) * 60,
      };
      footNote = "Walking path unavailable · using road distance estimate";
    } else if (!foot) {
      footNote = "Walking route unavailable · using straight-line estimate";
    }

    let twoWheeler = bike
      ? {
          distanceM: bike.distanceM,
          // Keep 2W ETA distinct from car by always using 2W speed model.
          durationSec: estimatedDurationMinutesForMode(bike.distanceM, "2w", null, false) * 60,
        }
      : null;
    let twoWheelerNote = "Bike/cycling path distance · 2W speed estimate";
    if (!twoWheeler && driving) {
      twoWheeler = {
        distanceM: driving.distanceM,
        durationSec: estimatedDurationMinutesForMode(driving.distanceM, "2w", null, true) * 60,
      };
      twoWheelerNote = "Bike route unavailable · using road distance with 2W speed estimate";
    }

    let metro = null;
    const metroBase = getMetroEstimateSummary(lat1, lng1, lat2, lng2);
    if (metroBase) {
      const [lngF, latF] = metroBase.fromStation.coords;
      const [lngT, latT] = metroBase.toStation.coords;
      const [firstLeg, lastLeg] = await Promise.all([
        fetchOsrmFootLeg(lng1, lat1, lngF, latF, signal),
        fetchOsrmFootLeg(lngT, latT, lng2, lat2, signal),
      ]);
      const firstM = firstLeg ? firstLeg.distanceM : metroBase.firstMileM;
      const lastM = lastLeg ? lastLeg.distanceM : metroBase.lastMileM;
      const firstSec = firstLeg ? firstLeg.durationSec : metroBase.firstMileWalkMin * 60;
      const lastSec = lastLeg ? lastLeg.durationSec : metroBase.lastMileWalkMin * 60;
      const metroRideM = metroBase.betweenM;
      const betweenKm = metroBase.betweenM / 1000;
      const interchanges = Math.max(0, Math.round(betweenKm / 12) - 1);
      const waitSec = (TRAVEL.metroBaseWaitMin + interchanges * TRAVEL.metroInterchangePenaltyMin) * 60;
      const metroRideSec = metroBase.metroTimeMin * 60 + waitSec;
      metro = {
        fromStation: metroBase.fromStation,
        toStation: metroBase.toStation,
        firstMileM: metroBase.firstMileM,
        lastMileM: metroBase.lastMileM,
        betweenM: metroBase.betweenM,
        metroTimeMin: metroBase.metroTimeMin,
        firstLeg,
        lastLeg,
        totalDistanceM: firstM + metroRideM + lastM,
        totalDurationSec: firstSec + metroRideSec + lastSec,
        interchanges,
      };
    }

    return {
      foot,
      footNote,
      car: driving,
      twoWheeler,
      twoWheelerNote,
      straightLineM,
      metro,
    };
  }

  let travelMetricsReqSeq = 0;
  let navRouteReqSeq = 0;
  let metroRouteReqSeq = 0;

  /** ETA policy by user mode so durations don't collapse to identical values. */
  function estimatedDurationMinutesForMode(distanceM, mode, osrmDurationSec, twFallback) {
    if (!isFinite(distanceM) || distanceM <= 0) return 0;
    const osrmMin = isFinite(osrmDurationSec) && osrmDurationSec > 0 ? osrmDurationSec / 60 : null;
    const osrmSpeedKmh = osrmMin ? (distanceM / 1000) / (osrmMin / 60) : null;

    if (mode === "walk") {
      const est = Math.max(1, Math.round(distanceM / TRAVEL.walkMPerMin));
      if (osrmMin && osrmSpeedKmh >= 2 && osrmSpeedKmh <= 8.5) return Math.max(1, Math.round(osrmMin));
      return est;
    }

    if (mode === "car") {
      const est = Math.max(1, Math.round(distanceM / TRAVEL.driveMPerMinCard));
      if (osrmMin && osrmSpeedKmh >= 8 && osrmSpeedKmh <= 140) return Math.max(1, Math.round(osrmMin));
      return est;
    }

    // 2W: ALWAYS use dedicated 2W speed model so it never collapses into car timing.
    if (mode === "2w" || twFallback) {
      return Math.max(1, Math.round(distanceM / TRAVEL.twoWMPerMin));
    }

    // Bicycle-only fallback path.
    const bikeEst = Math.max(1, Math.round(distanceM / TRAVEL.cycleMPerMin));
    if (osrmMin && osrmSpeedKmh >= 6 && osrmSpeedKmh <= 35) return Math.max(1, Math.round(osrmMin));
    return bikeEst;
  }

  let _metroStationListCache = null;
  function metroStationsList() {
    if (_metroStationListCache) return _metroStationListCache;
    _metroStationListCache = Object.keys(DELHI_METRO_STATIONS_REVISED).map((name) => ({
      name,
      coords: DELHI_METRO_STATIONS_REVISED[name],
    }));
    return _metroStationListCache;
  }

  function getNearestMetroStationRevised(lat, lng) {
    const list = metroStationsList();
    let best = null;
    let bestD = Infinity;
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const dM = haversineDistanceMeters(lat, lng, s.coords[1], s.coords[0]);
      if (dM < bestD) {
        bestD = dM;
        best = { station: s, distanceMeters: dM };
      }
    }
    return best;
  }

  function getMetroEstimateSummary(olat, olng, dlat, dlng) {
    const from = getNearestMetroStationRevised(olat, olng);
    const to = getNearestMetroStationRevised(dlat, dlng);
    if (!from || !to) return null;
    const sameStation =
      from.station.name === to.station.name ||
      haversineDistanceMeters(
        from.station.coords[1],
        from.station.coords[0],
        to.station.coords[1],
        to.station.coords[0],
      ) < 200;
    if (sameStation) return null;

    const firstMileM = from.distanceMeters;
    const lastMileM = haversineDistanceMeters(
      to.station.coords[1],
      to.station.coords[0],
      dlat,
      dlng,
    );
    const betweenM = haversineDistanceMeters(
      from.station.coords[1],
      from.station.coords[0],
      to.station.coords[1],
      to.station.coords[0],
    );
    const metroTimeMin = Math.max(
      5,
      Math.round((betweenM / 1000 / TRAVEL.metroSpeedKmh) * 60) + Math.round(betweenM / 10000),
    );
    const firstMileWalkMin = Math.round(firstMileM / TRAVEL.walkMPerMin);
    const firstMileDriveMin = Math.round(firstMileM / TRAVEL.driveMPerMinLeg);
    const lastMileWalkMin = Math.round(lastMileM / TRAVEL.walkMPerMin);
    const lastMileDriveMin = Math.round(lastMileM / TRAVEL.driveMPerMinLeg);
    const betweenKm = betweenM / 1000;
    const interchanges = Math.max(0, Math.round(betweenKm / 12) - 1);
    const waitMin = TRAVEL.metroBaseWaitMin + interchanges * TRAVEL.metroInterchangePenaltyMin;
    const totalEstimateMin = firstMileWalkMin + metroTimeMin + waitMin + lastMileWalkMin;

    return {
      fromStation: from.station,
      toStation: to.station,
      firstMileM,
      lastMileM,
      firstMileWalkMin,
      firstMileDriveMin,
      lastMileWalkMin,
      lastMileDriveMin,
      metroTimeMin,
      interchanges,
      waitMin,
      totalEstimateMin,
      betweenM,
    };
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function travelMetricCell(icon, label, value, subHtml) {
    const subBlock = subHtml
      ? `<div class="mt-0.5 text-[10px] leading-snug text-slate-500">${subHtml}</div>`
      : "";
    return `<div class="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100/80">
      <div class="mb-1 flex items-center gap-1.5 text-slate-500">
        <iconify-icon icon="${icon}" class="text-base"></iconify-icon>
        <span class="text-[10px] font-semibold uppercase tracking-wide">${label}</span>
      </div>
      <p class="text-base font-semibold tracking-tight text-slate-900">${value}</p>
      ${subBlock}
    </div>`;
  }

  function travelMetricsLoadingHtml() {
    let html = `<p class="mb-2 text-[10px] text-slate-400">Loading walk, car, two-wheeler, and metro access routes (OSRM)…</p>`;
    html += `<div class="grid grid-cols-2 gap-2">`;
    html += travelMetricCell("solar:walking-round-linear", "Walking", "-", "-");
    html += travelMetricCell("mdi:car", "Four-wheeler", "-", "-");
    html += travelMetricCell("mdi:bicycle", "Two-wheeler", "-", "-");
    html += travelMetricCell("solar:tram-linear", "Metro", "-", "-");
    html += `</div>`;
    return html;
  }

  /** @param routed {object|null} from computeRoutedTravelMetrics; null = all fallbacks */
  function buildTravelMetricsHtml(place, routed) {
    if (!place) return "";
    const ul = userLatLng();
    const d = haversineDistanceMeters(ul[0], ul[1], place.lat, place.lng);
    const foot = routed?.foot ?? null;
    const footNote = routed?.footNote ?? "";
    const car = routed?.car ?? null;
    const tw = routed?.twoWheeler ?? null;
    const twNote = routed?.twoWheelerNote ?? "";

    const walkBaseM = foot ? foot.distanceM : d;
    const walkKmStr = (walkBaseM / 1000).toFixed(2) + " km";
    const walkTime = foot
      ? formatDurationFromSeconds(foot.durationSec)
      : formatDurationMinutes(Math.round(walkBaseM / TRAVEL.walkMPerMin));
    const walkSteps = Math.round(walkBaseM / 0.75).toLocaleString();
    const walkSub = foot
      ? `${walkTime}<br/><span class="text-slate-400">~${walkSteps} steps · ${escapeHtml(
          footNote || "pedestrian path",
        )}</span>`
      : `${walkTime}<br/><span class="text-slate-400">Estimated walking time (route unavailable)</span>`;

    const carKmStr = ((car ? car.distanceM : d) / 1000).toFixed(2) + " km";
    const carTime = car
      ? formatDurationFromSeconds(car.durationSec)
      : formatDurationMinutes(Math.round(d / TRAVEL.driveMPerMinCard));
    const carSub = car
      ? `${carTime}<br/><span class="text-slate-400">Four-wheeler road path (OSRM driving)</span>`
      : `${carTime}<br/><span class="text-slate-400">Estimated road time (route unavailable)</span>`;

    const twKmStr = ((tw ? tw.distanceM : d) / 1000).toFixed(2) + " km";
    const twTime = tw
      ? formatDurationFromSeconds(tw.durationSec)
      : formatDurationMinutes(Math.round(d / TRAVEL.twoWMPerMin));
    const twSub = tw
      ? `${twTime}<br/><span class="text-slate-400">${twNote}</span>`
      : `${twTime}<br/><span class="text-slate-400">Estimated 2W time (route unavailable)</span>`;

    let metro = routed?.metro ?? null;
    if (!metro && d < 100000) {
      const mb = getMetroEstimateSummary(ul[0], ul[1], place.lat, place.lng);
      if (mb) {
        metro = {
          fromStation: mb.fromStation,
          toStation: mb.toStation,
          betweenM: mb.betweenM,
          metroTimeMin: mb.metroTimeMin,
          interchanges: mb.interchanges,
          firstLeg: null,
          lastLeg: null,
          firstMileM: mb.firstMileM,
          lastMileM: mb.lastMileM,
          totalDistanceM: mb.firstMileM + mb.betweenM + mb.lastMileM,
          totalDurationSec: mb.totalEstimateMin * 60,
        };
      }
    }

    let metroKmStr = "—";
    let metroSub =
      "No separate nearest stations for you and the monument — use walk or road.";
    if (metro) {
      const lineM = metro.betweenM ?? 0;
      const walkToM = metro.firstLeg ? metro.firstLeg.distanceM : metro.firstMileM ?? 0;
      const walkFromM = metro.lastLeg ? metro.lastLeg.distanceM : metro.lastMileM ?? 0;
      const fromN = escapeHtml(metro.fromStation.name);
      const toN = escapeHtml(metro.toStation.name);

      metroKmStr = (metro.totalDistanceM / 1000).toFixed(2) + " km";
      const waitM = TRAVEL.metroBaseWaitMin + (metro.interchanges || 0) * TRAVEL.metroInterchangePenaltyMin;
      metroSub = `<span class="text-slate-600">${formatDurationFromSeconds(
        metro.totalDurationSec,
      )} total</span>
        <p class="mt-0.5 text-[9px] leading-snug text-slate-500"><span class="font-medium text-slate-700">${fromN}</span> → <span class="font-medium text-slate-700">${toN}</span> · ~${formatDurationMinutes(
        metro.metroTimeMin,
      )} train + ~${formatDurationMinutes(waitM)} wait${metro.interchanges ? ` + ${metro.interchanges} change` : ""} · <span class="tabular-nums text-slate-700">${formatDistanceMeters(walkToM)} + ${formatDistanceMeters(lineM)} + ${formatDistanceMeters(
        walkFromM,
      )}</span> <span class="text-slate-400">in · line · out</span></p>`;
    }

    let html = `<p class="mb-2 text-[10px] text-slate-400">Walking / metro: foot paths from OSRM where available. Train time and line distance are estimates.</p>`;
    html += `<div class="grid grid-cols-2 gap-2">`;
    html += travelMetricCell("solar:walking-round-linear", "Walking", walkKmStr, walkSub);
    html += travelMetricCell("mdi:car", "Four-wheeler", carKmStr, carSub);
    html += travelMetricCell("mdi:bicycle", "Two-wheeler", twKmStr, twSub);
    html += travelMetricCell("solar:tram-linear", "Metro", metroKmStr, metroSub);
    html += `</div>`;
    return html;
  }

  /**
   * @param {{ mapPanel?: boolean }} targets
   */
  async function hydrateTravelMetricsUi(place, targets) {
    const mapPanel = Boolean(targets && targets.mapPanel);
    const mapRoot = mapPanel ? el("map-travel-metrics") : null;
    if (!place || !mapRoot) return;

    const mapWrap = el("map-travel-metrics-wrap");
    if (mapWrap) mapWrap.classList.remove("hidden");

    const seq = ++travelMetricsReqSeq;
    if (state.travelMetricsAbort) {
      try {
        state.travelMetricsAbort.abort();
      } catch (_e) {
        /* ignore */
      }
    }
    const ac = new AbortController();
    state.travelMetricsAbort = ac;

    const loading = travelMetricsLoadingHtml();
    mapRoot.innerHTML = loading;

    const ul = userLatLng();
    try {
      const routed = await computeRoutedTravelMetrics(ul[0], ul[1], place.lat, place.lng, ac.signal);
      if (seq !== travelMetricsReqSeq) return;
      const html = buildTravelMetricsHtml(place, routed);
      mapRoot.innerHTML = html;
    } catch (err) {
      if (err.name === "AbortError") return;
      if (seq !== travelMetricsReqSeq) return;
      const fallback = buildTravelMetricsHtml(place, null);
      mapRoot.innerHTML = fallback;
    } finally {
      if (state.travelMetricsAbort === ac) state.travelMetricsAbort = null;
    }
  }

  function refreshActiveTravelMetrics() {
    const p = state.activePlace;
    if (!p || !state.travelMetricsFromMap) return;
    const wrap = el("map-travel-metrics-wrap");
    if (!wrap || wrap.classList.contains("hidden")) return;
    void hydrateTravelMetricsUi(p, { mapPanel: true });
  }

  function isIndiaGate(place) {
    return place && place.slug === "india_gate";
  }

  function getIndiaGatePlace() {
    return state.places.find((p) => p.slug === "india_gate") || null;
  }

  function maybePromptIndiaGateMonumentMode(lat, lng) {
    const ig = getIndiaGatePlace();
    if (!ig) return;
    const insideHex = isPointInsidePolygon(lat, lng, TRAVEL.indiaGatePromptHex);
    const d = haversineDistanceMeters(lat, lng, ig.lat, ig.lng);
    const inside = insideHex || d <= TRAVEL.indiaGatePromptRadiusM;
    if (!inside) {
      state.indiaGatePromptArmed = true;
      setMonumentEntryPromptVisible(false);
      return;
    }
    if (isTourOverlayOpen()) {
      setMonumentEntryPromptVisible(false);
      return;
    }
    if (!state.indiaGatePromptArmed) return;
    setMonumentEntryPromptVisible(true);
  }

  function setMonumentEntryPromptVisible(visible) {
    const card = el("monument-entry-card");
    if (!card) return;
    card.classList.toggle("hidden", !visible);
  }

  function openMonumentModeFromPrompt() {
    const ig = getIndiaGatePlace();
    if (!ig) return;
    state.indiaGatePromptArmed = false;
    setMonumentEntryPromptVisible(false);
    state.activePlace = ig;
    state.monumentSimpleUiActive = false;
    openTourOverlay();
  }

  function disableMonumentRouteUiOutsideMode() {
    if (isTourOverlayOpen()) return;
    const hasMonumentRoute =
      !!state.monumentRoutingTargetId || !!(state.activePlace && state.activePlace.isMonumentCheckpoint);
    if (!hasMonumentRoute) return;
    dismissRouteOverlay();
  }

  function clearRoutingMachine() {
    if (state.routingControl && state.map) {
      try {
        state.map.removeControl(state.routingControl);
      } catch (_e) {
        /* ignore */
      }
      state.routingControl = null;
    }
    if (Array.isArray(state.navAltRouteLayers) && state.navAltRouteLayers.length && state.map) {
      state.navAltRouteLayers.forEach((layer) => {
        try {
          state.map.removeLayer(layer);
        } catch (_e) {
          /* ignore */
        }
      });
    }
    state.navAltRouteLayers = [];
    state.activeRoute = null;
    state.navSelectedRouteCoords = null;
    state.navSelectedRouteDistanceM = null;
    state.navSelectedRouteDurationSec = null;
  }

  function clearMetroNavLayers() {
    if (state.metroNavLayerGroup && state.map) {
      try {
        state.map.removeLayer(state.metroNavLayerGroup);
      } catch (_e) {
        /* ignore */
      }
      state.metroNavLayerGroup = null;
    }
  }

  function syncNavModeButtons() {
    document.querySelectorAll(".nav-mode-btn").forEach((btn) => {
      const m = btn.getAttribute("data-nav-mode");
      const on = m === state.navRouteMode;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("bg-[#f97316]", on);
      btn.classList.toggle("text-white", on);
      btn.classList.toggle("shadow-sm", on);
      btn.classList.toggle("ring-2", on);
      btn.classList.toggle("ring-[#f97316]/50", on);
      btn.classList.toggle("bg-slate-100", !on);
      btn.classList.toggle("text-slate-600", !on);
      btn.classList.toggle("ring-1", !on);
      btn.classList.toggle("ring-slate-200/80", !on);
    });
  }

  function syncLiveNavButton() {
    const btn = el("nav-live-start-btn");
    if (!btn) return;
    const on = state.liveNavWatchId != null;
    btn.textContent = on ? "Stop live navigation" : "Start live navigation";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.classList.toggle("bg-rose-600", on);
    btn.classList.toggle("hover:bg-rose-700", on);
    btn.classList.toggle("focus-visible:ring-rose-400", on);
    btn.classList.toggle("bg-slate-900", !on);
    btn.classList.toggle("hover:bg-slate-800", !on);
    btn.classList.toggle("focus-visible:ring-slate-400", !on);
  }

  function setMapLiveNavTilt(active) {
    const wrap = el("map-tilt-wrap");
    if (wrap) wrap.classList.toggle("map-live-nav-tilt", !!active);
  }

  function stopLiveNavigation() {
    const hadWatch = state.liveNavWatchId != null;
    if (hadWatch && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(state.liveNavWatchId);
    }
    state.liveNavWatchId = null;
    setMapLiveNavTilt(false);
    if (state.map && state.navPreLiveZoom != null) {
      try {
        state.map.setZoom(state.navPreLiveZoom);
      } catch (_e) {
        /* ignore */
      }
      state.navPreLiveZoom = null;
    }
    syncLiveNavButton();
    const row = el("nav-live-row");
    if (row) {
      row.classList.add("hidden");
      row.textContent = "";
    }
    if (state.userMarker) {
      state.userMarker.setIcon(createUserExploreMapIcon());
    }
    if (hadWatch) {
      setLiveNavAnchorLoop(false);
      setLiveNavMapControlsLock(false);
      state.navUiCompact = false;
      setExplorePanelVisible(true);
      syncNavBannerPlanningChrome();
      resetMapNorthUp();
      if (state.map && isTourOverlayOpen()) {
        try {
          state.map.setMaxBounds(state.monumentNavSavedMaxBounds || null);
          state.map.options.maxBoundsViscosity = state.monumentNavSavedMaxBoundsViscosity ?? 0;
        } catch (_e) {
          /* ignore */
        }
      }
      state.monumentNavSavedMaxBounds = null;
      state.monumentNavSavedMaxBoundsViscosity = null;
    }
  }

  function onLiveNavPosition(pos) {
    const gpsLoc = [pos.coords.latitude, pos.coords.longitude];
    const live = isLiveNavigationActive();
    const loc = live ? gpsLoc : (state.cursorMode ? userLatLng().slice() : gpsLoc);
    if (live || !state.cursorMode) state.userLocation = loc;
    if (state.userMarker) state.userMarker.setLatLng(loc);
    notifyMonumentModeUserPosition(loc[0], loc[1]);

    if (
      state.navUiCompact &&
      state.liveNavWatchId != null &&
      state.map &&
      typeof state.map.setBearing === "function"
    ) {
      let targetBearing = null;
      const rp = routeProgressEstimate(loc, state.navSelectedRouteCoords);
      if (rp) {
        targetBearing = routeForwardBearing(loc, state.navSelectedRouteCoords, rp, 140);
      }
      if (targetBearing == null && !state.cursorMode) {
        const hd = pos.coords.heading;
        if (
          hd != null &&
          !Number.isNaN(hd) &&
          hd >= 0 &&
          pos.coords.speed != null &&
          pos.coords.speed > 0.5
        ) {
          targetBearing = ((hd % 360) + 360) % 360;
        } else if (state.navPrevGpsForBearing) {
          const p = state.navPrevGpsForBearing;
          const moved = haversineDistanceMeters(p[0], p[1], loc[0], loc[1]);
          if (moved > 3) {
            targetBearing = bearingDegrees(p[0], p[1], loc[0], loc[1]);
          }
        }
      }
      state.navPrevGpsForBearing = [loc[0], loc[1]];
      if (targetBearing != null) {
        const prev = state.navSmoothedBearing != null ? state.navSmoothedBearing : targetBearing;
        state.navSmoothedBearing = lerpAngleDegrees(prev, targetBearing, 0.2);
        try {
          state.map.setBearing(state.navSmoothedBearing);
        } catch (_e) {
          /* ignore */
        }
      }
    }

    if (state.map && state.navUiCompact && state.liveNavWatchId != null) {
      const zTarget = liveNavigationTargetZoom();
      try {
        state.map.setView(loc, zTarget, { animate: false });
      } catch (_e) {
        /* ignore */
      }
      lockUserIconToScreenAnchor(state.map, loc, TRAVEL.navUserScreenYFrac);
    }

    const dest = state.activePlace;
    const row = el("nav-live-row");
    if (row && dest && state.liveNavWatchId != null) {
      const directM = haversineDistanceMeters(loc[0], loc[1], dest.lat, dest.lng);
      const progress = routeProgressEstimate(loc, state.navSelectedRouteCoords);
      if (progress && isFinite(progress.remainingM)) {
        let etaMin = null;
        if (
          isFinite(state.navSelectedRouteDistanceM) &&
          state.navSelectedRouteDistanceM > 1 &&
          isFinite(state.navSelectedRouteDurationSec) &&
          state.navSelectedRouteDurationSec > 1
        ) {
          etaMin =
            (state.navSelectedRouteDurationSec * (progress.remainingM / state.navSelectedRouteDistanceM)) / 60;
        } else {
          const paceMPerMin =
            state.navRouteMode === "walk"
              ? TRAVEL.walkMPerMin
              : state.navRouteMode === "car"
                ? TRAVEL.driveMPerMinCard
                : TRAVEL.cycleMPerMin;
          etaMin = progress.remainingM / paceMPerMin;
        }
        row.textContent = `Live GPS · ~${(progress.remainingM / 1000).toFixed(2)} km remaining · ETA ~${formatDurationMinutes(
          Math.max(1, Math.round(etaMin))
        )}`;
      } else {
        row.textContent = `Live GPS · ~${(directM / 1000).toFixed(2)} km to destination (straight line)`;
      }
      row.classList.remove("hidden");

      if (
        progress &&
        progress.distanceToRouteM > TRAVEL.navOffRouteThresholdM &&
        Date.now() - state.navLastAutoRerouteMs > TRAVEL.navAutoRerouteCooldownMs &&
        !isTourOverlayOpen()
      ) {
        state.navLastAutoRerouteMs = Date.now();
        showToast("You moved off route — rerouting…");
        beginNavRouting(state.navRouteMode);
        return;
      }

      if (directM <= TRAVEL.navArrivalRadiusM && state.navArrivalHandledPlaceSlug !== dest.slug) {
        state.navArrivalHandledPlaceSlug = dest.slug;
        triggerArrival(dest);
      }
    }
    updateLiveTurnByTurn(loc);
  }

  function startLiveNavigation() {
    if (!("geolocation" in navigator)) {
      showToast("Location is not available in this browser.");
      return;
    }
    if (state.liveNavWatchId != null) return;
    // Live navigation must follow real GPS, not cursor-simulated location.
    if (state.cursorMode) setCursorLocationMode(false, { toast: false });
    resetMapNorthUp();
    // Force an immediate, fresh GPS snap before continuous tracking starts.
    requestCurrentLocation(true, true);
    state.liveNavWatchId = navigator.geolocation.watchPosition(
      onLiveNavPosition,
      (err) => {
        const msg =
          err && err.code === 1
            ? "Location permission denied — enable location for live navigation."
            : "Could not track your position.";
        showToast(msg);
        stopLiveNavigation();
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );
    state.navUiCompact = true;
    setExplorePanelVisible(false);
    syncNavBannerPlanningChrome();
    applyNavDirectionsPhrases(state.navLastDirectionPhrases && state.navLastDirectionPhrases.length ? state.navLastDirectionPhrases : []);
    syncLiveNavButton();
    if (state.userMarker) {
      state.userMarker.setIcon(createUserNavArrowMapIcon());
    }
    if (state.map) {
      if (isTourOverlayOpen()) {
        state.monumentNavSavedMaxBounds = state.map.options.maxBounds || null;
        state.monumentNavSavedMaxBoundsViscosity = state.map.options.maxBoundsViscosity ?? 0;
        try {
          state.map.setMaxBounds(null);
          state.map.options.maxBoundsViscosity = 0;
        } catch (_e) {
          /* ignore */
        }
      }
      state.navPreLiveZoom = state.map.getZoom();
      const z = liveNavigationTargetZoom();
      // Always snap live navigation to the current user position + live-nav zoom.
      try {
        state.map.flyTo(userLatLng(), z, { duration: 0.65 });
      } catch (_e) {
        try {
          state.map.setView(userLatLng(), z);
        } catch (_e2) {
          /* ignore */
        }
      }
      setMapLiveNavTilt(true);
      setLiveNavMapControlsLock(true);
      setLiveNavAnchorLoop(true);
      lockUserIconToScreenAnchor(state.map, userLatLng(), TRAVEL.navUserScreenYFrac);
      scheduleLiveNavIconAnchorAfterMove();
    }
    showToast("Live navigation on — map follows your position.");
  }

  function toggleLiveNavigation() {
    const nb = el("nav-banner");
    if (nb && nb.classList.contains("-translate-y-[150%]")) return;
    if (state.liveNavWatchId != null) stopLiveNavigation();
    else startLiveNavigation();
  }

  function setExplorePanelVisible(visible) {
    const ex = el("paris-explore");
    if (!ex) return;
    ex.classList.toggle("hidden", !visible);
  }

  function clearNavDirectionStrip() {
    const strip = el("nav-direction-strip");
    const cur = el("nav-current-step");
    const next = el("nav-next-step");
    if (cur) cur.textContent = "";
    if (next) next.textContent = "";
    if (strip) strip.classList.add("hidden");
  }

  function applyNavDirectionsPhrases(phrases) {
    const strip = el("nav-direction-strip");
    const cur = el("nav-current-step");
    const next = el("nav-next-step");
    if (!strip || !cur || !next) return;
    if (!state.navUiCompact) {
      strip.classList.add("hidden");
      return;
    }
    const list = Array.isArray(phrases) ? phrases.filter(Boolean) : [];
    if (!list.length) {
      cur.textContent = "Follow the highlighted route on the map.";
      next.textContent = "";
    } else {
      cur.textContent = list[0];
      next.textContent = list.length > 1 ? `Then: ${list[1]}` : "";
    }
    strip.classList.remove("hidden");
  }

  function updateLiveTurnByTurn(loc) {
    if (!state.navUiCompact) return;
    const steps = state.navStepPoints;
    const strip = el("nav-direction-strip");
    const cur = el("nav-current-step");
    const next = el("nav-next-step");
    if (!strip || !cur || !next) return;
    if (!Array.isArray(steps) || !steps.length) {
      applyNavDirectionsPhrases(state.navLastDirectionPhrases || []);
      return;
    }

    while (state.navCurrentStepIndex < steps.length) {
      const target = steps[state.navCurrentStepIndex];
      const d = haversineDistanceMeters(loc[0], loc[1], target[0], target[1]);
      if (d <= 35) state.navCurrentStepIndex += 1;
      else break;
    }

    const idx = Math.min(state.navCurrentStepIndex, steps.length - 1);
    const phrases = state.navLastDirectionPhrases || [];
    const currentText = phrases[idx] || "Continue on the highlighted route";
    const nextText = phrases[idx + 1] ? `Then: ${phrases[idx + 1]}` : "";
    cur.textContent = currentText;
    next.textContent = nextText;
    strip.classList.remove("hidden");
  }

  function syncNavBannerPlanningChrome() {
    const compact = state.navUiCompact;
    const row = el("nav-mode-row");
    const label = el("nav-banner-label");
    if (row) row.classList.toggle("hidden", compact || isTourOverlayOpen());
    if (label) label.textContent = compact ? "Navigating to" : "Route to";
    syncMetroLegUiVisibility();
    if (!compact) clearNavDirectionStrip();
  }

  function syncMetroLegUiVisibility() {
    const wrap = el("nav-metro-legs");
    const nb = el("nav-banner");
    if (!wrap) return;
    if (state.navUiCompact) {
      wrap.classList.add("hidden");
      wrap.classList.remove("flex");
      return;
    }
    const bannerOpen = nb && !nb.classList.contains("-translate-y-[150%]");
    const show = Boolean(bannerOpen && state.navRouteMode === "metro");
    if (show) {
      wrap.classList.remove("hidden");
      wrap.classList.add("flex");
    } else {
      wrap.classList.add("hidden");
      wrap.classList.remove("flex");
    }
  }

  function syncMetroLegButtons() {
    document.querySelectorAll(".nav-metro-leg-btn").forEach((btn) => {
      const leg = btn.getAttribute("data-metro-leg");
      const m = btn.getAttribute("data-leg-mode");
      if (!leg || !m || !["walk", "2w", "car"].includes(m)) return;
      const active = leg === "first" ? state.metroFirstLegMode === m : state.metroLastLegMode === m;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      btn.classList.toggle("bg-[#f97316]", active);
      btn.classList.toggle("text-white", active);
      btn.classList.toggle("shadow-sm", active);
      btn.classList.toggle("ring-2", active);
      btn.classList.toggle("ring-[#f97316]/50", active);
      btn.classList.toggle("bg-slate-100", !active);
      btn.classList.toggle("text-slate-600", !active);
      btn.classList.toggle("ring-1", !active);
      btn.classList.toggle("ring-slate-200/80", !active);
    });
  }

  function setMetroLegMode(legKey, mode) {
    if (!["walk", "2w", "car"].includes(mode)) return;
    if (legKey === "first") state.metroFirstLegMode = mode;
    else if (legKey === "last") state.metroLastLegMode = mode;
    else return;
    syncMetroLegButtons();
    if (state.navRouteMode === "metro" && state.activePlace && state.map) {
      void drawMetroNavRoute(userLatLng(), state.activePlace, el("nav-stats"));
    }
  }

  async function drawMetroNavRoute(from, dest, statsEl) {
    const reqSeq = ++metroRouteReqSeq;
    const mb = getMetroEstimateSummary(from[0], from[1], dest.lat, dest.lng);
    if (!mb) {
      showToast("Metro path not available — try walk or road modes.");
      beginNavRouting("car");
      return;
    }
    const [lngF, latF] = mb.fromStation.coords;
    const [lngT, latT] = mb.toStation.coords;

    syncNavBannerPlanningChrome();
    syncMetroLegButtons();

    if (statsEl) statsEl.textContent = "Calculating metro legs…";

    const first = await resolveMetroAccessLeg(from[0], from[1], latF, lngF, state.metroFirstLegMode);
    const last = await resolveMetroAccessLeg(latT, lngT, dest.lat, dest.lng, state.metroLastLegMode);
    if (reqSeq !== metroRouteReqSeq) return;

    const mid = [
      [latF, lngF],
      [latT, lngT],
    ];
    clearMetroNavLayers();
    const g = L.layerGroup().addTo(state.map);
    state.metroNavLayerGroup = g;
    g.addLayer(L.polyline(first.coords, { color: "#6366f1", weight: 5, opacity: 0.92 }));
    g.addLayer(L.polyline(mid, { color: "#a855f7", weight: 4, opacity: 0.9, dashArray: "10 8" }));
    g.addLayer(L.polyline(last.coords, { color: "#0d9488", weight: 5, opacity: 0.92 }));
    const flat = first.coords.concat(mid).concat(last.coords);
    state.navSelectedRouteCoords = flat.slice();
    state.navSelectedRouteDistanceM = first.distanceM + mb.betweenM + last.distanceM;
    state.navSelectedRouteDurationSec = first.durationSec + (mb.metroTimeMin + mb.waitMin) * 60 + last.durationSec;
    state.map.fitBounds(L.latLngBounds(flat), { padding: [48, 48] });

    const d1 = (first.distanceM / 1000).toFixed(2);
    const d2 = (last.distanceM / 1000).toFixed(2);
    const t1 = formatDurationFromSeconds(first.durationSec);
    const t2 = formatDurationFromSeconds(last.durationSec);
    const firstModeText = renderMetroLegModeText(state.metroFirstLegMode, first);
    const lastModeText = renderMetroLegModeText(state.metroLastLegMode, last);
    const fromN = escapeHtml(mb.fromStation.name);
    const toN = escapeHtml(mb.toStation.name);
    const trainEst = formatDurationMinutes(mb.metroTimeMin);
    const waitEst = formatDurationMinutes(mb.waitMin);
    const totalTripMin =
      Math.round(first.durationSec / 60) + mb.metroTimeMin + mb.waitMin + Math.round(last.durationSec / 60);

    if (statsEl) {
      statsEl.innerHTML = `<span class="block">To <b>${fromN}</b>: ~${d1} km · ${t1} <span class="text-slate-400">(${firstModeText})</span></span><span class="block mt-1">From <b>${toN}</b>: ~${d2} km · ${t2} <span class="text-slate-400">(${lastModeText})</span></span><span class="block mt-1 text-[11px] text-slate-500">Train ~${trainEst} + wait ~${waitEst}${mb.interchanges ? ` + ${mb.interchanges} change` : ""} · between stations ${formatDistanceMeters(
        mb.betweenM,
      )} · ~${formatDurationMinutes(totalTripMin)} total (incl. train est.)</span>`;
    }
    state.navLastDirectionPhrases = [
      `Go to ${mb.fromStation.name} to board the metro`,
      `Ride toward ${mb.toStation.name}, then continue to ${dest.name}`,
    ];
    state.navStepPoints = null;
    state.navCurrentStepIndex = 0;
    if (state.navUiCompact) applyNavDirectionsPhrases(state.navLastDirectionPhrases);
    if (!state.navChatAnnounced) {
      state.navChatAnnounced = true;
      addChatMessage(
        `Metro-style path to <b>${dest.name}</b>: first leg to <b>${mb.fromStation.name}</b>, line toward <b>${mb.toStation.name}</b>, then last leg. <b>Indigo</b> = to station, <b>violet</b> = train, <b>teal</b> = to destination.`,
        false,
      );
    }
  }

  /**
   * @param {"walk"|"2w"|"car"|"metro"} mode
   * @param {{ profile: string, lineColor: string, statsLabel: string, twFallback?: boolean }} osrmOpts
   */
  function mountOsrmRoutingControl(from, dest, mode, osrmOpts) {
    const statsEl = el("nav-stats");
    const profile = osrmOpts.profile;
    const lineColor = osrmOpts.lineColor;
    const statsLabel = osrmOpts.statsLabel;
    const twFallback = Boolean(osrmOpts.twFallback);

    clearRoutingMachine();
    const reqSeq = ++navRouteReqSeq;
    if (statsEl) statsEl.textContent = "Fetching shortest route + alternatives…";

    void (async () => {
      const alternatives = await fetchOsrmRouteAlternatives(
        from[0],
        from[1],
        dest.lat,
        dest.lng,
        profile,
        mode
      );
      if (reqSeq !== navRouteReqSeq) return;

      if (!alternatives || !alternatives.length) {
        if (mode === "2w" && profile === "bike") {
          mountOsrmRoutingControl(from, dest, mode, {
            profile: "driving",
            lineColor: "#f97316",
            statsLabel: "driving",
            twFallback: true,
          });
          return;
        }
        showToast("Could not compute route. Try another mode or check your location.");
        addChatMessage(`No route found for <b>${dest.name}</b> with this profile.`, false);
        endJourney();
        return;
      }

      const drawSelected = async (idx, fitBounds) => {
        if (reqSeq !== navRouteReqSeq) return;
        const i = Math.max(0, Math.min(alternatives.length - 1, Number(idx) || 0));
        const route = alternatives[i];
        if (!route) return;
        if (!state.navAltRouteLayers.length) {
          state.navAltRouteLayers = alternatives.map((alt, routeIdx) => {
            const layer = L.polyline(alt.coords, {
              color: routeIdx === 0 ? lineColor : "#94a3b8",
              opacity: routeIdx === 0 ? 0.92 : 0.55,
              weight: routeIdx === 0 ? 6 : 4,
              lineCap: "round",
            }).addTo(state.map);
            layer.on("click", () => {
              void drawSelected(routeIdx, false);
            });
            return layer;
          });
        }
        state.navAltRouteLayers.forEach((layer, routeIdx) => {
          const selected = routeIdx === i;
          try {
            layer.setStyle({
              color: selected ? lineColor : "#94a3b8",
              opacity: selected ? 0.92 : 0.55,
              weight: selected ? 6 : 4,
            });
            if (selected && layer.bringToFront) layer.bringToFront();
          } catch (_e) {
            /* ignore */
          }
        });
        state.activeRoute = state.navAltRouteLayers[i] || null;
        state.navSelectedRouteCoords = route.coords.slice();
        state.navSelectedRouteDistanceM = route.distanceM;
        const timeMin = estimatedDurationMinutesForMode(route.distanceM, mode, route.durationSec, twFallback);
        state.navSelectedRouteDurationSec = timeMin * 60;
        if (fitBounds && state.activeRoute) {
          try {
            state.map.fitBounds(state.activeRoute.getBounds(), { padding: [48, 48] });
          } catch (_e) {
            /* ignore */
          }
        }

        const distKm = (route.distanceM / 1000).toFixed(2);
        let suffix = statsLabel;
        if (twFallback) {
          suffix = "two-wheeler estimate on road route";
        }

        if (statsEl) {
          const sourceLabel =
            mode === "car"
              ? `OSRM ${suffix}`
              : mode === "walk"
                ? "walking ETA estimate"
                : "two-wheeler ETA estimate";
          statsEl.innerHTML = `<span class="block">~${distKm} km · ~${formatDurationMinutes(
            timeMin
          )} <span class="text-slate-500">(${sourceLabel})</span></span>
            <span class="mt-1 block text-[11px] text-slate-500">Tap another route line on the map to switch.</span>`;
        }

        let phrases = route.phrases || [];
        if (phrases.length < 2) {
          const osrmProf =
            profile === "foot" || profile === "walking"
              ? "foot"
              : profile === "bike" || profile === "cycling"
                ? "bike"
                : "driving";
          const more = await fetchOsrmStepPhrases(from[1], from[0], dest.lng, dest.lat, osrmProf);
          if (more.length) phrases = more;
        }
        state.navLastDirectionPhrases = phrases.length ? phrases : null;
        state.navStepPoints =
          Array.isArray(route.stepPoints) && route.stepPoints.length ? route.stepPoints.slice() : null;
        state.navCurrentStepIndex = 0;
        if (state.navUiCompact) applyNavDirectionsPhrases(phrases);
      };

      await drawSelected(0, true);
      if (!state.navChatAnnounced) {
        state.navChatAnnounced = true;
        addChatMessage(
          `Route to <b>${dest.name}</b>: shortest option selected, with <b>${alternatives.length}</b> clickable route choices.`,
          false
        );
      }
    })();
  }

  /** @param {"walk"|"2w"|"car"|"metro"} mode */
  function beginNavRouting(mode) {
    if (!state.activePlace || !state.map) return;
    const dest = state.activePlace;
    const from = userLatLng();
    state.navLastDirectionPhrases = null;
    state.navArrivalHandledPlaceSlug = null;
    state.navLastAutoRerouteMs = 0;
    state.navRouteMode = mode;
    syncNavModeButtons();
    syncNavBannerPlanningChrome();

    const statsEl = el("nav-stats");
    if (statsEl) statsEl.textContent = "Calculating route…";

    clearRoutingMachine();
    clearMetroNavLayers();
    if (state.activeRoute) {
      try {
        state.map.removeLayer(state.activeRoute);
      } catch (_e) {
        /* ignore */
      }
      state.activeRoute = null;
    }

    el("nav-target").textContent = dest.name;
    el("nav-banner").classList.remove("-translate-y-[150%]");

    if (mode === "metro") {
      void drawMetroNavRoute(from, dest, statsEl);
      return;
    }

    if (typeof L === "undefined") {
      if (statsEl) statsEl.textContent = "Map engine unavailable.";
      return;
    }

    if (mode === "walk") {
      mountOsrmRoutingControl(from, dest, mode, {
        profile: "foot",
        lineColor: "#10b981",
        statsLabel: "walking",
      });
      return;
    }
    if (mode === "car") {
      mountOsrmRoutingControl(from, dest, mode, {
        profile: "driving",
        lineColor: "#38bdf8",
        statsLabel: "driving",
      });
      return;
    }
    /* 2w default */
    mountOsrmRoutingControl(from, dest, mode, {
      profile: "bike",
      lineColor: "#f97316",
      statsLabel: "bicycle / two-wheeler",
    });
  }

  function setNavRouteMode(mode) {
    if (!["walk", "2w", "car", "metro"].includes(mode)) return;
    if (!state.activePlace || !state.map) return;
    const nb = el("nav-banner");
    if (nb && nb.classList.contains("-translate-y-[150%]")) {
      state.navRouteMode = mode;
      syncNavModeButtons();
      syncNavBannerPlanningChrome();
      return;
    }
    beginNavRouting(mode);
  }

  function findPlaceInChatText(lower) {
    let best = null;
    let bestScore = 0;
    for (let i = 0; i < state.places.length; i++) {
      const p = state.places[i];
      const name = p.name.toLowerCase();
      if (lower.includes(name) && name.length > bestScore) {
        best = p;
        bestScore = name.length;
      }
      const kws = p.keywords || [];
      for (let j = 0; j < kws.length; j++) {
        const k = kws[j];
        if (lower.includes(k) && k.length > bestScore) {
          best = p;
          bestScore = k.length;
        }
      }
    }
    return best;
  }

  function el(id) {
    return document.getElementById(id);
  }

  /** Encode each path segment for local files (spaces, unicode). Supports root-relative paths. */
  function relAsset(relPath) {
    const s = String(relPath);
    const root = s.startsWith("/");
    const body = root ? s.slice(1) : s;
    const encoded = body
      .split("/")
      .filter(Boolean)
      .map((seg) => encodeURIComponent(seg))
      .join("/");
    return root ? `/${encoded}` : encoded;
  }

  function markerImageHref(slug) {
    const file = MEDIA_ASSETS[slug]?.markerFile;
    return file ? relAsset(file) : null;
  }

  function thumbForPlace(place) {
    if (!place) return "";
    const local = markerImageHref(place.slug);
    return local || place.image;
  }

  function updateModalHeroGalleryNav() {
    const urls = state.modalHeroGalleryUrls;
    const show = urls.length > 1;
    const prev = el("modal-hero-prev");
    const next = el("modal-hero-next");
    if (prev) {
      prev.classList.toggle("hidden", !show);
      prev.classList.toggle("flex", show);
    }
    if (next) {
      next.classList.toggle("hidden", !show);
      next.classList.toggle("flex", show);
    }
  }

  function setModalHeroGalleryIndex(i) {
    const urls = state.modalHeroGalleryUrls;
    if (!urls.length) return;
    const n = urls.length;
    const idx = ((i % n) + n) % n;
    state.modalHeroGalleryIndex = idx;
    const heroImg = el("modal-img");
    if (heroImg) heroImg.src = urls[idx];
    const strip = el("modal-gallery-strip");
    if (strip) {
      strip.querySelectorAll(".modal-gallery-thumb").forEach((btn) => {
        const j = Number(btn.getAttribute("data-gallery-index"));
        const on = j === idx;
        btn.classList.toggle("ring-2", on);
        btn.classList.toggle("ring-orange-500", on);
        btn.classList.toggle("ring-1", !on);
        btn.classList.toggle("ring-black/10", !on);
      });
    }
    updateModalHeroGalleryNav();
  }

  function modalHeroGalleryStep(delta) {
    setModalHeroGalleryIndex(state.modalHeroGalleryIndex + delta);
  }

  function resetModalMedia() {
    state.modalHeroGalleryUrls = [];
    state.modalHeroGalleryIndex = 0;
    const strip = el("modal-gallery-strip");
    if (strip) strip.innerHTML = "";
    const vidList = el("modal-videos-list");
    if (vidList) {
      vidList.querySelectorAll("video").forEach((v) => {
        try {
          v.pause();
        } catch (_e) {
          /* ignore */
        }
        v.removeAttribute("src");
        v.load();
      });
      vidList.innerHTML = "";
    }
    const ifr = el("modal-sketchfab-iframe");
    if (ifr) {
      ifr.src = "";
      ifr.classList.add("hidden");
    }
    const ph = el("modal-3d-placeholder");
    if (ph) ph.classList.add("hidden");
    ["modal-media-gallery-wrap", "modal-media-videos-wrap", "modal-media-3d-wrap"].forEach((id) => {
      const w = el(id);
      if (w) w.classList.add("hidden");
    });
    updateModalHeroGalleryNav();
  }

  function hydrateModalMedia(place) {
    resetModalMedia();
    if (!place) return;
    const ma = MEDIA_ASSETS[place.slug] || {};
    const heroImg = el("modal-img");
    const coverUrl = place.image || thumbForPlace(place);
    const folder = ma.gallery?.folder;
    const files = ma.gallery?.files;

    /** @type {string[]} */
    let heroUrls = [];
    if (folder && files && files.length) {
      heroUrls = files.map((f) => relAsset(folder + "/" + f));
      if (coverUrl && heroUrls.indexOf(coverUrl) < 0) {
        heroUrls = [coverUrl].concat(heroUrls);
      }
    } else if (coverUrl) {
      heroUrls = [coverUrl];
    }
    state.modalHeroGalleryUrls = heroUrls;
    state.modalHeroGalleryIndex = 0;
    if (heroUrls.length && heroImg) {
      heroImg.src = heroUrls[0];
    }
    updateModalHeroGalleryNav();

    const galWrap = el("modal-media-gallery-wrap");
    const strip = el("modal-gallery-strip");
    if (galWrap && strip && folder && files && files.length) {
      galWrap.classList.remove("hidden");
      heroUrls.forEach((url, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("data-gallery-index", String(index));
        btn.className =
          "modal-gallery-thumb snap-start shrink-0 h-24 w-28 overflow-hidden rounded-xl ring-1 ring-black/10 transition-transform hover:ring-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500";
        const im = document.createElement("img");
        im.src = url;
        im.alt = "";
        im.className = "h-full w-full object-cover";
        im.loading = "lazy";
        btn.appendChild(im);
        btn.addEventListener("click", () => setModalHeroGalleryIndex(index));
        strip.appendChild(btn);
      });
      setModalHeroGalleryIndex(0);
    }

    const vidWrap = el("modal-media-videos-wrap");
    const vidList = el("modal-videos-list");
    if (vidWrap && vidList && ma.videos && ma.videos.length) {
      vidWrap.classList.remove("hidden");
      ma.videos.slice(0, 1).forEach((v) => {
        const row = document.createElement("div");
        row.className = "overflow-hidden rounded-2xl bg-black ring-1 ring-slate-200";
        const cap = document.createElement("p");
        cap.className = "bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600";
        cap.textContent = v.title || "Video";
        row.appendChild(cap);
        const video = document.createElement("video");
        video.setAttribute("controls", "");
        video.setAttribute("playsinline", "");
        video.className = "aspect-video w-full bg-black";
        video.src = /^https?:\/\//i.test(v.url) ? v.url : relAsset(v.url);
        row.appendChild(video);
        vidList.appendChild(row);
      });
    }

    const d3 = el("modal-media-3d-wrap");
    const ifr = el("modal-sketchfab-iframe");
    const ph = el("modal-3d-placeholder");
    if (d3 && ifr && ph) {
      const sf = ma.sketchfabEmbed;
      const local = ma.local3dPage;
      if (sf) {
        d3.classList.remove("hidden");
        ifr.classList.remove("hidden");
        ph.classList.add("hidden");
        const q = sf.includes("?") ? "&" : "?";
        ifr.src = `${sf}${q}autostart=0&ui_theme=dark`;
      } else if (local) {
        d3.classList.remove("hidden");
        ifr.classList.remove("hidden");
        ph.classList.add("hidden");
        ifr.src = local;
      } else {
        d3.classList.add("hidden");
      }
    }

  }

  function showToast(msg) {
    const t = el("toast");
    const m = el("toast-msg");
    if (!t || !m) return;
    m.textContent = msg;
    t.classList.remove("-translate-y-[150%]");
    setTimeout(() => t.classList.add("-translate-y-[150%]"), 2800);
  }

  function createUserExploreMapIcon() {
    return L.divIcon({
      className: "custom-user-icon",
      html: `<div class="relative flex h-8 w-8 items-center justify-center">
               <div class="pulse-ring absolute inset-0 rounded-full bg-[#38bdf8]"></div>
               <div class="relative h-4 w-4 rounded-full bg-[#38bdf8] ring-2 ring-white"></div>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }

  /** Heading-up navigation chevron (screen-up = direction of travel when map bearing matches GPS). */
  function createUserNavArrowMapIcon() {
    return L.divIcon({
      className: "custom-user-icon custom-user-nav-arrow",
      html: `<div class="relative flex h-11 w-11 items-center justify-center">
               <div class="absolute inset-0 rounded-full bg-[#4285f4]/25 ring-2 ring-white/90 shadow-lg"></div>
               <svg class="relative z-[1] h-8 w-8 drop-shadow-md" viewBox="0 0 24 24" aria-hidden="true">
                 <path fill="#4285F4" stroke="#fff" stroke-width="1.1" stroke-linejoin="round"
                   d="M12 3.5l6.2 10.2H15.4L14 20h-4l-1.4-6.3H5.8L12 3.5z"/>
               </svg>
             </div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  }

  function initMap() {
    const center = userLatLng();
    state.map = L.map("map", {
      zoomControl: false,
      attributionControl: false,
      rotate: true,
      bearing: 0,
      rotateControl: false,
    }).setView(center, 13);
    if (state.map.compassBearing && typeof state.map.compassBearing.disable === "function") {
      state.map.compassBearing.disable();
    }
    state.lightLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(state.map);
    state.darkLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    });
    state.satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 }
    );

    state.userMarker = L.marker(center, {
      icon: createUserExploreMapIcon(),
      zIndexOffset: 1000,
    }).addTo(state.map);
    state.map.on("click", (e) => {
      if (!state.cursorMode) return;
      const loc = [e.latlng.lat, e.latlng.lng];
      state.userLocation = loc;
      if (state.userMarker) state.userMarker.setLatLng(loc);
      notifyMonumentModeUserPosition(loc[0], loc[1]);
      refreshActiveTravelMetrics();
      if (isLiveNavigationActive()) {
        lockUserIconToScreenAnchor(state.map, loc, TRAVEL.navUserScreenYFrac);
      }
      showToast("Location moved to selected point.");
    });
    state.map.on("zoomend moveend", () => {
      updatePlaceMarkerAggregation();
    });
    window.map = state.map;
  }

  function requestCurrentLocation(shouldAnimate = true, forceGps = false) {
    if (!("geolocation" in navigator)) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gpsLoc = [pos.coords.latitude, pos.coords.longitude];
        const loc = forceGps ? gpsLoc : (state.cursorMode ? userLatLng().slice() : gpsLoc);
        if (forceGps || !state.cursorMode) state.userLocation = loc;
        if (state.userMarker) state.userMarker.setLatLng(loc);
        notifyMonumentModeUserPosition(loc[0], loc[1]);
        if (state.map) {
          const live = isLiveNavigationActive();
          const z = live ? liveNavigationTargetZoom() : 13;
          if (live && shouldAnimate) scheduleLiveNavIconAnchorAfterMove();
          if (shouldAnimate) {
            state.map.flyTo(loc, z, { duration: live ? 0.5 : 1.1 });
          } else {
            state.map.setView(loc, z);
            if (live) lockUserIconToScreenAnchor(state.map, loc, TRAVEL.navUserScreenYFrac);
          }
        }
        refreshActiveTravelMetrics();
      },
      () => {
        // Silent fallback to configured default location.
      },
      { enableHighAccuracy: true, timeout: forceGps ? 14000 : 10000, maximumAge: forceGps ? 0 : 30000 }
    );
  }

  function createPlaceIcon(place, visited) {
    const mk = markerImageHref(place.slug);
    if (mk && !visited) {
      return L.divIcon({
        className: "custom-marker-icon",
        html: `<div class="h-10 w-10 overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-white/60 flex items-center justify-center">
                 <img src="${mk}" alt="" class="block h-full w-full object-contain object-center"/>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
    }
    const bg = visited ? "bg-green-500" : "bg-slate-900";
    return L.divIcon({
      className: "custom-marker-icon",
      html: `<div class="flex h-10 w-10 items-center justify-center rounded-full ${bg} text-white shadow-lg ring-2 ring-white/50 backdrop-blur-md">
               <iconify-icon icon="${visited ? "solar:check-circle-linear" : place.icon}" stroke-width="1.5" class="text-xl"></iconify-icon>
             </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }

  function clearMarkers() {
    state.markers.forEach((m) => state.map.removeLayer(m));
    state.markers = [];
    if (state.placeClusterLayer && state.map) {
      try {
        state.map.removeLayer(state.placeClusterLayer);
      } catch (_e) {
        /* ignore */
      }
      state.placeClusterLayer = null;
    }
    state.places.forEach((p) => {
      delete p.marker;
    });
  }

  function updatePlaceMarkerAggregation() {
    if (!state.map || !state.markers.length || isTourOverlayOpen()) return;
    const zoom = state.map.getZoom();
    if (zoom <= 4) {
      state.markers.forEach((m) => {
        if (state.map.hasLayer(m)) state.map.removeLayer(m);
      });
      if (state.placeClusterLayer) {
        try {
          state.placeClusterLayer.clearLayers();
        } catch (_e) {
          /* ignore */
        }
      }
      return;
    }
    if (!state.placeClusterLayer) {
      state.placeClusterLayer = L.layerGroup().addTo(state.map);
    }
    try {
      state.placeClusterLayer.clearLayers();
    } catch (_e) {
      /* ignore */
    }
    const placesInView = state.places.filter((p) => state.map.getBounds().contains([p.lat, p.lng]));
    if (placesInView.length <= 1) {
      state.markers.forEach((m) => {
        if (!state.map.hasLayer(m)) m.addTo(state.map);
      });
      return;
    }
    const thresholdPx = 10;
    const points = placesInView.map((p) => state.map.latLngToContainerPoint([p.lat, p.lng]));
    const adjacency = Array.from({ length: placesInView.length }, () => []);
    for (let i = 0; i < placesInView.length; i += 1) {
      for (let j = i + 1; j < placesInView.length; j += 1) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        if (Math.hypot(dx, dy) < thresholdPx) {
          adjacency[i].push(j);
          adjacency[j].push(i);
        }
      }
    }
    const visited = new Array(placesInView.length).fill(false);
    const groups = [];
    for (let i = 0; i < placesInView.length; i += 1) {
      if (visited[i]) continue;
      const queue = [i];
      visited[i] = true;
      const group = [];
      while (queue.length) {
        const idx = queue.shift();
        group.push(idx);
        adjacency[idx].forEach((n) => {
          if (visited[n]) return;
          visited[n] = true;
          queue.push(n);
        });
      }
      groups.push(group);
    }
    const clusteredIds = new Set();
    groups
      .filter((g) => g.length > 1)
      .forEach((g) => {
        const gPlaces = g.map((idx) => placesInView[idx]);
        gPlaces.forEach((p) => clusteredIds.add(p.id));
        const centerLat = gPlaces.reduce((s, p) => s + p.lat, 0) / gPlaces.length;
        const centerLng = gPlaces.reduce((s, p) => s + p.lng, 0) / gPlaces.length;
        const marker = L.marker([centerLat, centerLng], {
          icon: L.divIcon({
            className: "custom-marker-icon",
            html: `<div class="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-semibold shadow-lg ring-2 ring-white/80">${gPlaces.length}</div>`,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          }),
          zIndexOffset: 900,
        });
        marker.on("click", () => {
          const bounds = L.latLngBounds(gPlaces.map((p) => [p.lat, p.lng]));
          state.map.fitBounds(bounds.pad(0.35), { maxZoom: 19, animate: true });
        });
        state.placeClusterLayer.addLayer(marker);
      });
    placesInView.forEach((p) => {
      if (!p.marker) return;
      if (clusteredIds.has(p.id)) {
        if (state.map.hasLayer(p.marker)) state.map.removeLayer(p.marker);
      } else if (!state.map.hasLayer(p.marker)) {
        p.marker.addTo(state.map);
      }
    });
  }

  function renderMarkers() {
    clearMarkers();
    state.places.forEach((place) => {
      const visited = Boolean(place.visited);
      const marker = L.marker([place.lat, place.lng], { icon: createPlaceIcon(place, visited) })
        .addTo(state.map)
        .on("click", () => selectDelhiPlace(place));
      place.marker = marker;
      state.markers.push(marker);
    });
    updatePlaceMarkerAggregation();
  }

  function flyToPlace(place) {
    const offsetLng = window.innerWidth > 768 ? -0.012 : 0;
    const offsetLat = window.innerWidth <= 768 ? -0.015 : -0.005;
    state.map.flyTo([place.lat + offsetLat, place.lng + offsetLng], 14, { duration: 1.2 });
  }

  /** Keep #view-detail (title, image, description) aligned with the active monument. */
  function applyExploreDetailPlace(place) {
    if (!place) return;
    const tag = el("detail-tag");
    const title = el("detail-title");
    const rating = el("detail-rating");
    const reviews = el("detail-reviews");
    const panelRating = el("panel-rating");
    const panelReviews = el("panel-reviews");
    const desc = el("detail-desc");
    if (tag) tag.textContent = place.type;
    if (title) title.textContent = place.name;
    if (rating) rating.textContent = place.rating;
    if (reviews) reviews.textContent = place.reviews ? `(${place.reviews} reviews)` : "";
    if (panelRating) panelRating.textContent = place.rating;
    if (panelReviews) panelReviews.textContent = place.reviews ? `(${place.reviews} reviews)` : "";
    if (desc) desc.textContent = place.desc;
  }

  function slideExploreToDetail() {
    const vl = el("view-list");
    const vd = el("view-detail");
    if (!vl || !vd) return;
    vl.classList.remove("panel-slide-active");
    vl.classList.add("panel-slide-left");
    vd.classList.remove("panel-slide-right");
    vd.classList.add("panel-slide-active");
  }

  function selectDelhiPlace(place) {
    dismissRouteOverlay();
    state.activePlace = place;
    flyToPlace(place);

    el("panel-title").textContent = place.name;
    el("panel-img").src = thumbForPlace(place);
    state.travelMetricsFromMap = true;
    void hydrateTravelMetricsUi(place, { mapPanel: true });

    applyExploreDetailPlace(place);
    slideExploreToDetail();

    const panel = el("place-panel");
    panel.classList.remove("translate-y-[150%]");

    botTyping();
    setTimeout(() => {
      addChatMessage(`Ah, ${place.name}! Want a walking route on the map or a quick story?`, false);
    }, 900);
  }

  function hydrateFactsList(facts) {
    const ul = el("modal-facts-list");
    if (!ul || !Array.isArray(facts)) return;
    ul.innerHTML = "";
    facts.forEach((text, i) => {
      const li = document.createElement("li");
      li.className =
        "flex gap-4 items-start rounded-2xl p-4 ring-1 " +
        (i === 0 ? "bg-orange-50/50 ring-orange-100/50" : "bg-slate-50/80 ring-slate-100");
      li.innerHTML = `
        <div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          i === 0 ? "bg-orange-100 text-[#f97316]" : "bg-slate-200 text-slate-500"
        }">
          <iconify-icon icon="solar:star-linear" class="text-xs"></iconify-icon>
        </div>
        <span class="text-sm text-slate-700 leading-relaxed"></span>`;
      li.querySelector("span").textContent = text;
      ul.appendChild(li);
    });
  }

  function centerMap() {
    if (!state.map) return;
    requestCurrentLocation(true, true);
    const loc = userLatLng();
    const live = isLiveNavigationActive();
    if (!live && isTourOverlayOpen()) {
      const hex = TRAVEL.indiaGatePromptHex.map((p) => [p.lat, p.lng]);
      const hexBounds = L.latLngBounds(hex);
      state.map.fitBounds(hexBounds, { padding: [24, 24], maxZoom: 18, animate: true });
      return;
    }
    const z = live ? liveNavigationTargetZoom() : 13;
    if (live && isTourOverlayOpen()) {
      if (state.monumentNavSavedMaxBounds == null) {
        state.monumentNavSavedMaxBounds = state.map.options.maxBounds || null;
        state.monumentNavSavedMaxBoundsViscosity = state.map.options.maxBoundsViscosity ?? 0;
      }
      try {
        state.map.setMaxBounds(null);
        state.map.options.maxBoundsViscosity = 0;
      } catch (_e) {
        /* ignore */
      }
    }
    if (live) lockUserIconToScreenAnchor(state.map, loc, 0.5);
    state.map.flyTo(loc, z, { duration: live ? 0.5 : 1 });
  }

  function initializeExploreMode(animate = true) {
    const loc = userLatLng();
    state.userMarker.setLatLng(loc);

    const explore = el("paris-explore");
    if (explore) explore.classList.remove("hidden");

    const head = el("explore-heading");
    if (head) head.textContent = "Monument Suggestions";

    state.travelMetricsFromMap = false;
    if (state.travelMetricsAbort) {
      try {
        state.travelMetricsAbort.abort();
      } catch (_e) {
        /* ignore */
      }
      state.travelMetricsAbort = null;
    }
    travelMetricsReqSeq += 1;
    const mw = el("map-travel-metrics-wrap");
    if (mw) mw.classList.add("hidden");
    const mr = el("map-travel-metrics");
    if (mr) mr.innerHTML = "";

    renderParisList();
    showListParis();

    renderMarkers();
    if (animate) state.map.flyTo(loc, 13, { duration: 1.2 });
  }

  /* ---------- Paris browse panel ---------- */

  function renderParisList(filterText) {
    const container = el("places-container");
    if (!container) return;
    container.innerHTML = "";
    const q = (filterText || "").toLowerCase();
    const uloc = userLatLng();
    const orderedPlaces = state.places
      .slice()
      .sort(
        (a, b) =>
          haversineDistanceMeters(uloc[0], uloc[1], a.lat, a.lng) -
          haversineDistanceMeters(uloc[0], uloc[1], b.lat, b.lng)
      );
    orderedPlaces.forEach((place, index) => {
      const kw = (place.keywords || []).join(" ");
      if (q && !(`${place.name} ${place.type} ${place.desc} ${kw}`.toLowerCase().includes(q))) return;
      const reviews = place.reviews ? `(${place.reviews})` : "";
      const delay = index * 80;
      const html = `
        <div class="group mx-2 mb-2 mt-2 flex cursor-pointer gap-4 rounded-2xl bg-white p-2.5 transition-all duration-300 hover:bg-slate-50 hover:shadow-md hover:ring-1 hover:ring-slate-900/5 active:scale-[0.98]"
          style="animation: slideUpParis 0.5s ease forwards ${delay}ms; opacity: 0; transform: translateY(10px);"
          data-suggest-id="${place.id}">
          <div class="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-black/5">
            <img src="${thumbForPlace(place)}" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
          </div>
          <div class="flex flex-1 flex-col justify-center py-1 pr-2">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold tracking-tight text-slate-900">${place.name}</h3>
              <span class="text-[10px] font-medium text-slate-400">${place.type}</span>
            </div>
            <div class="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <iconify-icon icon="solar:star-bold" class="text-amber-400"></iconify-icon>
              <span class="font-medium text-slate-700">${place.rating}</span>
              <span>${reviews}</span>
            </div>
            <p class="mt-1.5 line-clamp-1 text-xs text-slate-400">${place.desc}</p>
          </div>
        </div>`;
      container.insertAdjacentHTML("beforeend", html);
    });
    container.querySelectorAll("[data-suggest-id]").forEach((row) => {
      row.addEventListener("click", () => {
        const id = Number(row.getAttribute("data-suggest-id"));
        const p = state.places.find((x) => x.id === id);
        if (p) handleParisPlaceClick(p);
      });
    });
  }

  function handleParisPlaceClick(place) {
    dismissRouteOverlay();
    state.activePlace = place;
    flyToPlace(place);

    el("panel-title").textContent = place.name;
    el("panel-img").src = thumbForPlace(place);
    state.travelMetricsFromMap = true;
    void hydrateTravelMetricsUi(place, { mapPanel: true });

    applyExploreDetailPlace(place);
    slideExploreToDetail();

    const panel = el("place-panel");
    if (panel) panel.classList.remove("translate-y-[150%]");

    botTyping();
    setTimeout(() => {
      addChatMessage(`Ah, ${place.name}! Want a walking route on the map or a quick story?`, false);
    }, 900);
  }

  /** Slide explore sheet to monument list, hide bottom place card, recenter map on user. */
  function exploreReturnToSuggestionList() {
    const pp = el("place-panel");
    if (pp) pp.classList.add("translate-y-[150%]");
    const vl = el("view-list");
    const vd = el("view-detail");
    if (!vl || !vd) return;
    vd.classList.remove("panel-slide-active");
    vd.classList.add("panel-slide-right");
    vl.classList.remove("panel-slide-left");
    vl.classList.add("panel-slide-active");
    if (state.map) {
      const live = isLiveNavigationActive();
      const z = live ? liveNavigationTargetZoom() : 13;
      if (live) scheduleLiveNavIconAnchorAfterMove();
      state.map.flyTo(userLatLng(), z, { duration: live ? 0.5 : 1 });
    }
  }

  function showListParis() {
    dismissRouteOverlay();
    exploreReturnToSuggestionList();
  }

  window.showListParis = showListParis;

  /* ---------- Chat ---------- */

  /** When chat is slid off-screen it still sat above the header (z-1200) and stole clicks. */
  function setChatPanelPointerPassThrough(open) {
    const panel = el("chat-panel");
    if (!panel) return;
    if (open) {
      panel.classList.remove("pointer-events-none");
      panel.classList.add("pointer-events-auto");
    } else {
      panel.classList.add("pointer-events-none");
      panel.classList.remove("pointer-events-auto");
    }
  }

  function toggleChat() {
    state.chatOpen = !state.chatOpen;
    const panel = el("chat-panel");
    if (!panel) {
      showToast("Chat panel not found (UI missing)");
      return;
    }
    panel.classList.toggle("translate-x-[120%]", !state.chatOpen);
    setChatPanelPointerPassThrough(state.chatOpen);
  }

  function openChatPanel() {
    state.chatOpen = true;
    const panel = el("chat-panel");
    if (!panel) {
      showToast("Chat panel not found (UI missing)");
      return;
    }
    panel.classList.remove("translate-x-[120%]");
    setChatPanelPointerPassThrough(true);
  }

  function toggleVoice() {
    state.voiceEnabled = !state.voiceEnabled;
    const dot = document.querySelector("#voice-toggle div");
    const bg = el("voice-toggle");
    if (dot && bg) {
      if (state.voiceEnabled) {
        dot.classList.add("translate-x-4");
        bg.classList.replace("bg-slate-200", "bg-[#f97316]");
      } else {
        dot.classList.remove("translate-x-4");
        bg.classList.replace("bg-[#f97316]", "bg-slate-200");
      }
    }
    const vs = el("settings-voice");
    if (vs) vs.checked = state.voiceEnabled;
  }

  function syncCursorLocationButton() {
    const btn = el("btn-cursor-location");
    if (!btn) return;
    btn.setAttribute("aria-pressed", state.cursorMode ? "true" : "false");
    btn.classList.toggle("bg-[#f97316]/90", state.cursorMode);
    btn.classList.toggle("ring-[#f97316]/60", state.cursorMode);
    btn.classList.toggle("text-white", state.cursorMode);
    btn.classList.toggle("bg-white/90", !state.cursorMode);
    const icon = btn.querySelector("iconify-icon");
    if (icon) {
      icon.classList.toggle("text-white", state.cursorMode);
      icon.classList.toggle("text-slate-600", !state.cursorMode);
    }
  }

  function setCursorLocationMode(enabled, { toast = true } = {}) {
    state.cursorMode = !!enabled;
    const mapEl = el("map");
    if (mapEl) mapEl.style.cursor = state.cursorMode ? "crosshair" : "";
    syncCursorLocationButton();
    if (toast) {
      showToast(
        state.cursorMode
          ? "Cursor location ON — tap map to move your location."
          : "Cursor location OFF."
      );
    }
  }

  function syncSettingsCheckboxes() {
    const vs = el("settings-voice");
    if (vs) vs.checked = state.voiceEnabled;
    const ss = el("settings-satellite");
    if (ss) ss.checked = state.mapStyle === "satellite";
    const ds = el("settings-dark");
    if (ds) ds.checked = !!state.darkUi;
    syncCursorLocationButton();
  }

  function botTyping() {
    const container = el("chat-messages");
    const id = "typing-" + Date.now();
    container.insertAdjacentHTML(
      "beforeend",
      `<div id="${id}" class="flex max-w-[85%] transition-opacity">
        <div class="flex items-center gap-1 rounded-2xl rounded-tl-none bg-slate-100 px-4 py-3">
          <div class="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400"></div>
          <div class="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400"></div>
          <div class="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400"></div>
        </div>
      </div>`
    );
    container.scrollTop = container.scrollHeight;
    return id;
  }

  function addChatMessage(text, isUser) {
    const container = el("chat-messages");
    const typing = document.querySelector('[id^="typing-"]');
    if (typing) typing.remove();

    const userHtml = `<div class="ml-auto max-w-[85%] rounded-2xl rounded-tr-none bg-[#f97316] px-4 py-3 text-sm text-white">${text}</div>`;
    const botHtml = `<div class="flex max-w-[85%]">
      <div class="rounded-2xl rounded-tl-none bg-slate-100 px-4 py-3 text-sm text-slate-700 leading-relaxed">${text}</div>
    </div>`;
    container.insertAdjacentHTML("beforeend", isUser ? userHtml : botHtml);
    container.scrollTop = container.scrollHeight;

    if (!isUser) speakBotText(text);
  }

  function speakBotText(rawText) {
    if (!state.voiceEnabled || !("speechSynthesis" in window)) return;
    try {
      const tmp = document.createElement("div");
      tmp.innerHTML = String(rawText || "");
      const spoken = (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
      if (!spoken) return;
      const u = new SpeechSynthesisUtterance(spoken);
      u.rate = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (_e) {
      /* ignore */
    }
  }

  function handleChatKey(e) {
    if (e.key === "Enter") sendMsg();
  }

  function sendMsg() {
    const input = el("chat-input");
    const text = input.value.trim();
    if (!text) return;
    addChatMessage(text, true);
    input.value = "";
    botTyping();
    setTimeout(() => {
      const lower = text.toLowerCase();
      if (lower.includes("route")) {
        const dest = state.activePlace || findPlaceInChatText(lower);
        if (dest) {
          state.activePlace = dest;
          addChatMessage("Fetching a turn-by-turn route on the map (OpenStreetMap).", false);
          startJourney();
        } else {
          addChatMessage(
            "Tap a monument first or name one in your message (e.g. “route to Qutub”).",
            false
          );
        }
      } else if (lower.includes("metro")) {
        addChatMessage("Metro planner is disabled in this build.", false);
      } else {
        addChatMessage(
          "Try asking for a walking <b>route</b>, the <b>metro</b> planner, or tap a monument suggestion card.",
          false
        );
      }
    }, 900);
  }

  /* ---------- Delhi modals & navigation ---------- */

  function openDetails() {
    const place = state.activePlace;
    if (!place) {
      showToast("Select a place on the map or from the list first.");
      return;
    }
    el("modal-title").textContent = place.name;
    el("modal-img").src = thumbForPlace(place);
    el("modal-desc").textContent = place.desc;
    const cul = el("modal-cultural");
    if (cul) cul.textContent = place.cultural || "";
    hydrateFactsList(place.facts);
    hydrateModalMedia(place);
    const tourCta = el("india-gate-tour-cta");
    if (tourCta) tourCta.classList.toggle("hidden", place.slug !== "india_gate");

    const modal = el("details-modal");
    const content = el("details-content");
    modal.classList.remove("pointer-events-none", "opacity-0");
    modal.classList.add("pointer-events-auto", "opacity-100");
    setTimeout(() => content.classList.remove("translate-y-full"), 40);
  }

  function closeDetails() {
    resetModalMedia();
    const tourCta = el("india-gate-tour-cta");
    if (tourCta) tourCta.classList.add("hidden");
    const modal = el("details-modal");
    const content = el("details-content");
    content.classList.add("translate-y-full");
    setTimeout(() => {
      modal.classList.remove("pointer-events-auto", "opacity-100");
      modal.classList.add("pointer-events-none", "opacity-0");
    }, 280);
  }

  function openGoogleMapsForActivePlace() {
    const place = state.activePlace;
    if (!place) return;
    const dest = `${place.lat},${place.lng}`;
    const hasOrigin = Array.isArray(state.userLocation) && state.userLocation.length === 2;
    const origin = hasOrigin ? `${state.userLocation[0]},${state.userLocation[1]}` : "";
    const url = hasOrigin
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function startJourney() {
    if (!state.activePlace || !state.map) return;
    el("place-panel").classList.add("translate-y-[150%]");
    state.navChatAnnounced = false;
    state.navRouteMode = "2w";
    state.metroFirstLegMode = "walk";
    state.metroLastLegMode = "walk";
    state.navUiCompact = false;
    setExplorePanelVisible(true);
    syncNavModeButtons();
    syncMetroLegButtons();
    syncNavBannerPlanningChrome();
    beginNavRouting("2w");
  }

  function startJourneyFromModal() {
    closeDetails();
    setTimeout(startJourney, 320);
  }

  /** Hide nav banner, live nav, and route graphics (without moving the map). */
  function dismissRouteOverlay() {
    stopLiveNavigation();
    clearRoutingMachine();
    clearMetroNavLayers();
    clearMonumentRouteLayer();
    if (state.activeRoute && state.map) {
      try {
        state.map.removeLayer(state.activeRoute);
      } catch (_e) {
        /* ignore */
      }
    }
    state.activeRoute = null;
    const nb = el("nav-banner");
    if (nb) nb.classList.add("-translate-y-[150%]");
    state.navUiCompact = false;
    state.navLastDirectionPhrases = null;
    state.navStepPoints = null;
    state.navCurrentStepIndex = 0;
    state.navArrivalHandledPlaceSlug = null;
    state.monumentRoutingTargetId = null;
    state.monumentLastRouteFrom = null;
    state.monumentLastRerouteMs = 0;
    state.indiaGatePromptArmed = true;
    clearNavDirectionStrip();
    setExplorePanelVisible(true);
    syncNavBannerPlanningChrome();
    resetMapNorthUp();
  }

  function endJourney() {
    const inMonumentMode = isTourOverlayOpen();
    if (inMonumentMode) {
      const targetCp =
        (state.monumentRoutingTargetId &&
          state.checkpoints.find((c) => c.id === state.monumentRoutingTargetId)) ||
        state.checkpoints.find((c) => c.status === "active") ||
        state.checkpoints.find((c) => c.status !== "done") ||
        null;
      if (targetCp) {
        routeToCheckpoint(targetCp.id);
      }
      return;
    }
    dismissRouteOverlay();
    exploreReturnToSuggestionList();
  }

  function closeNavigationFromBanner() {
    const inMonumentMode = isTourOverlayOpen();
    dismissRouteOverlay();
    if (!inMonumentMode) return;
    if (state.map) {
      const hex = TRAVEL.indiaGatePromptHex.map((p) => [p.lat, p.lng]);
      state.map.fitBounds(L.latLngBounds(hex), { padding: [24, 24], maxZoom: 18, animate: true });
    }
    setExplorePanelVisible(false);
    syncNavBannerPlanningChrome();
    renderTourPanel();
  }

  function triggerArrival(place) {
    if (place && place.isMonumentCheckpoint) {
      const cp = state.checkpoints.find((c) => c.id === place.id);
      if (cp) completeCheckpoint(cp);
      showToast(`You've reached ${place.name}.`);
      dismissRouteOverlay();
      return;
    }
    place.visited = true;
    if (place.marker) place.marker.setIcon(createPlaceIcon(place, true));
    showToast(`You've arrived at ${place.name}!`);
    setTimeout(() => {
      const loc = userLatLng();
      notifyMonumentModeUserPosition(loc[0], loc[1]);
      dismissRouteOverlay();
      centerMap();
      openDetails();
    }, 2200);
  }

  /* ---------- Monument / tour ---------- */

  function enterMonumentMode() {
    if (!state.activePlace) return;
    if (!isIndiaGate(state.activePlace)) {
      showToast("Checkpoint tour is only set up for India Gate.");
      return;
    }
    const loc = userLatLng();
    state.monumentSimpleUiActive = !isPointInsidePolygon(
      loc[0],
      loc[1],
      TRAVEL.indiaGatePromptHex
    );
    closeDetails();
    /* Keep Monument Mode in-map with left card UX. */
    setTimeout(() => openTourOverlay(), 320);
  }

  function exitMonumentMode() {
    /* legacy no-op; monument overlay removed */
  }

  function openTourOverlay() {
    const t = el("tour-overlay");
    if (!t) return;
    const brand = el("map-brand-chip");
    if (brand) brand.classList.add("hidden");
    setMonumentEntryPromptVisible(false);
    const qrBtn = el("btn-qr-scan");
    if (qrBtn) {
      const simpleUi = state.monumentSimpleUiActive || TRAVEL.monumentSimpleUi;
      if (simpleUi) {
        qrBtn.classList.add("hidden");
        qrBtn.classList.remove("flex");
      } else {
        qrBtn.classList.remove("hidden");
        qrBtn.classList.add("flex");
      }
    }
    const exitBtn = el("btn-exit-monument");
    if (exitBtn) {
      exitBtn.classList.remove("hidden");
      exitBtn.classList.add("flex");
    }
    const placePanel = el("place-panel");
    state.monumentHadPlacePanelOpen = !!(
      placePanel && !placePanel.classList.contains("translate-y-[150%]")
    );
    if (placePanel) placePanel.classList.add("translate-y-[150%]");
    if (state.map && Array.isArray(state.markers) && state.markers.length) {
      state.markers.forEach((m) => {
        try {
          state.map.removeLayer(m);
        } catch (_e) {
          /* ignore */
        }
      });
      state.monumentPlaceMarkersHidden = true;
    }
    state.checkpoints = (
      typeof structuredClone === "function"
        ? structuredClone(CHECKPOINTS_TEMPLATE)
        : JSON.parse(JSON.stringify(CHECKPOINTS_TEMPLATE))
    ).map((cp) => Object.assign({}, cp, { status: "pending" }));
    state.monumentRatingPromptShown = false;
    state.monumentTourPlaceSlug = state.activePlace?.slug || "india_gate";
    const loc = userLatLng();
    updateCheckpointDistances(loc[0], loc[1]);
    syncActiveCheckpoint();
    t.classList.remove("hidden");
    t.classList.add("flex");
    enableMonumentMapMaskAndZoomLock();
    drawMonumentBasePathLayer();
    drawMonumentQrMarkers();
    el("tour-monument-title").textContent = state.activePlace.name || "India Gate";
    renderTourPanel();
  }

  function exitTourMode() {
    const t = el("tour-overlay");
    t.classList.remove("flex");
    t.classList.add("hidden");
    const brand = el("map-brand-chip");
    if (brand) brand.classList.remove("hidden");
    const exitBtn = el("btn-exit-monument");
    if (exitBtn) {
      exitBtn.classList.add("hidden");
      exitBtn.classList.remove("flex");
    }
    clearMonumentQrMarkers();
    if (state.monumentPlaceMarkersHidden) {
      renderMarkers();
      state.monumentPlaceMarkersHidden = false;
    }
    const qrBtn = el("btn-qr-scan");
    if (qrBtn) {
      qrBtn.classList.add("hidden");
      qrBtn.classList.remove("flex");
    }
    const loc = userLatLng();
    setMonumentRatingCardVisible(false);
    state.indiaGatePromptArmed = true;
    maybePromptIndiaGateMonumentMode(loc[0], loc[1]);
    disableMonumentRouteUiOutsideMode();
    clearMonumentBasePathLayer();
    disableMonumentMapMaskAndZoomLock();
    const placePanel = el("place-panel");
    if (placePanel && state.monumentHadPlacePanelOpen) {
      placePanel.classList.remove("translate-y-[150%]");
    }
    state.monumentHadPlacePanelOpen = false;
  }

  function renderTourPanel() {
    const list = el("tour-checkpoints-list");
    const prog = el("tour-progress-label");
    if (!list) return;
    const loc = userLatLng();
    updateCheckpointDistances(loc[0], loc[1]);
    syncActiveCheckpoint();
    const done = state.checkpoints.filter((c) => c.status === "done").length;
    const total = state.checkpoints.length;
    if (prog) prog.textContent = `${done} / ${total}`;
    const bar = el("tour-progress-bar");
    if (bar) bar.style.width = `${(done / total) * 100}%`;
    const progressWrap = el("tour-progress-wrap");
    const simpleUi = state.monumentSimpleUiActive || TRAVEL.monumentSimpleUi;
    if (progressWrap) progressWrap.classList.toggle("hidden", !!simpleUi);

    list.innerHTML = "";
    const orderedCheckpoints = state.checkpoints
      .slice()
      .sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity));
    const pendingOrdered = orderedCheckpoints.filter((cp) => cp.status !== "done");
    const pendingRankById = {};
    pendingOrdered.forEach((cp, idx) => {
      pendingRankById[cp.id] = idx + 1;
    });
    if (simpleUi) {
      orderedCheckpoints.forEach((cp) => {
        const card = document.createElement("div");
        const isDone = cp.status === "done";
        const isActive = cp.status === "active";
        card.className = `relative rounded-2xl p-4 shadow-sm transition-all ${
          isDone
            ? "bg-white border border-emerald-200/80 ring-1 ring-emerald-500/5"
            : isActive
              ? "bg-white border-2 border-blue-500/30 shadow-md shadow-blue-500/5"
              : "bg-white border border-slate-200/80"
        }`;
        card.innerHTML = `
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-base font-semibold tracking-tight ${isDone ? "text-slate-900" : isActive ? "text-slate-900" : "text-slate-700"}">${cp.name}</h3>
          </div>
          <p class="text-xs text-slate-500 mb-3 leading-relaxed">${cp.body}</p>
          <button type="button" class="tour-info w-full py-2.5 rounded-xl bg-white text-slate-700 text-sm font-medium border border-slate-200 hover:bg-slate-50" data-cp="${cp.id}">View Info</button>`;
        list.appendChild(card);
      });
      list.querySelectorAll(".tour-info").forEach((btn) => {
        btn.addEventListener("click", () => openCheckpointModal(btn.getAttribute("data-cp")));
      });
      return;
    }
    orderedCheckpoints.forEach((cp, idx) => {
      const rank = cp.status === "done" ? "✓" : pendingRankById[cp.id] || "";
      const card = document.createElement("div");
      const isDone = cp.status === "done";
      const isActive = cp.status === "active";
      card.className = `relative rounded-2xl p-4 shadow-sm transition-all ${
        isDone
          ? "bg-white border border-emerald-200/80 ring-1 ring-emerald-500/5"
          : isActive
            ? "bg-white border-2 border-blue-500/30 shadow-md shadow-blue-500/5 overflow-hidden"
            : "bg-white border border-slate-200/80 opacity-85"
      }`;
      if (isActive) {
        card.innerHTML = `
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
          <div class="absolute top-4 right-4 text-blue-500"><iconify-icon icon="solar:map-point-wave-linear" class="text-xl animate-pulse"></iconify-icon></div>
          <div class="flex items-center gap-3 mb-2 pl-1">
            <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold shrink-0">${rank}</div>
            <h3 class="text-base font-semibold tracking-tight text-slate-900">${cp.name}</h3>
          </div>
          <p class="text-xs text-slate-500 mb-1 pr-8 pl-1 leading-relaxed">${cp.body}</p>
          <p class="mb-3 pl-1 text-[11px] font-medium text-blue-600">${checkpointDistanceLabel(cp)}</p>
          <div class="flex gap-2 pl-1">
            <button type="button" class="tour-info flex-1 py-2.5 rounded-xl bg-white text-slate-700 text-sm font-medium border border-slate-200 hover:bg-slate-50" data-cp="${cp.id}">View Info</button>
            <button type="button" class="tour-nav flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium flex items-center justify-center gap-2" data-cp="${cp.id}">
              <iconify-icon icon="solar:routing-2-linear" class="text-base opacity-90"></iconify-icon> Show Route
            </button>
          </div>`;
      } else if (isDone) {
        card.innerHTML = `
          <div class="absolute top-4 right-4 flex items-center gap-1.5 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md text-xs font-semibold">Scanned</div>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-semibold shrink-0">${rank}</div>
            <h3 class="text-base font-semibold tracking-tight text-slate-900">${cp.name}</h3>
          </div>
          <p class="text-xs text-slate-500 mb-1 pr-16">${cp.teaser}</p>
          <p class="mb-3 text-[11px] font-medium text-emerald-600">${checkpointDistanceLabel(cp)}</p>
          <div class="flex gap-2">
            <button type="button" class="tour-info flex-1 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200/60" data-cp="${cp.id}">View Info</button>
            <button type="button" class="tour-nav flex-1 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium flex items-center justify-center gap-2" data-cp="${cp.id}">
              <iconify-icon icon="solar:routing-2-linear" class="text-base opacity-90"></iconify-icon> Show Route
            </button>
          </div>`;
      } else {
        card.innerHTML = `
          <div class="absolute top-4 right-4 text-slate-400"><iconify-icon icon="solar:point-on-map-linear" class="text-lg"></iconify-icon></div>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-semibold shrink-0">${rank}</div>
            <h3 class="text-base font-semibold tracking-tight text-slate-700">${cp.name}</h3>
          </div>
          <p class="text-xs text-slate-500 mb-1 pr-8">${cp.body}</p>
          <p class="mb-3 text-[11px] font-medium text-slate-600">${checkpointDistanceLabel(cp)}</p>
          <div class="flex gap-2">
            <button type="button" class="tour-info flex-1 py-2 rounded-xl bg-white text-slate-700 text-sm font-medium border border-slate-200 hover:bg-slate-50" data-cp="${cp.id}">View Info</button>
            <button type="button" class="tour-nav flex-1 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium flex items-center justify-center gap-2" data-cp="${cp.id}">
              <iconify-icon icon="solar:routing-2-linear" class="text-base opacity-90"></iconify-icon> Show Route
            </button>
          </div>`;
      }
      list.appendChild(card);
    });

    list.querySelectorAll(".tour-info").forEach((btn) => {
      btn.addEventListener("click", () => openCheckpointModal(btn.getAttribute("data-cp")));
    });
    list.querySelectorAll(".tour-nav").forEach((btn) => {
      btn.addEventListener("click", () => routeToCheckpoint(btn.getAttribute("data-cp")));
    });
  }

  function openCheckpointModal(cpId) {
    const cp = state.checkpoints.find((c) => c.id === cpId);
    if (!cp) return;
    const article = CHECKPOINT_ARTICLES_ORIGINAL[cp.id] || null;
    const modal = el("checkpoint-modal");
    const simpleUi = state.monumentSimpleUiActive || TRAVEL.monumentSimpleUi;
    el("cp-modal-label").textContent = simpleUi ? "" : cp.label || "";
    el("cp-modal-title").textContent = cp.name;
    const descEl = el("cp-modal-desc");
    const keyListEl = el("cp-key-info-list");
    const aboutEl = el("cp-about-html");
    const qrCodeEl = el("cp-modal-qr-code");
    const qrImgEl = el("cp-modal-qr-img");
    const qrWrapEl = el("cp-modal-qr-wrap");
    if (descEl) {
      if (article && article.summary) {
        descEl.textContent = article.summary;
      } else {
        descEl.textContent = cp.about || cp.body;
      }
    }
    if (keyListEl) {
      const facts = Array.isArray(article?.keyFacts) && article.keyFacts.length
        ? article.keyFacts
        : [cp.facts?.built, cp.facts?.height, cp.facts?.architect].filter(Boolean);
      keyListEl.innerHTML = "";
      facts.forEach((f) => {
        const li = document.createElement("li");
        li.textContent = String(f);
        keyListEl.appendChild(li);
      });
    }
    if (aboutEl) {
      if (article && article.aboutHtml) aboutEl.innerHTML = article.aboutHtml;
      else aboutEl.innerHTML = `<p>${escapeHtml(cp.about || cp.body || "")}</p>`;
    }
    if (qrCodeEl) {
      qrCodeEl.textContent = String(cp.id || "-").replaceAll("_", " ").toUpperCase();
    }
    if (qrImgEl) {
      const qrPayload = `SAFAR|CHECKPOINT|${cp.id}|${cp.name}|${cp.lat},${cp.lng}`;
      const encodedPayload = encodeURIComponent(qrPayload);
      qrImgEl.src = `https://quickchart.io/qr?size=220&margin=1&text=${encodedPayload}`;
    }
    if (qrWrapEl) qrWrapEl.classList.toggle("hidden", !!simpleUi);
    const vid = el("cp-modal-video");
    const heroImg = el("cp-modal-hero-img");
    const videoSrc = cp.id === "india_gate_qr" ? "/assets/videos/India gate.mp4" : null;
    if (videoSrc) {
      vid.classList.remove("hidden");
      heroImg.classList.add("hidden");
      vid.src = videoSrc + "?cachebust=" + Date.now();
      try {
        vid.load();
        const playPromise = vid.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            /* autoplay may be blocked; controls remain available */
          });
        }
      } catch (_e) {
        /* ignore */
      }
    } else {
      vid.pause();
      vid.removeAttribute("src");
      vid.classList.add("hidden");
      heroImg.classList.remove("hidden");
      heroImg.src = thumbForPlace(state.activePlace) || "";
    }
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function closeCheckpointModal() {
    const modal = el("checkpoint-modal");
    const vid = el("cp-modal-video");
    if (vid) {
      try {
        vid.pause();
      } catch (_e) {
        /* ignore */
      }
      vid.removeAttribute("src");
    }
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  /* ---------- QR ---------- */

  async function startQrCameraPreview() {
    const video = el("qr-camera-preview");
    if (!video || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      state.qrCameraStream = stream;
      state.qrTorchOn = false;
      video.srcObject = stream;
      video.classList.remove("hidden");
      updateQrTorchButton();
      startQrScanLoop();
    } catch (_e) {
      showToast("Camera permission denied or unavailable.");
      updateQrTorchButton();
    }
  }

  function parseCheckpointIdFromQr(raw) {
    const text = String(raw || "").trim();
    if (!text) return null;
    if (text.startsWith("SAFAR|CHECKPOINT|")) {
      const parts = text.split("|");
      return parts[2] || null;
    }
    const normalized = text.toLowerCase().replaceAll(" ", "_");
    const match = state.checkpoints.find((cp) => cp.id.toLowerCase() === normalized);
    return match ? match.id : null;
  }

  function onQrDetected(rawValue) {
    const cpId = parseCheckpointIdFromQr(rawValue);
    if (!cpId) {
      showToast("Unknown QR code.");
      return;
    }
    const cp = state.checkpoints.find((c) => c.id === cpId);
    if (!cp) {
      showToast("Checkpoint not found.");
      return;
    }
    closeQrScanner();
    completeCheckpoint(cp);
    openCheckpointModal(cp.id);
  }

  function startQrScanLoop() {
    const statusText = el("qr-status-text");
    const statusDot = el("qr-status-dot");
    if (!("BarcodeDetector" in window)) {
      if (statusText) statusText.textContent = "QR unsupported";
      if (statusDot) statusDot.classList.remove("animate-pulse");
      showToast("Live QR scanning is not supported on this browser.");
      return;
    }
    try {
      state.qrBarcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
    } catch (_e) {
      state.qrBarcodeDetector = null;
      if (statusText) statusText.textContent = "QR unsupported";
      if (statusDot) statusDot.classList.remove("animate-pulse");
      showToast("Live QR scanning is not supported on this browser.");
      return;
    }
    state.qrScanActive = true;
    state.qrScanBusy = false;
    const tick = async () => {
      if (!state.qrScanActive) return;
      const video = el("qr-camera-preview");
      if (!video || video.readyState < 2 || !state.qrBarcodeDetector) {
        state.qrScanRafId = window.requestAnimationFrame(tick);
        return;
      }
      if (state.qrScanBusy) {
        state.qrScanRafId = window.requestAnimationFrame(tick);
        return;
      }
      state.qrScanBusy = true;
      try {
        const codes = await state.qrBarcodeDetector.detect(video);
        if (Array.isArray(codes) && codes.length) {
          const raw = codes[0]?.rawValue || "";
          if (statusText) statusText.textContent = "Detected";
          if (statusDot) statusDot.classList.remove("animate-pulse");
          onQrDetected(raw);
          return;
        }
      } catch (_e) {
        /* keep scanning */
      } finally {
        state.qrScanBusy = false;
      }
      state.qrScanRafId = window.requestAnimationFrame(tick);
    };
    state.qrScanRafId = window.requestAnimationFrame(tick);
  }

  function qrTorchSupported() {
    const track = state.qrCameraStream?.getVideoTracks?.()[0];
    if (!track || typeof track.getCapabilities !== "function") return false;
    const caps = track.getCapabilities();
    return !!caps && !!caps.torch;
  }

  function updateQrTorchButton() {
    const icon = el("qr-torch-icon");
    if (icon) {
      icon.setAttribute("icon", state.qrTorchOn ? "solar:flashlight-bold" : "solar:flashlight-linear");
      icon.classList.toggle("text-amber-300", state.qrTorchOn);
      icon.classList.toggle("text-white/80", !state.qrTorchOn);
    }
  }

  async function toggleQrTorch() {
    const track = state.qrCameraStream?.getVideoTracks?.()[0];
    if (!track || !qrTorchSupported()) {
      showToast("Flashlight is not supported on this device.");
      return;
    }
    const next = !state.qrTorchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      state.qrTorchOn = next;
      updateQrTorchButton();
    } catch (_e) {
      showToast("Torch not supported on this device.");
    }
  }

  function stopQrCameraPreview() {
    const video = el("qr-camera-preview");
    state.qrScanActive = false;
    state.qrScanBusy = false;
    if (state.qrScanRafId) {
      window.cancelAnimationFrame(state.qrScanRafId);
      state.qrScanRafId = null;
    }
    state.qrBarcodeDetector = null;
    if (state.qrCameraStream) {
      state.qrCameraStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (_e) {
          /* ignore */
        }
      });
      state.qrCameraStream = null;
    }
    state.qrTorchOn = false;
    if (video) {
      try {
        video.pause();
      } catch (_e) {
        /* ignore */
      }
      video.srcObject = null;
      video.classList.add("hidden");
    }
    updateQrTorchButton();
  }

  function openQrScanner(cpId) {
    state.qrResolve = cpId;
    const ov = el("qr-overlay");
    ov.classList.remove("hidden");
    ov.classList.add("flex");
    el("qr-status-dot").classList.add("bg-green-500", "animate-pulse");
    el("qr-status-dot").classList.remove("bg-gray-500");
    el("qr-status-text").textContent = "Scanning";
    const topControls = el("map-top-controls");
    if (topControls) topControls.classList.add("hidden", "pointer-events-none");
    void startQrCameraPreview();
  }

  function closeQrScanner() {
    const ov = el("qr-overlay");
    ov.classList.add("hidden");
    ov.classList.remove("flex");
    state.qrResolve = null;
    const topControls = el("map-top-controls");
    if (topControls) topControls.classList.remove("hidden", "pointer-events-none");
    stopQrCameraPreview();
  }

  function simulateQrSuccessSimple() {
    const targetId = state.qrResolve || state.checkpoints.find((c) => c.status === "active")?.id;
    const cp = state.checkpoints.find((c) => c.id === targetId);
    closeQrScanner();
    if (!cp) return;
    completeCheckpoint(cp);
    openCheckpointModal(cp.id);
  }

  /* ---------- Metro ---------- */

  function openMetro() {
    hydrateMetroLabels();
    const m = el("metro-overlay");
    m.classList.remove("hidden");
    m.classList.add("flex");
  }

  function closeMetro() {
    el("metro-overlay").classList.add("hidden");
    el("metro-overlay").classList.remove("flex");
  }

  function hydrateMetroLabels() {
    const o = el("metro-origin-input");
    const d = el("metro-dest-input");
    if (o) o.value = METRO_UI.origin;
    if (d) d.value = METRO_UI.destination;
    const summary = el("metro-summary");
    if (summary) {
      summary.innerHTML = `Fastest route via <span class="font-medium text-slate-900">${METRO_UI.lines[0]}</span> &amp; <span class="font-medium text-slate-900">${METRO_UI.lines[1]}</span>.`;
    }
  }

  function startMetroNavigation() {
    showToast("Metro navigation started (demo).");
    closeMetro();
  }

  /* ---------- Settings ---------- */

  function openSettings() {
    const overlay = el("settings-overlay");
    if (!overlay) return;
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");
    syncSettingsCheckboxes();
  }

  function closeSettings() {
    const overlay = el("settings-overlay");
    if (!overlay) return;
    overlay.classList.add("hidden");
    overlay.classList.remove("flex");
  }

  function applyThemeTiles() {
    if (!state.map) return;
    [state.lightLayer, state.darkLayer, state.satelliteLayer].forEach((lyr) => {
      if (!lyr) return;
      try {
        state.map.removeLayer(lyr);
      } catch (_e) {
        /* ignore */
      }
    });
    if (state.mapStyle === "satellite") {
      state.satelliteLayer.addTo(state.map);
      saveUiPrefs();
      return;
    }
    (state.darkUi ? state.darkLayer : state.lightLayer).addTo(state.map);
    saveUiPrefs();
  }

  function bindSettingsForm() {
    const v = el("settings-voice");
    const s = el("settings-satellite");
    const d = el("settings-dark");
    if (v)
      v.addEventListener("change", () => {
        if (v.checked !== state.voiceEnabled) toggleVoice();
      });
    if (s)
      s.addEventListener("change", () => {
        state.mapStyle = s.checked ? "satellite" : "default";
        applyThemeTiles();
      });
    if (d)
      d.addEventListener("change", () => {
        state.darkUi = d.checked;
        applyThemeTiles();
        saveUiPrefs();
      });
  }

  /* ---------- Home ---------- */

  function startFromHome() {
    const home = el("home-overlay");
    if (!home) return;
    const chrome = el("map-chrome");
    if (chrome) chrome.classList.remove("hidden");
    home.classList.add("opacity-0", "pointer-events-none");
    setTimeout(() => home.classList.add("hidden"), 320);
    requestCurrentLocation(true);
    initializeExploreMode(false);
    openChatPanel();
    showToast("Map ready.");
  }

  function scrollDestinationsBy(direction) {
    const scroller = el("destinations-scroller");
    if (!scroller) return;
    const firstCard = scroller.querySelector(".snap-start");
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 320;
    const step = Math.max(280, Math.round(cardWidth + 24));
    scroller.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  function bindDestinationFlipCards() {
    const flipBackTimers = new WeakMap();
    document.querySelectorAll(".destination-flip-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest(".destination-flip-card");
        if (!card) return;
        const pending = flipBackTimers.get(card);
        if (pending) {
          clearTimeout(pending);
          flipBackTimers.delete(card);
        }
        card.classList.add("is-flipped");
      });
    });

    document.querySelectorAll(".destination-flip-card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        const pending = flipBackTimers.get(card);
        if (pending) {
          clearTimeout(pending);
          flipBackTimers.delete(card);
        }
      });
      card.addEventListener("mouseleave", () => {
        if (!card.classList.contains("is-flipped")) return;
        const pending = flipBackTimers.get(card);
        if (pending) clearTimeout(pending);
        const t = setTimeout(() => {
          card.classList.remove("is-flipped");
          flipBackTimers.delete(card);
        }, 4000);
        flipBackTimers.set(card, t);
      });
    });
  }

  function setHomeConfirmCardVisible(visible) {
    const card = el("home-confirm-card");
    if (!card) return;
    card.classList.toggle("hidden", !visible);
  }

  function navigateToHomeScreenFromBrandChip() {
    dismissRouteOverlay();
    closeDetails();
    closeCheckpointModal();
    closeQrScanner();
    closeSettings();
    closeMetro();
    if (isTourOverlayOpen()) exitTourMode();
    setMonumentEntryPromptVisible(false);
    setHomeConfirmCardVisible(false);
    const chrome = el("map-chrome");
    if (chrome) chrome.classList.add("hidden");
    const home = el("home-overlay");
    if (home) {
      home.classList.remove("hidden", "opacity-0", "pointer-events-none");
    }
  }

  function goHomeFromBrandChip() {
    if (isLiveNavigationActive()) {
      setHomeConfirmCardVisible(true);
      return;
    }
    navigateToHomeScreenFromBrandChip();
  }

  function bindUi() {
    const btnSettings = el("btn-settings");
    if (btnSettings) btnSettings.addEventListener("click", openSettings);
    const btnCursorLoc = el("btn-cursor-location");
    if (btnCursorLoc) {
      btnCursorLoc.addEventListener("click", () => {
        setCursorLocationMode(!state.cursorMode, { toast: true });
      });
    }
    const qrBtn = el("btn-qr-scan");
    if (qrBtn) qrBtn.addEventListener("click", () => openQrScanner(null));
    const monumentOpenBtn = el("monument-entry-open");
    if (monumentOpenBtn) monumentOpenBtn.addEventListener("click", openMonumentModeFromPrompt);
    const exitMonumentBtn = el("btn-exit-monument");
    if (exitMonumentBtn) exitMonumentBtn.addEventListener("click", exitTourMode);
    const settingsClose = el("settings-close");
    if (settingsClose) settingsClose.addEventListener("click", closeSettings);
    const metroClose = el("metro-close");
    if (metroClose) metroClose.addEventListener("click", closeMetro);
    const metroClear = el("metro-clear");
    if (metroClear) metroClear.addEventListener("click", closeMetro);
    const metroStart = el("metro-start");
    if (metroStart) metroStart.addEventListener("click", startMetroNavigation);
    const exploreSearch = el("explore-search");
    if (exploreSearch) exploreSearch.addEventListener("input", (e) => renderParisList(e.target.value));
    const tourClose = el("tour-close");
    if (tourClose) tourClose.addEventListener("click", exitTourMode);
    const cpClose = el("cp-modal-close");
    if (cpClose) cpClose.addEventListener("click", closeCheckpointModal);
    const cpModal = el("checkpoint-modal");
    if (cpModal) {
      cpModal.addEventListener("click", (e) => {
        if (e.target === cpModal) closeCheckpointModal();
      });
    }
    const qrClose = el("qr-close");
    if (qrClose) qrClose.addEventListener("click", closeQrScanner);
    const qrTorchBtn = el("qr-torch-btn");
    if (qrTorchBtn) qrTorchBtn.addEventListener("click", () => void toggleQrTorch());
    const hs = el("home-start");
    if (hs) hs.addEventListener("click", startFromHome);
    const hom = el("home-open-map");
    if (hom) hom.addEventListener("click", startFromHome);
    const hom2 = el("home-open-map-2");
    if (hom2) hom2.addEventListener("click", startFromHome);
    const brandChip = el("map-brand-chip");
    if (brandChip) brandChip.addEventListener("click", goHomeFromBrandChip);
    const destPrev = el("destinations-prev");
    if (destPrev) destPrev.addEventListener("click", () => scrollDestinationsBy(-1));
    const destNext = el("destinations-next");
    if (destNext) destNext.addEventListener("click", () => scrollDestinationsBy(1));
    bindDestinationFlipCards();
    const homeConfirmCancel = el("home-confirm-cancel");
    if (homeConfirmCancel)
      homeConfirmCancel.addEventListener("click", () => setHomeConfirmCardVisible(false));
    const homeConfirmGo = el("home-confirm-go");
    if (homeConfirmGo) homeConfirmGo.addEventListener("click", navigateToHomeScreenFromBrandChip);
    const ratingLater = el("monument-rating-later");
    if (ratingLater) ratingLater.addEventListener("click", () => setMonumentRatingCardVisible(false));
    document.querySelectorAll(".monument-rate-btn").forEach((btn) => {
      btn.addEventListener("click", () => submitMonumentRating(btn.getAttribute("data-rate")));
    });

    const chatOpenBtn = el("chat-open-btn");
    if (chatOpenBtn) chatOpenBtn.addEventListener("click", toggleChat);

    document.querySelectorAll(".nav-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const m = btn.getAttribute("data-nav-mode");
        if (m) setNavRouteMode(m);
      });
    });
    document.querySelectorAll(".nav-metro-leg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const leg = btn.getAttribute("data-metro-leg");
        const m = btn.getAttribute("data-leg-mode");
        if (leg && m) setMetroLegMode(leg, m);
      });
    });
    const liveNavBtn = el("nav-live-start-btn");
    if (liveNavBtn) liveNavBtn.addEventListener("click", toggleLiveNavigation);
    const navClose = el("nav-banner-close");
    if (navClose) navClose.addEventListener("click", () => closeNavigationFromBanner());
    syncNavModeButtons();
    syncMetroLegButtons();
    syncNavBannerPlanningChrome();
    syncLiveNavButton();

    bindSettingsForm();
    setCursorLocationMode(state.cursorMode, { toast: false });
  }

  /* ---------- Global exports for inline onclick ---------- */

  window.toggleChat = toggleChat;
  window.openChatPanel = openChatPanel;
  window.openSettings = openSettings;
  window.closeSettings = closeSettings;
  window.toggleVoice = toggleVoice;
  window.handleChatKey = handleChatKey;
  window.sendMsg = sendMsg;
  window.openDetails = openDetails;
  window.closeDetails = closeDetails;
  window.openGoogleMapsForActivePlace = openGoogleMapsForActivePlace;
  window.modalHeroGalleryStep = modalHeroGalleryStep;
  window.startJourney = startJourney;
  window.startJourneyFromModal = startJourneyFromModal;
  window.endJourney = endJourney;
  window.clearRoute = endJourney;
  window.centerMap = centerMap;
  window.enterMonumentMode = enterMonumentMode;
  window.exitMonumentMode = exitMonumentMode;
  window.exitTourMode = exitTourMode;
  window.openMetro = openMetro;
  window.closeMetro = closeMetro;
  window.simulateQrSuccess = simulateQrSuccessSimple;
  window.setNavRouteMode = setNavRouteMode;
  window.toggleLiveNavigation = toggleLiveNavigation;

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("slideUpParisStyle")) {
      const s = document.createElement("style");
      s.id = "slideUpParisStyle";
      s.textContent = "@keyframes slideUpParis { to { opacity: 1; transform: translateY(0); } }";
      document.head.appendChild(s);
    }
    applyMonumentRatingsToPlaces();
    loadUiPrefs();
    applyDarkUiTheme();
    initMap();
    applyThemeTiles();
    bindUi();
    setChatPanelPointerPassThrough(state.chatOpen);
    requestCurrentLocation(false);
    initializeExploreMode(false);
    hydrateFactsList(PLACES_BY_CITY.delhi[0].facts);
  });
})();
