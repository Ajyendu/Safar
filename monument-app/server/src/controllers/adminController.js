import { Monument } from "../models/Monument.js";
import { User } from "../models/User.js";

/**
 * Aggregate counts for the admin dashboard (authenticated users only).
 */
export async function getAdminStats(req, res) {
  const [monumentCount, publishedCount, userCount, qrAgg, scanAgg] =
    await Promise.all([
      Monument.countDocuments(),
      Monument.countDocuments({ isPublished: true }),
      User.countDocuments(),
      Monument.aggregate([
        {
          $project: {
            n: { $size: { $ifNull: ["$qrPoints", []] } },
          },
        },
        { $group: { _id: null, totalQrPoints: { $sum: "$n" } } },
      ]),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalRecordedScans: { $sum: { $ifNull: ["$stats.totalScans", 0] } },
            uniqueMonumentVisits: { $sum: { $ifNull: ["$stats.monumentsVisited", 0] } },
          },
        },
      ]),
    ]);

  const qrRow = qrAgg[0];
  const scanRow = scanAgg[0];

  return res.json({
    stats: {
      monuments: monumentCount,
      publishedMonuments: publishedCount,
      draftMonuments: Math.max(0, monumentCount - publishedCount),
      users: userCount,
      totalQrPoints: qrRow?.totalQrPoints ?? 0,
      totalRecordedScans: scanRow?.totalRecordedScans ?? 0,
      sumUserMonumentVisits: scanRow?.uniqueMonumentVisits ?? 0,
    },
  });
}

export async function createMonument(req, res) {
  const payload = req.body;
  const doc = await Monument.create(payload);
  return res.status(201).json({ monument: doc });
}

export async function updateMonument(req, res) {
  const { slug } = req.params;
  const updates = { ...req.body };
  delete updates._id;
  const doc = await Monument.findOneAndUpdate(
    { slug },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!doc) return res.status(404).json({ error: "Not found" });
  return res.json({ monument: doc });
}

export async function deleteMonument(req, res) {
  const { slug } = req.params;
  const result = await Monument.deleteOne({ slug });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "Not found" });
  }
  return res.json({ ok: true });
}

export async function listAllMonuments(req, res) {
  const items = await Monument.find().lean();
  return res.json({ monuments: items });
}
