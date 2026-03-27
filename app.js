// ==============================
// Configuration & Constants
// SONEPAT DEMO – Supermax / SBIT / IIIT area (with Hybrid Navigation)
// ==============================

const GEMINI_API_KEY = "AIzaSyAf6DXmnji4mOseHNBJv61Kv4ie8XrDagU";
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
let delhiMonumentMarkers = [];
let currentZone = "unknown";
let lastZone = "unknown";
let lastUserLatLng = null;
/** When true, GPS does not move the user dot; use map clicks or drag the marker */
let cursorLocationMode = false;
let cursorMapClickHandler = null;
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

// Map view: compass (direction follows device)
let mapCompassMode = false;
let map3DMode = false;
let deviceHeading = 0;
let mapViewportEl = null;
let deviceOrientationHandler = null;

// 3D map (MapLibre GL – free, no API key)
let map3dMapInstance = null;

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
// Famous Delhi Monuments (marked on map, ~50 km from Sonepat)
// ==============================

const DELHI_MONUMENTS = [
  {
    id: "red_fort",
    name: "Red Fort (Lal Qila)",
    lat: 28.6562,
    lng: 77.241,
    type: "monument",
    tag: "Architecture",
    description:
      "UNESCO World Heritage Site; Mughal fort, built by Shah Jahan (1639–48).",
    keywords: [
      "red fort",
      "lal qila",
      "delhi",
      "monument",
      "mughal",
      "shah jahan",
    ],
  },
  {
    id: "india_gate",
    name: "India Gate",
    lat: 28.6129,
    lng: 77.2295,
    type: "monument",
    tag: "Memorial",
    description:
      "War memorial to 84,000 Indian soldiers; iconic arch on Rajpath.",
    keywords: ["india gate", "delhi", "monument", "war memorial", "rajpath"],
  },
  {
    id: "qutub_minar",
    name: "Qutub Minar",
    lat: 28.5219,
    lng: 77.1843,
    type: "monument",
    tag: "Architecture",
    description:
      "UNESCO site; 73 m minaret, Qutub complex, early Sultanate architecture.",
    keywords: ["qutub minar", "qutb", "delhi", "monument", "minaret"],
  },
  {
    id: "humayun_tomb",
    name: "Humayun's Tomb",
    lat: 28.593,
    lng: 77.2505,
    type: "monument",
    tag: "Architecture",
    description: "UNESCO site; Mughal garden tomb, precursor to the Taj Mahal.",
    keywords: ["humayun", "humayun tomb", "delhi", "monument", "mughal"],
  },
  {
    id: "lotus_temple",
    name: "Lotus Temple",
    lat: 28.5535,
    lng: 77.2588,
    type: "monument",
    tag: "Religious",
    description: "Bahá'í House of Worship; lotus-shaped white marble building.",
    keywords: ["lotus temple", "bahai", "delhi", "monument"],
  },
  {
    id: "akshardham",
    name: "Akshardham Temple",
    lat: 28.6126,
    lng: 77.2774,
    type: "monument",
    tag: "Religious",
    description:
      "Swaminarayan temple complex; grand Hindu temple with gardens and shows.",
    keywords: ["akshardham", "delhi", "monument", "temple", "swaminarayan"],
  },
  {
    id: "jama_masjid",
    name: "Jama Masjid",
    lat: 28.6506,
    lng: 77.2332,
    type: "monument",
    tag: "Religious",
    description:
      "India's largest mosque; built by Shah Jahan (1650–56), Old Delhi.",
    keywords: ["jama masjid", "jamia", "delhi", "monument", "mosque"],
  },
  {
    id: "rashtrapati_bhavan",
    name: "Rashtrapati Bhavan",
    lat: 28.6144,
    lng: 77.1996,
    type: "monument",
    tag: "Architecture",
    description:
      "Official residence of the President of India; Rajpath, Lutyens' Delhi.",
    keywords: [
      "rashtrapati bhavan",
      "president house",
      "delhi",
      "monument",
      "rajpath",
    ],
  },
];

// Tag (place type) → icon shown before name in tooltip and popup
const PLACE_TAG_ICON = {
  Architecture: "🏛",
  Memorial: "🎖",
  Religious: "🛕",
  Place: "📍",
  Monument: "🏛",
  Reference: "📍",
};

// Monument id → image path (PNG/WebP in project folder) for map markers
const DELHI_MONUMENT_IMAGES = {
  red_fort: "Red Fort.png",
  india_gate: "india gate.png",
  qutub_minar: "qutub minar .png",
  humayun_tomb: "humayun tomb.png",
  lotus_temple: "lotus temple .png",
  akshardham: "akshardham.png",
  jama_masjid: "Jama masjid.webp",
  rashtrapati_bhavan: "rashtrapati bhavan.png",
};

// Place/monument id → at most one video each (direct MP4 URL or project-relative path).
const PLACE_VIDEOS = {
  red_fort: [],
  india_gate: [{ url: "India gate.mp4", title: "India Gate" }],
  qutub_minar: [],
  humayun_tomb: [],
  lotus_temple: [],
  akshardham: [],
  jama_masjid: [],
  rashtrapati_bhavan: [],
  supermax_gate: [],
  fims_hospital: [],
};

// Monument id → gallery (empty: no carousel in place modal; add folder + files when you have assets).
const MONUMENT_PHOTOS = {};

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
  {
    id: "delhi_monuments",
    text: "Famous monuments in Delhi include: Red Fort (Lal Qila, UNESCO, Shah Jahan), India Gate (war memorial, Rajpath), Qutub Minar (73 m minaret, UNESCO, Mehrauli), Humayun's Tomb (UNESCO, garden tomb), Lotus Temple (Bahá'í, lotus shape), Akshardham (Swaminarayan temple), Jama Masjid (largest mosque in India), Rashtrapati Bhavan (President's residence). From Sonepat, take NH-44 or train to Delhi then metro/bus/cab. User can ask 'Delhi monuments' or a specific name to see on map.",
  },
];

const PLACE_DETAILED_INFO = {
  supermax_gate: {
    image: "",
    summary:
      "Supermax The New Town is an affordable housing project in Sector 33, Stadium Road, Village Rathdhana, Sonipat — your demo center with 8 towers and 743 units.",
    history:
      "Developed by Supermax Group, the project is RERA registered (HRERA-PKL-PROJ-506-2019). It was designed to offer quality affordable housing in the growing Sonipat region, well connected to Delhi NCR.",
    geography:
      "Stadium Road, Village Rathdhana, Sector 33, Sonipat, Haryana. Well connected to Sonepat city and Delhi NCR.",
    significance:
      "Landmark residential complex in Sector 33 with 5 acres of space, 4,600 m² of parks, clubhouse, temple, swimming pool, and gym. Popular for families and as a base for visiting SBIT, IIIT, and nearby institutes.",
    facts: [
      "8 towers (A–H), 12 floors each",
      "743 units — Type A1/A2 (562 sq.ft), Type A3 (657 sq.ft)",
      "5 acres | Pool, Gym, Clubhouse, Temple",
      "4,600 m² green parks",
    ],
    detailPageUrl: "indexflat.html",
  },
  fims_hospital: {
    image: "",
    summary:
      "FIMS Hospital (Fateh Chand Integrated Medical Sciences) is a multi super specialty hospital in HSIIDC, Sector 33, Sonipat — 200+ beds, 24/7 emergency and ambulance. Use the 3D view to explore the campus: Main Gate, Parking, Emergency, OPD, Pharmacy, and departments.",
    history:
      "FIMS was established to provide advanced multi-specialty healthcare in the Sonipat region. It serves as a key medical hub for HSIIDC, Sector 33, and surrounding areas. The hospital is part of the Fateh Chand Group and has grown into a full-fledged multi super specialty facility with modern infrastructure, including a rooftop helipad for critical care transfers.",
    geography:
      "Fateh Chand Integrated Medical Sciences, HSIIDC, Sector 33, Sonipat, Haryana. Easily accessible from Bahalgarh–Sonipat Road; well-connected to Delhi NCR.",
    significance:
      "Major healthcare destination with cardiology, neurology, orthopaedics, eye care, and paediatric departments. 24/7 emergency and ambulance services make it a critical facility for the region. The campus includes a dedicated emergency block, main entrance with canopy, visitor and ambulance parking, OPD wing, pharmacy, healing garden, and multi-storey inpatient tower with helipad.",
    facts: [
      "200+ beds | 50+ doctors | 15+ departments",
      "24/7 Emergency & Ambulance",
      "OPD 9 AM–5 PM | Pharmacy on campus",
      "Cardiology, Neurology, Ortho, Eye, Pediatric",
      "Main Gate (front) | Parking (east) | Emergency (left of main gate)",
      "Rooftop helipad for critical care transfers",
    ],
    detailPageUrl: "indexhos.html",
  },
  iiit_sonepat: {
    image: "",
    summary:
      "IIIT Sonepat is an Institute of National Importance focused on IT and CSE.",
    history:
      "Established under PPP model to strengthen technical education in Haryana.",
    geography: "Located in Rajiv Gandhi Education City, near Delhi NCR.",
    significance:
      "Institute of national importance offering B.Tech in IT and CSE; part of the IIIT system across India.",
    facts: [
      "Focus on IT & CSE",
      "Modern labs",
      "National importance institute",
      "Close to Delhi border",
    ],
  },
  sbit: {
    image: "",
    summary:
      "Shri Balwant Institute of Technology is a leading engineering college.",
    history: "Founded to provide quality engineering education near Delhi NCR.",
    geography: "Located on Meerut Road (Pallri), Sonepat.",
    significance:
      "20-acre campus adjacent to Rajiv Gandhi Education City; B.Tech and allied programs.",
    facts: ["20-acre campus", "B.Tech programs", "Well-equipped labs"],
  },
  // Delhi monuments (marker art in repo root)
  red_fort: {
    image: "Red Fort.png",
    summary:
      "Red Fort (Lal Qila) is a UNESCO World Heritage Site and iconic Mughal fort in Old Delhi, built by Emperor Shah Jahan.",
    history:
      "Construction began in 1638 and completed in 1648. It served as the main residence of Mughal emperors. The Indian flag is hoisted here on Independence Day.",
    geography:
      "Netaji Subhash Marg, Chandni Chowk, Old Delhi. Near Jama Masjid.",
    significance:
      "Symbol of Indian independence; Prime Minister addresses the nation from here on 15 August. Stunning red sandstone architecture and Diwan-i-Aam, Diwan-i-Khas.",
    facts: [
      "UNESCO World Heritage Site",
      "Built 1639–1648 by Shah Jahan",
      "Independence Day flag ceremony",
      "Open Tue–Sun, closed Monday",
    ],
    sketchfabEmbedUrl:
      "https://sketchfab.com/models/2ad9ae0a1b524a37a2c3ab245b0e5423/embed",
    sketchfabViewUrl:
      "https://sketchfab.com/3d-models/red-fort-model-2ad9ae0a1b524a37a2c3ab245b0e5423",
  },
  india_gate: {
    image: "india gate.png",
    summary:
      "India Gate is a war memorial honouring 84,000 Indian soldiers who died in the First World War. A landmark on Rajpath.",
    history:
      "Designed by Edwin Lutyens, unveiled in 1931. Originally All India War Memorial. Amar Jawan Jyoti added in 1972 for the 1971 war.",
    geography:
      "Rajpath, Central Delhi. Between Rashtrapati Bhavan and National Stadium.",
    significance:
      "National monument of remembrance; eternal flame (Amar Jawan Jyoti); surrounded by lawns, popular for evening visits.",
    facts: [
      "42 m tall arch",
      "Names of 13,300+ soldiers inscribed",
      "Amar Jawan Jyoti – eternal flame",
      "Free entry, open 24/7",
    ],
    sketchfabEmbedUrl:
      "https://sketchfab.com/models/59fe55328271479d82acb65310178d99/embed",
    sketchfabViewUrl:
      "https://sketchfab.com/3d-models/india-gate-59fe55328271479d82acb65310178d99",
  },
  qutub_minar: {
    image: "qutub minar .png",
    summary:
      "Qutub Minar is a 73-metre minaret and UNESCO World Heritage Site, part of the Qutub complex in South Delhi.",
    history:
      "Construction started by Qutb al-Din Aibak (1199), completed by Iltutmish and later rulers. Damaged by earthquakes and restored.",
    geography:
      "Mehrauli, South Delhi. Qutub Minar complex, Aurobindo Marg area.",
    significance:
      "Tallest brick minaret in the world; early Sultanate Indo-Islamic architecture; Quwwat-ul-Islam mosque and Iron Pillar in same complex.",
    facts: [
      "73 m (239 ft) tall",
      "UNESCO World Heritage Site",
      "Built 1199–1368",
      "Iron Pillar of Delhi in same complex",
    ],
    sketchfabEmbedUrl:
      "https://sketchfab.com/models/e165e25ec8f1497aa83ab72419f40ddc/embed",
    sketchfabViewUrl:
      "https://sketchfab.com/3d-models/qutub-minar-e165e25ec8f1497aa83ab72419f40ddc",
  },
  humayun_tomb: {
    image: "humayun tomb.png",
    summary:
      "Humayun's Tomb is a UNESCO-listed Mughal garden tomb, built for Emperor Humayun. Architectural precursor to the Taj Mahal.",
    history:
      "Commissioned by Empress Bega Begum (1569–70), designed by Persian architects. First garden-tomb on the Indian subcontinent.",
    geography: "Nizamuddin East, Delhi. Near Nizamuddin Dargah.",
    significance:
      "Pioneering Mughal garden tomb; double dome and charbagh garden; influenced Taj Mahal design.",
    facts: [
      "UNESCO World Heritage Site",
      "Built 1569–1570",
      "Garden tomb (charbagh)",
      "Red sandstone and white marble",
    ],
    sketchfabEmbedUrl:
      "https://sketchfab.com/models/592c6356517b4199bd88e5caf68da36d/embed",
    sketchfabViewUrl:
      "https://sketchfab.com/3d-models/humayun-tomb-delhi-592c6356517b4199bd88e5caf68da36d",
  },
  lotus_temple: {
    image: "lotus temple .png",
    summary:
      "Lotus Temple is the Bahá'í House of Worship, shaped like a lotus flower. Open to all for prayer and meditation.",
    history:
      "Completed in 1986, designed by Fariborz Sahba. Won numerous architectural awards. One of the most visited buildings in the world.",
    geography: "Lotus Temple Road, Nehru Place, South Delhi.",
    significance:
      "No idols; silence and meditation; striking 27-petal lotus design in white marble. People of any faith can pray here.",
    facts: [
      "Bahá'í House of Worship",
      "Opened 1986",
      "27 marble petals",
      "Free entry, closed Monday",
    ],
    detailPageUrl: "monuments-3d.html?monument=lotus_temple",
  },
  akshardham: {
    image: "akshardham.png",
    summary:
      "Akshardham is a large Swaminarayan Hindu temple complex with exhibitions, gardens, and boat ride.",
    history:
      "Opened in 2005. Built by BAPS. Dedicated to Bhagwan Swaminarayan. One of the largest Hindu temples in the world.",
    geography: "Noida Mor, Pandav Nagar, East Delhi (near Noida border).",
    significance:
      "Intricate carvings, water show, cultural exhibitions. No cameras or phones inside; free entry to temple, paid exhibitions.",
    facts: [
      "Opened 2005",
      "Mandir, exhibitions, gardens",
      "Evening water show",
      "Strict dress code, no phones inside",
    ],
    sketchfabEmbedUrl:
      "https://sketchfab.com/models/72df91f9fc3c4a979d9b8c08fbf357a6/embed",
    sketchfabViewUrl:
      "https://sketchfab.com/3d-models/akshardham-temple-72df91f9fc3c4a979d9b8c08fbf357a6",
  },
  jama_masjid: {
    image: "Jama masjid.webp",
    summary:
      "Jama Masjid is India's largest mosque, built by Shah Jahan. Dominates Old Delhi's skyline with three domes and two minarets.",
    history:
      "Construction 1650–1656. Main mosque for Friday prayers in Shahjahanabad. Can hold 25,000 worshippers.",
    geography: "Opposite Red Fort, Chandni Chowk, Old Delhi.",
    significance:
      "Largest mosque in India; courtyard and minarets; non-Muslims can visit outside prayer times (modest dress, small fee for tower).",
    facts: [
      "Largest mosque in India",
      "Built 1650–1656 by Shah Jahan",
      "Three domes, two 40 m minarets",
      "Views from minaret (paid)",
    ],
    sketchfabEmbedUrl:
      "https://sketchfab.com/models/9bdbc1a76f4e43e893978e67678d6efd/embed",
    sketchfabViewUrl:
      "https://sketchfab.com/3d-models/greenpark-jama-masjid-hauz-khas-new-delhi-9bdbc1a76f4e43e893978e67678d6efd",
  },
  rashtrapati_bhavan: {
    image: "rashtrapati bhavan.png",
    summary:
      "Rashtrapati Bhavan is the official residence of the President of India. Part of Lutyens' Central Vista.",
    history:
      "Designed by Edwin Lutyens, completed 1929. Originally Viceroy's House. Became President's residence in 1950.",
    geography:
      "Rashtrapati Bhavan, Rajpath, Central Delhi. North of India Gate.",
    significance:
      "340 rooms; Mughal Gardens open in spring; Changing of the Guard; central to Republic Day parade on Rajpath.",
    facts: [
      "Official residence of the President",
      "Designed by Lutyens",
      "Mughal Gardens (seasonal)",
      "Republic Day parade on Rajpath",
    ],
    sketchfabEmbedUrl:
      "https://sketchfab.com/models/69bd010237304baf9ffcc247fdedb446/embed",
    sketchfabViewUrl:
      "https://sketchfab.com/3d-models/rashtrapati-bhavan-new-delhi-69bd010237304baf9ffcc247fdedb446",
  },
};

