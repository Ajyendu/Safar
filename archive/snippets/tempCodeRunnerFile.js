// ==============================
// Configuration & Constants
// SONEPAT DEMO – Supermax / SBIT / IIIT area (with Hybrid Navigation)
// ==============================

const GEMINI_API_KEY = "AIzaSyDFb-wql_HveLmip8ShLYDAG9L21oUgodE";
const GEMINI_MODEL = "gemini-2.5-flash";

// Demo center: Supermax Sonepat (Sector 33 area)
const DEMO_CENTER = {
  name: "Supermax Sonepat (Demo Center)",
  lat: 28.951072,
  lng: 77.066861,
  knowledgeBase: [],
  insidePlaces: [],
  nearbyPlaces: [],
  amenities: [],
};

const EARTH_RADIUS_M = 6371000;
const FAR_THRESHOLD = 500;
const INSIDE_THRESHOLD = 50;
const ARRIVAL_THRESHOLD = 20; // Within 20 meters = arrived

// Conversation memory
let conversationHistory = [];

// Location state
let watchId = null;
let userMarker = null;
let mapInstance = null;
let centerMarker = null;
let insideMarkers = [];
let amenityMarkers = [];
let currentZone = "unknown";
let lastZone = "unknown";
let lastUserLatLng = null;
let routingControl = null; // For OSM navigation
let distanceMarkers = []; // For distance display
let visitedPlaces = new Set(); // Track visited places
let currentDestination = null; // Track current destination

// Pending confirmation state
let pendingConfirmation = null; // { place: place, callback: function }
let pendingRouteForPlace = null; // Store place for route confirmation

// DOM flags
let domReady = false;
let mapReady = false;
let locationTrackingStarted = false;

// UI elements
let distanceDisplayEl, zoneDisplayEl, nearestPlaceDisplayEl, top3ListEl;
let locationStatusEl, chatWindowEl, chatFormEl;
let userInputEl, voiceToggleEl, robotButtonEl;
let selectedPlacePanel, selectedPlaceDetails; // Panel elements
let arrivalNotificationEl; // Arrival notification

// Speech synthesis
let speechEnabled = true;

// ==============================
// SONEPAT DEMO – Places & Amenities
// ==============================

// Places "inside" or very near Supermax / Sector 33 (within ~200m)
DEMO_CENTER.insidePlaces = [
  {
    id: "supermax_gate",
    name: "Supermax The New Town",
    lat: 28.951463,
    lng: 77.068854,
    type: "residence",
    description: "Your demo center – Sector 33, Stadium Road",
  },
];

// FAMOUS PLACES - ORIGINAL TOP 3 LIST with enhanced categories
DEMO_CENTER.nearbyPlaces = [
  {
    id: "sbit",
    name: "SBIT (Shri Balwant Institute of Technology)",
    lat: 28.98,
    lng: 77.14,
    type: "institute",
    description: "Engineering college, Meerut Road (Pallri), 20-acre campus",
    famous: true,
    keywords: [
      "sbit",
      "shri balwant",
      "balwant institute",
      "engineering college",
      "college",
      "study",
      "btech",
      "engineering",
    ],
    categories: ["college", "education", "engineering"],
  },
  {
    id: "iiit_sonepat",
    name: "IIIT Sonepat",
    lat: 28.992,
    lng: 77.012,
    type: "institute",
    description:
      "Indian Institute of Information Technology, Rajiv Gandhi Education City",
    famous: true,
    keywords: [
      "iiit",
      "indian institute",
      "information technology",
      "college",
      "it college",
      "btech",
      "study",
    ],
    categories: ["college", "education", "it"],
  },
  {
    id: "O2_GYM",
    name: "O2 GYM",
    lat: 28.948716,
    lng: 77.070287,
    type: "GYM",
    description:
      "Make Body and Stay Healthy - Fitness Center with modern equipment",
    famous: true,
    keywords: [
      "gym",
      "body",
      "dumble",
      "health",
      "fitness",
      "workout",
      "exercise",
      "o2",
    ],
    categories: ["fitness", "gym", "health"],
  },
  {
    id: "sonepat_junction",
    name: "Sonepat Junction (Railway)",
    lat: 28.9898,
    lng: 77.0171,
    type: "transport",
    description:
      "Sonepat railway station - connects to Delhi, Panipat, Bhopal and other cities",
    famous: true,
    keywords: [
      "sonepat junction",
      "railway",
      "station",
      "train",
      "bhopal",
      "delhi",
      "travel",
      "journey",
      "punjab",
      "chandigarh",
    ],
    categories: ["transport", "railway", "travel"],
  },
  {
    id: "golden_hut",
    name: "Golden Hut",
    lat: 28.94547,
    lng: 77.096012,
    type: "food",
    description:
      "Punjabi dhaba, opposite Ashoka University, Rai NH1 - Famous for North Indian food",
    famous: true,
    keywords: [
      "golden hut",
      "dhaba",
      "punjabi",
      "restaurant",
      "food",
      "eat",
      "hungry",
      "lunch",
      "dinner",
    ],
    categories: ["food", "restaurant", "dhaba"],
  },
  {
    id: "op_jindal",
    name: "O.P. Jindal Global University",
    lat: 28.926407,
    lng: 77.056753,
    type: "institute",
    description: "JGU, Narela Road, near Jagdishpur - Private university",
    famous: true,
    keywords: [
      "jindal",
      "jgu",
      "op jindal",
      "global university",
      "college",
      "university",
      "study",
    ],
    categories: ["college", "education", "university"],
  },
  {
    id: "fims_hospital",
    name: "FIMS Hospital",
    lat: 28.972697,
    lng: 77.06873,
    type: "hospital",
    description:
      "Frank Institute of Medical Sciences, Bahalgarh-Sonipat Road - 24/7 emergency services",
    famous: true,
    keywords: [
      "fims",
      "hospital",
      "medical",
      "doctor",
      "health",
      "emergency",
      "clinic",
    ],
    categories: ["hospital", "medical", "healthcare"],
  },
  {
    id: "bahalgarh",
    name: "Bahalgarh",
    lat: 28.9618,
    lng: 77.0923,
    type: "landmark",
    description:
      "Bahalgarh Chowk, Sonepat - Local market area with shops and eateries",
    famous: false,
    keywords: ["bahalgarh", "chowk", "market", "shopping", "shop"],
    categories: ["market", "shopping", "local"],
  },
];

// ==============================
// Sonepat Amenities Database (Demo)
// ==============================

const AMENITIES_DATABASE = {
  food: [
    {
      id: "golden_hut",
      name: "Golden Hut",
      type: "cafe",
      lat: 28.94547,
      lng: 77.096012,
      landmark: "Opposite Ashoka University, Rai NH1",
      hours: "24 hours",
      items: [
        { name: "North Indian", price: "₹700 for two" },
        { name: "South Indian", price: "₹150+" },
      ],
      reviews: {
        rating: 4.2,
        count: 8000,
        recent: "Pure veg, 24hrs, famous dhaba",
      },
    },
  ],
  attractions: [
    {
      id: "sbit_campus",
      name: "SBIT Campus",
      lat: 28.98,
      lng: 77.14,
      type: "institute",
      entryFee: "Student/Visitor pass",
      hours: "9 AM - 5 PM",
      reviews: { rating: 4.2, count: 350, recent: "Green campus, good labs" },
    },
    {
      id: "iiit_sonepat",
      name: "IIIT Sonepat",
      lat: 28.992,
      lng: 77.012,
      type: "institute",
      entryFee: "Visitor pass",
      hours: "8 AM - 6 PM",
      reviews: { rating: 4.5, count: 200, recent: "Modern campus at RGEC" },
    },
    {
      id: "O2_GYM",
      name: "O2 GYM",
      lat: 28.948716,
      lng: 77.070287,
      type: "GYM",
      entryFee: "₹1000/month",
      hours: "6 AM - 10 PM",
      reviews: {
        rating: 4.3,
        count: 120,
        recent: "Best gym in the area, great equipment",
      },
    },
  ],
  water: [
    {
      id: "water_supermax",
      name: "Water Station",
      lat: 28.951463,
      lng: 77.068854,
      type: "water",
      landmark: "Supermax Complex",
      hours: "24/7",
      reviews: { rating: 4.0, count: 10, recent: "Clean drinking water" },
    },
  ],
};

const REDDIT_REVIEWS_DATABASE = {
  cafe: [
    {
      source: "r/sonepat",
      user: "u/foodie",
      text: "Golden Hut opposite Ashoka is the best dhaba in Rai. 24hrs pure veg.",
      upvotes: 120,
      date: "2024-02-01",
    },
  ],
  gym: [
    {
      source: "r/sonepat",
      user: "u/fitnessfan",
      text: "O2 Gym has great equipment and trainers. Highly recommended!",
      upvotes: 45,
      date: "2024-01-15",
    },
  ],
};

