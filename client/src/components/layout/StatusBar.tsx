import { useState, useEffect } from "react";
import { useStore } from "../../store";
import { formatDistance } from "../../lib/geo";
import { reverseGeocode } from "../../services/geocoding";

export function StatusBar() {
  const { currentLocation, totalDistanceMeters, moveState } = useStore();
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    if (!currentLocation) {
      setLocationName("");
      return;
    }

    // Only geocode when not actively navigating/moving (too many requests otherwise)
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
    <footer className="status-bar">
      <div className="status-left">
        {currentLocation ? (
          <>
            <span className="status-coords">
              {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </span>
            {locationName && (
              <span className="status-name">{locationName}</span>
            )}
          </>
        ) : (
          <span className="text-muted">No location set</span>
        )}
      </div>
      <div className="status-right">
        {moveState !== "idle" && (
          <span className="status-state">{moveState.toUpperCase()}</span>
        )}
        {totalDistanceMeters > 0 && (
          <span className="status-distance">
            Total: {formatDistance(totalDistanceMeters)}
          </span>
        )}
      </div>
    </footer>
  );
}
