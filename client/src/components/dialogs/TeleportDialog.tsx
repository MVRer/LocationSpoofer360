import { useStore } from "../../store";
import { api } from "../../services/api";
import { calculateRoute } from "../../services/routing";
import { reverseGeocode } from "../../services/geocoding";

export function TeleportDialog() {
  const { activeDialog, dialogData, closeDialog, currentLocation, moveType, addToast } =
    useStore();

  if (activeDialog !== "teleport" || !dialogData) return null;

  const { lat, lng, name } = dialogData;

  const handleTeleport = async () => {
    closeDialog();
    const result = await api.setLocation(lat, lng);
    if (result.ok) {
      const locationName = name ?? (await reverseGeocode(lat, lng).catch(() => `${lat.toFixed(4)}, ${lng.toFixed(4)}`));
      useStore.getState().addRecentLocation({
        coord: { lat, lng },
        name: locationName,
        timestamp: Date.now(),
      });
    } else {
      addToast(result.message, "error");
    }
  };

  const handleNavigate = async () => {
    if (!currentLocation) {
      addToast("No current location to navigate from", "error");
      return;
    }
    closeDialog();

    try {
      addToast("Calculating route...", "info");
      const route = await calculateRoute(currentLocation, { lat, lng }, moveType);
      if (route.coordinates.length < 2) {
        addToast("No route found", "error");
        return;
      }
      await api.startNavigation(route.coordinates);
    } catch (err) {
      addToast(`Routing failed: ${err}`, "error");
    }
  };

  return (
    <div className="dialog-overlay" onClick={closeDialog}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Set Location</h3>
        <p className="dialog-coords">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
        {name && <p className="dialog-name">{name}</p>}
        <div className="dialog-actions">
          <button className="btn" onClick={closeDialog}>
            Cancel
          </button>
          {currentLocation && (
            <button className="btn btn-primary" onClick={handleNavigate}>
              Navigate
            </button>
          )}
          <button className="btn btn-primary" onClick={handleTeleport}>
            Teleport
          </button>
        </div>
      </div>
    </div>
  );
}
