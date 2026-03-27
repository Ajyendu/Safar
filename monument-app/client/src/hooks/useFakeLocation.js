import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { haversineMeters } from "../lib/geo.js";

/** Tick interval for smooth interpolation (ms) */
export const FAKE_LOCATION_TICK_MS = 400;

/** Speed presets: meters per second */
export const FAKE_SPEED = {
  slow: 1.2,
  medium: 3,
  fast: 6,
};

const WAYPOINT_ARRIVAL_M = 10;

function distPoints(a, b) {
  return haversineMeters(a.lat, a.lng, b.lat, b.lng);
}

/**
 * Position at `distanceAlong` meters along the polyline `points`.
 */
export function positionAlongPolyline(points, distanceAlong) {
  if (!points?.length) return null;
  if (points.length === 1 || distanceAlong <= 0) {
    const p = points[0];
    return { lat: p.lat, lng: p.lng };
  }
  let acc = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const seg = distPoints(points[i], points[i + 1]);
    if (acc + seg >= distanceAlong - 1e-9) {
      const t = seg < 1e-12 ? 0 : (distanceAlong - acc) / seg;
      return {
        lat: points[i].lat + t * (points[i + 1].lat - points[i].lat),
        lng: points[i].lng + t * (points[i + 1].lng - points[i].lng),
      };
    }
    acc += seg;
  }
  const last = points[points.length - 1];
  return { lat: last.lat, lng: last.lng };
}

function totalPathLength(points) {
  if (!points || points.length < 2) return 0;
  let t = 0;
  for (let i = 0; i < points.length - 1; i++) {
    t += distPoints(points[i], points[i + 1]);
  }
  return t;
}

/**
 * Fake GPS simulator: manual placement, drag, click-to-set, and smooth walking along paths.
 *
 * @param {object} options
 * @param {number} [options.initialLat]
 * @param {number} [options.initialLng]
 * @param {(detail: { lat: number; lng: number; kind: 'path_complete' | 'waypoint'; waypointIndex?: number }) => void} [options.onArrival]
 */
