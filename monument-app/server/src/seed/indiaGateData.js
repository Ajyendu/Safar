/**
 * India Gate complex — internal navigation graph aligned with physical QR checkpoints.
 * Coordinates supplied for: Param Yodha Sthal, National War Memorial, Netaji Canopy, India Gate (Kartavya-side pin).
 */

export const INDIA_GATE_CENTER = { lat: 28.61332, lng: 77.23097 };

export const indiaGateMonument = {
  name: "India Gate",
  slug: "india-gate",
  description:
    "India Gate precinct. Four QR checkpoints: Param Yodha Sthal, National War Memorial, Netaji Subhash Chandra Bose Canopy, India Gate.",
  geofence: {
    lat: INDIA_GATE_CENTER.lat,
    lng: INDIA_GATE_CENTER.lng,
    radiusMeters: 400,
  },
  bounds: {
    north: 28.6151,
    south: 28.6124,
    east: 77.2331,
    west: 77.2289,
  },
  mapStyleUrl: "",
  graphNodes: [
    {
      id: "param_yodha_sthal",
      name: "Param Yodha Sthal",
      lat: 28.614705,
      lng: 77.231241,
    },
    {
      id: "national_war_memorial",
      name: "National War Memorial",
      lat: 28.612764,
      lng: 77.232741,
    },
    {
      id: "netaji_canopy",
      name: "Netaji Subhash Chandra Bose Canopy (Delhi)",
      lat: 28.612869,
      lng: 77.230633,
    },
    {
      id: "india_gate_qr",
      name: "India Gate",
      lat: 28.612943,
      lng: 77.229273,
    },
  ],
  graphEdges: [
    { from: "param_yodha_sthal", to: "national_war_memorial" },
    { from: "param_yodha_sthal", to: "netaji_canopy" },
    { from: "param_yodha_sthal", to: "india_gate_qr" },
    { from: "national_war_memorial", to: "netaji_canopy" },
    { from: "national_war_memorial", to: "india_gate_qr" },
    { from: "netaji_canopy", to: "india_gate_qr" },
  ],
  pathways: [
    {
      id: "pw-param-nwm",
      name: "Param Yodha Sthal ↔ National War Memorial",
      coordinates: [
        [77.231241, 28.614705],
        [77.232741, 28.612764],
      ],
    },
    {
      id: "pw-param-netaji",
      name: "Param Yodha Sthal ↔ Netaji Canopy",
      coordinates: [
        [77.231241, 28.614705],
        [77.230633, 28.612869],
      ],
    },
    {
      id: "pw-param-india-gate",
      name: "Param Yodha Sthal ↔ India Gate",
      coordinates: [
        [77.231241, 28.614705],
        [77.229273, 28.612943],
      ],
    },
    {
      id: "pw-nwm-netaji",
      name: "National War Memorial ↔ Netaji Canopy",
      coordinates: [
        [77.232741, 28.612764],
        [77.230633, 28.612869],
      ],
    },
    {
      id: "pw-nwm-india-gate",
      name: "National War Memorial ↔ India Gate",
      coordinates: [
        [77.232741, 28.612764],
        [77.229273, 28.612943],
      ],
    },
    {
      id: "pw-netaji-india-gate",
      name: "Netaji Canopy ↔ India Gate",
      coordinates: [
        [77.230633, 28.612869],
        [77.229273, 28.612943],
      ],
    },
  ],
  qrPoints: [
    {
      qrId: "ig-qr-param-yodha-sthal",
      nodeId: "param_yodha_sthal",
      title: "Param Yodha Sthal",
      shortLabel: "Param Yodha Sthal",
      description:
        "A dedicated space featuring statues of Param Vir Chakra awardees, recipients of India's highest military honor for bravery. Each statue is accompanied by detailed accounts of valor, making it an educational and inspirational section of the memorial. Together, these sites create a continuous narrative of sacrifice, remembrance, and national pride in the heart of the capital.",
      images: [],
      audioUrl: "",
      videoUrl: "",
      order: 1,
    },
    {
      qrId: "ig-qr-national-war-memorial",
      nodeId: "national_war_memorial",
      title: "National War Memorial",
      shortLabel: "War Memorial",
      description:
        "Inaugurated in 2019 to honor Indian armed forces personnel who were martyred after independence in 1947. The memorial is designed in a circular layout with four concentric zones—Amar Chakra (eternal flame), Tyag Chakra (engraved names of martyrs), Veerta Chakra (depicting battle stories), and Rakshak Chakra (a ring of trees symbolizing protection). It now serves as the primary national tribute to fallen soldiers, and the Amar Jawan Jyoti flame from India Gate has been ceremonially merged with it.",
      images: [],
      audioUrl: "",
      videoUrl: "",
      order: 2,
    },
    {
      qrId: "ig-qr-netaji-canopy",
      nodeId: "netaji_canopy",
      title: "Netaji Subhash Chandra Bose Canopy",
      shortLabel: "Netaji Canopy",
      description:
        "A sandstone structure that once housed a statue of King George V during British rule. After independence, the statue was removed, and in 2022, a grand statue of Subhas Chandra Bose was installed under the canopy. This transformation symbolizes India's shift away from colonial legacy toward honoring its own national heroes.",
      images: [],
      audioUrl: "",
      videoUrl: "",
      order: 3,
    },
    {
      qrId: "ig-qr-india-gate",
      nodeId: "india_gate_qr",
      title: "India Gate",
      shortLabel: "India Gate",
      description:
        "The area around India Gate in New Delhi forms a unified historical and national tribute zone that reflects both India's colonial past and its independent identity. India Gate is a 42-meter-high war memorial built in 1931 and designed by Edwin Lutyens. It commemorates over 70,000 Indian soldiers who died in World War I and other early 20th-century conflicts, with many names inscribed on its walls. Over time, it has evolved from a colonial monument into a national symbol and a popular public gathering space.",
      images: [],
      audioUrl: "",
      videoUrl: "",
      order: 4,
    },
  ],
  isPublished: true,
};
