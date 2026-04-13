import { useEffect } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { StatusBar } from "./components/layout/StatusBar";
import { MapView } from "./components/map/MapView";
import { MovementButton } from "./components/controls/MovementButton";
import { DirectionWheel } from "./components/controls/DirectionWheel";
import { TeleportDialog } from "./components/dialogs/TeleportDialog";
import { CoordinateInput } from "./components/dialogs/CoordinateInput";
import { GpxDialog } from "./components/dialogs/GpxDialog";
import { SettingsDialog } from "./components/dialogs/SettingsDialog";
import { ToastContainer } from "./components/common/Toast";
import { useWebSocket } from "./hooks/useWebSocket";
import { useKeyboard } from "./hooks/useKeyboard";
import { useStore } from "./store";
import { api } from "./services/api";

export function App() {
  useWebSocket();
  useKeyboard();

  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const selectedUdid = useStore((s) => s.selectedUdid);

  // Load initial data
  useEffect(() => {
    api.getDevices().then((devices) => {
      useStore.getState().setDevices(devices);
    });
    api.getTunnelStatus().then(({ running }) => {
      useStore.getState().setTunnelRunning(running);
    });
    api.getSettings().then((settings) => {
      const s = useStore.getState();
      if (settings.confirmTeleport !== undefined) s.setConfirmTeleport(settings.confirmTeleport);
      if (settings.speedVariance !== undefined) s.setSpeedVariance(settings.speedVariance);
      if (settings.movementBehavior) s.setMovementBehavior(settings.movementBehavior);
    });
  }, []);

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className={`main-content ${!sidebarOpen ? "full" : ""}`}>
          {selectedUdid ? (
            <MapView />
          ) : (
            <div className="no-device">
              <div className="no-device-icon">📱</div>
              <h2>No Device Selected</h2>
              <p>Select a device from the sidebar or start the tunnel first.</p>
            </div>
          )}
          <div className="controls-overlay">
            <DirectionWheel />
            <MovementButton />
          </div>
        </main>
      </div>
      <StatusBar />

      {/* Dialogs */}
      <TeleportDialog />
      <CoordinateInput />
      <GpxDialog />
      <SettingsDialog />
      <ToastContainer />
    </div>
  );
}