// ==============================
// Sonepat Knowledge Base (RAG) for Demo
// ==============================

const SONEPAT_KNOWLEDGE_BASE = [
  {
    id: "supermax",
    text: "Supermax The New Town is an affordable housing project in Sector 33, Stadium Road, Village Rathdhana, Sonipat. It is developed by Supermax Group. The area is well connected to Sonepat city and Delhi NCR.",
  },
  {
    id: "sbit",
    text: "Shri Balwant Institute of Technology (SBIT) is an engineering college in Sonepat on Meerut Road (Pallri), about 15 minutes from Delhi border. It has a 20-acre campus, adjacent to Rajiv Gandhi Education City. It offers B.Tech and other programs.",
  },
  {
    id: "iiit",
    text: "IIIT Sonepat (Indian Institute of Information Technology) is located at Rajiv Gandhi Education City, Sonepat. The campus is at Akbarpur Barota / Kilrod. It is an institute of national importance offering B.Tech in IT and CSE. Transit campus is at Sonepat-Bahalgarh area.",
  },
  {
    id: "O2_GYM",
    text: "O2 Gym is a fitness center located in Sonepat, Haryana near Supermax. It offers modern gym equipment, strength training, cardio workouts, and personal training facilities. Open from 6 AM to 10 PM.",
  },
  {
    id: "directions",
    text: "From Supermax Sector 33: SBIT is about 1.5 km via Meerut Road. IIIT Sonepat and Rajiv Gandhi Education City are about 8 km. Sonepat Junction railway station is about 6 km. O2 Gym is just 500 meters away. Buses and autos available on Stadium Road and NH-44.",
  },
  {
    id: "sector33",
    text: "Sector 33 Sonepat has Stadium Road, Supermax residential area, commercial blocks, and good local shops. It is a calm area with parks and basic amenities like water, toilets, and small cafes. O2 Gym is located nearby.",
  },
];

const PLACE_DETAILED_INFO = {
  iiit_sonepat: {
    image: "https://images.unsplash.com/photo-1581092918484-8313b9f2d2a3",
    summary:
      "IIIT Sonepat is an Institute of National Importance focused on IT and CSE.",
    history:
      "Established under PPP model to strengthen technical education in Haryana.",
    geography: "Located in Rajiv Gandhi Education City, near Delhi NCR.",
    facts: [
      "Focus on IT & CSE",
      "Modern labs",
      "National importance institute",
      "Close to Delhi border",
    ],
  },
  sbit: {
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
    summary:
      "Shri Balwant Institute of Technology is a leading engineering college.",
    history: "Founded to provide quality engineering education near Delhi NCR.",
    geography: "Located on Meerut Road (Pallri), Sonepat.",
    facts: ["20-acre campus", "B.Tech programs", "Well-equipped labs"],
  },
};

DEMO_CENTER.knowledgeBase = SONEPAT_KNOWLEDGE_BASE;

// ==============================
// SMART INTENT RECOGNITION
// ==============================

// Define intent patterns
const INTENT_PATTERNS = {
  study: [
    "study",
    "college",
    "university",
    "engineering",
    "btech",
    "education",
    "learn",
    "class",
    "course",
    "sbit",
    "iiit",
    "jindal",
  ],
  food: [
    "food",
    "eat",
    "restaurant",
    "dhaba",
    "lunch",
    "dinner",
    "breakfast",
    "hungry",
    "cafe",
    "golden hut",
  ],
  travel: [
    "travel",
    "go to",
    "reach",
    "bhopal",
    "delhi",
    "panipat",
    "railway",
    "station",
    "train",
    "bus",
    "transport",
    "journey",
    "punjab",
    "chandigarh",
  ],
  hospital: [
    "hospital",
    "doctor",
    "medical",
    "health",
    "sick",
    "fims",
    "clinic",
    "emergency",
  ],
  gym: [
    "gym",
    "workout",
    "exercise",
    "fitness",
    "body",
    "health",
    "o2",
    "o2 gym",
    "muscle",
  ],
  market: [
    "market",
    "shop",
    "shopping",
    "buy",
    "store",
    "mall",
    "bahalgarh",
    "chowk",
  ],
};

// Extract intent from query
function extractIntent(query) {
  const q = query.toLowerCase();
  const intents = [];

  for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
    for (const keyword of keywords) {
      if (q.includes(keyword)) {
        intents.push(intent);
        break;
      }
    }
  }

  return [...new Set(intents)]; // Remove duplicates
}

// Find places matching intent
function findPlacesByIntent(intent) {
  switch (intent) {
    case "study":
      return DEMO_CENTER.nearbyPlaces.filter(
        (p) =>
          p.categories?.includes("college") ||
          p.categories?.includes("education") ||
          p.categories?.includes("university") ||
          p.categories?.includes("engineering") ||
          p.categories?.includes("it")
      );
    case "food":
      return DEMO_CENTER.nearbyPlaces.filter(
        (p) =>
          p.categories?.includes("food") ||
          p.categories?.includes("restaurant") ||
          p.categories?.includes("dhaba")
      );
    case "travel":
      return DEMO_CENTER.nearbyPlaces.filter(
        (p) =>
          p.categories?.includes("transport") ||
          p.categories?.includes("railway") ||
          p.categories?.includes("travel")
      );
    case "hospital":
      return DEMO_CENTER.nearbyPlaces.filter(
        (p) =>
          p.categories?.includes("hospital") ||
          p.categories?.includes("medical") ||
          p.categories?.includes("healthcare")
      );
    case "gym":
      return DEMO_CENTER.nearbyPlaces.filter(
        (p) =>
          p.categories?.includes("fitness") ||
          p.categories?.includes("gym") ||
          p.categories?.includes("health")
      );
    case "market":
      return DEMO_CENTER.nearbyPlaces.filter(
        (p) =>
          p.categories?.includes("market") || p.categories?.includes("shopping")
      );
    default:
      return [];
  }
}

// Smart place matching with intent understanding
function smartPlaceMatch(query) {
  if (!query) return null;

  const q = query.toLowerCase();
  const intents = extractIntent(q);

  // First try exact name matching
  for (const place of DEMO_CENTER.nearbyPlaces) {
    if (
      q.includes(place.name.toLowerCase()) ||
      place.keywords.some((k) => q.includes(k.toLowerCase()))
    ) {
      return {
        type: "exact",
        place: place,
        confidence: 1.0,
      };
    }
  }

  // If travel intent (including Punjab, Bhopal, etc.)
  if (
    intents.includes("travel") ||
    q.includes("punjab") ||
    q.includes("chandigarh") ||
    q.includes("bhopal") ||
    q.includes("delhi")
  ) {
    const railway = DEMO_CENTER.nearbyPlaces.find(
      (p) => p.id === "sonepat_junction"
    );
    return {
      type: "intent",
      place: railway,
      intent: "travel",
      confidence: 0.9,
      message: `To travel to other cities, you can take a train from **Sonepat Junction Railway Station**.`,
    };
  }

  // If gym intent
  if (intents.includes("gym") || q.includes("o2") || q.includes("gym")) {
    const gym = DEMO_CENTER.nearbyPlaces.find((p) => p.id === "O2_GYM");
    return {
      type: "intent",
      place: gym,
      intent: "gym",
      confidence: 0.95,
      message: `For your fitness needs, here's the nearest gym:`,
    };
  }

  // If study/college intent
  if (intents.includes("study")) {
    const colleges = findPlacesByIntent("study");
    if (colleges.length > 0) {
      // Find nearest college
      if (lastUserLatLng) {
        const withDist = colleges.map((p) => ({
          ...p,
          distance: haversineDistanceMeters(
            lastUserLatLng.lat,
            lastUserLatLng.lng,
            p.lat,
            p.lng
          ),
        }));
        withDist.sort((a, b) => a.distance - b.distance);
        return {
          type: "intent",
          place: withDist[0],
          alternatives: withDist.slice(1, 3),
          intent: "study",
          confidence: 0.85,
          message: `For your study needs, here's the nearest college:`,
        };
      }
      return {
        type: "intent",
        place: colleges[0],
        alternatives: colleges.slice(1, 3),
        intent: "study",
        confidence: 0.8,
      };
    }
  }

  // If food intent
  if (intents.includes("food")) {
    const foodPlaces = findPlacesByIntent("food");
    if (foodPlaces.length > 0) {
      if (lastUserLatLng) {
        const withDist = foodPlaces.map((p) => ({
          ...p,
          distance: haversineDistanceMeters(
            lastUserLatLng.lat,
            lastUserLatLng.lng,
            p.lat,
            p.lng
          ),
        }));
        withDist.sort((a, b) => a.distance - b.distance);
        return {
          type: "intent",
          place: withDist[0],
          alternatives: withDist.slice(1, 3),
          intent: "food",
          confidence: 0.85,
        };
      }
      return {
        type: "intent",
        place: foodPlaces[0],
        alternatives: foodPlaces.slice(1, 3),
        intent: "food",
        confidence: 0.8,
      };
    }
  }

  // If hospital intent
  if (intents.includes("hospital")) {
    const hospitals = findPlacesByIntent("hospital");
    if (hospitals.length > 0) {
      return {
        type: "intent",
        place: hospitals[0],
        intent: "hospital",
        confidence: 0.9,
      };
    }
  }

  // If market intent
  if (intents.includes("market")) {
    const markets = findPlacesByIntent("market");
    if (markets.length > 0) {
      return {
        type: "intent",
        place: markets[0],
        intent: "market",
        confidence: 0.9,
      };
    }
  }

  // No match found - return null to fallback to Gemini
  return null;
}

