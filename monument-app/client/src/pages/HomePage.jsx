import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Map, Marker } from "react-map-gl";
import { api } from "../api/client.js";
import { useMergedLocation } from "../hooks/useGeolocation.js";
import { useFakeLocation } from "../hooks/useFakeLocation.js";
import { inGeofence } from "../lib/geo.js";
import { useAuth } from "../context/AuthContext.jsx";
import { MonumentModePrompt } from "../components/MonumentModePrompt.jsx";
import { InternalMapView } from "../components/InternalMapView.jsx";
import { FloatingScanButton } from "../components/FloatingScanButton.jsx";
import { QRScannerModal } from "../components/QRScannerModal.jsx";
import { FakeLocationDebugPanel } from "../components/FakeLocationDebugPanel.jsx";

const DEFAULT_SLUG = "india-gate";
const EXT_MAP_STYLE = "mapbox://styles/mapbox/streets-v12";

export function HomePage() {
  const { user } = useAuth();
  const [monument, setMonument] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [monumentMode, setMonumentMode] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [destinationNodeId, setDestinationNodeId] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [qrContent, setQrContent] = useState(null);
  const [arrivalLog, setArrivalLog] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getMonument(DEFAULT_SLUG);
        if (!cancelled) setMonument(data.monument);
      } catch (e) {
        if (!cancelled) setLoadError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fake = useFakeLocation({
    onArrival: (d) => {
      const line = `${new Date().toLocaleTimeString()} ${d.kind}${d.waypointIndex != null ? ` #${d.waypointIndex}` : ""}`;
      setArrivalLog((prev) => [...prev.slice(-19), line]);
    },
  });

  useEffect(() => {
    if (monument) {
      fake.setInitialCenter(monument.geofence.lat, monument.geofence.lng);
    }
  }, [monument, fake.setInitialCenter]);

  const prevFakeEnabled = useRef(false);
  useEffect(() => {
    if (fake.enabled && !prevFakeEnabled.current && monument) {
      fake.setLocation(monument.geofence.lat, monument.geofence.lng);
    }
    prevFakeEnabled.current = fake.enabled;
  }, [fake.enabled, monument, fake.setLocation]);

  useEffect(() => {
    if (!fake.enabled) {
      fake.stopSimulation();
    }
  }, [fake.enabled, fake.stopSimulation]);

  const { position, error: geoError, source } = useMergedLocation(fake);

  const demoWaypoints = useMemo(() => {
    if (!monument?.graphNodes?.length) return [];
    return monument.graphNodes.slice(0, 4).map((n) => ({ lat: n.lat, lng: n.lng }));
  }, [monument]);

  const routeWalkWaypoints = useMemo(() => {
    if (!routeData?.coordinates?.length) return [];
    return routeData.coordinates.map(([lng, lat]) => ({ lat, lng }));
  }, [routeData]);

  const inside = useMemo(() => {
    if (!position || !monument?.geofence) return false;
    return inGeofence(
      position.lat,
      position.lng,
      monument.geofence.lat,
      monument.geofence.lng,
      monument.geofence.radiusMeters
    );
  }, [position, monument]);

  /** Leaving the geofence resets the prompt and exits Monument Mode */
  useEffect(() => {
    if (!inside) {
      setPromptDismissed(false);
      setMonumentMode(false);
    }
  }, [inside]);

  const showPrompt = inside && !monumentMode && !promptDismissed && monument;

  const handleEnterMonumentMode = useCallback(async () => {
    setMonumentMode(true);
    setPromptDismissed(true);
    setRouteData(null);
    try {
      await api.recordVisit(DEFAULT_SLUG);
    } catch {
      /* optional */
    }
  }, []);

  const handleDismissPrompt = useCallback(() => {
    setPromptDismissed(true);
  }, []);

  const handleExitMonumentMode = useCallback(() => {
    setMonumentMode(false);
    setRouteData(null);
    setDestinationNodeId(null);
  }, []);

  const onQrScan = useCallback(
    async (decodedText) => {
      const qrId = decodedText.trim();
      try {
        const data = await api.verifyQr(qrId, DEFAULT_SLUG);
        setQrContent(data);
        setScanOpen(false);
      } catch (e) {
        setQrContent({ error: e.message });
      }
    },
    []
  );

  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-red-400">
        {loadError}
      </div>
    );
  }

  if (!monument) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        Loading monument…
      </div>
    );
  }

  if (monumentMode) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-surface">
        <InternalMapView
          monument={monument}
          userPosition={position}
          onExit={handleExitMonumentMode}
          destinationNodeId={destinationNodeId}
          onDestinationChange={setDestinationNodeId}
          routeData={routeData}
          onRouteUpdate={setRouteData}
          fakeLocationEnabled={fake.enabled}
          onFakeMapClick={(e) => fake.setLocation(e.lngLat.lat, e.lngLat.lng)}
          onFakeMarkerDragEnd={(e) => fake.setLocation(e.lngLat.lat, e.lngLat.lng)}
        />
        <div className="pointer-events-auto fixed bottom-24 left-2 z-[65] max-w-[min(100%,22rem)] pr-2 sm:bottom-8">
          <FakeLocationDebugPanel
            fake={fake}
            onArrivalLog={arrivalLog}
            demoWaypoints={demoWaypoints}
            demoLabel="Walk graph (demo)"
            routeWaypoints={routeWalkWaypoints}
            routeLabel="Walk route"
          />
        </div>
        <FloatingScanButton onClick={() => setScanOpen(true)} />
        <QRScannerModal
          open={scanOpen}
          onClose={() => setScanOpen(false)}
          onScan={onQrScan}
          monumentSlug={DEFAULT_SLUG}
        />
        {qrContent && !qrContent.error && (
          <ContentSheet content={qrContent} onClose={() => setQrContent(null)} />
        )}
        {qrContent?.error && (
          <Toast message={qrContent.error} onClose={() => setQrContent(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <header className="absolute left-0 right-0 top-0 z-20 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 py-4">
        <div>
          <p className="text-xs text-zinc-500">Monument Navigator</p>
          <h1 className="text-xl font-bold text-white">{monument.name}</h1>
        </div>
        <div className="text-right text-xs text-zinc-400">
          {user ? (
            <span className="text-emerald-400/90">Signed in</span>
          ) : (
            <span>Guest (sign in to save progress)</span>
          )}
        </div>
      </header>

      <div className="h-[70vh] min-h-[400px] w-full">
        {!token ? (
          <div className="flex h-full items-center justify-center bg-zinc-900 text-center text-sm text-zinc-500">
            Add VITE_MAPBOX_ACCESS_TOKEN to client/.env
          </div>
        ) : (
          <Map
            mapboxAccessToken={token}
            mapStyle={EXT_MAP_STYLE}
            initialViewState={{
              longitude: monument.geofence.lng,
              latitude: monument.geofence.lat,
              zoom: 15,
            }}
            onClick={(e) => {
              if (fake.enabled) {
                fake.setLocation(e.lngLat.lat, e.lngLat.lng);
              }
            }}
            style={{
              width: "100%",
              height: "100%",
              cursor: fake.enabled ? "crosshair" : undefined,
            }}
          >
            <Marker
              longitude={monument.geofence.lng}
              latitude={monument.geofence.lat}
              anchor="center"
            >
              <span className="block h-4 w-4 rounded-full border-2 border-white bg-amber-500/90 shadow-lg" />
            </Marker>
            {position && (
              <Marker
                longitude={position.lng}
                latitude={position.lat}
                anchor="center"
                draggable={fake.enabled}
                onDragEnd={(e) => fake.setLocation(e.lngLat.lat, e.lngLat.lng)}
              >
                <span className="block h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-500 shadow-md" />
              </Marker>
            )}
          </Map>
        )}
      </div>

      <div className="px-4 pt-3">
        <FakeLocationDebugPanel
          fake={fake}
          onArrivalLog={arrivalLog}
          demoWaypoints={demoWaypoints}
          demoLabel="Walk graph (demo)"
          routeWaypoints={routeWalkWaypoints}
          routeLabel="Walk route"
        />
      </div>

      <section className="space-y-3 border-t border-white/10 bg-surface-card px-4 py-5">
        <h2 className="text-sm font-semibold text-zinc-300">Location status</h2>
        <p className="text-[11px] text-zinc-600">
          Source: <span className="text-zinc-400">{source}</span>
          {fake.enabled && (
            <span className="text-amber-400/90"> — click map or drag marker to move</span>
          )}
        </p>
        {geoError && <p className="text-sm text-amber-400">{geoError}</p>}
        {!position && !geoError && (
          <p className="text-sm text-zinc-500">Acquiring GPS…</p>
        )}
        {position && (
          <p className="text-sm text-zinc-400">
            {inside ? (
              <span className="text-emerald-400">Inside {monument.name} geofence</span>
            ) : (
              <span>Outside geofence — move closer to India Gate (demo radius ~160m)</span>
            )}
          </p>
        )}
        {inside && !monumentMode && (
          <button
            type="button"
            onClick={handleEnterMonumentMode}
            className="mt-2 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
          >
            Enter Monument Mode
          </button>
        )}
        <p className="text-xs text-zinc-600">
          Tip: Enable <strong className="text-amber-400/90">Fake Location Simulator</strong>{" "}
          above to test geofence and navigation without traveling.
        </p>
      </section>

      {showPrompt && (
        <MonumentModePrompt
          monumentName={monument.name}
          onEnter={handleEnterMonumentMode}
          onDismiss={handleDismissPrompt}
        />
      )}

      <FloatingScanButton onClick={() => setScanOpen(true)} />
      <QRScannerModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScan={onQrScan}
        monumentSlug={DEFAULT_SLUG}
      />
      {qrContent && !qrContent.error && (
        <ContentSheet content={qrContent} onClose={() => setQrContent(null)} />
      )}
      {qrContent?.error && (
        <Toast message={qrContent.error} onClose={() => setQrContent(null)} />
      )}
    </div>
  );
}

function ContentSheet({ content, onClose }) {
  const { point } = content;

  const speak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${point.title}. ${point.description}`);
    u.lang = "en-IN";
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[85] max-h-[70vh] overflow-y-auto rounded-t-2xl border border-white/10 bg-surface-card p-5 shadow-float">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-500">Checkpoint</p>
          <h3 className="text-lg font-semibold text-white">{point.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-white/5 hover:text-white"
        >
          Close
        </button>
      </div>
      {!point.audioUrl && (
        <button
          type="button"
          onClick={speak}
          className="mb-3 text-xs font-medium text-sky-400 hover:text-sky-300"
        >
          Voice guide (browser TTS)
        </button>
      )}
      <p className="text-sm leading-relaxed text-zinc-400">{point.description}</p>
      {point.images?.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {point.images.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              className="h-40 w-full rounded-xl object-cover"
            />
          ))}
        </div>
      )}
      {point.audioUrl && (
        <audio className="mt-4 w-full" controls src={point.audioUrl}>
          <track kind="captions" />
        </audio>
      )}
      {point.videoUrl && (
        <video className="mt-4 w-full rounded-xl" controls src={point.videoUrl} />
      )}
    </div>
  );
}

function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-24 left-1/2 z-[85] max-w-md -translate-x-1/2 rounded-xl border border-red-500/30 bg-red-950/90 px-4 py-3 text-sm text-red-200 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <span>{message}</span>
        <button type="button" onClick={onClose} className="text-red-400 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
}
