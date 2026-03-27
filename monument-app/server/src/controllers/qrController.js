import { Monument } from "../models/Monument.js";
import { User } from "../models/User.js";

/**
 * Verifies a scanned QR id and returns rich content.
 * Optionally records scan for authenticated users.
 */
export async function verifyQr(req, res) {
  const { qrId, monumentSlug } = req.body;
  if (!qrId || typeof qrId !== "string") {
    return res.status(400).json({ error: "qrId is required" });
  }

  const query = monumentSlug
    ? { slug: monumentSlug, isPublished: true }
    : { isPublished: true };
  const monument = await Monument.findOne({
    ...query,
    "qrPoints.qrId": qrId,
  }).lean();

  if (!monument) {
    return res.status(404).json({ error: "Unknown or invalid QR code" });
  }

  const point = monument.qrPoints.find((p) => p.qrId === qrId);
  if (!point) {
    return res.status(404).json({ error: "QR point not found" });
  }

  const key = `${monument.slug}:${point.qrId}`;
  if (req.user) {
    const user = await User.findById(req.user._id);
    if (user && !user.scannedQrPoints.includes(key)) {
      user.scannedQrPoints.push(key);
      user.stats.totalScans += 1;
      await user.save();
    }
  }

  return res.json({
    valid: true,
    monument: {
      slug: monument.slug,
      name: monument.name,
    },
    point: {
      qrId: point.qrId,
      nodeId: point.nodeId,
      title: point.title,
      shortLabel: point.shortLabel,
      description: point.description,
      images: point.images || [],
      audioUrl: point.audioUrl || "",
      videoUrl: point.videoUrl || "",
    },
  });
}

/**
 * Marks monument as visited (e.g. when entering Monument Mode).
 */
export async function recordMonumentVisit(req, res) {
  const { slug } = req.body;
  if (!slug) return res.status(400).json({ error: "slug is required" });

  const exists = await Monument.findOne({ slug, isPublished: true });
  if (!exists) return res.status(404).json({ error: "Monument not found" });

  if (!req.user) {
    return res.json({ ok: true, anonymous: true });
  }

  const user = await User.findById(req.user._id);
  if (!user.visitedMonuments.includes(slug)) {
    user.visitedMonuments.push(slug);
    user.stats.monumentsVisited = user.visitedMonuments.length;
    await user.save();
  }

  return res.json({ ok: true, visitedMonuments: user.visitedMonuments });
}
