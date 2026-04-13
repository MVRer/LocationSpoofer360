import { useState, useRef } from "react";
import { useStore } from "../../store";
import { api } from "../../services/api";
import type { GpxData } from "@shared/types";

export function GpxDialog() {
  const { activeDialog, closeDialog, currentLocation, addToast } = useStore();
  const [gpxData, setGpxData] = useState<GpxData | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string>("");
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

      // Auto-select if there's only one option
      const options = getOptions(data);
      if (options.length === 1) {
        setSelectedRoute(options[0].key);
      }
    } catch {
      addToast("Failed to parse GPX file", "error");
    }
  };

  const getOptions = (data: GpxData) => {
    const opts: { key: string; label: string; coords: { lat: number; lng: number }[] }[] = [];

    data.tracks.forEach((t, i) => {
      t.segments.forEach((seg, j) => {
        opts.push({
          key: `track-${i}-${j}`,
          label: `Track: ${t.name}${t.segments.length > 1 ? ` (seg ${j + 1})` : ""}`,
          coords: seg,
        });
      });
    });

    data.routes.forEach((r, i) => {
      opts.push({ key: `route-${i}`, label: `Route: ${r.name}`, coords: r.points });
    });

    if (data.waypoints.length > 1) {
      opts.push({ key: "waypoints", label: "Waypoints", coords: data.waypoints });
    }

    return opts;
  };

  const handleStart = async (teleportFirst: boolean) => {
    if (!gpxData || !selectedRoute) return;
    const options = getOptions(gpxData);
    const selected = options.find((o) => o.key === selectedRoute);
    if (!selected || selected.coords.length < 2) {
      addToast("Selected route has fewer than 2 points", "error");
      return;
    }
    closeDialog();

    if (teleportFirst) {
      await api.setLocation(selected.coords[0].lat, selected.coords[0].lng);
    }
    await api.startNavigation(selected.coords);
    addToast(`Following GPX: ${selected.label}`, "success");
  };

  const options = gpxData ? getOptions(gpxData) : [];

  return (
    <div className="dialog-overlay" onClick={closeDialog}>
      <div className="dialog dialog-wide" onClick={(e) => e.stopPropagation()}>
        <h3>Load GPX File</h3>

        {!gpxData ? (
          <div className="form-group">
            <input
              ref={fileRef}
              type="file"
              accept=".gpx"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <>
            <p className="text-muted">{gpxData.name}</p>
            {options.length > 1 && (
              <div className="form-group">
                <label>Select track/route:</label>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="select-input"
                >
                  <option value="">-- Select --</option>
                  {options.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label} ({o.coords.length} points)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        <div className="dialog-actions">
          <button className="btn" onClick={closeDialog}>
            Cancel
          </button>
          {gpxData && selectedRoute && (
            <>
              <button className="btn btn-primary" onClick={() => handleStart(true)}>
                Teleport & Follow
              </button>
              {currentLocation && (
                <button className="btn btn-primary" onClick={() => handleStart(false)}>
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
