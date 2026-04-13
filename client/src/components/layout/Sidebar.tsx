import {
  ClockIcon,
  DevicePhoneMobileIcon,
  MagnifyingGlassIcon,
  SignalIcon,
  WifiIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../services/api";
import { type SearchResult, searchLocation } from "../../services/geocoding";
import { useStore } from "../../store";

export function Sidebar() {
  const devices = useStore((s) => s.devices);
  const selectedUdid = useStore((s) => s.selectedUdid);
  const tunnelRunning = useStore((s) => s.tunnelRunning);
  const recentLocations = useStore((s) => s.recentLocations);
  const addToast = useStore((s) => s.addToast);

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [tunnelLoading, setTunnelLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Poll devices and tunnel status directly via REST
  useEffect(() => {
    function poll() {
      api.getDevices().then((d) => useStore.getState().setDevices(d));
      api.getTunnelStatus().then((s) => useStore.getState().setTunnelRunning(s.running));
    }
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchLocation(query);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 500);
  }, []);

  const handleSelectSearchResult = async (result: SearchResult) => {
    setSearchResults([]);
    setSearchQuery("");
    useStore.getState().openDialog("teleport", {
      lat: result.lat,
      lng: result.lng,
      name: result.displayName,
    });
  };

  const handleSelectDevice = async (udid: string) => {
    try {
      await api.selectDevice(udid);
      useStore.getState().setSelectedUdid(udid);
    } catch {
      addToast("Failed to select device", "error");
    }
  };

  const handleStartTunnel = async () => {
    setTunnelLoading(true);
    addToast("Starting tunnel (admin password may be required)...", "info");
    const result = await api.startTunnel();
    setTunnelLoading(false);
    useStore.getState().setTunnelRunning(result.running);
    addToast(result.message, result.ok ? "success" : "error");
  };

  const handleStopTunnel = async () => {
    const result = await api.stopTunnel();
    useStore.getState().setTunnelRunning(result.running);
    addToast(result.message, result.ok ? "success" : "error");
  };

  const handleClearRecent = async () => {
    useStore.getState().clearRecentLocations();
    await api.clearRecentLocations();
  };

  return (
    <aside className="w-[260px] min-w-[200px] bg-slate-900 border-r border-white/10 overflow-y-auto shrink-0">
      {/* Search */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            className="w-full pl-7 pr-2.5 py-2 bg-slate-950 border border-white/10 rounded-md text-slate-200 text-sm outline-none focus:border-blue-500 placeholder:text-slate-600"
            placeholder="Search location..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-1 bg-slate-950 border border-white/10 rounded-md max-h-[200px] overflow-y-auto list-none">
            {searchResults.map((r) => (
              <li
                key={`${r.lat}-${r.lng}`}
                className="px-2.5 py-2 cursor-pointer border-b border-white/10 last:border-b-0 text-xs leading-relaxed hover:bg-slate-800 transition-colors"
                onClick={() => handleSelectSearchResult(r)}
              >
                {r.displayName}
              </li>
            ))}
          </ul>
        )}
        {searching && <div className="py-2 text-xs text-slate-500">Searching...</div>}
      </div>

      {/* Tunnel */}
      <div className="p-3 border-b border-white/10">
        <h3 className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <SignalIcon className="w-3.5 h-3.5" />
            Tunnel
          </span>
          <span
            className={`inline-block w-2 h-2 rounded-full ${tunnelRunning ? "bg-green-500" : "bg-red-500"}`}
          />
        </h3>
        {!tunnelRunning ? (
          <button
            type="button"
            className="px-2.5 py-1 text-xs border border-white/10 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer transition-all disabled:opacity-50"
            onClick={handleStartTunnel}
            disabled={tunnelLoading}
          >
            {tunnelLoading ? "Starting..." : "Start Tunnel"}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-400">Running</span>
            <button
              type="button"
              className="text-xs text-red-400 hover:text-red-300 bg-transparent border-none cursor-pointer"
              onClick={handleStopTunnel}
            >
              Stop
            </button>
          </div>
        )}
      </div>

      {/* Devices */}
      <div className="p-3 border-b border-white/10">
        <h3 className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <DevicePhoneMobileIcon className="w-3.5 h-3.5" />
          Devices
        </h3>
        {devices.length === 0 ? (
          <p className="text-xs text-slate-600">No devices found</p>
        ) : (
          <ul className="list-none space-y-1">
            {devices.map((d) => (
              <li
                key={d.udid}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                  d.udid === selectedUdid
                    ? "bg-blue-500/20 outline outline-1 outline-blue-500"
                    : "hover:bg-slate-800"
                }`}
                onClick={() => handleSelectDevice(d.udid)}
              >
                {d.connectionType === "usb" ? (
                  <DevicePhoneMobileIcon className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <WifiIcon className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate text-sm">{d.name}</span>
                  <span className="text-[11px] text-slate-500">iOS {d.osVersion}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent Locations */}
      {recentLocations.length > 0 && (
        <div className="p-3">
          <h3 className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5" />
              Recent
            </span>
            <button
              type="button"
              className="text-blue-400 hover:underline text-[11px] bg-transparent border-none cursor-pointer normal-case tracking-normal"
              onClick={handleClearRecent}
            >
              Clear
            </button>
          </h3>
          <ul className="list-none space-y-0.5">
            {recentLocations.map((loc) => (
              <li
                key={`${loc.coord.lat}-${loc.coord.lng}`}
                className="p-1.5 rounded cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => {
                  useStore.getState().openDialog("teleport", {
                    lat: loc.coord.lat,
                    lng: loc.coord.lng,
                    name: loc.name,
                  });
                }}
              >
                <span className="block text-xs truncate">{loc.name.split(",")[0]}</span>
                <span className="text-[10px] text-slate-600">
                  {loc.coord.lat.toFixed(4)}, {loc.coord.lng.toFixed(4)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
