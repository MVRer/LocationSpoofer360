import { useStore } from "../../store";
import { api } from "../../services/api";

export function SettingsDialog() {
  const {
    activeDialog,
    closeDialog,
    confirmTeleport,
    speedVariance,
    movementBehavior,
    setConfirmTeleport,
    setSpeedVariance,
    setMovementBehavior,
  } = useStore();

  if (activeDialog !== "settings") return null;

  const handleConfirmTeleport = (checked: boolean) => {
    setConfirmTeleport(checked);
    api.updateSettings({ confirmTeleport: checked });
  };

  const handleSpeedVariance = (checked: boolean) => {
    setSpeedVariance(checked);
    api.setVariance(checked);
    api.updateSettings({ speedVariance: checked });
  };

  const handleMovementBehavior = (behavior: "natural" | "traditional") => {
    setMovementBehavior(behavior);
    api.updateSettings({ movementBehavior: behavior });
  };

  return (
    <div className="dialog-overlay" onClick={closeDialog}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Settings</h3>

        <div className="settings-group">
          <label className="setting-item">
            <input
              type="checkbox"
              checked={confirmTeleport}
              onChange={(e) => handleConfirmTeleport(e.target.checked)}
            />
            <span>Confirm teleportation</span>
          </label>

          <label className="setting-item">
            <input
              type="checkbox"
              checked={speedVariance}
              onChange={(e) => handleSpeedVariance(e.target.checked)}
            />
            <span>Vary movement speed (80-120%)</span>
          </label>

          <div className="setting-item">
            <label>Arrow key behavior:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="behavior"
                  checked={movementBehavior === "natural"}
                  onChange={() => handleMovementBehavior("natural")}
                />
                Natural (arrows move in that direction)
              </label>
              <label>
                <input
                  type="radio"
                  name="behavior"
                  checked={movementBehavior === "traditional"}
                  onChange={() => handleMovementBehavior("traditional")}
                />
                Traditional (left/right rotate heading)
              </label>
            </div>
          </div>
        </div>

        <div className="dialog-actions">
          <button className="btn btn-primary" onClick={closeDialog}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
