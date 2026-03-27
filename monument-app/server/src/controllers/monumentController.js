import { Monument } from "../models/Monument.js";

/** Public list (minimal fields) */
export async function listMonuments(req, res) {
  const items = await Monument.find({ isPublished: true })
    .select("name slug description geofence")
    .lean();
  return res.json({ monuments: items });
}

/**
 * Full monument payload for internal map + graph (no secrets).
 * QR descriptions included; could strip for anonymous if needed.
 */
export async function getMonumentBySlug(req, res) {
  const { slug } = req.params;
  const doc = await Monument.findOne({ slug, isPublished: true }).lean();
  if (!doc) {
    return res.status(404).json({ error: "Monument not found" });
  }
  return res.json({ monument: doc });
}
