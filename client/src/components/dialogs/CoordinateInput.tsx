import { useState } from "react";
import { useStore } from "../../store";

export function CoordinateInput() {
  const { activeDialog, closeDialog } = useStore();
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
    <div className="dialog-overlay" onClick={closeDialog}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Go to Coordinates</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Latitude</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              onPaste={handlePaste}
              placeholder="e.g. 37.7749"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Longitude</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="e.g. -122.4194"
            />
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn" onClick={closeDialog}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Go
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