// ==============================
// Utility Functions
// ==============================

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return NaN;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

function formatDistance(meters) {
  if (!isFinite(meters)) return "-- m";
  if (meters >= 1000) {
    return (meters / 1000).toFixed(2) + " km";
  }
  return Math.round(meters) + " m";
}

function determineZone(distanceMeters) {
  if (!isFinite(distanceMeters)) return "unknown";
  if (distanceMeters > FAR_THRESHOLD) return "far";
  if (distanceMeters >= INSIDE_THRESHOLD && distanceMeters <= FAR_THRESHOLD)
    return "near";
  if (distanceMeters < INSIDE_THRESHOLD) return "inside";
  return "unknown";
}

function findNearestPlace(userLat, userLng, places) {
  if (!places || places.length === 0 || userLat == null || userLng == null) {
    return null;
  }
  let best = null;
  let bestDist = Infinity;
  for (const place of places) {
    const d = haversineDistanceMeters(userLat, userLng, place.lat, place.lng);
    if (d < bestDist) {
      bestDist = d;
      best = { ...place, distance: d };
    }
  }
  return best;
}

// ORIGINAL TOP 3 NEARBY FAMOUS PLACES - Realtime updates as you move
function getTop3NearbyFamous(userLat, userLng) {
  const allPlaces = DEMO_CENTER.nearbyPlaces.filter((p) => p.famous).slice();
  if (userLat == null || userLng == null) return [];
  const withDist = allPlaces.map((p) => ({
    ...p,
    distance: haversineDistanceMeters(userLat, userLng, p.lat, p.lng),
  }));
  withDist.sort((a, b) => a.distance - b.distance);
  return withDist.slice(0, 3);
}

// Get all nearby places (including non-famous)
function getAllNearbyPlaces(userLat, userLng) {
  const allPlaces = DEMO_CENTER.nearbyPlaces.slice();
  if (userLat == null || userLng == null) return [];
  const withDist = allPlaces.map((p) => ({
    ...p,
    distance: haversineDistanceMeters(userLat, userLng, p.lat, p.lng),
  }));
  withDist.sort((a, b) => a.distance - b.distance);
  return withDist;
}

// ==============================
// SMART PLACE MATCHING
// ==============================

// Calculate similarity between two strings
function stringSimilarity(str1, str2) {
  str1 = str1.toLowerCase();
  str2 = str2.toLowerCase();

  // Exact match
  if (str1 === str2) return 1.0;

  // Contains match
  if (str1.includes(str2) || str2.includes(str1)) return 0.8;

  // Check word matches
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);

  let matches = 0;
  for (const w1 of words1) {
    if (w1.length < 3) continue;
    for (const w2 of words2) {
      if (w2.length < 3) continue;
      if (w1 === w2) matches++;
      else if (w1.includes(w2) || w2.includes(w1)) matches += 0.5;
    }
  }

  return matches / Math.max(words1.length, words2.length);
}

// Find best matching place for a query
function findBestMatchingPlace(query) {
  if (!query) return null;

  const queryLower = query.toLowerCase().trim();
  const places = DEMO_CENTER.nearbyPlaces;

  let bestMatch = null;
  let bestScore = 0;
  let matches = [];

  for (const place of places) {
    // Check direct name match
    const nameScore = stringSimilarity(place.name, queryLower);

    // Check keywords
    let keywordScore = 0;
    if (place.keywords) {
      for (const keyword of place.keywords) {
        if (queryLower.includes(keyword.toLowerCase())) {
          keywordScore = 0.9;
          break;
        }
      }
    }

    // Check ID
    const idScore = queryLower.includes(place.id.toLowerCase()) ? 0.7 : 0;

    const score = Math.max(nameScore, keywordScore, idScore);

    if (score > 0.3) {
      matches.push({ place, score });
      if (score > bestScore) {
        bestScore = score;
        bestMatch = place;
      }
    }
  }

  matches.sort((a, b) => b.score - a.score);

  return {
    exactMatch: bestScore > 0.8 ? bestMatch : null,
    possibleMatches: matches.slice(0, 3).map((m) => m.place),
    allMatches: matches,
  };
}

// ==============================
// ARRIVAL DETECTION
// ==============================

// Check if user has arrived at a place
function checkArrival(userLat, userLng) {
  if (!userLat || !userLng) return;

  const allPlaces = DEMO_CENTER.nearbyPlaces;
  let arrivedPlace = null;

  for (const place of allPlaces) {
    const distance = haversineDistanceMeters(
      userLat,
      userLng,
      place.lat,
      place.lng
    );
    if (distance <= ARRIVAL_THRESHOLD && !visitedPlaces.has(place.id)) {
      arrivedPlace = place;
      visitedPlaces.add(place.id);
      break;
    }
  }

  if (arrivedPlace) {
    showArrivalNotification(arrivedPlace);
    setArrivedPlace(arrivedPlace);

    setTimeout(() => {
      suggestNearbyPlaces(userLat, userLng, arrivedPlace);
    }, 3000);
  }
}

function setArrivedPlace(place) {
  if (place) {
    currentDestination = place;
    showSelectedPlace(
      place,
      lastUserLatLng.lat,
      lastUserLatLng.lng,
      "You've arrived at your destination!"
    );
    setArrivedPlaceInfo(place);
  }
}

function setArrivedPlaceInfo(place) {
  const moreinfo = document.createElement("div");
  moreinfo.className = "arrival-notification";

  moreinfo.innerHTML = `
    <div style="margin-top:10px;">
      <button 
        style="
          padding:10px 18px;
          border:none;
          border-radius:20px;
          background:var(--accent-primary);
          color:white;
          font-weight:600;
          cursor:pointer;
        "
        onclick="openPlaceModal('${place.id}')">
        📖 More Info
      </button>
    </div>
  `;

  document.body.appendChild(moreinfo);

  setTimeout(() => {
    if (moreinfo.parentElement) {
      moreinfo.remove();
    }
  }, 8000);
}

window.openPlaceModal = function (placeId) {
  const data = PLACE_DETAILED_INFO[placeId];
  if (!data) return;

  document.getElementById("placeModal").style.display = "flex";
  document.getElementById(
    "placeModalImage"
  ).style.backgroundImage = `url(${data.image})`;
  document.getElementById("placeModalTitle").innerText = placeId
    .replace("_", " ")
    .toUpperCase();
  document.getElementById("placeModalSummary").innerText = data.summary;
  document.getElementById("placeModalHistory").innerText = data.history;
  document.getElementById("placeModalGeography").innerText = data.geography;

  const factsList = document.getElementById("placeModalFacts");
  factsList.innerHTML = "";
  data.facts.forEach((f) => {
    const li = document.createElement("li");
    li.innerText = f;
    factsList.appendChild(li);
  });

  document.getElementById("modalRouteBtn").onclick = function () {
    const place = DEMO_CENTER.nearbyPlaces.find((p) => p.id === placeId);
    if (place) showRouteOnOSM(place.lat, place.lng, place.name);
  };
};

window.closePlaceModal = function () {
  document.getElementById("placeModal").style.display = "none";
};

// Show arrival notification
function showArrivalNotification(place) {
  const notification = document.createElement("div");
  notification.className = "arrival-notification";
  notification.innerHTML = `
    <div class="arrival-content">
      <i class="fas fa-map-pin" style="color: var(--success); font-size: 1.5rem;"></i>
      <div>
        <h4>🎉 You've arrived at ${place.name}!</h4>
        <p>${place.description}</p>
      </div>
    </div>
    <button class="close-notification" onclick="this.parentElement.remove()">✕</button>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 8000);

  appendMessage({
    text: `🎉 **You've arrived at ${place.name}!**\n\n${place.description}\n\nWould you like to visit other nearby places?`,
    sender: "bot",
    meta: { source: "Arrival Detector", time: new Date().toLocaleTimeString() },
  });

  speak(`Welcome to ${place.name}! You have arrived at your destination.`);
}

