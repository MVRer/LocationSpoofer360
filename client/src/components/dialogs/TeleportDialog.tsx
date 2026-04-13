import { useStore } from "../../store";
import { api } from "../../services/api";
import { calculateRoute } from "../../services/routing";
import { reverseGeocode } from "../../services/geocoding";

export function TeleportDialog() {
  const activeDialog = useStore((s) => s.activeDialog);
  const dialogData = useStore((s) => s.dialogData);
  const closeDialog = useStore((s) => s.closeDialog);
  const currentLocation = useStore((s) => s.currentLocation);
  const moveType = useStore((s) => s.moveType);
  const addToast = useStore((s) => s.addToast);

  if (activeDialog !== "teleport" || !dialogData) return null;

  const { lat, lng, name } = dialogData;

  const handleTeleport = async () => {
    closeDialog();
    const result = await api.setLocation(lat, lng);
    if (result.ok) {
      const locationName = name ?? await reverseGeocode(lat, lng).catch(() => `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" onClick={closeDialog}>
      <div className="bg-slate-900 border border-white/10 rounded-lg p-5 min-w-[320px] max-w-[450px] shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold mb-3">Set Location</h3>
        <p className="font-mono text-sm text-slate-400 mb-1">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
        {name && <p className="text-xs text-slate-500 mb-3">{name}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-3 py-1.5 text-xs border border-white/10 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer transition-all"
            onClick={closeDialog}
          >
            Cancel
          </button>
          {currentLocation && (
            <button
              className="px-3 py-1.5 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer transition-all border border-blue-500"
              onClick={handleNavigate}
            >
              Navigate
            </button>
          )}
          <button
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
