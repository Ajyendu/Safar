import { FAKE_SPEED } from "../hooks/useFakeLocation.js";

/**
 * Debug UI for fake GPS: toggle, coords, status, speed, simulation controls.
 */
export function FakeLocationDebugPanel({
  fake,
  onArrivalLog,
  /** Optional: walk along these waypoints when user clicks "Walk demo path" */
  demoWaypoints,
  /** Optional: label for demo button */
  demoLabel = "Walk demo path",
  /** Optional: follow computed navigation route polyline */
  routeWaypoints,
  routeLabel = "Walk along route",
}) {
  const { position, status, speedTier, setSpeedTier, simulationProgress, simDistanceAlong, simTotalLength, tickMs, enabled } =
    fake;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-950/40 p-4 text-left shadow-lg backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-amber-200/90">
          Fake Location Simulator
        </h3>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-amber-100/90">
          <input
            type="checkbox"
            className="rounded border-amber-500/50 bg-black/40"
            checked={enabled}
            onChange={(e) => fake.setEnabled(e.target.checked)}
          />
          Enable
        </label>
      </div>

      <p className="mt-2 text-[11px] leading-snug text-amber-200/60">
        Overrides real GPS. Click the map or drag the marker to place yourself. Use controls to
        simulate walking smoothly (~{tickMs} ms steps).
      </p>

      <dl className="mt-3 space-y-1 font-mono text-[11px] text-amber-100/85">
        <div className="flex justify-between gap-2">
          <dt className="text-amber-200/50">Lat</dt>
          <dd>{position?.lat?.toFixed(6) ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-amber-200/50">Lng</dt>
          <dd>{position?.lng?.toFixed(6) ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-amber-200/50">Source</dt>
          <dd className="text-emerald-300/90">{enabled ? "fake" : "gps"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-amber-200/50">Simulation</dt>
          <dd className="capitalize">{status}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-amber-200/50">Speed</dt>
          <dd>
            {FAKE_SPEED[speedTier]?.toFixed(1) ?? "?"} m/s ({speedTier})
          </dd>
        </div>
        {(status === "running" || status === "paused") && simTotalLength > 0 && (
          <div className="flex justify-between gap-2">
            <dt className="text-amber-200/50">Along path</dt>
            <dd>
              {simDistanceAlong.toFixed(0)} / {simTotalLength.toFixed(0)} m (
              {(simulationProgress * 100).toFixed(0)}%)
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-3">
        <p className="mb-1 text-[10px] uppercase text-amber-200/40">Walking speed</p>
        <div className="flex gap-1">
          {["slow", "medium", "fast"].map((tier) => (
            <button
              key={tier}
              type="button"
              disabled={!enabled}
              onClick={() => setSpeedTier(tier)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold capitalize ${
                speedTier === tier
                  ? "bg-amber-500 text-black"
                  : "bg-black/30 text-amber-100/80 hover:bg-black/50"
              } disabled:opacity-40`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={!enabled || status !== "idle" || !demoWaypoints?.length}
          onClick={() => fake.startSimulation(demoWaypoints)}
          className="rounded-lg bg-emerald-600/80 px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
        >
          {demoLabel}
        </button>
        <button
          type="button"
          disabled={!enabled || status !== "idle" || !routeWaypoints?.length}
          onClick={() => fake.startSimulation(routeWaypoints)}
          className="rounded-lg bg-sky-600/80 px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-sky-500 disabled:opacity-40"
        >
          {routeLabel}
        </button>
        <button
          type="button"
          disabled={!enabled || status !== "running"}
          onClick={() => fake.pauseSimulation()}
          className="rounded-lg bg-white/10 px-2 py-1.5 text-[10px] font-medium text-amber-100 disabled:opacity-40"
        >
          Pause
        </button>
        <button
          type="button"
          disabled={!enabled || status !== "paused"}
          onClick={() => fake.resumeSimulation()}
          className="rounded-lg bg-white/10 px-2 py-1.5 text-[10px] font-medium text-amber-100 disabled:opacity-40"
        >
          Resume
        </button>
        <button
          type="button"
          disabled={!enabled || status === "idle"}
          onClick={() => fake.stopSimulation()}
          className="rounded-lg bg-red-500/30 px-2 py-1.5 text-[10px] font-medium text-red-200 disabled:opacity-40"
        >
          Stop
        </button>
        <button
          type="button"
          disabled={!enabled}
          onClick={() => fake.reset()}
          className="rounded-lg bg-white/10 px-2 py-1.5 text-[10px] font-medium text-amber-100 disabled:opacity-40"
        >
          Reset
        </button>
      </div>

      {onArrivalLog?.length > 0 && (
        <div className="mt-3 max-h-20 overflow-y-auto rounded border border-amber-500/20 bg-black/30 p-2 font-mono text-[10px] text-amber-200/70">
          {onArrivalLog.slice(-5).map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
