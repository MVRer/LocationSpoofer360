import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import type { Route } from "./+types/_index";
import { ToastContainer } from "../components/common/Toast";
import { DirectionWheel } from "../components/controls/DirectionWheel";
import { MovementButton } from "../components/controls/MovementButton";
import { CoordinateInput } from "../components/dialogs/CoordinateInput";
import { GpxDialog } from "../components/dialogs/GpxDialog";
import { SettingsDialog } from "../components/dialogs/SettingsDialog";
import { TeleportDialog } from "../components/dialogs/TeleportDialog";
import { Header } from "../components/layout/Header";
import { NavigationPanel } from "../components/navigation/NavigationPanel";
import { Sidebar } from "../components/layout/Sidebar";
import { StatusBar } from "../components/layout/StatusBar";
import { useKeyboard } from "../hooks/useKeyboard";
import { useSSE } from "../hooks/useSSE";
import { useStore } from "../store";

const MapView = lazy(() =>
  import("../components/map/MapView").then((m) => ({ default: m.MapView })),
);

// Server-side imports
import { getDevices } from "../../server/device/discovery.js";
import { getCurrentHeading, getCurrentLocation } from "../../server/simulation/location.js";
import {
  getMoveState,
  getMoveType,
  getSpeedKmh,
  getTotalDistance,
} from "../../server/simulation/movement.js";
import { isTunneldRunning } from "../../server/tunnel/manager.js";
import { ensureBootstrap } from "../../server/bootstrap.js";
import { loadSettings } from "../../server/settings.js";

export async function loader() {
  ensureBootstrap();

  const [tunnelRunning, settings] = await Promise.all([
    isTunneldRunning(),
    Promise.resolve(loadSettings()),
  ]);

  return {
    devices: getDevices(),
    tunnelRunning,
    currentLocation: getCurrentLocation(),
    heading: getCurrentHeading(),
    moveState: getMoveState(),
    moveType: getMoveType(),
    speedKmh: getSpeedKmh(),
    totalDistance: getTotalDistance(),
    settings,
  };
}

function ClientOnly({
  children,
  fallback,
}: {
  children: () => ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? children() : (fallback ?? null);
}

export default function IndexPage({ loaderData }: Route.ComponentProps) {
  // Hydrate Zustand store with server data on mount
  useEffect(() => {
    const s = useStore.getState();
    s.setDevices(loaderData.devices);
    s.setTunnelRunning(loaderData.tunnelRunning);
    if (loaderData.currentLocation) {
      s.setCurrentLocation(loaderData.currentLocation);
      s.setHeading(loaderData.heading);
      s.setMoveState(loaderData.moveState);
      s.setMoveType(loaderData.moveType);
      s.setSpeedKmh(loaderData.speedKmh);
      s.setTotalDistance(loaderData.totalDistance);
    }
    if (loaderData.settings) {
      if (loaderData.settings.confirmTeleport !== undefined)
        s.setConfirmTeleport(loaderData.settings.confirmTeleport);
      if (loaderData.settings.speedVariance !== undefined)
        s.setSpeedVariance(loaderData.settings.speedVariance);
      if (loaderData.settings.movementBehavior)
        s.setMovementBehavior(loaderData.settings.movementBehavior);
    }
  }, [loaderData]);

  // Real-time updates via SSE
  useSSE();
  useKeyboard();

  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const selectedUdid = useStore((s) => s.selectedUdid);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 text-sm">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}
        <main className="flex-1 relative flex">
          {selectedUdid ? (
            <>
              <ClientOnly
                fallback={<div className="flex-1 bg-slate-900" />}
              >
                {() => (
                  <Suspense fallback={<div className="flex-1 bg-slate-900" />}>
                    <MapView />
                  </Suspense>
                )}
              </ClientOnly>
              <NavigationPanel />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-500 gap-3">
              <DevicePhoneMobileIcon className="w-12 h-12 opacity-40" />
              <h2 className="text-lg font-medium text-slate-400">
                No Device Selected
              </h2>
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