// Suggest nearby places after arrival
function suggestNearbyPlaces(userLat, userLng, currentPlace) {
  const allPlaces = getAllNearbyPlaces(userLat, userLng);
  const otherPlaces = allPlaces
    .filter((p) => p.id !== currentPlace.id)
    .slice(0, 3);

  let suggestions =
    "🗺️ **While you're here, you might also want to visit:**\n\n";
  otherPlaces.forEach((place, index) => {
    const dist = formatDistance(place.distance);
    suggestions += `${index + 1}. **${place.name}** - ${dist} away\n`;
    suggestions += `   💡 ${place.description}\n\n`;
  });

  suggestions += "Click on any place in the map or ask me to show the route!";

  appendMessage({
    text: suggestions,
    sender: "bot",
    meta: { source: "Tour Guide", time: new Date().toLocaleTimeString() },
  });
}

// ==============================
// SELECTED PLACE PANEL
// ==============================

// Show selected place details with distance
function showSelectedPlace(place, userLat, userLng, intentMessage = null) {
  if (!selectedPlacePanel || !selectedPlaceDetails) return;

  const distance = haversineDistanceMeters(
    userLat,
    userLng,
    place.lat,
    place.lng
  );
  const formattedDist = formatDistance(distance);
  const walkingTime = Math.round(distance / 80);
  const drivingTime = Math.round(distance / 200);
  const cyclingTime = Math.round(distance / 167);
  const steps = Math.round(distance / 0.75);
  const isArrived = distance <= ARRIVAL_THRESHOLD;

  let arrivalBadge = "";
  if (isArrived) {
    arrivalBadge =
      '<span style="background: var(--success); color: white; padding: 4px 8px; border-radius: var(--radius-pill); font-size: 0.7rem; margin-left: 8px;"><i class="fas fa-check-circle"></i> You are here!</span>';
  } else if (visitedPlaces.has(place.id)) {
    arrivalBadge =
      '<span style="background: var(--info); color: white; padding: 4px 8px; border-radius: var(--radius-pill); font-size: 0.7rem; margin-left: 8px;"><i class="fas fa-history"></i> Visited</span>';
  }

  let intentHeader = "";
  if (intentMessage) {
    intentHeader = `<div style="color: var(--accent-primary); margin-bottom: 10px; font-size: 0.9rem;"><i class="fas fa-lightbulb"></i> ${intentMessage}</div>`;
  }

  selectedPlaceDetails.innerHTML = `
    ${intentHeader}
    <div class="place-name">
      <i class="fas fa-map-marker-alt"></i>
      ${escapeHtml(place.name)} ${arrivalBadge}
    </div>
    <div class="place-description">
      ${escapeHtml(place.description)}
    </div>
    <div class="distance-info">
      <div class="distance-card">
        <i class="fas fa-route"></i>
        <div class="label">Distance</div>
        <div class="value">${formattedDist}</div>
      </div>
      <div class="distance-card">
        <i class="fas fa-clock"></i>
        <div class="label">Walking</div>
        <div class="value">${walkingTime} min</div>
        <div class="sub-value">${steps.toLocaleString()} steps</div>
      </div>
      <div class="distance-card">
        <i class="fas fa-car"></i>
        <div class="label">Driving</div>
        <div class="value">${drivingTime} min</div>
        <div class="sub-value">~${(distance / 1000).toFixed(2)} km</div>
      </div>
      <div class="distance-card">
        <i class="fas fa-bicycle"></i>
        <div class="label">Cycling</div>
        <div class="value">${cyclingTime} min</div>
        <div class="sub-value">~10 km/h</div>
      </div>
    </div>
    <div class="navigate-buttons">
      <button class="navigate-btn osm" onclick="showRouteOnOSM(${place.lat}, ${
    place.lng
  }, '${place.name.replace(/'/g, "\\'")}')">
        <i class="fas fa-map-marked-alt"></i> Show Route (OSM)
      </button>
      <button class="navigate-btn google" onclick="openGoogleMaps(${
        place.lat
      }, ${place.lng}, '${place.name.replace(/'/g, "\\'")}')">
        <i class="fab fa-google"></i> Google Maps
      </button>
    </div>
    <button class="close-panel" onclick="hideSelectedPlace()">
      <i class="fas fa-times"></i> Close
    </button>
  `;

  selectedPlacePanel.style.display = "block";
  selectedPlacePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Hide selected place panel
function hideSelectedPlace() {
  if (selectedPlacePanel) {
    selectedPlacePanel.style.display = "none";
  }
}

// ==============================
// NAVIGATION FUNCTIONS
// ==============================

// 1. TOP 3 LIST - Opens Google Maps (for full navigation)
function openGoogleMaps(lat, lng, name) {
  if (!lastUserLatLng) {
    speak("Please enable location to get directions.");
    appendMessage({
      text: "📍 Please enable location access to get directions.",
      sender: "bot",
      meta: { source: "Navigation" },
    });
    return;
  }

  const url = `https://www.google.com/maps/dir/${lastUserLatLng.lat},${lastUserLatLng.lng}/${lat},${lng}`;
  window.open(url, "_blank");

  speak(`Opening Google Maps with directions to ${name}.`);

  appendMessage({
    text:
      `🗺️ **Google Maps opened for ${name}**\n` +
      `[Click here if not redirected](${url})`,
    sender: "bot",
    meta: { source: "Google Maps", time: new Date().toLocaleTimeString() },
  });
}

// 2. Show route on OSM map
function showRouteOnOSM(lat, lng, name) {
  if (!lastUserLatLng) {
    speak("Please enable location to see route.");
    return;
  }

  currentDestination = { lat, lng, name };

  if (routingControl) {
    mapInstance.removeControl(routingControl);
  }

  if (distanceMarkers.length > 0) {
    distanceMarkers.forEach((marker) => mapInstance.removeLayer(marker));
    distanceMarkers = [];
  }

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(lastUserLatLng.lat, lastUserLatLng.lng),
      L.latLng(lat, lng),
    ],
    routeWhileDragging: false,
    showAlternatives: false,
    fitSelectedRoutes: true,
    addWaypoints: false,
    draggableWaypoints: false,
    collapsible: true,
    collapsed: true,
    createMarker: function (i, wp) {
      if (i === 0) {
        return null;
      }
      return L.marker(wp.latLng);
    },
    lineOptions: {
      styles: [{ color: "#38bdf8", opacity: 0.9, weight: 6 }],
    },
    router: L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1",
      profile: "driving",
    }),
  }).addTo(mapInstance);

  routingControl.on("routesfound", function (e) {
    const routes = e.routes;
    const route = routes[0];
    const distance = (route.summary.totalDistance / 1000).toFixed(2);
    const time = Math.round(route.summary.totalTime / 60);

    appendMessage({
      text:
        `📍 **Route to ${name}**\n` +
        `Distance: ${distance} km\n` +
        `Time: ~${time} min\n` +
        `Follow the blue line on map.`,
      sender: "bot",
      meta: { source: "OSM Route", time: new Date().toLocaleTimeString() },
    });

    speak(
      `Route to ${name} found. Distance ${distance} kilometers, approximately ${time} minutes.`
    );
  });
}

