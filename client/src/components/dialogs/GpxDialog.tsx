import type { GpxData } from "@shared/types";
import { useRef, useState } from "react";
import { api } from "../../services/api";
import { useStore } from "../../store";

export function GpxDialog() {
  const activeDialog = useStore((s) => s.activeDialog);
  const closeDialog = useStore((s) => s.closeDialog);
  const currentLocation = useStore((s) => s.currentLocation);
  const addToast = useStore((s) => s.addToast);
  const [gpxData, setGpxData] = useState<GpxData | null>(null);
  const [selectedRoute, setSelectedRoute] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (activeDialog !== "gpx") return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await api.uploadGpx(file);
      if (data.error) {
        addToast(data.error, "error");
        return;
      }
      setGpxData(data);
      const options = getOptions(data);
      if (options.length === 1) setSelectedRoute(options[0].key);
    } catch {
      addToast("Failed to parse GPX file", "error");
    }
  };

  const getOptions = (data: GpxData) => {
    const trackOpts = data.tracks.flatMap((t, i) =>
      t.segments.map((seg, j) => ({
        key: `track-${i}-${j}`,
        label: `Track: ${t.name}${t.segments.length > 1 ? ` (seg ${j + 1})` : ""}`,
        coords: seg,
      })),
    );
    const routeOpts = data.routes.map((r, i) => ({
      key: `route-${i}`,
      label: `Route: ${r.name}`,
      coords: r.points,
    }));
    const waypointOpts =
      data.waypoints.length > 1
        ? [{ key: "waypoints", label: "Waypoints", coords: data.waypoints }]
        : [];
    return [...trackOpts, ...routeOpts, ...waypointOpts];
  };

  const handleStart = async (teleportFirst: boolean) => {
    if (!(gpxData && selectedRoute)) return;
    const selected = getOptions(gpxData).find((o) => o.key === selectedRoute);
    if (!selected || selected.coords.length < 2) {
      addToast("Selected route has fewer than 2 points", "error");
      return;
    }
    closeDialog();
    if (teleportFirst) await api.setLocation(selected.coords[0].lat, selected.coords[0].lng);
    await api.startNavigation(selected.coords);
    addToast(`Following GPX: ${selected.label}`, "success");
  };

  const options = gpxData ? getOptions(gpxData) : [];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
      onClick={closeDialog}
    >
      <div
        className="bg-slate-900 border border-white/10 rounded-lg p-5 min-w-[400px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-3">Load GPX File</h3>

        {!gpxData ? (
          <input
            ref={fileRef}
            type="file"
            accept=".gpx"
            onChange={handleFileChange}
            className="text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700"
          />
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-2">{gpxData.name}</p>
            {options.length > 1 && (
              <div className="mb-3">
                <label htmlFor="gpx-route-select" className="block mb-1 text-xs text-slate-400">
                  Select track/route:
                </label>
                <select
                  id="gpx-route-select"
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-950 border border-white/10 rounded-md text-slate-200 text-sm"
                >
                  <option value="">-- Select --</option>
                  {options.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label} ({o.coords.length} pts)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            className="px-3 py-1.5 text-xs border border-white/10 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
            onClick={() => {
              setGpxData(null);
              setSelectedRoute("");
              closeDialog();
            }}
          >
            Cancel
          </button>
          {gpxData && selectedRoute && (
            <>
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer border border-blue-500"
                onClick={() => handleStart(true)}
              >
                Teleport & Follow
              </button>
              {currentLocation && (
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer border border-blue-500"
                  onClick={() => handleStart(false)}
                >
                  Navigate to Start
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
