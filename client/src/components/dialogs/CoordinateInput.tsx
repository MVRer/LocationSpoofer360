import { useState } from "react";
import { useStore } from "../../store";

export function CoordinateInput() {
  const activeDialog = useStore((s) => s.activeDialog);
  const closeDialog = useStore((s) => s.closeDialog);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  if (activeDialog !== "coordinate") return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) return;
    closeDialog();
    useStore.getState().openDialog("teleport", { lat: latNum, lng: lngNum });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    const match = text.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
    if (match) {
      e.preventDefault();
      setLat(match[1]);
      setLng(match[2]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" onClick={closeDialog}>
      <div className="bg-slate-900 border border-white/10 rounded-lg p-5 min-w-[320px] shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold mb-3">Go to Coordinates</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block mb-1 text-xs text-slate-400">Latitude</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              onPaste={handlePaste}
              placeholder="e.g. 37.7749"
              autoFocus
              className="w-full px-2.5 py-2 bg-slate-950 border border-white/10 rounded-md text-slate-200 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 text-xs text-slate-400">Longitude</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="e.g. -122.4194"
              className="w-full px-2.5 py-2 bg-slate-950 border border-white/10 rounded-md text-slate-200 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-3 py-1.5 text-xs border border-white/10 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              onClick={closeDialog}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer border border-blue-500"
            >
              Go
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