// FIMS Hospital – internal mapping nodes and walking directions
const FIMS_INTERNAL_NODES = [
  { id: "main_gate", name: "Main Gate", desc: "Front entrance, canopy" },
  {
    id: "parking",
    name: "Parking",
    desc: "Visitor & ambulance parking (east)",
  },
  {
    id: "emergency",
    name: "Emergency",
    desc: "24/7 emergency block (left of gate)",
  },
  { id: "opd", name: "OPD", desc: "Outpatient dept, front wing" },
  { id: "pharmacy", name: "Pharmacy", desc: "In-house pharmacy" },
  { id: "cardiology", name: "Cardiology", desc: "Left wing" },
  { id: "neurology", name: "Neurology", desc: "Right wing" },
  { id: "garden", name: "Garden", desc: "Healing garden" },
];

const FIMS_INTERNAL_ROUTES = {
  main_gate_parking: [
    "Walk to the right (east) from the main gate.",
    "Follow the driveway; parking area is ahead with marked bays.",
    "~1 min walk.",
  ],
  main_gate_emergency: [
    "From main gate, turn left.",
    "Emergency block is the red-sign building with ambulance bay.",
    "~1 min walk.",
  ],
  main_gate_opd: [
    "Enter through the main gate.",
    "OPD is in the front wing straight ahead.",
    "~2 min walk.",
  ],
  main_gate_pharmacy: [
    "Enter via main gate, go straight past OPD.",
    "Pharmacy is at the back of the ground floor.",
    "~3 min walk.",
  ],
  main_gate_cardiology: [
    "Enter main gate, turn left after the lobby.",
    "Cardiology is in the left wing, upper floors.",
    "Take lift or stairs to the department.",
    "~4 min walk.",
  ],
  main_gate_neurology: [
    "Enter main gate, turn right after the lobby.",
    "Neurology is in the right wing, upper floors.",
    "~4 min walk.",
  ],
  main_gate_garden: [
    "From main gate, walk to the right and follow the path behind the building.",
    "Garden is on the west side.",
    "~3 min walk.",
  ],
  parking_main_gate: [
    "Walk from parking toward the main building.",
    "Main gate (canopy) is on the west side.",
    "~1 min walk.",
  ],
  parking_emergency: [
    "From parking, walk toward the building and turn left.",
    "Emergency block is next to the main entrance.",
    "~2 min walk.",
  ],
  parking_opd: [
    "From parking, walk to main gate and enter.",
    "OPD is straight ahead in the front wing.",
    "~3 min walk.",
  ],
  emergency_main_gate: [
    "Exit emergency block, turn right.",
    "Main gate is ahead with the green canopy.",
    "~1 min walk.",
  ],
  emergency_opd: [
    "From emergency, walk toward main building and enter via main gate.",
    "OPD is straight ahead.",
    "~2 min walk.",
  ],
  opd_main_gate: [
    "Exit OPD wing toward the entrance.",
    "Main gate is ahead.",
    "~2 min walk.",
  ],
  opd_pharmacy: [
    "From OPD, walk to the back of the ground floor.",
    "Pharmacy is signposted.",
    "~1 min walk.",
  ],
  opd_emergency: [
    "Exit OPD, turn left and follow the corridor to the main entrance.",
    "Emergency is to the left of the main gate.",
    "~2 min walk.",
  ],
  pharmacy_opd: [
    "From pharmacy, walk to the front of the building.",
    "OPD is in the front wing.",
    "~1 min walk.",
  ],
  pharmacy_main_gate: [
    "From pharmacy, follow signs to main exit.",
    "Main gate is ahead.",
    "~3 min walk.",
  ],
  cardiology_main_gate: [
    "Take lift/stairs to ground floor, turn right.",
    "Walk to main entrance.",
    "~4 min walk.",
  ],
  cardiology_opd: [
    "Go to ground floor, OPD is in the front wing.",
    "~3 min walk.",
  ],
  neurology_main_gate: [
    "Take lift/stairs to ground floor, turn left.",
    "Main gate is ahead.",
    "~4 min walk.",
  ],
  neurology_opd: [
    "Go to ground floor, OPD is in the front wing.",
    "~3 min walk.",
  ],
  garden_main_gate: [
    "From garden, walk to the front of the campus.",
    "Main gate is on the north side.",
    "~3 min walk.",
  ],
};

