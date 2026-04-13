import { useStore } from "../../store";
import { api } from "../../services/api";

export function SettingsDialog() {
  const activeDialog = useStore((s) => s.activeDialog);
  const closeDialog = useStore((s) => s.closeDialog);
  const confirmTeleport = useStore((s) => s.confirmTeleport);
  const speedVariance = useStore((s) => s.speedVariance);
  const movementBehavior = useStore((s) => s.movementBehavior);

  if (activeDialog !== "settings") return null;

  const toggle = (key: string, setter: (v: boolean) => void, current: boolean) => {
    setter(!current);
    api.updateSettings({ [key]: !current });
    if (key === "speedVariance") api.setVariance(!current);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" onClick={closeDialog}>
      <div className="bg-slate-900 border border-white/10 rounded-lg p-5 min-w-[360px] shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold mb-4">Settings</h3>

        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={confirmTeleport}
              onChange={() => toggle("confirmTeleport", useStore.getState().setConfirmTeleport, confirmTeleport)}
              className="accent-blue-500"
            />
            Confirm teleportation
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={speedVariance}
              onChange={() => toggle("speedVariance", useStore.getState().setSpeedVariance, speedVariance)}
              className="accent-blue-500"
            />
            Vary movement speed (80-120%)
          </label>

          <div>
            <span className="text-sm text-slate-400 block mb-2">Arrow key behavior:</span>
            <div className="flex flex-col gap-2 pl-1">
              {(["natural", "traditional"] as const).map((b) => (
                <label key={b} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="behavior"
                    checked={movementBehavior === b}
                    onChange={() => {
                      useStore.getState().setMovementBehavior(b);
                      api.updateSettings({ movementBehavior: b });
                    }}
                    className="accent-blue-500"
                  />
                  {b === "natural" ? "Natural (arrows move in that direction)" : "Traditional (left/right rotate heading)"}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <button
            className="px-4 py-1.5 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer border border-blue-500"
            onClick={closeDialog}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
