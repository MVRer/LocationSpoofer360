import {
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  DocumentArrowUpIcon,
  MapIcon,
  MapPinIcon,
  ViewfinderCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { formatSpeed, kmhToSlider, sliderToKmh } from "../../lib/speed";
import { api } from "../../services/api";
import { useStore } from "../../store";

const MOVE_TYPES = [
  { type: "walk" as const, label: "Walk" },
  { type: "cycle" as const, label: "Cycle" },
  { type: "drive" as const, label: "Drive" },
];

export function Header() {
  const moveType = useStore((s) => s.moveType);
  const speedKmh = useStore((s) => s.speedKmh);
  const autoReverse = useStore((s) => s.autoReverse);
  const moveState = useStore((s) => s.moveState);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const autoFocus = useStore((s) => s.autoFocus);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const toggleAutoFocus = useStore((s) => s.toggleAutoFocus);

  return (
    <header className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-white/10 gap-3 shrink-0 z-50">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-1 text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          onClick={toggleSidebar}
          title="Toggle sidebar"
        >
          {sidebarOpen ? (
            <ChevronLeftIcon className="w-4 h-4" />
          ) : (
            <ChevronRightIcon className="w-4 h-4" />
          )}
        </button>

        <div className="flex gap-0.5 bg-slate-950 rounded-md p-0.5">
          {MOVE_TYPES.map(({ type, label }) => (
            <button
              type="button"
              key={type}
              className={`px-2.5 py-1 border-none rounded cursor-pointer text-xs transition-all ${
                moveType === type
                  ? "bg-blue-500 text-white"
                  : "bg-transparent text-slate-400 hover:text-white"
              }`}
              onClick={() => api.setMoveType(type)}
            >
              {label}
            </button>
          ))}
        </div>

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

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={`flex items-center gap-1 px-2 py-1 text-[11px] border rounded cursor-pointer transition-all whitespace-nowrap ${
            autoFocus
              ? "bg-blue-500/20 border-blue-500 text-blue-400"
              : "bg-slate-800 border-white/10 text-slate-400 hover:bg-slate-700"
          }`}
          onClick={toggleAutoFocus}
          title="Auto-focus map on location"
        >
          <ViewfinderCircleIcon className="w-3.5 h-3.5" />
          Focus
        </button>

        <button
          type="button"
          className={`flex items-center gap-1 px-2 py-1 text-[11px] border rounded cursor-pointer transition-all whitespace-nowrap ${
            autoReverse
              ? "bg-blue-500/20 border-blue-500 text-blue-400"
              : "bg-slate-800 border-white/10 text-slate-400 hover:bg-slate-700"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          onClick={() => {
            api.setAutoReverse(!autoReverse);
            useStore.getState().setAutoReverse(!autoReverse);
          }}
          disabled={moveState !== "navigation"}
          title="Auto-reverse route"
        >
          <ArrowPathIcon className="w-3.5 h-3.5" />
          Reverse
        </button>

        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 text-[11px] border border-white/10 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer transition-all"
          onClick={() => useStore.getState().openDialog("coordinate")}
          title="Go to coordinates"
        >
          <MapPinIcon className="w-3.5 h-3.5" />
          Coords
        </button>

        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 text-[11px] border border-white/10 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer transition-all"
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  useStore.getState().openDialog("teleport", {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    name: "Current location",
                  });
                },
                () => useStore.getState().addToast("Geolocation denied", "error"),
              );
            }
          }}
          title="Use browser geolocation"
        >
          <MapIcon className="w-3.5 h-3.5" />
          My Location
        </button>

        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 text-[11px] border border-white/10 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer transition-all"
          onClick={() => useStore.getState().openDialog("gpx")}
          title="Load GPX file"
        >
          <DocumentArrowUpIcon className="w-3.5 h-3.5" />
          GPX
        </button>

        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 text-[11px] border border-red-500/50 rounded bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => {
            api.resetLocation();
            useStore.getState().setCurrentLocation(null);
            useStore.getState().setMoveState("idle");
          }}
          title="Reset location"
        >
          <XCircleIcon className="w-3.5 h-3.5" />
          Reset
        </button>

        <button
          type="button"
          className="p-1.5 text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          onClick={() => useStore.getState().openDialog("settings")}
          title="Settings"
        >
          <Cog6ToothIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