export function useFakeLocation(options = {}) {
  const { initialLat, initialLng, onArrival } = options;
  const onArrivalRef = useRef(onArrival);
  onArrivalRef.current = onArrival;

  const initialRef = useRef({
    lat: initialLat ?? 28.6129,
    lng: initialLng ?? 77.2295,
  });

  const [enabled, setEnabled] = useState(false);
  const [position, setPosition] = useState(() => ({
    lat: initialRef.current.lat,
    lng: initialRef.current.lng,
    accuracy: 5,
    ts: Date.now(),
  }));

  const [status, setStatus] = useState("idle");
  const [speedTier, setSpeedTier] = useState("medium");
  const [simDistanceAlong, setSimDistanceAlong] = useState(0);
  const [simTotalLength, setSimTotalLength] = useState(0);

  const speedMpsRef = useRef(FAKE_SPEED.medium);
  useEffect(() => {
    speedMpsRef.current = FAKE_SPEED[speedTier] ?? FAKE_SPEED.medium;
  }, [speedTier]);

  const pathPointsRef = useRef([]);
  const distanceAlongRef = useRef(0);
  const totalLengthRef = useRef(0);
  const visitedWaypointRef = useRef(new Set());
  const tickIdRef = useRef(null);
  const statusRef = useRef("idle");
  statusRef.current = status;

  const positionRef = useRef(position);
  positionRef.current = position;

  const clearTick = useCallback(() => {
    if (tickIdRef.current != null) {
      clearInterval(tickIdRef.current);
      tickIdRef.current = null;
    }
  }, []);

  const runTickStep = useCallback(() => {
    const path = pathPointsRef.current;
    if (path.length < 2) return;

    const advance = speedMpsRef.current * (FAKE_LOCATION_TICK_MS / 1000);
    distanceAlongRef.current += advance;
    setSimDistanceAlong(distanceAlongRef.current);

    if (distanceAlongRef.current >= totalLengthRef.current - 1e-6) {
      const end = path[path.length - 1];
      setPosition({
        lat: end.lat,
        lng: end.lng,
        accuracy: 5,
        ts: Date.now(),
      });
      clearTick();
      setStatus("idle");
      statusRef.current = "idle";
      pathPointsRef.current = [];
      distanceAlongRef.current = 0;
      totalLengthRef.current = 0;
      setSimDistanceAlong(0);
      setSimTotalLength(0);
      onArrivalRef.current?.({
        lat: end.lat,
        lng: end.lng,
        kind: "path_complete",
      });
      return;
    }

    const pos = positionAlongPolyline(path, distanceAlongRef.current);
    if (!pos) return;

    setPosition({
      lat: pos.lat,
      lng: pos.lng,
      accuracy: 5,
      ts: Date.now(),
    });

    for (let i = 1; i < path.length - 1; i++) {
      if (visitedWaypointRef.current.has(i)) continue;
      const wp = path[i];
      if (haversineMeters(pos.lat, pos.lng, wp.lat, wp.lng) <= WAYPOINT_ARRIVAL_M) {
        visitedWaypointRef.current.add(i);
        onArrivalRef.current?.({
          lat: wp.lat,
          lng: wp.lng,
          kind: "waypoint",
          waypointIndex: i,
        });
      }
    }
  }, [clearTick]);

  const startTickLoop = useCallback(() => {
    clearTick();
    tickIdRef.current = setInterval(runTickStep, FAKE_LOCATION_TICK_MS);
  }, [clearTick, runTickStep]);

  const setLocation = useCallback(
    (lat, lng) => {
      clearTick();
      setStatus("idle");
      statusRef.current = "idle";
      pathPointsRef.current = [];
      distanceAlongRef.current = 0;
      totalLengthRef.current = 0;
      visitedWaypointRef.current = new Set();
      setSimDistanceAlong(0);
      setSimTotalLength(0);
      setPosition({
        lat,
        lng,
        accuracy: 5,
        ts: Date.now(),
      });
    },
    [clearTick]
  );

  const setInitialCenter = useCallback((lat, lng) => {
    initialRef.current = { lat, lng };
  }, []);

  const reset = useCallback(
    (lat, lng) => {
      const la = lat ?? initialRef.current.lat;
      const ln = lng ?? initialRef.current.lng;
      setLocation(la, ln);
    },
    [setLocation]
  );

  const stopSimulation = useCallback(() => {
    clearTick();
    setStatus("idle");
    statusRef.current = "idle";
    pathPointsRef.current = [];
    distanceAlongRef.current = 0;
    totalLengthRef.current = 0;
    setSimDistanceAlong(0);
    setSimTotalLength(0);
  }, [clearTick]);

  const pauseSimulation = useCallback(() => {
    clearTick();
    setStatus((s) => {
      if (s === "running") {
        statusRef.current = "paused";
        return "paused";
      }
      return s;
    });
  }, [clearTick]);

  const resumeSimulation = useCallback(() => {
    if (status !== "paused") return;
    const path = pathPointsRef.current;
    if (path.length < 2 || totalLengthRef.current <= 0) return;
    setStatus("running");
    statusRef.current = "running";
    startTickLoop();
  }, [status, startTickLoop]);

  const startSimulation = useCallback(
    (waypoints) => {
      if (!waypoints?.length) return;
      clearTick();
      visitedWaypointRef.current = new Set();

      const cur = positionRef.current;
      const current = { lat: cur.lat, lng: cur.lng };
      const path = [current, ...waypoints.map((p) => ({ lat: p.lat, lng: p.lng }))];
      pathPointsRef.current = path;
      const total = totalPathLength(path);
      totalLengthRef.current = total;
      distanceAlongRef.current = 0;
      setSimDistanceAlong(0);
      setSimTotalLength(total);

      if (total < 1e-6) {
        setStatus("idle");
        statusRef.current = "idle";
        return;
      }

      setStatus("running");
      statusRef.current = "running";
      startTickLoop();
    },
    [clearTick, startTickLoop]
  );

  useEffect(() => () => clearTick(), [clearTick]);

  const simulationProgress = useMemo(() => {
    if (simTotalLength <= 0) return 0;
    return Math.min(1, simDistanceAlong / simTotalLength);
  }, [simDistanceAlong, simTotalLength]);

  return {
    enabled,
    setEnabled,
    position,
    setLocation,
    setInitialCenter,
    reset,
    startSimulation,
    stopSimulation,
    pauseSimulation,
    resumeSimulation,
    status,
    speedTier,
    setSpeedTier,
    simulationProgress,
    simDistanceAlong,
    simTotalLength,
    tickMs: FAKE_LOCATION_TICK_MS,
  };
}
