import { useState, useCallback, useRef } from "react";
import { useStore } from "../../store";
import { api } from "../../services/api";
import { searchLocation, type SearchResult } from "../../services/geocoding";
import { formatDistance } from "../../lib/geo";

export function Sidebar() {
  const {
    devices,
    selectedUdid,
    tunnelRunning,
    recentLocations,
    sidebarOpen,
    currentLocation,
    addToast,
  } = useStore();

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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
    const store = useStore.getState();
    if (store.confirmTeleport) {
      store.openDialog("teleport", { lat: result.lat, lng: result.lng, name: result.displayName });
    } else {
      const res = await api.setLocation(result.lat, result.lng);
      if (res.ok) {
        store.addRecentLocation({
          coord: { lat: result.lat, lng: result.lng },
          name: result.displayName,
          timestamp: Date.now(),
        });
      }
    }
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
    addToast("Starting tunnel (admin password may be required)...", "info");
    const result = await api.startTunnel();
    addToast(result.message, result.ok ? "success" : "error");
  };

  if (!sidebarOpen) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <input
          type="text"
          className="search-input"
          placeholder="Search location..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searchResults.length > 0 && (
          <ul className="search-results">
            {searchResults.map((r, i) => (
              <li key={i} onClick={() => handleSelectSearchResult(r)}>
                <span className="search-result-name">{r.displayName}</span>
              </li>
            ))}
          </ul>
        )}
        {searching && <div className="search-loading">Searching...</div>}
      </div>

      <div className="sidebar-section">
        <h3>
          Tunnel
          <span className={`status-dot ${tunnelRunning ? "active" : ""}`} />
        </h3>
        {!tunnelRunning ? (
          <button className="btn btn-sm" onClick={handleStartTunnel}>
            Start Tunnel
          </button>
        ) : (
          <span className="text-muted">Running</span>
        )}
      </div>

      <div className="sidebar-section">
        <h3>Devices</h3>
        {devices.length === 0 ? (
          <p className="text-muted">No devices found</p>
        ) : (
          <ul className="device-list">
            {devices.map((d) => (
              <li
                key={d.udid}
                className={`device-item ${d.udid === selectedUdid ? "selected" : ""}`}
                onClick={() => handleSelectDevice(d.udid)}
              >
                <span className="device-icon">{d.connectionType === "usb" ? "🔌" : "📶"}</span>
                <div className="device-info">
                  <span className="device-name">{d.name}</span>
                  <span className="device-version">iOS {d.osVersion}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {recentLocations.length > 0 && (
        <div className="sidebar-section">
          <h3>
            Recent
            <button
              className="btn-link"
              onClick={() => useStore.getState().clearRecentLocations()}
            >
              Clear
            </button>
          </h3>
          <ul className="recent-list">
            {recentLocations.map((loc, i) => (
              <li
                key={i}
                onClick={() => {
                  const store = useStore.getState();
                  if (store.confirmTeleport) {
                    store.openDialog("teleport", {
                      lat: loc.coord.lat,
                      lng: loc.coord.lng,
                      name: loc.name,
                    });
                  } else {
                    api.setLocation(loc.coord.lat, loc.coord.lng);
                  }
                }}
              >
                <span className="recent-name">{loc.name.split(",")[0]}</span>
                <span className="recent-coords">
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