// Update Top 3 panel - ALL CLICKS SHOW ROUTE ON MAP
function updateTop3Panel(top3) {
  if (!top3ListEl) return;
  if (!top3 || top3.length === 0) {
    top3ListEl.innerHTML =
      '<div class="top3-placeholder">Enable location to see nearest places</div>';
    return;
  }
  top3ListEl.innerHTML = "";
  top3.forEach((place) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "top3-item";
    row.innerHTML =
      '<span class="top3-item-name"><i class="fas fa-map-marker-alt"></i>' +
      escapeHtml(place.name) +
      "</span>" +
      '<span class="top3-item-dist">You are ' +
      formatDistance(place.distance) +
      " away</span>";
    row.addEventListener("click", () => {
      showRouteOnOSM(place.lat, place.lng, place.name);
      if (lastUserLatLng) {
        showSelectedPlace(place, lastUserLatLng.lat, lastUserLatLng.lng);
      }
    });
    top3ListEl.appendChild(row);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Clear current route from OSM map
function clearRoute() {
  if (routingControl) {
    mapInstance.removeControl(routingControl);
    routingControl = null;
  }

  if (distanceMarkers.length > 0) {
    distanceMarkers.forEach((marker) => mapInstance.removeLayer(marker));
    distanceMarkers = [];
  }

  currentDestination = null;
  pendingRouteForPlace = null;

  appendMessage({
    text: "🧭 Route cleared from OSM map.",
    sender: "bot",
    meta: { source: "Navigation" },
  });
}

// ==============================
// RAG: Retrieval System
// ==============================

function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function tokenize(text) {
  return normalizeText(text)
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function retrieveRelevantChunks(query, maxChunks = 3) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];
  const kb = DEMO_CENTER.knowledgeBase;
  const scored = kb.map((chunk) => {
    const textTokens = tokenize(chunk.text);
    const tokenSet = new Set(textTokens);
    let score = 0;
    for (const token of queryTokens) {
      if (tokenSet.has(token)) score += 1;
    }
    return { chunk, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter((item) => item.score > 0)
    .slice(0, maxChunks)
    .map((item) => item.chunk);
}

// ==============================
// Amenities Search
// ==============================

function searchAmenities(query, userLat, userLng, type = null, maxResults = 5) {
  let allAmenities = [];
  for (const category in AMENITIES_DATABASE) {
    allAmenities = allAmenities.concat(AMENITIES_DATABASE[category]);
  }
  let filtered = type
    ? allAmenities.filter((a) => a.type === type || a.subtype === type)
    : allAmenities;
  const withDistance = filtered.map((item) => {
    const distance = haversineDistanceMeters(
      userLat,
      userLng,
      item.lat,
      item.lng
    );
    return { ...item, distance };
  });
  withDistance.sort((a, b) => a.distance - b.distance);
  return withDistance.slice(0, maxResults);
}

function searchAttractions(userLat, userLng, maxResults = 5) {
  const attractions = AMENITIES_DATABASE.attractions.map((item) => {
    const distance = haversineDistanceMeters(
      userLat,
      userLng,
      item.lat,
      item.lng
    );
    return { ...item, distance };
  });
  attractions.sort((a, b) => a.distance - b.distance);
  return attractions.slice(0, maxResults);
}

function getRedditReviews(query, category = null) {
  const normalizedQuery = query.toLowerCase();
  let results = [];
  for (const cat in REDDIT_REVIEWS_DATABASE) {
    if (category && cat !== category) continue;
    const reviews = REDDIT_REVIEWS_DATABASE[cat];
    reviews.forEach((review) => {
      if (
        review.text.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(cat)
      ) {
        results.push({ ...review, category: cat });
      }
    });
  }
  if (results.length === 0 && !category) {
    for (const cat in REDDIT_REVIEWS_DATABASE) {
      results = results.concat(REDDIT_REVIEWS_DATABASE[cat].slice(0, 1));
    }
  }
  return results.slice(0, 3);
}

function formatAmenityResponse(
  items,
  type,
  userLat,
  userLng,
  includeReviews = true
) {
  if (items.length === 0) return `No ${type} found near you.`;
  let response = `📍 **${items.length} ${type} found near you:**\n\n`;
  items.forEach((item, index) => {
    const distance = formatDistance(item.distance);
    const walkingTime = Math.round(item.distance / 80);
    response += `**${index + 1}. ${
      item.name
    }** — ${distance} (${walkingTime} min walk)\n`;
    response += `📍 ${item.landmark || "Sonepat area"}\n`;
    if (item.price)
      response += `💰 ${item.price === "Free" ? "Free" : item.price}\n`;
    if (item.hours) response += `⏰ ${item.hours}\n`;
    if (includeReviews && item.reviews) {
      response += `⭐ ${item.reviews.rating}/5 (${item.reviews.count} reviews)\n`;
      response += `💬 "${item.reviews.recent}"\n`;
    }
    response += `[Show Route](javascript:showRouteOnOSM(${item.lat},${item.lng},'${item.name}'))\n\n`;
  });
  response += `Would you like me to show the route to any of these?`;
  return response;
}

function formatAttractionResponse(attractions) {
  if (attractions.length === 0) return "No nearby attractions found.";
  let response = `🏛️ **Places Near You (Sonepat Demo):**\n\n`;
  attractions.forEach((attraction, index) => {
    const distance = formatDistance(attraction.distance);
    const walkingTime = Math.round(attraction.distance / 80);
    response += `**${index + 1}. ${
      attraction.name
    }** — ${distance} (${walkingTime} min walk)\n`;
    response += `📝 ${
      (attraction.type || "").charAt(0).toUpperCase() +
      (attraction.type || "").slice(1)
    }\n`;
    if (attraction.entryFee) response += `🎟️ ${attraction.entryFee}\n`;
    if (attraction.hours) response += `⏰ ${attraction.hours}\n`;
    if (attraction.reviews) {
      response += `⭐ ${attraction.reviews.rating}/5 — "${attraction.reviews.recent}"\n`;
    }
    response += `[Show Route](javascript:showRouteOnOSM(${attraction.lat},${
      attraction.lng
    },'${attraction.name.replace(/'/g, "\\'")}'))\n\n`;
  });
  return response;
}

// ==============================
// Gemini API Integration
// ==============================

async function callGeminiWithRag({
  userMessage,
  distanceMeters,
  zone,
  retrievedChunks,
}) {
  const distanceText = formatDistance(distanceMeters);
  const contextText =
    retrievedChunks && retrievedChunks.length
      ? retrievedChunks.map((c) => `- [${c.id}] ${c.text}`).join("\n\n")
      : "No specific location context found.";

  const lastTurns = conversationHistory.slice(-5);
  const historyText =
    lastTurns.length === 0
      ? "No previous conversation."
      : lastTurns
          .map((turn) => `${turn.role.toUpperCase()}: ${turn.text}`)
          .join("\n");

  const nearbyPlaces = lastUserLatLng
    ? getTop3NearbyFamous(lastUserLatLng.lat, lastUserLatLng.lng)
        .map((p) => `${p.name} (${formatDistance(p.distance)})`)
        .join(", ")
    : "unknown (enable location to see nearby places)";

  const prompt = `
You are a friendly and helpful local guide for the Sonepat area in Haryana, India. The user's demo center is Supermax, Sector 33, Sonepat.
You know about these local places: Supermax, SBIT (Engineering College), IIIT Sonepat, O2 Gym, FIMS Hospital, Sonepat Junction (Railway Station), Golden Hut (Restaurant), O.P. Jindal Global University, and Bahalgarh Market.

Current Context:
- User Distance From Demo Center (Supermax): ${distanceText}
- User Zone: ${zone.toUpperCase()} (far, near, or inside)
- Nearby Famous Places: ${nearbyPlaces}

Conversation History (last 5 turns):
${historyText}

User Question:
"${userMessage}"

Instructions for your response:
1. Be conversational, friendly, and helpful.
2. If the question is about Sonepat or the listed local places, provide specific, helpful information (like distances, how to reach, what's special).
3. If the question is a general greeting or casual chat (like "hello", "how are you", "bhai"), respond in a friendly manner.
4. If the question is about something outside Sonepat (like "I want to go to Punjab"), provide helpful general advice (like suggesting the railway station to start the journey) while keeping it light.
5. Keep responses concise but informative. Use emojis where appropriate.
6. If you mention a specific local place, offer to show the route on the map.

Now, provide your response:
`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };

  const modelAttempts = [
    { version: "v1beta", model: "gemini-2.5-flash" },
    { version: "v1", model: "gemini-2.5-flash" },
    { version: "v1beta", model: "gemini-2.0-flash" },
    { version: "v1", model: "gemini-2.0-flash" },
  ];

  let response = null;
  let lastError = null;
  for (const attempt of modelAttempts) {
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/${attempt.version}/models/${attempt.model}:generateContent?key=` +
          encodeURIComponent(GEMINI_API_KEY),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (response.ok) break;
      if (response.status !== 404) break;
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  if (!response) {
    throw new Error(
      `Failed to connect to Gemini API: ${
        lastError?.message || "Unknown error"
      }`
    );
  }
  if (!response.ok) {
    let errorText = "";
    try {
      errorText = await response.text();
      const errorData = JSON.parse(errorText);
      throw new Error(
        `Gemini API error: ${response.status}. ${
          errorData?.error?.message || errorText
        }`
      );
    } catch (parseErr) {
      throw new Error(
        `Gemini API error: ${response.status}. ${errorText || parseErr.message}`
      );
    }
  }

  const data = await response.json();
  const candidates = data.candidates || [];
  const first = candidates[0];
  if (
    !first ||
    !first.content ||
    !first.content.parts ||
    !first.content.parts.length
  ) {
    throw new Error("Gemini returned an empty response.");
  }
  const text = first.content.parts.map((p) => p.text || "").join("\n");
  return text.trim();
}

// ==============================
// Amenity & Route Detection
// ==============================

function isAmenityQuery(text) {
  const q = text.toLowerCase();
  const patterns = {
    water: ["water", "drink", "thirsty", "drinking water", "bottle"],
    toilet: ["toilet", "restroom", "washroom", "bathroom", "wc", "loo"],
    food: [
      "food",
      "eat",
      "hungry",
      "snacks",
      "lunch",
      "dinner",
      "meal",
      "samosa",
      "chai",
      "cafe",
    ],
    cafe: ["cafe", "coffee", "chai", "tea", "cold drink"],
    shopping: [
      "shop",
      "souvenir",
      "buy",
      "gift",
      "shopping",
      "market",
      "store",
    ],
    attraction: [
      "attraction",
      "visit",
      "see",
      "sightseeing",
      "tourist spot",
      "sbit",
      "iiit",
      "gym",
      "nearby",
      "places",
    ],
    reddit: ["reddit", "review", "reviews", "people say", "rating"],
  };
  for (const [type, keywords] of Object.entries(patterns)) {
    if (keywords.some((k) => q.includes(k))) return type;
  }
  return null;
}

function isRouteQuery(text) {
  const q = text.toLowerCase();
  const patterns = [
    "how do i reach",
    "how can i reach",
    "how to reach",
    "how to get",
    "directions",
    "navigation",
    "navigate",
    "route to",
    "go to",
    "take me to",
    "show me the way",
  ];
  return patterns.some((p) => q.includes(p));
}

function extractPlaceFromQuery(text) {
  const q = text.toLowerCase();
  const places = DEMO_CENTER.nearbyPlaces;

  for (const place of places) {
    if (
      q.includes(place.name.toLowerCase()) ||
      place.keywords.some((k) => q.includes(k.toLowerCase()))
    ) {
      return place;
    }
  }
  return null;
}

function buildRouteAnswer(distanceMeters, zone) {
  const distanceText = formatDistance(distanceMeters);
  let zoneNote = "";
  if (zone === "far")
    zoneNote = `📍 You are ${distanceText} from demo center (Supermax).`;
  else if (zone === "near")
    zoneNote = `📍 You are ${distanceText} from Supermax — very close!`;
  else if (zone === "inside")
    zoneNote = `📍 You are at/near the demo center (Supermax, Sector 33).`;
  else zoneNote = `📍 Directions from your location:`;

  return [
    zoneNote,
    ``,
    `🚗 **To SBIT:** Meerut Road (Pallri), ~1.5 km from Supermax. Auto/bike available.`,
    `🚗 **To IIIT Sonepat:** Rajiv Gandhi Education City, ~8 km. Take shared auto or bus towards RGEC.`,
    `🚂 **Sonepat Junction:** ~6 km. Buses and autos from Stadium Road.`,
    `💪 **To O2 Gym:** Just 500m from Supermax, walking distance.`,
    ``,
    `💡 **Demo tip:** Click any place in Top 3 or ask me to "show route to [place]" to see it on map!`,
  ].join("\n");
}

// ==============================
// UI Helpers
// ==============================

function appendMessage({ text, sender, meta, isTyping }) {
  const row = document.createElement("div");
  row.className = `message-row ${sender === "user" ? "user" : "bot"}`;
  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  if (isTyping) {
    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.innerHTML =
      '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    bubble.appendChild(typing);
  } else {
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");

    bubble.innerHTML = formattedText;
  }
  row.appendChild(bubble);
  if (meta) {
    const metaRow = document.createElement("div");
    metaRow.className = "message-meta";
    if (meta.time) {
      const timeSpan = document.createElement("span");
      timeSpan.textContent = meta.time;
      metaRow.appendChild(timeSpan);
    }
    if (meta.source) {
      const sourceSpan = document.createElement("span");
      sourceSpan.className = "message-source";
      sourceSpan.textContent = meta.source;
      metaRow.appendChild(sourceSpan);
    }
    bubble.appendChild(metaRow);
  }
  chatWindowEl.appendChild(row);
  chatWindowEl.scrollTop = chatWindowEl.scrollHeight;
  return { row, bubble };
}

function showSystemChip(text) {
  const chip = document.createElement("div");
  chip.className = "system-chip";
  chip.innerHTML = text;
  chatWindowEl.appendChild(chip);
  chatWindowEl.scrollTop = chatWindowEl.scrollHeight;
}

function updateZoneDisplay(zone) {
  zoneDisplayEl.classList.remove("zone-far", "zone-near", "zone-inside");
  let label = "Unknown";
  if (zone === "far") {
    label = "Far from demo center";
    zoneDisplayEl.classList.add("zone-far");
  } else if (zone === "near") {
    label = "Near Supermax";
    zoneDisplayEl.classList.add("zone-near");
  } else if (zone === "inside") {
    label = "At Supermax / Sector 33";
    zoneDisplayEl.classList.add("zone-inside");
  }
  zoneDisplayEl.textContent = label;
}

function speak(text) {
  if (!speechEnabled) return;
  if (!("speechSynthesis" in window) || !text) return;
  const plainText = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const utterance = new SpeechSynthesisUtterance(plainText);
  utterance.lang = "en-IN";
  utterance.rate = 0.9;
  const voices = window.speechSynthesis.getVoices() || [];
  const preferred = voices.find(
    (v) => /en-IN|en-GB/.test(v.lang) && v.name.includes("Google")
  );
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// ==============================
// Proactive Zone Logic (Demo)
// ==============================

async function handleZoneChange(newZone, distanceMeters) {
  if (newZone === lastZone) return;
  lastZone = newZone;

  let proactivePrompt = "";
  let uiChip = "";
  const userLat = lastUserLatLng ? lastUserLatLng.lat : null;
  const userLng = lastUserLatLng ? lastUserLatLng.lng : null;

  const top3 = getTop3NearbyFamous(userLat, userLng);
  const top3Text =
    top3.length > 0
      ? top3
          .map((p, i) => `${i + 1}. ${p.name} (${formatDistance(p.distance)})`)
          .join(" | ")
      : "";

  if (newZone === "far") {
    uiChip =
      "🚶 You are far from Supermax. " +
      (top3Text ? "Top 3 nearby: " + top3Text : "");
    proactivePrompt =
      "The user is far from Supermax. Recommend these top 3 nearby places and ask if they want to see routes: " +
      top3.map((p) => p.name + " – " + formatDistance(p.distance)).join(", ");
  } else if (newZone === "near") {
    uiChip = "🏠 You are near Supermax! Top 3 nearby: " + top3Text;
    proactivePrompt =
      "The user is close to Supermax. Suggest visiting these places and offer to show routes: " +
      top3.map((p) => p.name + " – " + formatDistance(p.distance)).join(", ");
  } else if (newZone === "inside") {
    uiChip = "✨ You are at Supermax! Top 3 nearby: " + top3Text;
    proactivePrompt =
      "The user is at Supermax. Recommend these top 3 places to visit and ask if they want directions: " +
      top3.map((p) => p.name + " – " + formatDistance(p.distance)).join(", ");
  } else return;

  showSystemChip(uiChip);

  try {
    const relevantChunks = retrieveRelevantChunks(
      newZone === "far"
        ? "directions reach SBIT IIIT Sonepat"
        : newZone === "near"
        ? "Supermax Sector 33 amenities"
        : "Supermax Sector 33 water cafe toilet"
    );
    const reply = await callGeminiWithRag({
      userMessage: proactivePrompt,
      distanceMeters,
      zone: newZone,
      retrievedChunks: relevantChunks,
    });
    conversationHistory.push({ role: "user", text: proactivePrompt });
    conversationHistory.push({ role: "assistant", text: reply });
    appendMessage({
      text: reply,
      sender: "bot",
      meta: {
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        source: "Proactive guide",
      },
    });
    speak(reply);
  } catch (err) {
    console.error("Proactive Gemini error", err);
    appendMessage({
      text: "I'm here to help! You can ask me about any place or click on the map to see routes.",
      sender: "bot",
    });
  }
}

// ==============================
// Recommendations - UPDATES IN REALTIME AS YOU MOVE
// ==============================

function updateRecommendations(zone) {
  const userLat = lastUserLatLng ? lastUserLatLng.lat : null;
  const userLng = lastUserLatLng ? lastUserLatLng.lng : null;
  if (userLat == null || userLng == null) return;
  const top3 = getTop3NearbyFamous(userLat, userLng);
  updateTop3Panel(top3);
}

// ==============================
// Chat Handler
// ==============================

async function handleUserMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  appendMessage({
    text: trimmed,
    sender: "user",
    meta: {
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  });
  conversationHistory.push({ role: "user", text: trimmed });

  // Check if there's a pending route confirmation
  const lower = trimmed.toLowerCase();
  if (
    pendingRouteForPlace &&
    (lower === "yes" ||
      lower === "show route" ||
      lower === "yes show route" ||
      lower.includes("route") ||
      lower.includes("show me"))
  ) {
    const place = pendingRouteForPlace;
    showRouteOnOSM(place.lat, place.lng, place.name);
    showSelectedPlace(place, lastUserLatLng?.lat, lastUserLatLng?.lng);
    appendMessage({
      text: `📍 Showing route to **${place.name}** on the map!`,
      sender: "bot",
      meta: { time: new Date().toLocaleTimeString(), source: "Navigation" },
    });
    pendingRouteForPlace = null;
    return;
  }

  // Check if there's a pending confirmation
  if (pendingConfirmation) {
    const confirmationResult = handleConfirmation(trimmed);
    if (confirmationResult) {
      appendMessage({
        text: confirmationResult.text,
        sender: "bot",
        meta: { time: new Date().toLocaleTimeString(), source: "Place Info" },
      });

      if (confirmationResult.place && trimmed.toLowerCase() !== "no") {
        pendingRouteForPlace = confirmationResult.place;
        setTimeout(() => {
          appendMessage({
            text: `Would you like me to show the route to **${confirmationResult.place.name}** on the map? (say "yes" or "show route")`,
            sender: "bot",
            meta: {
              time: new Date().toLocaleTimeString(),
              source: "Navigation",
            },
          });
        }, 1000);
      }
      return;
    }
  }

  const distanceMeters =
    lastUserLatLng == null
      ? NaN
      : haversineDistanceMeters(
          lastUserLatLng.lat,
          lastUserLatLng.lng,
          DEMO_CENTER.lat,
          DEMO_CENTER.lng
        );

  // Check if asking for route to a specific place
  if (isRouteQuery(trimmed)) {
    const place = extractPlaceFromQuery(trimmed);
    if (place && lastUserLatLng) {
      showRouteOnOSM(place.lat, place.lng, place.name);
      showSelectedPlace(place, lastUserLatLng.lat, lastUserLatLng.lng);
      appendMessage({
        text: `📍 Showing route to **${place.name}** on the map!`,
        sender: "bot",
        meta: { time: new Date().toLocaleTimeString(), source: "Navigation" },
      });
      return;
    }
  }

  // Try smart matching with intent understanding
  const match = smartPlaceMatch(trimmed);

  if (match) {
    if (match.type === "exact") {
      showSelectedPlace(match.place, lastUserLatLng.lat, lastUserLatLng.lng);
      appendMessage({
        text: `📍 Here's information about **${match.place.name}**.\n\nWould you like me to show the route on map?`,
        sender: "bot",
        meta: { time: new Date().toLocaleTimeString(), source: "Place Search" },
      });
      pendingRouteForPlace = match.place;
      return;
    } else if (match.type === "intent") {
      let message =
        match.message ||
        `Based on your interest in **${match.intent}**, here's the nearest option:`;
      showSelectedPlace(
        match.place,
        lastUserLatLng.lat,
        lastUserLatLng.lng,
        message
      );

      if (match.alternatives && match.alternatives.length > 0) {
        setTimeout(() => {
          let altMessage = `\n\nOther nearby options:\n`;
          match.alternatives.forEach((p, i) => {
            const dist = formatDistance(
              haversineDistanceMeters(
                lastUserLatLng.lat,
                lastUserLatLng.lng,
                p.lat,
                p.lng
              )
            );
            altMessage += `${i + 1}. **${p.name}** - ${dist}\n`;
          });
          appendMessage({
            text: altMessage,
            sender: "bot",
            meta: {
              time: new Date().toLocaleTimeString(),
              source: "Alternatives",
            },
          });
        }, 1500);
      }

      pendingRouteForPlace = match.place;
      setTimeout(() => {
        appendMessage({
          text: `Would you like me to show the route to **${match.place.name}** on the map? (say "yes" or "show route")`,
          sender: "bot",
          meta: { time: new Date().toLocaleTimeString(), source: "Navigation" },
        });
      }, 2000);
      return;
    }
  }

  // Check for amenity queries
  const amenityType = isAmenityQuery(trimmed);
  if (amenityType && lastUserLatLng) {
    const userLat = lastUserLatLng.lat;
    const userLng = lastUserLatLng.lng;
    let reply = "";
    switch (amenityType) {
      case "water":
        reply = formatAmenityResponse(
          searchAmenities("water", userLat, userLng, "water", 5),
          "water",
          userLat,
          userLng
        );
        break;
      case "toilet":
        reply = formatAmenityResponse(
          searchAmenities("restroom", userLat, userLng, "restroom", 5),
          "restroom",
          userLat,
          userLng
        );
        break;
      case "food":
      case "cafe":
        const foodPlaces = [
          ...searchAmenities("food", userLat, userLng, "cafe", 3),
          ...searchAmenities("food", userLat, userLng, "food", 2),
        ];
        reply = formatAmenityResponse(foodPlaces, "cafe", userLat, userLng);
        break;
      case "shopping":
        reply = formatAmenityResponse(
          searchAmenities("shopping", userLat, userLng, "shopping", 5),
          "shopping",
          userLat,
          userLng
        );
        break;
      case "attraction":
        reply = formatAttractionResponse(
          searchAttractions(userLat, userLng, 5)
        );
        break;
    }
    if (reply) {
      appendMessage({
        text: reply,
        sender: "bot",
        meta: { time: new Date().toLocaleTimeString(), source: "Amenities" },
      });
      conversationHistory.push({ role: "assistant", text: reply });
      speak(reply);
    }
    return;
  }

  // For everything else, use Gemini
  const typingRef = appendMessage({ text: "", sender: "bot", isTyping: true });
  try {
    const relevantChunks = retrieveRelevantChunks(trimmed, 3);
    const reply = await callGeminiWithRag({
      userMessage: trimmed,
      distanceMeters,
      zone: currentZone,
      retrievedChunks: relevantChunks,
    });
    typingRef.bubble.innerHTML = reply.replace(/\n/g, "<br>");
    const metaDiv = document.createElement("div");
    metaDiv.className = "message-meta";
    const timeSpan = document.createElement("span");
    timeSpan.textContent = new Date().toLocaleTimeString();
    const srcSpan = document.createElement("span");
    srcSpan.className = "message-source";
    srcSpan.textContent = "Gemini AI";
    metaDiv.appendChild(timeSpan);
    metaDiv.appendChild(srcSpan);
    typingRef.bubble.appendChild(metaDiv);
    conversationHistory.push({ role: "assistant", text: reply });
    chatWindowEl.scrollTop = chatWindowEl.scrollHeight;
    speak(reply);
  } catch (err) {
    console.error("Gemini chat error", err);
    typingRef.bubble.textContent = "⚠️ Something went wrong. Please try again.";
  }
}

