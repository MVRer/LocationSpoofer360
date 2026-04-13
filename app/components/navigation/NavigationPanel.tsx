import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { formatDistance, polylineDistance } from "../../lib/geo";
import { api } from "../../services/api";
import { useStore } from "../../store";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
}

function formatETA(seconds: number): string {
  const arrival = new Date(Date.now() + seconds * 1000);
  return arrival.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function NavigationPanel() {
  const moveState = useStore((s) => s.moveState);
  const destinationName = useStore((s) => s.navigationDestinationName);
  const navigationStartTime = useStore((s) => s.navigationStartTime);
  const upcomingRoute = useStore((s) => s.upcomingRoute);
  const navigationProgress = useStore((s) => s.navigationProgress);
  const speedKmh = useStore((s) => s.speedKmh);
  const moveType = useStore((s) => s.moveType);

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!navigationStartTime) {
      setElapsed(0);
      return;
    }
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - navigationStartTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [navigationStartTime]);

  if (moveState !== "navigation") return null;

  const remainingDistance = polylineDistance(upcomingRoute);
  const speedMs = (speedKmh * 1000) / 3600;
  const etaSeconds = speedMs > 0 ? remainingDistance / speedMs : 0;
  const progressPercent = Math.round(navigationProgress * 100);

  const handleStop = async () => {
    await api.stopNavigation();
    const s = useStore.getState();
    s.setNavigationDestinationName(null);
    s.setNavigationStartTime(null);
  };

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-[380px]">
      <div className="bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold uppercase text-blue-400 shrink-0">
              {moveType === "walk" ? "Walking" : moveType === "cycle" ? "Cycling" : "Driving"} to
            </span>
          </div>
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer shrink-0"
            onClick={handleStop}
            title="Stop navigation"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {destinationName && (
          <div className="px-4 pb-2">
            <p className="text-sm text-white font-medium truncate">{destinationName}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-4 pb-3">
          <div>
            <p className="text-[10px] uppercase text-slate-500">Distance</p>
            <p className="text-sm font-semibold text-white">{formatDistance(remainingDistance)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">ETA</p>
            <p className="text-sm font-semibold text-white">{formatETA(etaSeconds)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Elapsed</p>
            <p className="text-sm font-semibold text-white">{formatDuration(elapsed)}</p>
          </div>
        </div>

        {/* Speed */}
        <div className="px-4 pb-2">
          <p className="text-[10px] text-slate-500">
            {speedKmh.toFixed(1)} km/h &middot; {progressPercent}% complete
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