function getFimsInternalDirections(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return [];
  const key = fromId + "_" + toId;
  return (
    FIMS_INTERNAL_ROUTES[key] || [
      "Route not defined. Ask at reception for directions.",
    ]
  );
}

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
          p.categories?.includes("it"),
      );
    case "food":
      return DEMO_CENTER.nearbyPlaces.filter(
        (p) =>
          p.categories?.includes("food") ||
          p.categories?.includes("restaurant") ||
          p.categories?.includes("dhaba"),
      );
    case "travel":
      return DEMO_CENTER.nearbyPlaces.filter(
        (p) =>
          p.categories?.includes("transport") ||
          p.categories?.includes("railway") ||
          p.categories?.includes("travel"),
      );
    case "hospital":
      return DEMO_CENTER.nearbyPlaces.filter(
        (p) =>
          p.categories?.includes("hospital") ||
          p.categories?.includes("medical") ||
          p.categories?.includes("healthcare"),
      );
    case "gym":
      return DEMO_CENTER.nearbyPlaces.filter(
        (p) =>
          p.categories?.includes("fitness") ||
          p.categories?.includes("gym") ||
          p.categories?.includes("health"),
      );
    case "market":
      return DEMO_CENTER.nearbyPlaces.filter(
        (p) =>
          p.categories?.includes("market") ||
          p.categories?.includes("shopping"),
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

  // First try exact name matching (Sonepat places)
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

  // Delhi monuments – exact name/keyword match
  for (const place of DELHI_MONUMENTS) {
    if (
      q.includes(place.name.toLowerCase()) ||
      place.keywords.some((k) => q.includes(k.toLowerCase()))
    ) {
      return {
        type: "exact",
        place: place,
        confidence: 1.0,
        isDelhiMonument: true,
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
      (p) => p.id === "sonepat_junction",
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
            p.lng,
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
            p.lng,
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

// Top 3 nearest places: local famous places + Delhi monuments, sorted by distance
function getTop3NearbyFamous(userLat, userLng) {
  const famousLocal = DEMO_CENTER.nearbyPlaces.filter((p) => p.famous).slice();
  const allCandidates = [...famousLocal, ...DELHI_MONUMENTS];
  if (userLat == null || userLng == null) return [];
  const withDist = allCandidates.map((p) => ({
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
      place.lng,
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
      "You've arrived at your destination!",
    );
    setArrivedPlaceInfo(place);
  }
}

function setArrivedPlaceInfo(place) {
  // "More Info" is now shown inside the arrival notification (showArrivalNotification)
  // Selected place panel already offers route/details; no extra notification needed.
}

function initDraggable3DLabel(wrapEl) {
  const label = wrapEl && wrapEl.querySelector(".place-modal-3d-label");
  if (!label) return;
  label.style.bottom = "20px";
  label.style.left = "24px";
  label.style.top = "";

  if (label.dataset.dragInited === "1") return;
  label.dataset.dragInited = "1";

  function getCoords(e) {
    if (e.touches && e.touches.length)
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function onDown(e) {
    e.preventDefault();
    const rect = label.getBoundingClientRect();
    const wrapRect = wrapEl.getBoundingClientRect();

    function onMove(e) {
      e.preventDefault();
      const c = getCoords(e);
      let left = c.x - wrapRect.left - rect.width / 2;
      let top = c.y - wrapRect.top - rect.height / 2;
      left = Math.max(0, Math.min(wrapRect.width - rect.width, left));
      top = Math.max(0, Math.min(wrapRect.height - rect.height, top));
      label.style.left = left + "px";
      label.style.top = top + "px";
      label.style.bottom = "auto";
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove, { passive: false });
      document.removeEventListener("touchend", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
    onMove(e);
  }

  label.addEventListener("mousedown", onDown);
  label.addEventListener("touchstart", onDown, { passive: false });
}

window.openPlaceModal = function (placeId) {
  if (placeId === "fims_hospital") {
    window.location.href = "fims-hospital.html";
    return;
  }
  const place =
    DEMO_CENTER.nearbyPlaces.find((p) => p.id === placeId) ||
    DEMO_CENTER.insidePlaces.find((p) => p.id === placeId) ||
    DELHI_MONUMENTS.find((p) => p.id === placeId);
  const data = PLACE_DETAILED_INFO[placeId];

  document.getElementById("placeModal").style.display = "flex";

  const titleEl = document.getElementById("placeModalTitle");
  const summaryEl = document.getElementById("placeModalSummary");
  const historyEl = document.getElementById("placeModalHistory");
  const geographyEl = document.getElementById("placeModalGeography");
  const significanceEl = document.getElementById("placeModalSignificance");
  const factsList = document.getElementById("placeModalFacts");
  const detailLink = document.getElementById("modalDetailPageLink");
  const modalImage = document.getElementById("placeModalImage");
  const modal3DWrap = document.getElementById("placeModal3DWrap");
  const modal3DIframe = document.getElementById("placeModal3D");
  const photosWrap = document.getElementById("placeModalPhotosWrap");
  const significanceWrap = document.getElementById(
    "placeModalSignificanceWrap",
  );

  const use3D = data?.detailPageUrl || data?.sketchfabEmbedUrl;
  if (modal3DWrap) {
    modal3DWrap.classList.toggle("is-visible", !!use3D);
  }
  if (modal3DIframe) {
    let embedUrl = "";
    if (data?.sketchfabEmbedUrl) {
      const base = data.sketchfabEmbedUrl;
      embedUrl = base + (base.indexOf("?") >= 0 ? "&" : "?") + "autostart=1";
    } else if (data?.detailPageUrl) {
      const url3D = data.detailPageUrl;
      embedUrl = url3D + (url3D.indexOf("?") >= 0 ? "&" : "?") + "embed=1";
    }
    modal3DIframe.src = embedUrl;
  }
  if (modalImage) {
    modalImage.style.display = use3D ? "none" : "";
    if (!use3D)
      modalImage.style.backgroundImage = data ? `url(${data.image})` : "";
  }
  if (use3D && modal3DWrap) {
    initDraggable3DLabel(modal3DWrap);
  }

  if (data) {
    titleEl.innerText = (place?.name || placeId).replace(/_/g, " ");
    summaryEl.innerText = data.summary;
    historyEl.innerText = data.history;
    geographyEl.innerText = data.geography;
    significanceEl.innerText = data.significance || "—";
    if (significanceWrap)
      significanceWrap.style.display = data.significance ? "block" : "none";
    factsList.innerHTML = "";
    (data.facts || []).forEach((f) => {
      const li = document.createElement("li");
      li.innerText = f;
      factsList.appendChild(li);
    });
    const statsEl = document.getElementById("placeModalStats");
    if (statsEl) {
      statsEl.innerHTML = "";
      (data.facts || []).slice(0, 5).forEach((f) => {
        const p = document.createElement("p");
        p.className = "place-modal-stat-item";
        p.innerText = f;
        statsEl.appendChild(p);
      });
    }
    const has3DLink = data.sketchfabViewUrl || data.detailPageUrl;
    if (has3DLink) {
      detailLink.href = data.sketchfabViewUrl || data.detailPageUrl;
      detailLink.style.display = "inline-block";
      const fd = document.getElementById("placeModal3DFallback");
      if (fd) fd.style.display = "none";
    } else {
      detailLink.style.display = "none";
      const fd = document.getElementById("placeModal3DFallback");
      if (fd) fd.style.display = "block";
    }
    const fullPageLink = document.getElementById("placeModalFullPageLink");
    if (fullPageLink)
      fullPageLink.style.display =
        placeId === "fims_hospital" ? "inline-flex" : "none";
  } else {
    if (photosWrap) photosWrap.style.display = "none";
    const fullPageLink = document.getElementById("placeModalFullPageLink");
    if (fullPageLink) fullPageLink.style.display = "none";
  }

  const photoSet = placeId && MONUMENT_PHOTOS[placeId];
  const photoImg = document.getElementById("placeModalPhotoImg");
  const photoPrev = document.getElementById("placeModalPhotoPrev");
  const photoNext = document.getElementById("placeModalPhotoNext");
  if (photosWrap && photoImg) {
    if (photoSet && photoSet.files && photoSet.files.length > 0) {
      const folder = photoSet.folder;
      const urls = photoSet.files.map(function (file) {
        return encodeURI(folder + "/" + file);
      });
      photoImg.src = urls[0];
      photoImg.alt = place?.name || placeId;
      photoImg.onclick = function () {
        const list = JSON.parse(photosWrap.dataset.photoUrls || "[]");
        const idx = parseInt(photosWrap.dataset.photoIndex || "0", 10);
        if (list[idx]) window.open(list[idx], "_blank");
      };
      photosWrap.dataset.photoUrls = JSON.stringify(urls);
      photosWrap.dataset.photoIndex = "0";
      photosWrap.style.display = "flex";
      function updatePhotoNav() {
        const list = JSON.parse(photosWrap.dataset.photoUrls || "[]");
        const idx = parseInt(photosWrap.dataset.photoIndex || "0", 10);
        if (photoPrev)
          photoPrev.style.visibility = list.length > 1 ? "visible" : "hidden";
        if (photoNext)
          photoNext.style.visibility = list.length > 1 ? "visible" : "hidden";
      }
      if (photoPrev) {
        photoPrev.onclick = function () {
          const list = JSON.parse(photosWrap.dataset.photoUrls || "[]");
          let idx = parseInt(photosWrap.dataset.photoIndex || "0", 10);
          idx = idx <= 0 ? list.length - 1 : idx - 1;
          photosWrap.dataset.photoIndex = String(idx);
          photoImg.src = list[idx];
        };
      }
      if (photoNext) {
        photoNext.onclick = function () {
          const list = JSON.parse(photosWrap.dataset.photoUrls || "[]");
          let idx = parseInt(photosWrap.dataset.photoIndex || "0", 10);
          idx = idx >= list.length - 1 ? 0 : idx + 1;
          photosWrap.dataset.photoIndex = String(idx);
          photoImg.src = list[idx];
        };
      }
      updatePhotoNav();
    } else {
      photosWrap.style.display = "none";
      photosWrap.removeAttribute("data-photo-urls");
      photosWrap.removeAttribute("data-photo-index");
    }
  }

  if (!data) {
    if (modalImage) modalImage.style.backgroundImage = "";
    titleEl.innerText = (place?.name || placeId).replace(/_/g, " ");
    summaryEl.innerText = place?.description || "You've arrived at this place.";
    historyEl.innerText = "—";
    geographyEl.innerText = place?.description || "—";
    significanceEl.innerText = "—";
    if (significanceWrap) significanceWrap.style.display = "none";
    factsList.innerHTML = "";
    const statsEl = document.getElementById("placeModalStats");
    if (statsEl) statsEl.innerHTML = "";
    detailLink.style.display = "none";
    const fd = document.getElementById("placeModal3DFallback");
    if (fd) fd.style.display = "block";
  }

  const modalRouteBtn = document.getElementById("modalRouteBtn");
  if (modalRouteBtn)
    modalRouteBtn.onclick = function () {
      if (place) openGoogleMaps(place.lat, place.lng, place.name);
    };

  const placeName =
    (place && place.name) ||
    (placeId && placeId.replace(/_/g, " ")) ||
    "this place";
  const botInput = document.getElementById("placeModalBotInput");
  const botBtn = document.getElementById("placeModalBotBtn");
  if (botInput) botInput.value = "";
  if (botBtn) {
    botBtn.onclick = function () {
      const text = (botInput && botInput.value && botInput.value.trim()) || "";
      if (text) {
        handleUserMessage("About " + placeName + ": " + text);
        if (botInput) botInput.value = "";
        closePlaceModal();
        if (chatWindowEl) chatWindowEl.scrollTop = chatWindowEl.scrollHeight;
        if (userInputEl) userInputEl.focus();
      }
    };
  }
  if (botInput) {
    botInput.onkeydown = function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (botBtn) botBtn.click();
      }
    };
  }

  // Auto-speak about this place when modal opens (respects Robot Voice toggle)
  const toSpeak = [];
  if (titleEl && titleEl.innerText) toSpeak.push(titleEl.innerText);
  if (summaryEl && summaryEl.innerText) toSpeak.push(summaryEl.innerText);
  if (historyEl && historyEl.innerText) toSpeak.push(historyEl.innerText);
  if (geographyEl && geographyEl.innerText) toSpeak.push(geographyEl.innerText);
  if (
    significanceWrap &&
    significanceWrap.style.display !== "none" &&
    significanceEl &&
    significanceEl.innerText
  )
    toSpeak.push(significanceEl.innerText);
  const script = toSpeak.filter(Boolean).join(". ");
  if (script)
    setTimeout(function () {
      speak(script);
    }, 400);
};

window.closePlaceModal = function () {
  document.getElementById("placeModal").style.display = "none";
  const iframe = document.getElementById("placeModal3D");
  if (iframe) iframe.src = "";
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
};

// Show arrival notification (with "More Info" to open detail modal)
function showArrivalNotification(place) {
  const hasMoreInfo = PLACE_DETAILED_INFO[place.id];
  const moreInfoBtn = hasMoreInfo
    ? `<button class="arrival-more-info-btn" onclick="openPlaceModal('${place.id}'); this.closest('.arrival-notification')?.remove();">
         <i class="fas fa-info-circle"></i> More Info
       </button>`
    : "";

  const notification = document.createElement("div");
  notification.className = "arrival-notification";
  notification.innerHTML = `
    <div class="arrival-content">
      <i class="fas fa-map-pin" style="color: var(--success); font-size: 1.5rem;"></i>
      <div>
        <h4>🎉 You've arrived at ${place.name}!</h4>
        <p>${place.description}</p>
        ${moreInfoBtn}
      </div>
    </div>
    <button class="close-notification" onclick="this.parentElement.remove()">✕</button>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 12000);

  appendMessage({
    text: `🎉 **You've arrived at ${place.name}!**\n\n${place.description}\n\n${hasMoreInfo ? "Tap **More Info** in the notification for history, significance & more. " : ""}Would you like to visit other nearby places?`,
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
    place.lng,
  );
  const formattedDist = formatDistance(distance);
  const walkingTime = Math.round(distance / 80);
  const drivingTime = Math.round(distance / 200);
  const cyclingTime = Math.round(distance / 167);
  const steps = Math.round(distance / 0.75);
  const isArrived = distance <= ARRIVAL_THRESHOLD;
  const metroSummary = getMetroRouteSummary(
    userLat,
    userLng,
    place.lat,
    place.lng,
  );

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

  let metroRouteText = "";
  if (metroSummary && metroSummary.metroRouteDetail) {
    const r = metroSummary.metroRouteDetail;
    const segments = [];
    let segLine = null;
    let segStart = null;
    for (let i = 0; i < r.path.length; i++) {
      const p = r.path[i];
      if (p.line !== segLine) {
        if (segLine && segStart && i > 0) {
          segments.push(
            "Take <strong>" +
              escapeHtml(segLine) +
              "</strong> from " +
              escapeHtml(segStart) +
              " to " +
              escapeHtml(r.path[i - 1].station),
          );
        }
        segLine = p.line;
        segStart = i > 0 ? r.path[i - 1].station : p.station;
      }
    }
    if (segLine && segStart) {
      segments.push(
        "Take <strong>" +
          escapeHtml(segLine) +
          "</strong> from " +
          escapeHtml(segStart) +
          " to " +
          escapeHtml(r.toStation),
      );
    }
    metroRouteText = segments.join(". ");
    if (r.interchanges && r.interchanges.length > 0) {
      metroRouteText +=
        " — Change at: " +
        r.interchanges
          .map(function (x) {
            return (
              escapeHtml(x.station) +
              " (" +
              escapeHtml(x.fromLine) +
              " → " +
              escapeHtml(x.toLine) +
              ")"
            );
          })
          .join("; ");
    }
    metroRouteText += ". ~" + r.estimatedMin + " min on metro.";
  } else if (metroSummary) {
    metroRouteText =
      "Metro " +
      escapeHtml(metroSummary.fromStation.name) +
      " → " +
      escapeHtml(metroSummary.toStation.name) +
      " (~" +
      metroSummary.metroTimeMin +
      " min)";
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
      ${
        metroSummary &&
        shouldShowMetroOption(distance, walkingTime, metroSummary)
          ? `
      <div class="distance-card metro-card metro-card-full">
        <i class="fas fa-train-subway"></i>
        <div class="label">By Metro</div>
        <div class="value">~${metroSummary.totalEstimateMin} min total</div>
        <div class="metro-breakdown">
          <div class="metro-leg"><strong>To metro:</strong> ${formatDistance(metroSummary.firstMileM)} — walk ~${metroSummary.firstMileWalkMin} min or drive ~${metroSummary.firstMileDriveMin} min → <strong>${metroSummary.fromStation.name}</strong></div>
          <div class="metro-leg metro-route">${metroRouteText}</div>
          <div class="metro-leg"><strong>From metro:</strong> ${formatDistance(metroSummary.lastMileM)} — walk ~${metroSummary.lastMileWalkMin} min or drive ~${metroSummary.lastMileDriveMin} min to destination</div>
        </div>
      </div>
      `
          : ""
      }
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

// Show route on map and open Selected Place panel (only when user clicks "Route" in popup)
function showRouteAndPanel(placeId) {
  const place =
    DEMO_CENTER.nearbyPlaces.find((p) => p.id === placeId) ||
    DEMO_CENTER.insidePlaces.find((p) => p.id === placeId) ||
    DELHI_MONUMENTS.find((p) => p.id === placeId);
  if (!place) return;
  showRouteOnOSM(place.lat, place.lng, place.name);
  if (lastUserLatLng) {
    showSelectedPlace(place, lastUserLatLng.lat, lastUserLatLng.lng);
  }
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
      `Route to ${name} found. Distance ${distance} kilometers, approximately ${time} minutes.`,
    );
  });

  routingControl.on("routingerror", function () {
    appendMessage({
      text: `⚠️ **Could not find a route to ${name}.**\n\nTry opening in **Google Maps** from the place panel, or check your location is enabled.`,
      sender: "bot",
      meta: { source: "Navigation" },
    });
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
      item.lng,
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
      item.lng,
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
  includeReviews = true,
) {
  if (items.length === 0) return `No ${type} found near you.`;
  let response = `📍 **${items.length} ${type} found near you:**\n\n`;
  items.forEach((item, index) => {
    const distance = formatDistance(item.distance);
    const walkingTime = Math.round(item.distance / 80);
    response += `**${index + 1}. ${
      item.name
    }** — ${distance} (${walkingTime} min walk)\n`;
    response += `📍 ${item.landmark || "Nearby"}\n`;
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
  let response = `🏛️ **Places Near You:**\n\n`;
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
  metroContext = {},
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

  const nearestMetroText = metroContext.nearestMetroText || "unknown";
  const placeMetroBlurb = metroContext.placeMetroText
    ? `\n- Metro option for mentioned place: ${metroContext.placeMetroText}`
    : "";

  const prompt = `
You are a friendly and helpful travel guide for monuments and places. You help users discover nearby attractions, famous monuments, and get directions.
You know about local places (e.g. Supermax, SBIT, IIIT, O2 Gym, FIMS Hospital, Sonepat Junction, Golden Hut, Jindal University, Bahalgarh) and famous Delhi monuments (Red Fort, India Gate, Qutub Minar, Humayun's Tomb, Lotus Temple, Akshardham, Jama Masjid, Rashtrapati Bhavan). Suggest "Delhi monuments" or a monument name to see them on the map.

Current Context:
- User Distance From Demo Center (Supermax): ${distanceText}
- User Zone: ${zone.toUpperCase()} (far, near, or inside)
- Nearby Famous Places: ${nearbyPlaces}
- User's nearest metro station: ${nearestMetroText}${placeMetroBlurb}

Relevant local knowledge (use this for accurate answers):
${contextText}

Conversation History (last 5 turns):
${historyText}

User Question:
"${userMessage}"

Instructions for your response:
1. Be conversational, friendly, and helpful.
2. Prefer the "Relevant local knowledge" above when answering about places, monuments, or directions.
3. When discussing distance or how to reach a place, always consider metro: walk to nearest metro, then metro to nearest station to the destination, then walk. Use the metro option data above when present (~2 min per km on metro).
4. If the question is about a listed place or monument, give specific info (distances, how to reach by road and by metro, what's special).
5. For general greetings or casual chat, respond in a friendly manner.
6. For travel to other cities, suggest the nearest railway or transport and keep it light.
7. Keep responses concise. Use emojis where appropriate. If you mention a place, offer to show the route on the map.

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
        },
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
      }`,
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
        }`,
      );
    } catch (parseErr) {
      throw new Error(
        `Gemini API error: ${response.status}. ${errorText || parseErr.message}`,
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
  const places = [...DEMO_CENTER.nearbyPlaces, ...DELHI_MONUMENTS];

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
      .replace(/`(.*?)`/g, "<code>$1</code>");
    // Make [text](https?://...) links clickable; leave other links as plain text for safety
    formattedText = formattedText.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>',
    );
    formattedText = formattedText.replace(/\n/g, "<br>");
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
    (v) => /en-IN|en-GB/.test(v.lang) && v.name.includes("Google"),
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
      "🚶 You are far from the reference point. " +
      (top3Text ? "Top 3 nearest: " + top3Text : "");
    proactivePrompt =
      "The user is far from the reference point. Recommend these top 3 nearest places and ask if they want to see routes: " +
      top3.map((p) => p.name + " – " + formatDistance(p.distance)).join(", ");
  } else if (newZone === "near") {
    uiChip = "🏠 You are near the area! Top 3 nearest: " + top3Text;
    proactivePrompt =
      "The user is close to the area. Suggest visiting these places and offer to show routes: " +
      top3.map((p) => p.name + " – " + formatDistance(p.distance)).join(", ");
  } else if (newZone === "inside") {
    uiChip = "✨ You are at the reference point! Top 3 nearest: " + top3Text;
    proactivePrompt =
      "The user is at the reference point. Recommend these top 3 places to visit and ask if they want directions: " +
      top3.map((p) => p.name + " – " + formatDistance(p.distance)).join(", ");
  } else return;

  showSystemChip(uiChip);

  try {
    const relevantChunks = retrieveRelevantChunks(
      newZone === "far"
        ? "directions to nearby places and monuments"
        : newZone === "near"
          ? "Supermax Sector 33 amenities"
          : "Supermax Sector 33 water cafe toilet",
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

  // Generic "Delhi monuments" / "famous monuments in Delhi" – list all and show on map
  const delhiMonumentTriggers = [
    "delhi monument",
    "monuments in delhi",
    "monuments of delhi",
    "famous monument",
    "famous places in delhi",
    "sightseeing delhi",
    "what to see in delhi",
  ];
  if (delhiMonumentTriggers.some((t) => lower.includes(t))) {
    flyToDelhiMonuments();
    let list = "🏛 **Famous monuments in Delhi** (marked on map):\n\n";
    DELHI_MONUMENTS.forEach((p, i) => {
      list += `**${i + 1}. ${p.name}** — ${p.description}\n\n`;
    });
    list +=
      '📍 Map has moved to Delhi. Click any 🏛 marker for more info, or ask about a specific monument (e.g. "Red Fort", "India Gate").';
    appendMessage({
      text: list,
      sender: "bot",
      meta: { time: new Date().toLocaleTimeString(), source: "Delhi Guide" },
    });
    conversationHistory.push({ role: "assistant", text: list });
    return;
  }

  const distanceMeters =
    lastUserLatLng == null
      ? NaN
      : haversineDistanceMeters(
          lastUserLatLng.lat,
          lastUserLatLng.lng,
          DEMO_CENTER.lat,
          DEMO_CENTER.lng,
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
      const userLat = lastUserLatLng?.lat ?? DEMO_CENTER.lat;
      const userLng = lastUserLatLng?.lng ?? DEMO_CENTER.lng;
      showSelectedPlace(match.place, userLat, userLng);
      if (match.isDelhiMonument) {
        flyToDelhiMonuments();
        if (mapInstance)
          mapInstance.setView([match.place.lat, match.place.lng], 15);
        openPlaceModal(match.place.id);
        appendMessage({
          text: `🏛 **${match.place.name}** (Delhi) — ${match.place.description}\n\nMap moved to Delhi. Use **More info** in the modal for history & significance.`,
          sender: "bot",
          meta: {
            time: new Date().toLocaleTimeString(),
            source: "Delhi Guide",
          },
        });
      } else {
        appendMessage({
          text: `📍 Here's information about **${match.place.name}**.\n\nWould you like me to show the route on map?`,
          sender: "bot",
          meta: {
            time: new Date().toLocaleTimeString(),
            source: "Place Search",
          },
        });
        pendingRouteForPlace = match.place;
      }
      return;
    } else if (match.type === "intent") {
      let message =
        match.message ||
        `Based on your interest in **${match.intent}**, here's the nearest option:`;
      showSelectedPlace(
        match.place,
        lastUserLatLng.lat,
        lastUserLatLng.lng,
        message,
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
                p.lng,
              ),
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
          userLng,
        );
        break;
      case "toilet":
        reply = formatAmenityResponse(
          searchAmenities("restroom", userLat, userLng, "restroom", 5),
          "restroom",
          userLat,
          userLng,
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
          userLng,
        );
        break;
      case "attraction":
        reply = formatAttractionResponse(
          searchAttractions(userLat, userLng, 5),
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

  // For everything else, use Gemini (include metro context for distance/reach questions)
  const userLat = lastUserLatLng?.lat ?? DEMO_CENTER.lat;
  const userLng = lastUserLatLng?.lng ?? DEMO_CENTER.lng;
  const nearestMetro = getNearestMetroStation(userLat, userLng);
  const nearestMetroText = nearestMetro
    ? `${nearestMetro.station.name} (${formatDistance(nearestMetro.distanceMeters)} away)`
    : "none";
  const placeForMetro = extractPlaceFromQuery(trimmed);
  let placeMetroText = null;
  if (placeForMetro && lastUserLatLng) {
    const directDist = haversineDistanceMeters(
      userLat,
      userLng,
      placeForMetro.lat,
      placeForMetro.lng,
    );
    const directWalkMin = Math.round(directDist / WALK_SPEED_M_PER_MIN);
    const metroSum = getMetroRouteSummary(
      userLat,
      userLng,
      placeForMetro.lat,
      placeForMetro.lng,
    );
    if (
      metroSum &&
      shouldShowMetroOption(directDist, directWalkMin, metroSum)
    ) {
      placeMetroText = `To **${placeForMetro.name}** by metro: ${formatMetroSummary(metroSum)}`;
    }
  }

  const typingRef = appendMessage({ text: "", sender: "bot", isTyping: true });
  try {
    const relevantChunks = retrieveRelevantChunks(trimmed, 3);
    const reply = await callGeminiWithRag({
      userMessage: trimmed,
      distanceMeters,
      zone: currentZone,
      retrievedChunks: relevantChunks,
      metroContext: { nearestMetroText, placeMetroText },
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
    const lastUserText =
      conversationHistory.length > 0
        ? conversationHistory[conversationHistory.length - 1].text
        : "";
    typingRef.bubble.innerHTML =
      '⚠️ Something went wrong. Ask about a place, or click the map. <button type="button" class="chat-retry-btn">Try again</button>';
    const retryBtn = typingRef.bubble.querySelector(".chat-retry-btn");
    if (retryBtn && lastUserText) {
      retryBtn.addEventListener("click", () => {
        conversationHistory.pop();
        typingRef.row.remove();
        handleUserMessage(lastUserText);
      });
    }
  }
}

// ==============================
// Delhi Metro – all lines and stations (GeoJSON)
// ==============================
// Revised anchor stations: [lng, lat] for GeoJSON/Leaflet. Overrides CSV when building lines.
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

const DELHI_METRO_LINE_COLORS = {
  Yellow: "#F9D71C",
  Blue: "#00B4F0",
  "Blue Branch": "#00B4F0",
  Red: "#E21836",
  Violet: "#8034C6",
  Green: "#00A651",
  "Green Branch": "#00A651",
  Pink: "#E91E8C",
  Magenta: "#E91E8C",
  Grey: "#9E9E9E",
  Orange: "#F7941D",
  "Airport Express": "#6B4B9A",
};

// Delhi Metro map: revised connections (anchor stations). Same name = one interchange node; bidirectional edges.
const DELHI_METRO_LINE_ORDER = {
  Yellow: [
    "Samaypur Badli",
    "Rohini Sector 18/19",
    "Jahangirpuri",
    "Azadpur",
    "Vishwavidyalaya",
    "Civil Lines",
    "Kashmere Gate",
    "New Delhi",
    "Rajiv Chowk",
    "Patel Chowk",
    "Central Secretariat",
    "INA",
    "AIIMS",
    "Hauz Khas",
    "Saket",
    "Qutub Minar",
    "Chhatarpur",
    "Sultanpur",
    "Ghitorni",
    "Guru Dronacharya",
    "Sikandarpur",
    "MG Road",
    "IFFCO Chowk",
    "HUDA City Centre",
  ],
  Blue: [
    "Dwarka Sector 21",
    "Dwarka",
    "Nawada",
    "Janakpuri West",
    "Tilak Nagar",
    "Rajouri Garden",
    "Kirti Nagar",
    "Karol Bagh",
    "Ramakrishna Ashram Marg",
    "Rajiv Chowk",
    "Mandi House",
    "Indraprastha",
    "Yamuna Bank",
    "Akshardham",
    "Mayur Vihar Phase-1",
    "Botanical Garden",
    "Noida Electronic City",
  ],
  "Blue Branch": [
    "Yamuna Bank",
    "Laxmi Nagar",
    "Nirman Vihar",
    "Anand Vihar ISBT",
    "Kaushambi",
    "Vaishali",
  ],
  Red: [
    "Shaheed Sthal",
    "Hindon River",
    "Arthala",
    "Mohan Nagar",
    "Shyam Park",
    "Major Mohit Sharma",
    "Raj Bagh",
    "Dilshad Garden",
    "Shahdara",
    "Welcome",
    "Kashmere Gate",
    "Inderlok",
    "Netaji Subhash Place",
    "Rithala",
  ],
  Pink: [
    "Majlis Park",
    "Netaji Subhash Place",
    "Punjabi Bagh West",
    "Mayapuri",
    "Delhi Cantonment",
    "Durgabai Deshmukh South Campus",
    "INA",
    "Lajpat Nagar",
    "Ashram",
    "Mayur Vihar Pocket I",
    "Anand Vihar ISBT",
    "Maujpur-Babarpur",
    "Shiv Vihar",
  ],
  Magenta: [
    "Janakpuri West",
    "Munirka",
    "Hauz Khas",
    "Kalkaji Mandir",
    "Okhla NSIC",
    "Jamia Millia Islamia",
    "Kalindi Kunj",
    "Okhla Bird Sanctuary",
    "Botanical Garden",
  ],
  Violet: [
    "Kashmere Gate",
    "Lal Qila",
    "Jama Masjid",
    "Delhi Gate",
    "ITO",
    "Mandi House",
    "Janpath",
    "Central Secretariat",
    "Khan Market",
    "Jawaharlal Nehru Stadium",
    "Jangpura",
    "Lajpat Nagar",
    "Moolchand",
    "Kailash Colony",
    "Nehru Place",
    "Kalkaji Mandir",
    "Govind Puri",
    "Harkesh Nagar Okhla",
    "Jasola Apollo",
    "Sarita Vihar",
    "Mohan Estate",
    "Tughlakabad",
    "Badarpur Border",
    "Sarai",
    "NHPC Chowk",
    "Mewla Maharajpur",
    "Sector 28",
    "Badkhal Mor",
    "Old Faridabad",
    "Neelam Chowk Ajronda",
    "Bata Chowk",
    "Escorts Mujesar",
    "Sant Surdas (Sihi)",
    "Raja Nahar Singh",
  ],
  Green: [
    "Inderlok",
    "Ashok Park Main",
    "Punjabi Bagh",
    "Shivaji Park",
    "Madipur",
    "Paschim Vihar East",
    "Paschim Vihar West",
    "Peera Garhi",
    "Udyog Nagar",
    "Surajmal Stadium",
    "Nangloi",
    "Nangloi Railway Station",
    "Rajdhani Park",
    "Mundka",
    "Mundka Industrial Area",
    "Ghevra",
    "Tikri Kalan",
    "Tikri Border",
    "Pandit Shree Ram Sharma",
    "Bahadurgarh City",
    "Brigadier Hoshiar Singh",
  ],
  "Green Branch": ["Ashok Park Main", "Satguru Ram Singh Marg", "Kirti Nagar"],
  Grey: ["Najafgarh", "Nangli", "Dhansa Bus Stand"],
  "Airport Express": [
    "New Delhi Railway Station",
    "Shivaji Stadium",
    "Dhaula Kuan",
    "Delhi Aerocity",
    "IGI Airport T3",
  ],
};

const DELHI_METRO_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Yellow Line", line: "Yellow", color: "#F9D71C" },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.17, 28.73],
          [77.18, 28.71],
          [77.19, 28.7],
          [77.2, 28.69],
          [77.21, 28.68],
          [77.22, 28.67],
          [77.22, 28.66],
          [77.22, 28.65],
          [77.22, 28.63],
          [77.22, 28.62],
          [77.22, 28.61],
          [77.21, 28.59],
          [77.22, 28.57],
          [77.23, 28.55],
          [77.22, 28.53],
          [77.185, 28.524],
          [77.17, 28.52],
          [77.14, 28.51],
          [77.12, 28.5],
          [77.09, 28.49],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Blue Line", line: "Blue", color: "#00B4F0" },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.04, 28.59],
          [77.06, 28.585],
          [77.08, 28.58],
          [77.1, 28.58],
          [77.15, 28.6],
          [77.18, 28.615],
          [77.22, 28.63],
          [77.24, 28.63],
          [77.26, 28.62],
          [77.28, 28.62],
          [77.3, 28.61],
          [77.32, 28.6],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Red Line", line: "Red", color: "#E21836" },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.05, 28.72],
          [77.07, 28.71],
          [77.1, 28.705],
          [77.14, 28.695],
          [77.18, 28.68],
          [77.22, 28.67],
          [77.26, 28.665],
          [77.3, 28.66],
          [77.34, 28.655],
          [77.38, 28.65],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Violet Line", line: "Violet", color: "#8034C6" },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.22, 28.67],
          [77.21, 28.66],
          [77.18, 28.64],
          [77.15, 28.62],
          [77.12, 28.61],
          [77.1, 28.6],
          [77.08, 28.59],
          [77.08, 28.56],
          [77.1, 28.54],
          [77.12, 28.52],
          [77.15, 28.51],
          [77.2, 28.5],
          [77.26, 28.49],
          [77.28, 28.48],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Green Line", line: "Green", color: "#00A651" },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.08, 28.65],
          [77.1, 28.64],
          [77.12, 28.63],
          [77.15, 28.62],
          [77.18, 28.615],
          [77.22, 28.61],
          [77.26, 28.6],
          [77.28, 28.58],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Pink Line", line: "Pink", color: "#E91E8C" },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.06, 28.72],
          [77.1, 28.7],
          [77.14, 28.68],
          [77.18, 28.66],
          [77.22, 28.64],
          [77.26, 28.62],
          [77.28, 28.59],
          [77.28, 28.56],
          [77.26, 28.53],
          [77.24, 28.5],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Magenta Line", line: "Magenta", color: "#E91E8C" },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.08, 28.61],
          [77.12, 28.6],
          [77.18, 28.59],
          [77.22, 28.58],
          [77.26, 28.57],
          [77.3, 28.56],
          [77.34, 28.55],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Grey Line", line: "Grey", color: "#9E9E9E" },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.08, 28.68],
          [77.12, 28.67],
          [77.16, 28.665],
          [77.2, 28.66],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Orange Line", line: "Orange", color: "#F7941D" },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.28, 28.65],
          [77.3, 28.64],
          [77.32, 28.63],
          [77.34, 28.62],
          [77.36, 28.61],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Airport Express",
        line: "Airport Express",
        color: "#6B4B9A",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.22, 28.64],
          [77.2, 28.58],
          [77.14, 28.56],
          [77.08, 28.55],
          [77.02, 28.54],
        ],
      },
    },
  ],
};