// ==============================
// Map & Location - FIXED AUTO-PANNING
// ==============================

function initMap() {
  mapInstance = L.map("map", {
    doubleClickZoom: false,
  }).setView([DEMO_CENTER.lat, DEMO_CENTER.lng], 15);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap, &copy; CartoDB",
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(mapInstance);

  mapInstance.on("dblclick", function (e) {
    // Do nothing on double-click
  });

  const centerIcon = L.divIcon({
    className: "custom-marker center-marker",
    html: '<div style="background-color: #f59e0b; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #fde68a;"></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
  centerMarker = L.marker([DEMO_CENTER.lat, DEMO_CENTER.lng], {
    icon: centerIcon,
  }).addTo(mapInstance);
  centerMarker.bindPopup(
    `<b>🏠 ${DEMO_CENTER.name}</b><br>Sector 33, Stadium Road, Sonepat (Demo)`
  );

  // Add nearby places with hover and click
  DEMO_CENTER.nearbyPlaces.forEach((place) => {
    const markerColor = place.famous ? "#818cf8" : "#94a3b8";
    const nearIcon = L.divIcon({
      className: "custom-marker near-marker",
      html: `<div style="background-color: ${markerColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #c7d2fe;"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    const marker = L.marker([place.lat, place.lng], { icon: nearIcon }).addTo(
      mapInstance
    );

    marker.bindTooltip(place.name, {
      permanent: false,
      direction: "top",
      offset: [0, -10],
    });

    marker.on("click", function (e) {
      L.DomEvent.stopPropagation(e);

      if (lastUserLatLng) {
        showSelectedPlace(place, lastUserLatLng.lat, lastUserLatLng.lng);
      }

      showRouteOnOSM(place.lat, place.lng, place.name);
    });

    const visitedStatus = visitedPlaces.has(place.id) ? " (Visited)" : "";
    marker.bindPopup(`
      <div style="text-align: left;">
        <b style="color: #38bdf8; font-size: 1rem;">${place.name}</b>${visitedStatus}<br>
        <span style="color: #e2e8f0; font-size: 0.85rem;">${place.description}</span>
      </div>
    `);

    insideMarkers.push(marker);
  });

  mapInstance.on("zoomend", function () {
    const zoom = mapInstance.getZoom();
    if (zoom >= 16) addAmenityMarkers();
    else removeAmenityMarkers();
  });

  mapReady = true;
  tryStartLocationTracking();

  setInterval(() => {
    if (lastUserLatLng) {
      const userLat = lastUserLatLng.lat;
      const userLng = lastUserLatLng.lng;
      const top3 = getTop3NearbyFamous(userLat, userLng);
      updateTop3Panel(top3);
      checkArrival(userLat, userLng);
    }
  }, 2000);
}

function addAmenityMarkers() {
  removeAmenityMarkers();
  ["food", "water", "attractions"].forEach((cat) => {
    const list = AMENITIES_DATABASE[cat];
    if (!list || !Array.isArray(list)) return;
    const color =
      cat === "food" ? "#f97316" : cat === "water" ? "#3b82f6" : "#a855f7";
    list.forEach((amenity) => {
      const icon = L.divIcon({
        className: "amenity-marker",
        html: `<div style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const marker = L.marker([amenity.lat, amenity.lng], { icon })
        .addTo(mapInstance)
        .bindTooltip(amenity.name, { permanent: false, direction: "top" })
        .bindPopup(
          `<b>${amenity.name}</b><br>${amenity.landmark || ""}<br>⭐ ${
            amenity.reviews?.rating || 4
          }/5`
        );

      marker.on("click", function (e) {
        L.DomEvent.stopPropagation(e);
        if (lastUserLatLng) {
          const amenityPlace = {
            name: amenity.name,
            description: amenity.landmark || amenity.name,
            lat: amenity.lat,
            lng: amenity.lng,
          };
          showSelectedPlace(
            amenityPlace,
            lastUserLatLng.lat,
            lastUserLatLng.lng
          );
        }
        showRouteOnOSM(amenity.lat, amenity.lng, amenity.name);
      });

      amenityMarkers.push(marker);
    });
  });
}

function removeAmenityMarkers() {
  amenityMarkers.forEach((m) => mapInstance.removeLayer(m));
  amenityMarkers = [];
}

function isSecureContextForGeolocation() {
  // Geolocation only works in secure contexts: https or localhost
  if (typeof window === "undefined" || !window.isSecureContext) return false;
  try {
    const u = new URL(window.location.href);
    return (
      u.protocol === "https:" ||
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1"
    );
  } catch (_) {
    return false;
  }
}

function initLocationTracking() {
  if (locationTrackingStarted) return;
  locationTrackingStarted = true;

  if (!("geolocation" in navigator)) {
    locationStatusEl.textContent =
      "Geolocation not supported. You can still chat with the guide.";
    return;
  }

  // If opened via file://, browsers block geolocation — show clear instructions
  const url = window.location.href || "";
  if (url.startsWith("file://")) {
    locationStatusEl.innerHTML =
      '❌ <strong>Location needs a web server.</strong> Open this folder in a terminal and run: <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">npx serve</code> or <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">python -m http.server 8000</code>, then open <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">http://localhost:3000</code> (or :8000). You can still chat.';
    return;
  }

  if (!isSecureContextForGeolocation()) {
    locationStatusEl.textContent =
      "⚠️ Open this page over HTTPS or http://localhost for location to work. You can still chat.";
    return;
  }

  locationStatusEl.textContent =
    "📡 Getting your location... Please allow location access when prompted.";

  const options = { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 };

  let isFirstLocation = true;

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const userLatLng = { lat: latitude, lng: longitude };
      lastUserLatLng = userLatLng;

      const distance = haversineDistanceMeters(
        latitude,
        longitude,
        DEMO_CENTER.lat,
        DEMO_CENTER.lng
      );
      if (distanceDisplayEl)
        distanceDisplayEl.textContent = formatDistance(distance);

      const zone = determineZone(distance);
      currentZone = zone;
      updateZoneDisplay(zone);

      const top3 = getTop3NearbyFamous(latitude, longitude);
      updateTop3Panel(top3);

      locationStatusEl.textContent =
        "🟢 Live – You are " + formatDistance(distance) + " from center.";

      if (!userMarker) {
        const userIcon = L.divIcon({
          className: "custom-marker user-marker",
          html: '<div style="background-color: #38bdf8; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #0f172a;"></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        userMarker = L.marker([latitude, longitude], { icon: userIcon }).addTo(
          mapInstance
        );
        userMarker.bindPopup("📍 You are here");

        mapInstance.setView([latitude, longitude], 15);
        isFirstLocation = false;
      } else {
        userMarker.setLatLng([latitude, longitude]);
      }

      handleZoneChange(zone, distance);
    },
    (err) => {
      console.error("Geolocation error", err);
      const code = err.code;
      if (code === 1 || code === err.PERMISSION_DENIED) {
        locationStatusEl.textContent =
          "❌ Location denied. Allow location in your browser (lock/address bar) and refresh. You can still chat.";
      } else if (code === 3 || code === err.TIMEOUT) {
        locationStatusEl.textContent =
          "⚠️ Location timed out. Check GPS/Wi‑Fi and try again. Chat still works.";
      } else {
        locationStatusEl.textContent =
          "⚠️ Could not get location (" +
          (err.message || "unknown") +
          "). Open via http://localhost if using file. Chat still works.";
      }
    },
    options
  );
}

function tryStartLocationTracking() {
  if (domReady && mapReady && !locationTrackingStarted) initLocationTracking();
}

function openChatPanel() {
  const chatSection = document.querySelector(".chat-section");
  if (chatSection)
    chatSection.scrollIntoView({ behavior: "smooth", block: "center" });
  if (robotButtonEl) robotButtonEl.classList.add("active");
}

function toggleChatFromButton() {
  const chatSection = document.querySelector(".chat-section");
  if (!chatSection) return;
  const rect = chatSection.getBoundingClientRect();
  const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
  if (isVisible) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    robotButtonEl.classList.remove("active");
  } else {
    openChatPanel();
  }
}

