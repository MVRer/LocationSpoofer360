import { useState, useEffect } from "react";
import { useStore } from "../../store";
import { formatDistance } from "../../lib/geo";
import { reverseGeocode } from "../../services/geocoding";

export function StatusBar() {
  const currentLocation = useStore((s) => s.currentLocation);
  const totalDistanceMeters = useStore((s) => s.totalDistanceMeters);
  const moveState = useStore((s) => s.moveState);
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    if (!currentLocation) {
      setLocationName("");
      return;
    }
    if (moveState === "idle" || moveState === "manual") {
      const timeout = setTimeout(async () => {
        try {
          const name = await reverseGeocode(currentLocation.lat, currentLocation.lng);
          setLocationName(name.split(",").slice(0, 2).join(","));
        } catch {
          setLocationName("");
        }
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [currentLocation?.lat, currentLocation?.lng, moveState]);

  return (
    <footer className="flex items-center justify-between px-3 py-1 bg-slate-900 border-t border-white/10 text-[11px] shrink-0 z-50">
      <div className="flex items-center gap-3">
        {currentLocation ? (
          <>
            <span className="font-mono text-slate-400">
              {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </span>
            {locationName && (
              <span className="text-slate-600 max-w-[300px] truncate">{locationName}</span>
            )}
          </>
        ) : (
          <span className="text-slate-600">No location set</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {moveState !== "idle" && (
          <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white font-semibold text-[10px] uppercase">
            {moveState}
          </span>
        )}
        {totalDistanceMeters > 0 && (
          <span className="text-slate-400">Total: {formatDistance(totalDistanceMeters)}</span>
        )}
      </div>
    </footer>
  );
}