// Stations: [lng, lat], name, line(s)
const DELHI_METRO_STATIONS = [
  { name: "Samaypur Badli", coords: [77.17, 28.73], lines: ["Yellow"] },
  { name: "Rohini Sector 18-19", coords: [77.18, 28.71], lines: ["Yellow"] },
  { name: "Jahangirpuri", coords: [77.2, 28.69], lines: ["Yellow"] },
  {
    name: "Kashmere Gate",
    coords: [77.22, 28.67],
    lines: ["Yellow", "Red", "Violet"],
  },
  { name: "Chandni Chowk", coords: [77.22, 28.65], lines: ["Yellow"] },
  {
    name: "New Delhi",
    coords: [77.22, 28.63],
    lines: ["Yellow", "Airport Express"],
  },
  { name: "Rajiv Chowk", coords: [77.22, 28.63], lines: ["Yellow", "Blue"] },
  {
    name: "Central Secretariat",
    coords: [77.22, 28.61],
    lines: ["Yellow", "Violet"],
  },
  { name: "Hauz Khas", coords: [77.22, 28.55], lines: ["Yellow", "Magenta"] },
  { name: "Qutub Minar", coords: [77.185, 28.524], lines: ["Yellow"] },
  { name: "HUDA City Centre", coords: [77.09, 28.49], lines: ["Yellow"] },
  {
    name: "Dwarka Sector 21",
    coords: [77.04, 28.59],
    lines: ["Blue", "Airport Express"],
  },
  { name: "Dwarka", coords: [77.06, 28.585], lines: ["Blue"] },
  {
    name: "Janakpuri West",
    coords: [77.08, 28.58],
    lines: ["Blue", "Magenta"],
  },
  { name: "Rajouri Garden", coords: [77.1, 28.58], lines: ["Blue", "Pink"] },
  { name: "Karol Bagh", coords: [77.18, 28.615], lines: ["Blue"] },
  { name: "Yamuna Bank", coords: [77.28, 28.62], lines: ["Blue"] },
  { name: "Vaishali", coords: [77.32, 28.6], lines: ["Blue"] },
  { name: "Rithala", coords: [77.05, 28.72], lines: ["Red"] },
  { name: "Rohini West", coords: [77.07, 28.71], lines: ["Red"] },
  { name: "Pitampura", coords: [77.14, 28.695], lines: ["Red"] },
  { name: "Shastri Park", coords: [77.26, 28.665], lines: ["Red"] },
  { name: "Dilshad Garden", coords: [77.38, 28.65], lines: ["Red"] },
  {
    name: "Kalkaji Mandir",
    coords: [77.08, 28.56],
    lines: ["Violet", "Magenta"],
  },
  { name: "Ballabhgarh", coords: [77.28, 28.48], lines: ["Violet"] },
  { name: "Inderlok", coords: [77.08, 28.65], lines: ["Green", "Red"] },
  { name: "Kirti Nagar", coords: [77.15, 28.62], lines: ["Green", "Blue"] },
  { name: "Ashok Park Main", coords: [77.18, 28.615], lines: ["Green"] },
  { name: "Mundka", coords: [77.06, 28.72], lines: ["Pink"] },
  {
    name: "Mayur Vihar Phase-1",
    coords: [77.28, 28.59],
    lines: ["Pink", "Blue"],
  },
  { name: "Shiv Vihar", coords: [77.08, 28.61], lines: ["Magenta"] },
  {
    name: "Botanical Garden",
    coords: [77.34, 28.55],
    lines: ["Magenta", "Blue"],
  },
  { name: "Najafgarh", coords: [77.08, 28.68], lines: ["Grey"] },
  { name: "Dhansa Bus Stand", coords: [77.2, 28.66], lines: ["Grey"] },
  { name: "Nangloi", coords: [77.28, 28.65], lines: ["Orange"] },
  {
    name: "New Delhi Railway Station",
    coords: [77.22, 28.64],
    lines: ["Airport Express", "Yellow"],
  },
  {
    name: "IGI Airport T3",
    coords: [77.02, 28.54],
    lines: ["Airport Express"],
  },
];