// ==============================
// DOM Init
// ==============================

function initDom() {
  distanceDisplayEl = document.getElementById("distanceDisplay");
  zoneDisplayEl = document.getElementById("zoneDisplay");
  nearestPlaceDisplayEl = document.getElementById("nearestPlaceDisplay");
  top3ListEl = document.getElementById("top3List");
  locationStatusEl = document.getElementById("locationStatus");
  chatWindowEl = document.getElementById("chatWindow");
  chatFormEl = document.getElementById("chatForm");
  userInputEl = document.getElementById("userInput");
  voiceToggleEl = document.getElementById("voiceToggle");
  robotButtonEl = document.getElementById("robotButton");

  selectedPlacePanel = document.getElementById("selectedPlacePanel");
  selectedPlaceDetails = document.getElementById("selectedPlaceDetails");

  window.openGoogleMaps = openGoogleMaps;
  window.showRouteOnOSM = showRouteOnOSM;
  window.clearRoute = clearRoute;
  window.hideSelectedPlace = hideSelectedPlace;

  domReady = true;

  appendMessage({
    text:
      "🤖 **Namaste! I'm your Sonepat area demo guide.**\n\n" +
      "📍 **Center:** Supermax, Sector 33, Sonepat.\n" +
      "🏫 **Nearby:** SBIT, IIIT Sonepat, O2 Gym, FIMS Hospital, Golden Hut, Jindal University\n\n" +
      "**✨ Smart Features:**\n" +
      "• **Study/College** - Shows SBIT, IIIT, Jindal\n" +
      "• **Gym/Fitness** - Shows O2 Gym\n" +
      "• **Travel/Bhopal** - Shows Railway Station\n" +
      "• **Food/Hungry** - Shows Golden Hut\n" +
      "• **Hospital/Health** - Shows FIMS Hospital\n" +
      "• **Market/Shopping** - Shows Bahalgarh\n" +
      "• **General Chat** - I can chat about anything!\n\n" +
      "**Try these:**\n" +
      '• "I want to study"\n' +
      '• "I need to go to Bhopal"\n' +
      '• "Where is the gym?"\n' +
      '• "I\'m hungry"\n' +
      '• "Hello, how are you?"\n' +
      '• "What\'s the weather like?"\n\n' +
      "How can I help you?",
    sender: "bot",
    meta: { source: "Sonepat Demo v5" },
  });

  chatFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = userInputEl.value;

    if (text.toLowerCase().includes("clear route")) {
      clearRoute();
      userInputEl.value = "";
      return;
    }

    userInputEl.value = "";
    handleUserMessage(text);
  });

  voiceToggleEl.addEventListener("change", () => {
    speechEnabled = voiceToggleEl.checked;
    if (!speechEnabled && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
  });

  if (robotButtonEl)
    robotButtonEl.addEventListener("click", toggleChatFromButton);

  initMap();
}

// Add CSS for arrival notification
const style = document.createElement("style");
style.textContent = `
  .arrival-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--bg-card);
    border: 2px solid var(--success);
    border-radius: var(--radius-lg);
    padding: 16px;
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    max-width: 350px;
    animation: slideInRight 0.5s ease;
  }
  
  .arrival-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .close-notification {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 1rem;
  }
  
  .close-notification:hover {
    color: var(--danger);
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDom);
} else {
  initDom();
}
