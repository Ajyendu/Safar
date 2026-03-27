/**
 * Haversine distance in meters between two WGS84 points.
 */
export function haversineMeters(a, b) {
  const R = 6371000;
  const dLat = deg2rad(b.lat - a.lat);
  const dLon = deg2rad(b.lng - a.lng);
  const lat1 = deg2rad(a.lat);
  const lat2 = deg2rad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function deg2rad(d) {
  return (d * Math.PI) / 180;
}

/**
 * Build undirected adjacency map from edges; weight uses haversine unless weightMeters set on edge.
 */
export function buildGraph(nodes, edges) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const adj = new Map();

  function addEdge(u, v, w) {
    if (!adj.has(u)) adj.set(u, []);
    if (!adj.has(v)) adj.set(v, []);
    adj.get(u).push({ to: v, w });
    adj.get(v).push({ to: u, w });
  }

  for (const e of edges) {
    const A = byId.get(e.from);
    const B = byId.get(e.to);
    if (!A || !B) continue;
    const w =
      typeof e.weightMeters === "number"
        ? e.weightMeters
        : haversineMeters(
            { lat: A.lat, lng: A.lng },
            { lat: B.lat, lng: B.lng }
          );
    addEdge(e.from, e.to, w);
  }

  return { adj, byId };
}

/**
 * A* pathfinding. Returns array of node ids from start to goal, or null.
 */
export function aStar(adj, byId, startId, goalId) {
  if (!byId.has(startId) || !byId.has(goalId)) return null;
  if (startId === goalId) return [startId];

  const goal = byId.get(goalId);

  const open = new Set([startId]);
  const cameFrom = new Map();
  const gScore = new Map([[startId, 0]]);
  const fScore = new Map([
    [startId, haversineMeters(byId.get(startId), goal)],
  ]);

  while (open.size > 0) {
    let current = null;
    let bestF = Infinity;
    for (const id of open) {
      const f = fScore.get(id) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        current = id;
      }
    }
    if (current === null) break;
    if (current === goalId) {
      const path = [];
      let c = current;
      while (c !== undefined) {
        path.push(c);
        c = cameFrom.get(c);
      }
      return path.reverse();
    }

    open.delete(current);
    const neighbors = adj.get(current) || [];
    for (const { to, w } of neighbors) {
      const tentative = (gScore.get(current) ?? Infinity) + w;
      if (tentative < (gScore.get(to) ?? Infinity)) {
        cameFrom.set(to, current);
        gScore.set(to, tentative);
        const h = haversineMeters(byId.get(to), goal);
        fScore.set(to, tentative + h);
        open.add(to);
      }
    }
  }

  return null;
}