function getStationLineColor(lines) {
  if (!lines || lines.length === 0) return "#555";
  return DELHI_METRO_LINE_COLORS[lines[0]] || "#555";
}

/** Nearest metro station to a point. coords are [lng, lat]. */
function getNearestMetroStation(lat, lng) {
  const list =
    currentMetroStations && currentMetroStations.length
      ? currentMetroStations
      : DELHI_METRO_STATIONS;
  if (!list.length || lat == null || lng == null) return null;
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    const d = haversineDistanceMeters(lat, lng, s.coords[1], s.coords[0]);
    if (d < bestD) {
      bestD = d;
      best = { station: s, distanceMeters: d };
    }
  }
  return best;
}

// Metro graph: connected graph for shortest-path routing and line drawing.
// Rules: (1) Each line is an ordered list; adjacent stations get a bidirectional edge.
// (2) Same station name on multiple lines = ONE node (interchanges merge automatically).
// (3) Exact names from DELHI_METRO_LINE_ORDER only; no renaming.
let METRO_GRAPH_ADJ = null; // Map: stationName -> [{ neighbor, line }]
let METRO_LINE_BETWEEN = null; // Map: "A|B" -> line (both directions)
let METRO_STATION_KEYS = null; // Set of all station names for resolveMetroStationName

function buildMetroGraph() {
  if (METRO_GRAPH_ADJ) return;
  const adj = new Map();
  const lineBetween = new Map();
  const keys = new Set();
  function addEdge(a, b, line) {
    const A = a.trim();
    const B = b.trim();
    keys.add(A);
    keys.add(B);
    const k1 = A + "|" + B;
    const k2 = B + "|" + A;
    lineBetween.set(k1, line);
    lineBetween.set(k2, line);
    if (!adj.has(A)) adj.set(A, []);
    adj.get(A).push({ neighbor: B, line });
    if (!adj.has(B)) adj.set(B, []);
    adj.get(B).push({ neighbor: A, line });
  }
  Object.keys(DELHI_METRO_LINE_ORDER).forEach(function (line) {
    const arr = DELHI_METRO_LINE_ORDER[line];
    for (let i = 0; i < arr.length - 1; i++) {
      addEdge(arr[i], arr[i + 1], line);
    }
  });
  METRO_GRAPH_ADJ = adj;
  METRO_LINE_BETWEEN = lineBetween;
  METRO_STATION_KEYS = keys;
}

function resolveMetroStationName(name) {
  if (!name) return null;
  buildMetroGraph();
  const n = (name || "").trim();
  if (METRO_STATION_KEYS.has(n)) return n;
  const nLower = n.toLowerCase();
  for (const k of METRO_STATION_KEYS) {
    if (k.toLowerCase() === nLower) return k;
  }
  for (const k of METRO_STATION_KEYS) {
    if (
      k.toLowerCase().indexOf(nLower) !== -1 ||
      nLower.indexOf(k.toLowerCase()) !== -1
    )
      return k;
  }
  return null;
}

function getLineBetweenStations(a, b) {
  buildMetroGraph();
  return METRO_LINE_BETWEEN.get(a + "|" + b) || null;
}

/**
 * Get metro route between two stations: path with line segments and interchanges.
 * Returns { path: [{ station, line }], interchanges: [{ station, fromLine, toLine }], totalStations, estimatedMin } or null.
 */
function getMetroRouteBetweenStations(fromStationName, toStationName) {
  buildMetroGraph();
  const fromKey = resolveMetroStationName(fromStationName);
  const toKey = resolveMetroStationName(toStationName);
  if (!fromKey || !toKey || fromKey === toKey) return null;

  // BFS for shortest path (fewest hops)
  const queue = [{ key: fromKey, path: [fromKey] }];
  const visited = new Set([fromKey]);
  let resultPath = null;
  while (queue.length > 0) {
    const { key, path } = queue.shift();
    if (key === toKey) {
      resultPath = path;
      break;
    }
    const neighbors = METRO_GRAPH_ADJ.get(key) || [];
    for (let i = 0; i < neighbors.length; i++) {
      const next = neighbors[i].neighbor;
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push({ key: next, path: path.concat([next]) });
    }
  }
  if (!resultPath || resultPath.length < 2) return null;

  // Assign line to each segment and detect interchanges
  const pathWithLines = [];
  const interchanges = [];
  let currentLine = getLineBetweenStations(resultPath[0], resultPath[1]);
  pathWithLines.push({ station: resultPath[0], line: currentLine });
  for (let i = 1; i < resultPath.length; i++) {
    const prev = resultPath[i - 1];
    const cur = resultPath[i];
    const segLine = getLineBetweenStations(prev, cur);
    if (segLine && segLine !== currentLine) {
      interchanges.push({
        station: cur,
        fromLine: currentLine,
        toLine: segLine,
      });
      currentLine = segLine;
    } else if (segLine) {
      currentLine = segLine;
    }
    pathWithLines.push({ station: cur, line: currentLine });
  }
  const totalStations = resultPath.length - 1;
  const estimatedMin =
    totalStations * METRO_MIN_PER_STATION + interchanges.length * 3;

  return {
    path: pathWithLines,
    interchanges,
    totalStations,
    estimatedMin,
    fromStation: resultPath[0],
    toStation: resultPath[resultPath.length - 1],
  };
}

