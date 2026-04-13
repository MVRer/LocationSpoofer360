import { useStore } from "../../store";
import { api } from "../../services/api";
import { sliderToKmh, kmhToSlider, formatSpeed } from "../../lib/speed";

export function Header() {
  const moveType = useStore((s) => s.moveType);
  const speedKmh = useStore((s) => s.speedKmh);
  const autoReverse = useStore((s) => s.autoReverse);
  const moveState = useStore((s) => s.moveState);
  const currentLocation = useStore((s) => s.currentLocation);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  return (
    <header className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-white/10 gap-3 shrink-0 z-50">
      <div className="flex items-center gap-2">
        <button
          className="px-2 py-1 text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-base"
          onClick={toggleSidebar}
          title="Toggle sidebar"
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>

        {/* Move type selector */}
        <div className="flex gap-0.5 bg-slate-950 rounded-md p-0.5">
          {(["walk", "cycle", "drive"] as const).map((type) => (
            <button
              key={type}
              className={`flex items-center gap-1 px-2.5 py-1 border-none rounded cursor-pointer text-xs transition-all ${
                moveType === type
                  ? "bg-blue-500 text-white"
                  : "bg-transparent text-slate-400 hover:text-white"
              }`}
              onClick={() => api.setMoveType(type)}
            >
              <span>{type === "walk" ? "🚶" : type === "cycle" ? "🚴" : "🚗"}</span>
              <span className="capitalize">{type}</span>
            </button>
          ))}
        </div>

        {/* Speed slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={kmhToSlider(speedKmh)}
            onChange={(e) => api.setSpeed(sliderToKmh(parseFloat(e.target.value)))}
            className="w-28 accent-blue-500"
          />
          <span className="text-[11px] text-slate-400 min-w-[55px]">{formatSpeed(speedKmh)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`px-2 py-1 text-[11px] border rounded cursor-pointer transition-all whitespace-nowrap ${
            autoReverse
              ? "bg-blue-500 border-blue-500 text-white"
              : "bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          onClick={() => {
            api.setAutoReverse(!autoReverse);
            useStore.getState().setAutoReverse(!autoReverse);
          }}
          disabled={moveState !== "navigation"}
          title="Auto-reverse route"
        >
          ↺ Reverse
        </button>

        <button
          className="px-2 py-1 text-[11px] border border-white/10 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer transition-all"
          onClick={() => useStore.getState().openDialog("coordinate")}
          title="Go to coordinates"
        >
          📍 Coords
        </button>

        <button
          className="px-2 py-1 text-[11px] border border-white/10 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer transition-all"
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  useStore.getState().openDialog("teleport", {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    name: "My Location",
                  });
                },
                () => useStore.getState().addToast("Geolocation denied", "error")
              );
            }
          }}
          title="Use my real location"
        >
          📌 My Location
        </button>

        <button
          className="px-2 py-1 text-[11px] border border-white/10 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer transition-all"
          onClick={() => useStore.getState().openDialog("gpx")}
          title="Load GPX file"
        >
          GPX
        </button>

        <button
          className="px-2 py-1 text-[11px] border border-red-500/50 rounded bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => api.resetLocation()}
          disabled={!currentLocation}
          title="Reset location"
        >
          Reset
        </button>

        <button
          className="px-2 py-1 text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-base"
          onClick={() => useStore.getState().openDialog("settings")}
          title="Settings"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}
