import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { ToastContainer } from "./components/common/Toast";
import { DirectionWheel } from "./components/controls/DirectionWheel";
import { MovementButton } from "./components/controls/MovementButton";
import { CoordinateInput } from "./components/dialogs/CoordinateInput";
import { GpxDialog } from "./components/dialogs/GpxDialog";
import { SettingsDialog } from "./components/dialogs/SettingsDialog";
import { TeleportDialog } from "./components/dialogs/TeleportDialog";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { StatusBar } from "./components/layout/StatusBar";
import { MapView } from "./components/map/MapView";
import { NavigationPanel } from "./components/navigation/NavigationPanel";
import { useKeyboard } from "./hooks/useKeyboard";
import { useWebSocket } from "./hooks/useWebSocket";
import { api } from "./services/api";
import { useStore } from "./store";

export function App() {
  useWebSocket();
  useKeyboard();

  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const selectedUdid = useStore((s) => s.selectedUdid);

  useEffect(() => {
    api.getSettings().then((settings) => {
      const s = useStore.getState();
      if (settings.confirmTeleport !== undefined) s.setConfirmTeleport(settings.confirmTeleport);
      if (settings.speedVariance !== undefined) s.setSpeedVariance(settings.speedVariance);
      if (settings.movementBehavior) s.setMovementBehavior(settings.movementBehavior);
    });
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 text-sm">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}
        <main className="flex-1 relative flex">
          {selectedUdid ? (
            <>
              <MapView />
              <NavigationPanel />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-500 gap-3">
              <DevicePhoneMobileIcon className="w-12 h-12 opacity-40" />
              <h2 className="text-lg font-medium text-slate-400">No Device Selected</h2>
              <p className="text-slate-600 text-xs">
                Select a device from the sidebar or start the tunnel first.
              </p>
            </div>
          )}
          <div className="absolute bottom-5 left-5 z-[1000] pointer-events-none">
            <div className="relative w-[120px] h-[120px] pointer-events-auto">
              <DirectionWheel />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <MovementButton />
              </div>
            </div>
          </div>
        </main>
      </div>
      <StatusBar />

      <TeleportDialog />
      <CoordinateInput />
      <GpxDialog />
      <SettingsDialog />
      <ToastContainer />
    </div>
  );
}
