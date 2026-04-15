import { useCallback, useEffect, useMemo, useState } from "react";
import { Map, Layer, Marker, Source } from "react-map-gl";
import { bearingDegrees, haversineMeters, nearestNodeId } from "../lib/geo.js";
import { api } from "../api/client.js";

const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";

/**
 * Custom internal map: pathways, QR nodes, live user dot, optional route line.
 */
export function InternalMapView({
  monument,
  userPosition,
  onExit,
  destinationQrId,
  onDestinationQrIdChange,
  routeData,
  onRouteUpdate,
  /** When true, map click and draggable user marker set simulated position */
  fakeLocationEnabled = false,
  onFakeMapClick,
  onFakeMarkerDragEnd,
}) {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const [routeError, setRouteError] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const bounds = monument.bounds;

  const sortedQrPoints = useMemo(() => {
    const list = [...(monument.qrPoints || [])];
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return list;
  }, [monument.qrPoints]);

  const destinationNodeId = useMemo(() => {
    if (!destinationQrId) return null;
    const q = sortedQrPoints.find((p) => p.qrId === destinationQrId);
    return q?.nodeId ?? null;
  }, [destinationQrId, sortedQrPoints]);

  const pathwayGeoJSON = useMemo(() => {
    const features = (monument.pathways || []).map((p) => ({
      type: "Feature",
      properties: { id: p.id, name: p.name },
      geometry: {
        type: "LineString",
        coordinates: p.coordinates,
      },
    }));
    return { type: "FeatureCollection", features };
  }, [monument.pathways]);

  const nodesGeoJSON = useMemo(() => {
    const features = (monument.graphNodes || []).map((n) => ({
      type: "Feature",
      properties: { id: n.id, name: n.name },
      geometry: {
        type: "Point",
        coordinates: [n.lng, n.lat],
      },
    }));
    return { type: "FeatureCollection", features };
  }, [monument.graphNodes]);

  const routeGeoJSON = useMemo(() => {
    if (!routeData?.coordinates?.length) {
      return { type: "FeatureCollection", features: [] };
    }
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: routeData.coordinates,
          },
        },
      ],
    };
  }, [routeData]);

  const onMapLoad = useCallback(
    (e) => {
      if (!bounds) return;
      e.target.fitBounds(
        [
          [bounds.west, bounds.south],
          [bounds.east, bounds.north],
        ],
        { padding: 56, duration: 400 }
      );
    },
    [bounds]
  );

  const nearestFrom = useMemo(() => {
    if (!userPosition) return null;
    return nearestNodeId(monument.graphNodes, userPosition.lat, userPosition.lng);
  }, [userPosition, monument.graphNodes]);

  /**
   * GPS jitter can flip the nearest graph node every second; that retriggers routing and
   * clears the line. Debounce so the API "from" node stabilizes briefly before fetching.
   */
  const [routingFromNodeId, setRoutingFromNodeId] = useState(null);
  useEffect(() => {
    if (!nearestFrom) {
      setRoutingFromNodeId(null);
      return;
    }
    const t = window.setTimeout(() => setRoutingFromNodeId(nearestFrom), 400);
    return () => window.clearTimeout(t);
  }, [nearestFrom]);

  useEffect(() => {
    if (!destinationNodeId || !routingFromNodeId) {
      onRouteUpdate(null);
      setRouteError(null);
      setRouteLoading(false);
      return;
    }

    let cancelled = false;
    setRouteLoading(true);
    setRouteError(null);

    (async () => {
      try {
        const data = await api.getNavigation(
          monument.slug,
          routingFromNodeId,
          destinationNodeId
        );
        if (!cancelled) {
          onRouteUpdate(data);
          setRouteError(null);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          onRouteUpdate(null);
          setRouteError(err.message || "Could not compute route");
        }
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [destinationNodeId, routingFromNodeId, monument.slug, onRouteUpdate]);

  /** Direction toward the next meaningful vertex ahead on the route (skip duplicates / same point). */
  const nextBearing = useMemo(() => {
    if (!userPosition || !routeData?.coordinates?.length) return null;
    const coords = routeData.coordinates;
    const minM = 5;
    for (let i = 1; i < coords.length; i++) {
      const [lng, lat] = coords[i];
      const d = haversineMeters(userPosition.lat, userPosition.lng, lat, lng);
      if (d >= minM) {
        return bearingDegrees(userPosition.lat, userPosition.lng, lat, lng);
      }
    }
    return null;
  }, [userPosition, routeData]);

  if (!token) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-surface p-6 text-center">
        <p className="text-zinc-400">
          Set <code className="text-accent">VITE_MAPBOX_ACCESS_TOKEN</code> in{" "}
          <code className="text-zinc-300">client/.env</code> to load the map.
        </p>
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300"
        >
          Exit
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent px-3 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Monument Mode</p>
          <h1 className="text-base font-semibold text-white">{monument.name}</h1>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
        >
          Exit mode
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        <Map
          mapboxAccessToken={token}
          mapStyle={MAP_STYLE}
          initialViewState={{
            longitude: monument.geofence.lng,
            latitude: monument.geofence.lat,
            zoom: 17,
          }}
          onLoad={onMapLoad}
          onClick={(e) => {
            if (fakeLocationEnabled) onFakeMapClick?.(e);
          }}
          style={{
            width: "100%",
            height: "100%",
            cursor: fakeLocationEnabled ? "crosshair" : undefined,
          }}
          attributionControl
        >
          <Source id="pathways" type="geojson" data={pathwayGeoJSON}>
            <Layer
              id="pathways-line"
              type="line"
              paint={{
                "line-color": "#64748b",
                "line-width": 4,
                "line-opacity": 0.85,
              }}
            />
          </Source>

          <Source id="nodes" type="geojson" data={nodesGeoJSON}>
            <Layer
              id="nodes-circle"
              type="circle"
              paint={{
                "circle-radius": 7,
                "circle-color": "#38bdf8",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#0f172a",
              }}
            />
          </Source>

          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#22c55e",
                "line-width": 5,
                "line-opacity": 0.95,
              }}
            />
          </Source>

          {userPosition && (
            <Marker
              longitude={userPosition.lng}
              latitude={userPosition.lat}
              anchor="center"
              draggable={fakeLocationEnabled}
              onDragEnd={(e) => {
                if (fakeLocationEnabled) onFakeMarkerDragEnd?.(e);
              }}
            >
              <div className="relative flex h-4 w-4 items-center justify-center">
                <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-sky-400/40" />
                <span className="relative h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-500 shadow-lg" />
              </div>
            </Marker>
          )}
        </Map>

        {nextBearing !== null && routeData?.coordinates?.length > 1 && (
          <div
            className="pointer-events-none absolute bottom-36 left-1/2 flex h-16 w-16 items-center justify-center rounded-full bg-black/50"
            style={{
              transform: `translateX(-50%) rotate(${nextBearing}deg)`,
            }}
            aria-hidden
          >
            <span className="text-3xl text-emerald-400">↑</span>
          </div>
        )}
      </div>

      <nav className="shrink-0 border-t border-white/10 bg-surface-card p-4">
        <p className="text-xs text-zinc-500">
          Nearest graph node:{" "}
          <span className="font-medium text-zinc-300">{nearestFrom || "—"}</span>
          {routingFromNodeId && routingFromNodeId !== nearestFrom && (
            <span className="text-zinc-600"> · routing from {routingFromNodeId}</span>
          )}
          {!userPosition && (
            <span className="mt-1 block text-amber-500/90">
              Waiting for GPS… enable location or use Fake Location Simulator.
            </span>
          )}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-zinc-500">Navigate to checkpoint</span>
            <select
              value={destinationQrId || ""}
              onChange={(e) => onDestinationQrIdChange(e.target.value || null)}
              className="w-full rounded-xl border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-white"
            >
              <option value="">Select destination…</option>
              {sortedQrPoints.map((q) => (
                <option key={q.qrId} value={q.qrId}>
                  {q.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          Route updates when you change checkpoint or your position snaps to a new nearest node.
        </p>
        {routeLoading && <p className="mt-2 text-xs text-sky-400/90">Calculating route…</p>}
        {routeError && <p className="mt-2 text-xs text-red-400">{routeError}</p>}
        {routeData?.distanceMeters != null && !routeError && (
          <p className="mt-2 text-xs text-emerald-400/90">
            Route ≈ {routeData.distanceMeters} m along pathways
          </p>
        )}
      </nav>
    </div>
  );
}
