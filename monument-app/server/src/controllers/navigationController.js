import { Monument } from "../models/Monument.js";
import { aStar, buildGraph, haversineMeters } from "../utils/pathfinding.js";

/**
 * GET /api/monuments/:slug/navigation?from=&to=
 * Returns shortest path node ids and coordinate line for Mapbox.
 */
export async function getNavigationRoute(req, res) {
  const { slug } = req.params;
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: "Query params 'from' and 'to' (node ids) are required" });
  }

  const monument = await Monument.findOne({ slug, isPublished: true }).lean();
  if (!monument) {
    return res.status(404).json({ error: "Monument not found" });
  }

  const { adj, byId } = buildGraph(monument.graphNodes, monument.graphEdges);
  const pathIds = aStar(adj, byId, String(from), String(to));
  if (!pathIds || pathIds.length === 0) {
    return res.status(400).json({ error: "No path found between nodes" });
  }

  const coordinates = pathIds.map((id) => {
    const n = byId.get(id);
    return [n.lng, n.lat];
  });

  let totalMeters = 0;
  for (let i = 1; i < pathIds.length; i++) {
    const a = byId.get(pathIds[i - 1]);
    const b = byId.get(pathIds[i]);
    totalMeters += haversineMeters(
      { lat: a.lat, lng: a.lng },
      { lat: b.lat, lng: b.lng }
    );
  }

  return res.json({
    path: pathIds,
    coordinates,
    distanceMeters: Math.round(totalMeters),
    monument: { slug: monument.slug, name: monument.name },
  });
}