/** ~2 min per km for metro (including stops). */
const METRO_SPEED_KMH = 30;
const WALK_SPEED_M_PER_MIN = 80;
const DRIVING_SPEED_M_PER_MIN = 400; // ~24 km/h in city
const METRO_MIN_PER_STATION = 2; // approx min per station including stops
/** Don't suggest metro if destination is closer than this (going to metro would just add extra leg). */
const MIN_DIRECT_DISTANCE_FOR_METRO_M = 2000;

/**
 * Metro route summary: origin → nearest metro (walk/drive) → metro (with line & interchange) → nearest metro to dest → destination (walk/drive).
 * Returns null if no stations or origin/dest same station (or very close).
 */
function getMetroRouteSummary(originLat, originLng, destLat, destLng) {
  const from = getNearestMetroStation(originLat, originLng);
  const to = getNearestMetroStation(destLat, destLng);
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
    destLat,
    destLng,
  );
  const metroRouteDetail = getMetroRouteBetweenStations(
    from.station.name,
    to.station.name,
  );
  const metroTimeMin = metroRouteDetail
    ? metroRouteDetail.estimatedMin
    : Math.max(
        2,
        Math.round(
          (haversineDistanceMeters(
            from.station.coords[1],
            from.station.coords[0],
            to.station.coords[1],
            to.station.coords[0],
          ) /
            1000 /
            METRO_SPEED_KMH) *
            60,
        ),
      );
  const firstMileWalkMin = Math.round(firstMileM / WALK_SPEED_M_PER_MIN);
  const firstMileDriveMin = Math.round(firstMileM / DRIVING_SPEED_M_PER_MIN);
  const lastMileWalkMin = Math.round(lastMileM / WALK_SPEED_M_PER_MIN);
  const lastMileDriveMin = Math.round(lastMileM / DRIVING_SPEED_M_PER_MIN);
  const totalWalkMin = firstMileWalkMin + lastMileWalkMin;
  const totalEstimateMin = totalWalkMin + metroTimeMin;
  const totalDistM =
    firstMileM +
    (metroRouteDetail
      ? metroRouteDetail.totalStations * 800
      : haversineDistanceMeters(
          from.station.coords[1],
          from.station.coords[0],
          to.station.coords[1],
          to.station.coords[0],
        )) +
    lastMileM;

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
    metroRouteDetail,
    totalWalkMin,
    totalEstimateMin,
    totalDistM,
  };
}

/** Only show metro option when it's logical: destination far enough that metro can help; not when walking is as fast or going to metro just adds extra distance. */
function shouldShowMetroOption(
  directDistanceMeters,
  directWalkMin,
  metroSummary,
) {
  if (!metroSummary || !isFinite(directDistanceMeters)) return false;
  if (directDistanceMeters < MIN_DIRECT_DISTANCE_FOR_METRO_M) return false;
  if (directWalkMin <= metroSummary.totalEstimateMin) return false;
  return true;
}

function formatMetroRouteDetail(metroRouteDetail) {
  if (!metroRouteDetail || !metroRouteDetail.path.length) return "";
  const parts = [];
  let curLine = null;
  let segmentStart = null;
  metroRouteDetail.path.forEach(function (p, i) {
    if (p.line !== curLine) {
      if (curLine) {
        parts.push(
          "Take " +
            curLine +
            " from " +
            segmentStart +
            " to " +
            metroRouteDetail.path[i - 1].station,
        );
      }
      curLine = p.line;
      segmentStart = p.station;
    }
  });
  if (curLine && segmentStart) {
    parts.push(
      "Take " +
        curLine +
        " from " +
        segmentStart +
        " to " +
        metroRouteDetail.toStation,
    );
  }
  let text = parts.join(". ");
  if (
    metroRouteDetail.interchanges &&
    metroRouteDetail.interchanges.length > 0
  ) {
    const ch = metroRouteDetail.interchanges
      .map(function (x) {
        return (
          "Change at " + x.station + " from " + x.fromLine + " to " + x.toLine
        );
      })
      .join("; ");
    text += " (Interchange: " + ch + "). ";
  }
  text += "~" + metroRouteDetail.estimatedMin + " min on metro.";
  return text;
}

function formatMetroSummary(summary) {
  if (!summary) return "";
  const toMetro =
    "To metro: " +
    formatDistance(summary.firstMileM) +
    " walk (~" +
    summary.firstMileWalkMin +
    " min) or drive (~" +
    summary.firstMileDriveMin +
    " min) to " +
    summary.fromStation.name +
    ".";
  const metroPart = summary.metroRouteDetail
    ? formatMetroRouteDetail(summary.metroRouteDetail)
    : "Metro " +
      summary.fromStation.name +
      " → " +
      summary.toStation.name +
      " (~" +
      summary.metroTimeMin +
      " min).";
  const fromMetro =
    "From metro: " +
    formatDistance(summary.lastMileM) +
    " walk (~" +
    summary.lastMileWalkMin +
    " min) or drive (~" +
    summary.lastMileDriveMin +
    " min) to destination.";
  return (
    toMetro +
    " " +
    metroPart +
    " " +
    fromMetro +
    " Total ~" +
    summary.totalEstimateMin +
    " min."
  );
}

function normalizeStationName(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").replace(/-/g, " ").trim();
}

// Aliases for station names (ordered name -> CSV name) so DMRC/Wikipedia names match CSV
const METRO_STATION_ALIASES = {
  "Raja Nahar Singh": "Ballabhgarh",
  "Lal Qila": "Red Fort",
  "Maharaja Surajmal Stadium": "Surajmal Stadium",
  Peeragarhi: "Peera Garhi",
  "Dilli Haat - INA": "INA",
  "Haiderpur Badli Mor": "Haiderpur",
  "Barakhamba Road": "Barakhambha Road",
  "Mayur Vihar Phase-1": "Mayur Vihar -I",
  "Hindon River": "Hindon",
  Pitampura: "Pitam Pura",
  Tughlakabad: "Tughlakabad Station",
  "Dabri Mor": "Dabri Mor-Janakpuri South",
  "RK Puram": "R.K.Puram",
  "Rohini Sector 18/19": "Rohini Sector 18",
  Vishwavidyalaya: "Vishwa Vidyalaya",
  Sikanderpur: "Sikandarpur",
  "Surajmal Stadium": "Maharaja Surajmal Stadium",
  "Nangloi Railway Station": "Nangloi Railway station",
  "Satguru Ram Singh Marg": "Satguru Ramsingh Marg",
  "Brigadier Hoshiar Singh": "Brigadier Hoshiyar Singh",
};

function findCoordForOrderedName(orderedName, nameToCoord) {
  let n = normalizeStationName(orderedName);
  if (nameToCoord.has(n)) return nameToCoord.get(n);
  const alias = METRO_STATION_ALIASES[orderedName];
  if (alias && nameToCoord.has(normalizeStationName(alias)))
    return nameToCoord.get(normalizeStationName(alias));
  for (const [key, coord] of nameToCoord) {
    if (key.indexOf(n) !== -1 || n.indexOf(key) !== -1) return coord;
  }
  return null;
}

// Load Delhi Metro from CSV – build lines in correct route order using DELHI_METRO_LINE_ORDER
function parseMetroCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return null;
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    if (parts.length < 4) continue;
    const name = (parts[0] || "").trim();
    const lineName = (parts[1] || "").trim();
    const lat = parseFloat(parts[2]);
    const lng = parseFloat(parts[3]);
    if (!name || !lineName || isNaN(lat) || isNaN(lng)) continue;
    rows.push({ name, line: lineName, lat, lng });
  }
  const stationMap = new Map();
  const nameToCoord = new Map();
  rows.forEach(function (r) {
    const key = r.name + "|" + r.lat.toFixed(5) + "|" + r.lng.toFixed(5);
    if (!stationMap.has(key))
      stationMap.set(key, { name: r.name, coords: [r.lng, r.lat], lines: [] });
    const s = stationMap.get(key);
    if (s.lines.indexOf(r.line) === -1) s.lines.push(r.line);
    nameToCoord.set(normalizeStationName(r.name), [r.lng, r.lat]);
  });
  // Revised anchor coords override CSV (map alignment)
  Object.keys(DELHI_METRO_STATIONS_REVISED).forEach(function (name) {
    nameToCoord.set(
      normalizeStationName(name),
      DELHI_METRO_STATIONS_REVISED[name],
    );
  });
  const stations = Array.from(stationMap.values()).map(function (s) {
    return { name: s.name, coords: s.coords, lines: s.lines };
  });
  // Apply revised coords to station markers; add revised-only stations
  const seenNormal = new Set(
    stations.map(function (s) {
      return normalizeStationName(s.name);
    }),
  );
  Object.keys(DELHI_METRO_STATIONS_REVISED).forEach(function (name) {
    const n = normalizeStationName(name);
    const revCoord = DELHI_METRO_STATIONS_REVISED[name];
    const found = stations.find(function (s) {
      return normalizeStationName(s.name) === n;
    });
    if (found) found.coords = revCoord;
    else if (!seenNormal.has(n)) {
      stations.push({ name: name, coords: revCoord, lines: [] });
      seenNormal.add(n);
    }
  });

  const features = [];
  const lineNamesInOrder = Object.keys(DELHI_METRO_LINE_ORDER);
  lineNamesInOrder.forEach(function (lineName) {
    const orderList = DELHI_METRO_LINE_ORDER[lineName];
    const coords = [];
    orderList.forEach(function (stationName) {
      const c = findCoordForOrderedName(stationName, nameToCoord);
      if (
        c &&
        (coords.length === 0 ||
          c[0] !== coords[coords.length - 1][0] ||
          c[1] !== coords[coords.length - 1][1])
      )
        coords.push(c);
    });
    if (coords.length < 2) return;
    const color =
      DELHI_METRO_LINE_COLORS[lineName] ||
      DELHI_METRO_LINE_COLORS["Blue"] ||
      "#555";
    const displayName =
      lineName === "Blue Branch"
        ? "Blue Line (Vaishali Branch)"
        : lineName === "Green Branch"
          ? "Green Line (Branch)"
          : lineName + " Line";
    features.push({
      type: "Feature",
      properties: { name: displayName, line: lineName, color: color },
      geometry: { type: "LineString", coordinates: coords },
    });
  });

  const orderedLineNames = new Set(lineNamesInOrder);
  const lineCoordsFromCSV = {};
  rows.forEach(function (r) {
    if (!lineCoordsFromCSV[r.line]) lineCoordsFromCSV[r.line] = [];
    lineCoordsFromCSV[r.line].push([r.lng, r.lat]);
  });
  Object.keys(lineCoordsFromCSV).forEach(function (lineName) {
    if (orderedLineNames.has(lineName)) return;
    let coords = lineCoordsFromCSV[lineName];
    coords = coords.sort(function (a, b) {
      if (Math.abs(a[1] - b[1]) > 0.001) return b[1] - a[1];
      return a[0] - b[0];
    });
    if (coords.length < 2) return;
    features.push({
      type: "Feature",
      properties: {
        name: lineName + " Line",
        line: lineName,
        color: DELHI_METRO_LINE_COLORS[lineName] || "#555",
      },
      geometry: { type: "LineString", coordinates: coords },
    });
  });

  return {
    geoJson: { type: "FeatureCollection", features: features },
    stations: stations,
  };
}

function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if ((c === "," && !inQuotes) || c === "\n" || c === "\r") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

// ==============================
// Map & Location - FIXED AUTO-PANNING
// ==============================

let metroLayer = null;
let metroStationsLayer = null;
let metroLayerGroup = null;
/** Current metro stations list (from CSV or fallback); used for distance/metro estimates. */
let currentMetroStations = []; // set in addMetroLayers; getNearestMetroStation falls back to DELHI_METRO_STATIONS

// Base map layers (clean, non-yellow: Standard, Dark, Satellite)
const MAP_LAYERS = {
  Standard: L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {
      attribution:
        "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='https://carto.com/attributions'>CARTO</a>",
      subdomains: "abcd",
      maxZoom: 20,
    },
  ),
  Dark: L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 20,
    },
  ),
  Satellite: L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "&copy; Esri",
      maxZoom: 19,
    },
  ),
};

