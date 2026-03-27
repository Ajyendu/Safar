/**
 * Shown when GPS enters monument geofence — offers Monument Mode.
 */
export function MonumentModePrompt({ monumentName, onEnter, onDismiss }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 pb-10 sm:items-center sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-card p-6 shadow-float">
        <h2 className="text-lg font-semibold text-white">You are at {monumentName}</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Enter <span className="text-accent font-medium">Monument Mode</span> to open the
          internal map, live position, QR checkpoints, and turn-by-turn navigation along
          pathways.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onEnter}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
          >
            Enter Navigation Mode
          </button>
        </div>
      </div>
    </div>
  );
}
