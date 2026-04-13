import { useState } from "react";
import { api } from "../../services/api";
import { reverseGeocode } from "../../services/geocoding";
import { type RouteResult, calculateRoute } from "../../services/routing";
import { useStore } from "../../store";
import { formatDistance } from "../../lib/geo";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
}

function formatETA(seconds: number): string {
  const arrival = new Date(Date.now() + seconds * 1000);
  return arrival.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getSimulatedDuration(distanceMeters: number, speedKmh: number): number {
  if (speedKmh <= 0) return 0;
  return distanceMeters / ((speedKmh * 1000) / 3600);
}

export function TeleportDialog() {
  const activeDialog = useStore((s) => s.activeDialog);
  const dialogData = useStore((s) => s.dialogData);
  const closeDialog = useStore((s) => s.closeDialog);
  const currentLocation = useStore((s) => s.currentLocation);
  const moveType = useStore((s) => s.moveType);
  const speedKmh = useStore((s) => s.speedKmh);
  const addToast = useStore((s) => s.addToast);

  const [calculatedRoute, setCalculatedRoute] = useState<RouteResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  if (activeDialog !== "teleport" || !dialogData) return null;

  const { lat, lng, name } = dialogData;

  const saveRecent = async (locationName?: string) => {
    const resolvedName =
      locationName ??
      (await reverseGeocode(lat, lng).catch(() => `${lat.toFixed(4)}, ${lng.toFixed(4)}`));
    const loc = { coord: { lat, lng }, name: resolvedName, timestamp: Date.now() };
    useStore.getState().addRecentLocation(loc);
    api.addRecentLocation(loc);
  };

  const handleClose = () => {
    setCalculatedRoute(null);
    setCalculating(false);
    useStore.getState().setPreviewRoute(null);
    closeDialog();
  };

  const handleTeleport = async () => {
    handleClose();
    const result = await api.setLocation(lat, lng);
    if (result.ok) {
      useStore.getState().setCurrentLocation({ lat, lng });
      await saveRecent(name);
    } else {
      addToast(result.message, "error");
    }
  };

  const handleCalculateRoute = async () => {
    if (!currentLocation) {
      addToast("No current location to navigate from", "error");
      return;
    }
    setCalculating(true);
    try {
      const route = await calculateRoute(currentLocation, { lat, lng }, moveType);
      if (route.coordinates.length < 2) {
        addToast("No route found", "error");
        setCalculating(false);
        return;
      }
      setCalculatedRoute(route);
      useStore.getState().setPreviewRoute(route.coordinates);
    } catch (err) {
      addToast(`Routing failed: ${err}`, "error");
    }
    setCalculating(false);
  };

  const handleConfirmNavigation = async () => {
    if (!calculatedRoute) return;
    const route = calculatedRoute;
    useStore.getState().setPreviewRoute(null);
    handleClose();
    try {
      await api.startNavigation(route.coordinates, name);
      useStore.getState().setNavigationDestinationName(name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      useStore.getState().setNavigationStartTime(Date.now());
      await saveRecent(name);
    } catch (err) {
      addToast(`Navigation failed: ${err}`, "error");
    }
  };

  const handleBack = () => {
    setCalculatedRoute(null);
    useStore.getState().setPreviewRoute(null);
  };

  // Route confirmation view
  if (calculatedRoute) {
    const simDuration = getSimulatedDuration(calculatedRoute.distanceMeters, speedKmh);

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
        onClick={handleClose}
      >
        <div
          className="bg-slate-900 border border-white/10 rounded-lg p-5 min-w-[320px] max-w-[450px] shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-base font-semibold mb-3">Route Confirmation</h3>
          {name && <p className="text-xs text-slate-400 mb-3">{name}</p>}

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Distance</span>
              <span className="text-white font-medium">{formatDistance(calculatedRoute.distanceMeters)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Real duration</span>
              <span className="text-white font-medium">{formatDuration(calculatedRoute.durationSeconds)}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
              <span className="text-slate-400">Simulated duration</span>
              <span className="text-blue-400 font-medium">
                {formatDuration(simDuration)} @ {speedKmh} km/h ({moveType})
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">ETA</span>
              <span className="text-blue-400 font-medium">{formatETA(simDuration)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-xs border border-white/10 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer transition-all"
              onClick={handleBack}
            >
              Back
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs rounded bg-green-600 text-white hover:bg-green-500 cursor-pointer transition-all border border-green-600"
              onClick={handleConfirmNavigation}
            >
              Start Navigation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default teleport/navigate view
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
      onClick={handleClose}
    >
      <div
        className="bg-slate-900 border border-white/10 rounded-lg p-5 min-w-[320px] max-w-[450px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-3">Set Location</h3>
        <p className="font-mono text-sm text-slate-400 mb-1">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
        {name && <p className="text-xs text-slate-500 mb-3">{name}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            className="px-3 py-1.5 text-xs border border-white/10 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer transition-all"
            onClick={handleClose}
          >
            Cancel
          </button>
          {currentLocation && (
            <button
              type="button"
              className="px-3 py-1.5 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer transition-all border border-blue-500 disabled:opacity-50"
              onClick={handleCalculateRoute}
              disabled={calculating}
            >
              {calculating ? "Calculating..." : "Navigate"}
            </button>
          )}
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer transition-all border border-blue-500"
            onClick={handleTeleport}
          >
            Teleport
          </button>
        </div>
      </div>
    </div>
  );
}