function initMap() {
  mapInstance = L.map("map", {
    doubleClickZoom: true,
    zoomControl: false,
  }).setView([DEMO_CENTER.lat, DEMO_CENTER.lng], 15);

  MAP_LAYERS.Standard.addTo(mapInstance);

  function styleMetroLine(feature) {
    return {
      color: feature.properties.color || "#555",
      weight: 4,
      opacity: 0.85,
      lineCap: "round",
      lineJoin: "round",
    };
  }

  function addMetroLayers(geoJson, stations) {
    if (metroLayerGroup && mapInstance.hasLayer(metroLayerGroup))
      mapInstance.removeLayer(metroLayerGroup);
    currentMetroStations =
      stations && stations.length ? stations : DELHI_METRO_STATIONS;
    metroLayer = L.geoJSON(geoJson, {
      style: styleMetroLine,
      onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.name) {
          layer.bindTooltip(feature.properties.name, {
            permanent: false,
            direction: "top",
          });
        }
      },
    });
    metroStationsLayer = L.layerGroup();
    (stations || []).forEach(function (s) {
      const color = getStationLineColor(s.lines);
      const linesLabel =
        s.lines && s.lines.length ? " (" + s.lines.join(", ") + ")" : "";
      const marker = L.circleMarker([s.coords[1], s.coords[0]], {
        radius: 2.5,
        fillColor: color,
        color: "rgba(255,255,255,0.6)",
        weight: 0.5,
        opacity: 0.7,
        fillOpacity: 0.65,
      });
      marker.bindTooltip("<b>" + s.name + "</b>" + linesLabel, {
        permanent: false,
        direction: "top",
        className: "metro-station-tooltip",
      });
      metroStationsLayer.addLayer(marker);
    });
    metroLayerGroup = L.layerGroup([metroLayer, metroStationsLayer]); // not added to map – lines & dots hidden
  }

  function initMetroWithControl() {
    L.control
      .layers(
        {
          Standard: MAP_LAYERS.Standard,
          Dark: MAP_LAYERS.Dark,
          Satellite: MAP_LAYERS.Satellite,
        },
        { "Metro lines & stations": metroLayerGroup },
        { position: "topright", collapsed: true },
      )
      .addTo(mapInstance);
  }

  fetch("delhi-metro-data.csv")
    .then(function (r) {
      return r.text();
    })
    .then(function (csvText) {
      const parsed = parseMetroCSV(csvText);
      if (
        parsed &&
        parsed.geoJson.features.length > 0 &&
        parsed.stations.length > 0
      ) {
        addMetroLayers(parsed.geoJson, parsed.stations);
      } else {
        addMetroLayers(DELHI_METRO_GEOJSON, DELHI_METRO_STATIONS);
      }
      initMetroWithControl();
    })
    .catch(function () {
      addMetroLayers(DELHI_METRO_GEOJSON, DELHI_METRO_STATIONS);
      initMetroWithControl();
    });

  L.control.zoom({ position: "bottomright" }).addTo(mapInstance);

  mapInstance.on("dblclick", function (e) {
    mapInstance.setView(e.latlng, mapInstance.getZoom() + 1, { animate: true });
  });

  const centerIcon = L.divIcon({
    className: "custom-marker center-marker",
    html: '<div style="background-color: #0a84ff; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #64b5ff;"></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
  centerMarker = L.marker([DEMO_CENTER.lat, DEMO_CENTER.lng], {
    icon: centerIcon,
  }).addTo(mapInstance);
  centerMarker.bindPopup(
    `<div class="map-popup-inner"><b>${DEMO_CENTER.name}</b><span>Sector 33, Stadium Road – Reference point</span><div class="map-popup-buttons"><button class="modal-route-btn map-popup-more-btn" onclick="openPlaceModal('supermax_gate')">About</button><button class="map-popup-route-btn" onclick="showRouteAndPanel('supermax_gate')">Route</button></div><span class="map-popup-tag">Reference</span></div>`,
    { closeButton: false },
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
      mapInstance,
    );

    const tagLabel = place.tag || "Place";
    const typeIcon = PLACE_TAG_ICON[tagLabel] || PLACE_TAG_ICON.Place;
    const tooltipContent = typeIcon + " " + place.name;
    marker.bindTooltip(tooltipContent, {
      permanent: false,
      direction: "top",
      offset: [0, -10],
    });

    marker.on("click", function (e) {
      L.DomEvent.stopPropagation(e);
    });

    const visitedStatus = visitedPlaces.has(place.id) ? " (Visited)" : "";
    const moreInfoBtn = PLACE_DETAILED_INFO[place.id]
      ? `<button class="modal-route-btn map-popup-more-btn" onclick="openPlaceModal('${place.id}')">About</button>`
      : "";
    const routeBtn = `<button class="map-popup-route-btn" onclick="showRouteAndPanel('${place.id}')">Route</button>`;
    marker.bindPopup(
      `<div class="map-popup-inner"><b>${place.name}${visitedStatus}</b><span>${place.description}</span><div class="map-popup-buttons">${moreInfoBtn}${routeBtn}</div><span class="map-popup-tag">${tagLabel}</span></div>`,
      { closeButton: false },
    );
    const tooltipOptions = {
      permanent: false,
      direction: "top",
      offset: [0, -10],
    };
    marker.on("popupopen", function () {
      marker.closeTooltip();
      marker.unbindTooltip();
    });
    marker.on("popupclose", function () {
      marker.bindTooltip(tooltipContent, tooltipOptions);
    });

    insideMarkers.push(marker);
  });

  // Delhi monuments layer (custom PNG/WebP icons when available, else pin)
  const delhiIconColor = "#0a84ff";
  DELHI_MONUMENTS.forEach((place) => {
    const imgPath = DELHI_MONUMENT_IMAGES[place.id];
    const isNarrow = place.id === "qutub_minar";
    const icon = imgPath
      ? L.icon({
          iconUrl: encodeURI(imgPath),
          iconSize: isNarrow ? [16, 32] : [32, 32],
          iconAnchor: isNarrow ? [8, 32] : [16, 32],
          popupAnchor: isNarrow ? [0, -32] : [0, -32],
          className:
            "delhi-monument-icon" +
            (isNarrow ? " delhi-monument-icon-narrow" : ""),
        })
      : L.divIcon({
          className: "custom-marker delhi-marker",
          html: `<div style="background-color: ${delhiIconColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #64b5ff;"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
    const marker = L.marker([place.lat, place.lng], { icon }).addTo(
      mapInstance,
    );
    const tagLabel = place.tag || "Monument";
    const typeIcon = PLACE_TAG_ICON[tagLabel] || PLACE_TAG_ICON.Monument;
    const tooltipContent = typeIcon + " " + place.name;
    const tooltipOptions = {
      permanent: false,
      direction: "top",
      offset: [0, -10],
    };
    marker.bindTooltip(tooltipContent, tooltipOptions);
    const nameEsc = (place.name || "").replace(/'/g, "\\'");
    marker.bindPopup(
      `<div class="map-popup-inner"><b>${place.name}</b><div class="map-popup-buttons"><button class="modal-route-btn map-popup-more-btn" onclick="openPlaceModal('${place.id}')">About</button><button class="map-popup-route-btn" onclick="showRouteAndPanel('${place.id}')">Route</button></div><span class="map-popup-tag">${tagLabel}</span></div>`,
      { closeButton: false },
    );
    marker.on("click", function (e) {
      L.DomEvent.stopPropagation(e);
      mapInstance.setView([place.lat, place.lng], 15);
      setTimeout(function () {
        marker.openPopup();
      }, 350);
    });
    marker.on("popupopen", function () {
      marker.closeTooltip();
      marker.unbindTooltip();
    });
    marker.on("popupclose", function () {
      marker.bindTooltip(tooltipContent, tooltipOptions);
    });
    delhiMonumentMarkers.push(marker);
  });

  mapInstance.on("zoomend", function () {
    const zoom = mapInstance.getZoom();
    if (zoom >= 16) addAmenityMarkers();
    else removeAmenityMarkers();
  });

  document.addEventListener("click", function (e) {
    const routeBtn = e.target.closest(".map-popup-route-btn");
    const aboutBtn = e.target.closest(".map-popup-more-btn");
    var wrap =
      (routeBtn || aboutBtn) &&
      (routeBtn || aboutBtn).closest(".map-popup-buttons");
    if (!wrap) return;
    var more = wrap.querySelector(".map-popup-more-btn");
    var route = wrap.querySelector(".map-popup-route-btn");
    if (routeBtn && route) {
      if (more) more.classList.remove("is-active");
      route.classList.add("is-active");
    } else if (aboutBtn && more) {
      if (route) route.classList.remove("is-active");
      more.classList.add("is-active");
    }
  });

  mapReady = true;
  const chCursorReapply = document.getElementById("chCursorLocationToggle");
  if (chCursorReapply && chCursorReapply.checked) {
    setCursorLocationMode(true);
  }
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
          }/5`,
        );

      marker.on("click", function (e) {
        L.DomEvent.stopPropagation(e);
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

function attachUserMarkerDragHandler() {
  if (!userMarker || userMarker._chDragHooked) return;
  userMarker._chDragHooked = true;
  userMarker.on("dragend", function (e) {
    if (!cursorLocationMode) return;
    const ll = e.target.getLatLng();
    syncUserLocation(ll.lat, ll.lng, { source: "drag" });
  });
}

/**
 * Single path for user position → UI, zone, top3, monument geofence, marker.
 * @param {string} opts.source - 'gps' | 'click' | 'drag' | 'toggle'
 */
function syncUserLocation(lat, lng, opts) {
  opts = opts || {};
  const source = opts.source || "programmatic";

  lastUserLatLng = { lat: lat, lng: lng };

  if (
    typeof globalThis.CHMonumentMode !== "undefined" &&
    typeof globalThis.CHMonumentMode.onUserPosition === "function"
  ) {
    try {
      globalThis.CHMonumentMode.onUserPosition(lat, lng);
    } catch (e) {
      console.warn("CHMonumentMode", e);
    }
  }

  const distance = haversineDistanceMeters(
    lat,
    lng,
    DEMO_CENTER.lat,
    DEMO_CENTER.lng,
  );
  if (distanceDisplayEl)
    distanceDisplayEl.textContent = formatDistance(distance);

  const zone = determineZone(distance);
  currentZone = zone;
  updateZoneDisplay(zone);

  const top3 = getTop3NearbyFamous(lat, lng);
  updateTop3Panel(top3);

  if (locationStatusEl) {
    if (cursorLocationMode) {
      locationStatusEl.textContent =
        "🖱️ Cursor position – You are " +
        formatDistance(distance) +
        " from center. Click the map or drag the blue dot. Turn off the toggle to use GPS again.";
    } else {
      locationStatusEl.textContent =
        "🟢 Live – You are " + formatDistance(distance) + " from center.";
    }
  }

  const centerMapWrap = document.getElementById("centerMapWrap");
  if (centerMapWrap) centerMapWrap.style.display = "none";

  if (mapInstance) {
    if (!userMarker) {
      const userIcon = L.divIcon({
        className: "custom-marker user-marker",
        html: '<div class="user-dot"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      userMarker = L.marker([lat, lng], {
        icon: userIcon,
        draggable: cursorLocationMode,
      }).addTo(mapInstance);
      userMarker.bindPopup(
        cursorLocationMode ? "Drag to move your position" : "You are here",
      );
      attachUserMarkerDragHandler();
      if (source === "gps" && opts.isFirstGps) {
        mapInstance.setView([lat, lng], 15);
      }
    } else {
      if (source === "drag") {
        /* Leaflet already moved the marker */
      } else if (source === "gps") {
        const now = Date.now();
        if (!userMarker._lastUpdate || now - userMarker._lastUpdate > 1500) {
          userMarker.setLatLng([lat, lng]);
          userMarker._lastUpdate = now;
        }
      } else {
        userMarker.setLatLng([lat, lng]);
      }
      if (userMarker.dragging) {
        if (cursorLocationMode) userMarker.dragging.enable();
        else userMarker.dragging.disable();
      }
    }
  }

  handleZoneChange(zone, distance);
}

function setCursorLocationMode(enabled) {
  cursorLocationMode = !!enabled;
  const wrap = document.querySelector(".map-wrapper");
  if (wrap)
    wrap.classList.toggle("map-wrapper--cursor-place", cursorLocationMode);

  if (!mapInstance) return;

  if (cursorLocationMode) {
    if (!cursorMapClickHandler) {
      cursorMapClickHandler = function (e) {
        if (!cursorLocationMode) return;
        syncUserLocation(e.latlng.lat, e.latlng.lng, { source: "click" });
      };
    }
    mapInstance.on("click", cursorMapClickHandler);
    if (userMarker) {
      if (userMarker.dragging) userMarker.dragging.enable();
      userMarker.bindPopup("Drag to move your position");
    } else {
      const c = mapInstance.getCenter();
      syncUserLocation(c.lat, c.lng, { source: "click" });
    }
  } else {
    mapInstance.off("click", cursorMapClickHandler);
    if (userMarker && userMarker.dragging) userMarker.dragging.disable();
    if (userMarker) userMarker.bindPopup("You are here");
  }
}

function initLocationTracking() {
  if (locationTrackingStarted) return;
  locationTrackingStarted = true;

  if (!("geolocation" in navigator)) {
    locationStatusEl.textContent =
      "Geolocation not supported. You can still chat with the guide.";
    const centerMapWrap = document.getElementById("centerMapWrap");
    if (centerMapWrap) centerMapWrap.style.display = "block";
    return;
  }

  const centerMapWrap = document.getElementById("centerMapWrap");

  // If opened via file://, browsers block geolocation — show clear instructions
  const url = window.location.href || "";
  if (url.startsWith("file://")) {
    locationStatusEl.innerHTML =
      '❌ <strong>Location needs a web server.</strong> Open this folder in a terminal and run: <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">npx serve</code> or <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">python -m http.server 8000</code>, then open <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">http://localhost:3000</code> (or :8000). You can still chat.';
    if (centerMapWrap) centerMapWrap.style.display = "block";
    return;
  }

  if (!isSecureContextForGeolocation()) {
    locationStatusEl.textContent =
      "⚠️ Open this page over HTTPS or http://localhost for location to work. You can still chat.";
    if (centerMapWrap) centerMapWrap.style.display = "block";
    return;
  }

  locationStatusEl.textContent =
    "📡 Getting your location... Please allow location access when prompted.";

  const options = { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 };

  let isFirstLocation = true;

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      if (cursorLocationMode) return;

      const { latitude, longitude } = pos.coords;
      syncUserLocation(latitude, longitude, {
        source: "gps",
        isFirstGps: isFirstLocation,
      });
      if (isFirstLocation) isFirstLocation = false;
    },
    (err) => {
      console.error("Geolocation error", err);
      const code = err.code;
      const centerMapWrap = document.getElementById("centerMapWrap");
      if (centerMapWrap) centerMapWrap.style.display = "block";
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
    options,
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
// Map Compass & 3D (direction follows device)
// ==============================

function applyMapViewportTransform() {
  if (!mapViewportEl) return;
  const parts = [];
  if (map3DMode) {
    parts.push("perspective(900px)");
    parts.push("rotateX(52deg)");
  }
  if (mapCompassMode) {
    parts.push(`rotateZ(${-deviceHeading}deg)`);
  }
  mapViewportEl.style.transform = parts.length ? parts.join(" ") : "";
  const wrapper = document.querySelector(".map-wrapper");
  if (wrapper) {
    wrapper.classList.toggle("map-3d", map3DMode);
    wrapper.classList.toggle("map-compass", mapCompassMode);
  }
}

let orientationRAF = null;
function onDeviceOrientation(e) {
  let heading = 0;
  if (e.webkitCompassHeading != null && !isNaN(e.webkitCompassHeading)) {
    heading = e.webkitCompassHeading;
  } else if (typeof e.alpha === "number" && !isNaN(e.alpha)) {
    heading = e.alpha;
    if (e.absolute) {
      heading = (360 - heading) % 360;
    } else {
      heading = (360 - (heading + 90)) % 360;
      if (heading < 0) heading += 360;
    }
  }
  deviceHeading = heading;
  if (orientationRAF == null) {
    orientationRAF = requestAnimationFrame(() => {
      orientationRAF = null;
      applyMapViewportTransform();
    });
  }
}

function startCompassMode() {
  function enable() {
    deviceOrientationHandler = onDeviceOrientation;
    window.addEventListener(
      "deviceorientation",
      deviceOrientationHandler,
      true,
    );
    mapCompassMode = true;
    applyMapViewportTransform();
    const btn = document.getElementById("mapCompassBtn");
    if (btn) btn.classList.add("active");
  }
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    DeviceOrientationEvent.requestPermission
  ) {
    DeviceOrientationEvent.requestPermission()
      .then((permission) => {
        if (permission === "granted") enable();
      })
      .catch((err) => console.warn("Compass permission denied or error:", err));
    return;
  }
  enable();
}

function stopCompassMode() {
  if (deviceOrientationHandler) {
    window.removeEventListener(
      "deviceorientation",
      deviceOrientationHandler,
      true,
    );
    deviceOrientationHandler = null;
  }
  mapCompassMode = false;
  deviceHeading = 0;
  applyMapViewportTransform();
  const btn = document.getElementById("mapCompassBtn");
  if (btn) btn.classList.remove("active");
}

// ==============================
// 3D Map (Mapbox GL + Three.js monument models – Apple Maps style)
// ==============================

function createMonumentShape(THREE, id, meterInMercator) {
  const group = new THREE.Group();
  const scale = meterInMercator * 12;
  const stone = 0x8b7355;
  const sand = 0xc4a574;
  if (id === "qutub_minar") {
    const geom = new THREE.CylinderGeometry(0.3, 0.5, 2.2, 12);
    const mat = new THREE.MeshPhongMaterial({ color: stone });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.y = 1.1;
    group.add(mesh);
  } else if (id === "humayun_tomb") {
    const box = new THREE.BoxGeometry(1.2, 0.5, 1.2);
    const dome = new THREE.SphereGeometry(
      0.5,
      16,
      12,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2,
    );
    const mat = new THREE.MeshPhongMaterial({ color: stone });
    group.add(new THREE.Mesh(box, mat));
    const domeM = new THREE.Mesh(
      dome,
      new THREE.MeshPhongMaterial({ color: sand }),
    );
    domeM.position.y = 0.5;
    group.add(domeM);
  } else if (id === "red_fort" || id === "jama_masjid") {
    const box = new THREE.BoxGeometry(1, 0.4, 1);
    group.add(
      new THREE.Mesh(box, new THREE.MeshPhongMaterial({ color: 0x9c3d2e })),
    );
  } else if (id === "india_gate" || id === "rashtrapati_bhavan") {
    const box = new THREE.BoxGeometry(0.8, 0.6, 0.3);
    group.add(
      new THREE.Mesh(box, new THREE.MeshPhongMaterial({ color: 0xd4c4b0 })),
    );
  } else if (id === "lotus_temple") {
    const cone = new THREE.ConeGeometry(0.5, 0.4, 8);
    group.add(
      new THREE.Mesh(cone, new THREE.MeshPhongMaterial({ color: 0xf5f5dc })),
    );
  } else {
    const box = new THREE.BoxGeometry(0.6, 0.5, 0.6);
    group.add(
      new THREE.Mesh(box, new THREE.MeshPhongMaterial({ color: stone })),
    );
  }
  group.scale.setScalar(scale);
  return group;
}

function initMap3D() {
  const container = document.getElementById("map3dContainer");
  const gl =
    typeof maplibregl !== "undefined"
      ? maplibregl
      : typeof mapboxgl !== "undefined"
        ? mapboxgl
        : null;
  if (!container || !gl || typeof THREE === "undefined") return;
  if (map3dMapInstance) {
    map3dMapInstance.resize();
    return;
  }
  const map = new gl.Map({
    container: "map3dContainer",
    style: "https://demotiles.maplibre.org/style.json",
    center: [77.21, 28.61],
    zoom: 13,
    pitch: 60,
    bearing: 0,
    antialias: true,
  });
  map3dMapInstance = map;

  function add3DLayer() {
    if (!map.getStyle() || map.getLayer("monuments-3d")) return;
    const THREE = window.THREE;
    const modelRotate = [Math.PI / 2, 0, 0];

    const customLayer = {
      id: "monuments-3d",
      type: "custom",
      renderingMode: "3d",
      onAdd: function (map, gl) {
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();
        const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
        light1.position.set(0, -70, 100).normalize();
        this.scene.add(light1);
        const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
        light2.position.set(0, 70, 100).normalize();
        this.scene.add(light2);
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        this.monumentGroups = [];
        DELHI_MONUMENTS.forEach((place) => {
          const merc = gl.MercatorCoordinate.fromLngLat(
            [place.lng, place.lat],
            0,
          );
          const meterInMercator = merc.meterInMercatorCoordinateUnits();
          const group = createMonumentShape(THREE, place.id, meterInMercator);
          group.position.set(merc.x, merc.y, merc.z);
          this.scene.add(group);
          this.monumentGroups.push({ group, merc });
        });

        this.map = map;
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true,
        });
        this.renderer.autoClear = false;
      },
      render: function (gl, matrix) {
        const m = new THREE.Matrix4().fromArray(matrix);
        const rotationX = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(1, 0, 0),
          modelRotate[0],
        );
        const rotationY = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 1, 0),
          modelRotate[1],
        );
        const rotationZ = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 0, 1),
          modelRotate[2],
        );
        const l = new THREE.Matrix4()
          .multiply(rotationX)
          .multiply(rotationY)
          .multiply(rotationZ);
        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
      },
    };
    map.addLayer(customLayer);
  }

  map.on("style.load", add3DLayer);
  if (typeof map.isStyleLoaded === "function" && map.isStyleLoaded())
    add3DLayer();

  map.on("load", function () {
    map.resize();
  });
}

