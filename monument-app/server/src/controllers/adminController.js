import { Monument } from "../models/Monument.js";

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
