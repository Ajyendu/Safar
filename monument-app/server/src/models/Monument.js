import mongoose from "mongoose";

/**
 * Graph node for internal navigation (lat/lng in WGS84).
 */
const graphNodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const graphEdgeSchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    /** Optional override; if omitted, weight = haversine distance */
    weightMeters: { type: Number },
  },
  { _id: false }
);

/**
 * Pathways / walkways as GeoJSON LineString coordinates [lng, lat][] for Mapbox.
 */
const pathwaySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: "" },
    coordinates: {
      type: [[Number]],
      required: true,
    },
  },
  { _id: false }
);

const qrPointSchema = new mongoose.Schema(
  {
    /** Public id encoded in physical QR codes; verified by API */
    qrId: { type: String, required: true },
    /** Links to graphNodes[].id for pathfinding destination */
    nodeId: { type: String, required: true },
    title: { type: String, required: true },
    shortLabel: { type: String, default: "" },
    description: { type: String, default: "" },
    images: [{ type: String }],
    audioUrl: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const monumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    /** Circular geofence: center + radius (meters) */
    geofence: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      radiusMeters: { type: Number, required: true, default: 180 },
    },
    /** Bounding box for internal Mapbox camera / fitBounds */
    bounds: {
      north: Number,
      south: Number,
      east: Number,
      west: Number,
    },
    /** Custom map style URL (Mapbox style) or null = client default */
    mapStyleUrl: { type: String, default: "" },
    graphNodes: [graphNodeSchema],
    graphEdges: [graphEdgeSchema],
    pathways: [pathwaySchema],
    qrPoints: [qrPointSchema],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Monument = mongoose.model("Monument", monumentSchema);