function closeMap3D() {
  map3DMode = false;
  applyMapViewportTransform();
}

function openMap3D() {
  const el = document.createElement("div");
  el.className = "coming-soon-toast";
  el.setAttribute("role", "status");
  el.innerHTML =
    '<span class="coming-soon-icon">🗺️</span> <strong>3D Map</strong> – Coming soon';
  document.body.appendChild(el);
  requestAnimationFrame(function () {
    el.classList.add("is-visible");
  });
  setTimeout(function () {
    el.classList.remove("is-visible");
    setTimeout(function () {
      if (el.parentNode) el.remove();
    }, 300);
  }, 2500);
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
  window.showRouteAndPanel = showRouteAndPanel;
  window.clearRoute = clearRoute;
  window.hideSelectedPlace = hideSelectedPlace;
  window.centerMapOnDemo = function () {
    if (mapInstance)
      mapInstance.setView([DEMO_CENTER.lat, DEMO_CENTER.lng], 15);
  };

  window.flyToDelhiMonuments = function () {
    if (mapInstance) mapInstance.setView([28.61, 77.23], 11);
  };

  const centerMapBtn = document.getElementById("centerMapBtn");
  if (centerMapBtn)
    centerMapBtn.addEventListener("click", window.centerMapOnDemo);

  const chMonumentDemoBtn = document.getElementById("chMonumentDemoBtn");
  if (
    chMonumentDemoBtn &&
    typeof globalThis.CHMonumentMode !== "undefined" &&
    globalThis.CHMonumentMode.openDemo
  ) {
    chMonumentDemoBtn.addEventListener("click", function () {
      globalThis.CHMonumentMode.openDemo("india_gate");
    });
  }

  const chCursorToggle = document.getElementById("chCursorLocationToggle");
  if (chCursorToggle) {
    chCursorToggle.addEventListener("change", function () {
      setCursorLocationMode(chCursorToggle.checked);
    });
  }

  domReady = true;

  appendMessage({
    text:
      "🤖 **Namaste! I'm your travel guide for monuments and places.**\n\n" +
      "📍 **Reference:** Supermax, Sector 33 (Sonepat).\n" +
      "🏛️ **Nearby:** Local spots + Delhi monuments (Red Fort, Qutub Minar, Humayun's Tomb, India Gate, etc.)\n" +
      "🏛 **Delhi:** Red Fort, India Gate, Qutub Minar, Humayun's Tomb, Lotus Temple, Akshardham, Jama Masjid, Rashtrapati Bhavan\n\n" +
      "**✨ Smart Features:**\n" +
      "• **Study/College** - Shows SBIT, IIIT, Jindal\n" +
      "• **Gym/Fitness** - Shows O2 Gym\n" +
      "• **Travel/Bhopal** - Shows Railway Station\n" +
      "• **Food/Hungry** - Shows Golden Hut\n" +
      "• **Hospital/Health** - Shows FIMS Hospital\n" +
      "• **Market/Shopping** - Shows Bahalgarh\n" +
      "• **Delhi monuments** - List & map of famous Delhi monuments\n" +
      "• **General Chat** - I can chat about anything!\n\n" +
      "**Try these:**\n" +
      '• "I want to study"\n' +
      '• "Famous monuments in Delhi"\n' +
      '• "Red Fort" or "India Gate"\n' +
      '• "I\'m hungry"\n\n' +
      "🏛 **India Gate area:** When your position (GPS or **Move my location with cursor**) is inside the **ceremonial hexagon** (CICR boundary), you'll be asked to open **Monument Mode** — **map on the left** (**satellite** inside the hex, dark outside); **QR list on the right** with **Route** and **Info** for each checkpoint (same from map pins). Or use **Monument Mode (India Gate demo)** to try it from anywhere.\n\n" +
      "How can I help you?",
    sender: "bot",
    meta: { source: "Travel Guide" },
  });

  chatFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = userInputEl.value;

    if (text.toLowerCase().includes("clear route")) {
      clearRoute();
      userInputEl.value = "";
      return;
    }

    const trimmedChat = text.trim();
    if (
      trimmedChat.indexOf("ig-qr-") !== -1 &&
      typeof globalThis.CHMonumentMode !== "undefined" &&
      typeof globalThis.CHMonumentMode.handleScannedQrPayload === "function"
    ) {
      if (globalThis.CHMonumentMode.handleScannedQrPayload(trimmedChat)) {
        userInputEl.value = "";
        appendMessage({
          text: "Opened that QR checkpoint in Monument Mode — check the info panel for details and distance from you.",
          sender: "bot",
          meta: { source: "Travel Guide" },
        });
        return;
      }
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

  // Ensure the visible chat toggle button works too.
  // `index.full-app.html` uses `travelrChatToggle`, while this script originally
  // listened only to the hidden `robotButton`.
  const travelrChatToggleEl = document.getElementById("travelrChatToggle");
  if (travelrChatToggleEl)
    travelrChatToggleEl.addEventListener("click", toggleChatFromButton);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("placeModal");
      if (modal && modal.style.display === "flex") closePlaceModal();
    }
  });

  mapViewportEl = document.getElementById("mapViewport");

  const mapLocateBtn = document.getElementById("mapLocateBtn");
  if (mapLocateBtn) {
    mapLocateBtn.addEventListener("click", () => {
      if (lastUserLatLng && mapInstance) {
        mapInstance.flyTo([lastUserLatLng.lat, lastUserLatLng.lng], 16, {
          duration: 0.8,
          easeLinearity: 0.25,
        });
        mapLocateBtn.classList.add("map-locate-btn-pulse");
        setTimeout(
          () => mapLocateBtn.classList.remove("map-locate-btn-pulse"),
          600,
        );
      }
    });
  }

  const mapCompassBtn = document.getElementById("mapCompassBtn");
  if (mapCompassBtn) {
    mapCompassBtn.addEventListener("click", () => {
      if (mapCompassMode) stopCompassMode();
      else startCompassMode();
    });
  }

  const map3DBtn = document.getElementById("map3DBtn");
  if (map3DBtn) map3DBtn.addEventListener("click", openMap3D);

  const map3dCloseBtn = document.getElementById("map3dCloseBtn");
  if (map3dCloseBtn) map3dCloseBtn.addEventListener("click", closeMap3D);

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
  
  .arrival-more-info-btn {
    margin-top: 12px;
    padding: 10px 18px;
    border: none;
    border-radius: 20px;
    background: var(--accent-primary);
    color: white;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    transition: 0.2s;
  }
  .arrival-more-info-btn:hover {
    background: var(--accent-deep);
    transform: translateY(-1px);
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .coming-soon-toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: var(--bg-card, #1d1d1f);
    color: var(--text-primary, #fff);
    padding: 14px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    z-index: 3000;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .coming-soon-toast.is-visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  .coming-soon-toast .coming-soon-icon { font-size: 1.2em; }
`;
document.head.appendChild(style);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDom);
} else {
  initDom();
}
